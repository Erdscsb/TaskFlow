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
import json

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
            return {'message': 'User not found'}, 401 # Unauthorized
        
        project = Project.query.get(project_id)
        if not project:
            return {'message': 'Project not found'}, 404 # Not Found
        
        # --- SECURITY CHECK ---
        if user not in project.members:
            return {'message': 'Unauthorized'}, 403 # Forbidden

        data = request.get_json()
        if not data.get('title'):
            return {'message': 'Task title is required'}, 400 # Bad Request

        status = data.get('status', 'TODO')
        max_order = db.session.query(db.func.max(Task.order)).filter_by( 
            # Get max order in the status column
            project_id=project_id, 
            status=status
        ).scalar() # Get the scalar value
        
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
        
        if 'assignees' in data and isinstance(data['assignees'], list):
            new_task.assignees = data['assignees'] # Use the setter property

        db.session.add(new_task) # Add the new task to the session
        db.session.commit()

        db.session.refresh(new_task)

        new_task = Task.query.get(new_task.id) # Re-fetch to get updated fields
        return serialize_task(new_task), 201 # Created

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
            return {'message': 'User not found'}, 401 # Unauthorized

        task = Task.query.get(task_id)
        if not task:
            return {'message': 'Task not found'}, 404 # Not Found

        # --- SECURITY CHECK ---
        # We check membership via the task's parent project
        if user not in task.project.members:
            return {'message': 'Unauthorized'}, 403 # Forbidden

        data = request.get_json()
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)

        if 'expiry_date' in data:
            task.expiry_date = parse_iso_date(data.get('expiry_date'))
        
        if 'assignees' in data:
            assignees_list = data['assignees']
            if isinstance(assignees_list, list):
                # Simple validation: ensure all items are strings
                task.assignees = [str(item) for item in assignees_list]
            elif assignees_list is None:
                task.assignees = [] # Clear assignees
            else:
                return {'message': 'assignees must be a list'}, 400 # Bad Request

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
            return {'message': 'User not found'}, 401 # Unauthorized

        task = Task.query.get(task_id)
        if not task:
            return {'message': 'Task not found'}, 404 # Not Found

        # --- SECURITY CHECK ---
        if user not in task.project.members:
            return {'message': 'Unauthorized'}, 403 # Forbidden

        db.session.delete(task)
        db.session.commit()
        
        return {'message': 'Task deleted'}, 200

class TaskMoveResource(Resource):
    """
    Handles the drag-and-drop logic for moving a task.
    - PATCH /api/tasks/<int:task_id>/move
    """
    @jwt_required()
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
            return {'message': 'Task not found'}, 404 # Not Found
        
        # --- SECURITY CHECK ---
        if user not in task.project.members:
            return {'message': 'Unauthorized'}, 403 # Forbidden

        data = request.get_json()
        
        if 'status' in data:
            task.status = data['status']
            
        if 'order' in data:
            task.order = data['order']
            
        db.session.commit()

        task = Task.query.get(task_id)
        return serialize_task(task), 200

# --- Register the resources with our API ---
api.add_resource(TaskListResource, '/projects/<int:project_id>/tasks')
api.add_resource(TaskResource, '/tasks/<int:task_id>')
api.add_resource(TaskMoveResource, '/tasks/<int:task_id>/move')
