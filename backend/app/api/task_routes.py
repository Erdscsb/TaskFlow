"""
This file defines the RESTful API routes for Tasks.
- /api/projects/<id>/tasks (POST)
- /api/tasks/<id> (PUT, DELETE)
- /api/tasks/<id>/move (PATCH)
"""

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity  # <-- Imports changed

from . import api
from ..models import db, Project, Task, User  # <-- Added User
from .project_routes import serialize_task  # Assuming this is in a neighboring file

class TaskListResource(Resource):
    """
    Handles creation of tasks for a specific project.
    - POST /api/projects/<int:project_id>/tasks
    """
    @jwt_required()  # <-- Decorator changed
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
        if user not in project.members:  # <-- Use the fetched user object
            return {'message': 'Unauthorized'}, 403

        data = request.get_json()
        if not data.get('title'):
            return {'message': 'Task title is required'}, 400

        status = data.get('status', 'TODO')
        # This logic for finding the max order is great, no changes needed
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
            project_id=project_id
        )
        
        db.session.add(new_task)
        db.session.commit()
        
        return serialize_task(new_task), 201

class TaskResource(Resource):
    """
    Handles routes for a single task instance.
    - PUT /api/tasks/<int:task_id>
    - DELETE /api/tasks/<int:task_id>
    """
    @jwt_required()  # <-- Decorator changed
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
        if user not in task.project.members:  # <-- Use the fetched user object
            return {'message': 'Unauthorized'}, 403
            
        data = request.get_json()
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)
        
        db.session.commit()
        return serialize_task(task), 200

    @jwt_required()  # <-- Decorator changed
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
        if user not in task.project.members:  # <-- Use the fetched user object
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
        if user not in task.project.members:  # <-- Use the fetched user object
            return {'message': 'Unauthorized'}, 403

        data = request.get_json()
        
        if 'status' in data:
            task.status = data['status']
            
        if 'order' in data:
            task.order = data['order']
            
        db.session.commit()
        return serialize_task(task), 200

# --- Register the resources with our API ---
api.add_resource(TaskListResource, '/projects/<int:project_id>/tasks')
api.add_resource(TaskResource, '/tasks/<int:task_id>')
api.add_resource(TaskMoveResource, '/tasks/<int:task_id>/move')
