"""
This file defines the RESTful API routes for Tasks.
- /api/projects/<id>/tasks (POST)
- /api/tasks/<id> (PUT, DELETE)
- /api/tasks/<id>/move (PATCH)
"""

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from . import api
from ..models import db, Project, Task, User
from .project_routes import serialize_task

# --- Helper function to parse dates ---
def parse_iso_date(date_string):
    """Safely parses an ISO date string, returns None if invalid."""
    if not date_string:
        return None
    try:
        # Handles 'YYYY-MM-DD' by converting to full datetime
        if len(date_string) == 10:
             return datetime.strptime(date_string, '%Y-%m-%d')
        # Handles full ISO 8601 format
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except ValueError:
        return None

class TaskListResource(Resource):
    """
    Handles creation of tasks for a specific project.
    - POST /api/projects/<int:project_id>/tasks
    """
    @jwt_required()
    def post(self, project_id):
        """
        Creates a new task within a project.
        """
        # --- Get the current user ---
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return {'message': 'User not found'}, 401
        
        project = Project.query.get(project_id)
        if not project:
            return {'message': 'Project not found'}, 404
        
        # --- SECURITY CHECK ---
        if user not in project.members:
            return {'message': 'Unauthorized'}, 403

        data = request.get_json()
        if not data.get('title'):
            return {'message': 'Task title is required'}, 400

        status = data.get('status', 'TODO')
        max_order = db.session.query(db.func.max(Task.order)).filter_by(
            project_id=project_id, 
            status=status
        ).scalar()
        
        new_order = (max_order or 0) + 1

        new_task = Task(
            title=data['title'],
            description=data.get('description'),
            status=status,
            order=new_order,
            project_id=project_id,
            creator_id=current_user_id,
            expiry_date=parse_iso_date(data.get('expiry_date'))
        )
        
        db.session.add(new_task)
        db.session.commit()

        db.session.refresh(new_task)

        new_task = Task.query.get(new_task.id)
        return serialize_task(new_task), 201

class TaskResource(Resource):
    """
    Handles routes for a single task instance.
    - PUT /api/tasks/<int:task_id>
    - DELETE /api/tasks/<int:task_id>
    """
    @jwt_required()
    def put(self, task_id):
        """
        Updates a task's details (title, description).
        """
        # --- Get the current user ---
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return {'message': 'User not found'}, 401

        task = Task.query.get(task_id)
        if not task:
            return {'message': 'Task not found'}, 404
        
        # --- SECURITY CHECK ---
        # We check membership via the task's parent project
        if user not in task.project.members:
            return {'message': 'Unauthorized'}, 403
            
        data = request.get_json()
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)

        if 'expiry_date' in data:
            task.expiry_date = parse_iso_date(data.get('expiry_date'))
        
        db.session.commit()

        task = Task.query.get(task_id)
        return serialize_task(task), 200

    @jwt_required()
    def delete(self, task_id):
        """
        Deletes a task.
        """
        # --- Get the current user ---
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return {'message': 'User not found'}, 401
        
        task = Task.query.get(task_id)
        if not task:
            return {'message': 'Task not found'}, 404

        # --- SECURITY CHECK ---
        if user not in task.project.members:
            return {'message': 'Unauthorized'}, 403
            
        db.session.delete(task)
        db.session.commit()
        
        return {'message': 'Task deleted'}, 200

class TaskMoveResource(Resource):
    """
    Handles the drag-and-drop logic for moving a task.
    - PATCH /api/tasks/<int:task_id>/move
    """
    @jwt_required()  # <-- Decorator changed
    def patch(self, task_id):
        """
        Updates a task's status and/or order.
        Expects JSON: { "status": "...", "order": ... }
        """
        # --- Get the current user ---
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return {'message': 'User not found'}, 401

        task = Task.query.get(task_id)
        if not task:
            return {'message': 'Task not found'}, 404
        
        # --- SECURITY CHECK ---
        if user not in task.project.members:
            return {'message': 'Unauthorized'}, 403

        data = request.get_json()
        
        if 'status' in data:
            task.status = data['status']
            
        if 'order' in data:
            task.order = data['order']
            
        db.session.commit()

        task = Task.query.get(task_id)
        return serialize_task(task), 200

class TaskAssignResource(Resource):
    """
    Handles assigning/unassigning users to a task.
    - POST /api/tasks/<int:task_id>/assign
    - DELETE /api/tasks/<int:task_id>/assign
    """
    @jwt_required()
    def post(self, task_id):
        """
        Assigns a user to a task.
        Expects JSON: { "user_id": ... }
        """
        # --- Get the current user ---
        current_user_id = get_jwt_identity()
        acting_user = User.query.get(current_user_id)
        if not acting_user:
            return {'message': 'User not found'}, 401
            
        task = Task.query.get(task_id)
        if not task:
            return {'message': 'Task not found'}, 404

        # --- SECURITY CHECK 1: Acting user must be member of project ---
        if acting_user not in task.project.members:
            return {'message': 'Unauthorized'}, 403

        data = request.get_json()
        user_to_assign_id = data.get('user_id')
        if not user_to_assign_id:
            return {'message': 'user_id is required'}, 400

        user_to_assign = User.query.get(user_to_assign_id)
        if not user_to_assign:
            return {'message': 'User to assign not found'}, 404

        # --- SECURITY CHECK 2: User to assign must also be member of project ---
        if user_to_assign not in task.project.members:
            return {'message': 'User to assign is not a member of this project'}, 403
            
        # Add user to assignees if not already assigned
        if user_to_assign not in task.assignees:
            task.assignees.append(user_to_assign)
            db.session.commit()
            
        task = Task.query.get(task_id)
        return serialize_task(task), 200

    @jwt_required()
    def delete(self, task_id):
        """
        Unassigns a user from a task.
        Expects JSON: { "user_id": ... }
        """
        # --- Get the current user ---
        current_user_id = get_jwt_identity()
        acting_user = User.query.get(current_user_id)
        if not acting_user:
            return {'message': 'User not found'}, 401
            
        task = Task.query.get(task_id)
        if not task:
            return {'message': 'Task not found'}, 404

        # --- SECURITY CHECK 1: Acting user must be member of project ---
        if acting_user not in task.project.members:
            return {'message': 'Unauthorized'}, 403
            
        data = request.get_json()
        user_to_unassign_id = data.get('user_id')
        if not user_to_unassign_id:
            return {'message': 'user_id is required'}, 400
            
        user_to_unassign = User.query.get(user_to_unassign_id)
        if not user_to_unassign:
            return {'message': 'User to unassign not found'}, 404

        # Remove user from assignees if they are assigned
        if user_to_unassign in task.assignees:
            task.assignees.remove(user_to_unassign)
            db.session.commit()

        task = Task.query.get(task_id)
        return serialize_task(task), 200

# --- Register the resources with our API ---
api.add_resource(TaskListResource, '/projects/<int:project_id>/tasks')
api.add_resource(TaskResource, '/tasks/<int:task_id>')
api.add_resource(TaskMoveResource, '/tasks/<int:task_id>/move')
api.add_resource(TaskAssignResource, '/tasks/<int:task_id>/assign')
