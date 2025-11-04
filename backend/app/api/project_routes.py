"""
This file defines the RESTful API routes for Projects.
- /api/projects (GET, POST)
- /api/projects/<id> (GET, PUT, DELETE)
"""

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import joinedload, selectinload
from datetime import datetime
import json

from . import api
from ..models import db, Project, Task, User

# --- Helper Functions for Serialization ---

def serialize_task(task):
    """Converts a Task model object into a JSON-serializable dictionary.""" 
    return {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'order': task.order,
        'project_id': task.project_id,

        # Convert expiry_date to ISO format string if it exists
        'expiry_date': task.expiry_date.isoformat() if task.expiry_date else None,
        
        # Include the creator's details
        'creator': serialize_project_member(task.creator) if task.creator else None,
        
        # Include the list of assignees
        'assignees': task.assignees
    }

def serialize_project_member(user): # Jsonifying a user as a project member, python dict -> json
    """Converts a User model object (as a member) into a dictionary."""
    return {
        'id': user.id,
        'email': user.email
    }

def serialize_project(project, include_tasks=False, include_members=False):
    """Converts a Project model object into a dictionary."""
    data = {
        'id': project.id,
        'name': project.name,
        'description': project.description,
    }
    if include_tasks: # Include tasks if requested
        # Sort tasks by status first, then by their internal order
        sorted_tasks = sorted(project.tasks, key=lambda t: (t.status, t.order))
        data['tasks'] = [serialize_task(task) for task in sorted_tasks] 
        # This will create a list of serialized tasks
    
    if include_members: # Include members if requested
        data['members'] = [serialize_project_member(member) for member in project.members]
    
    return data

# --- Resource Classes ---

class ProjectListResource(Resource):
    """
    Handles routes for the collection of projects.
    - GET /api/projects
    - POST /api/projects
    """
    @jwt_required() # Require authentication
    def get(self):
        """
        Gets all projects the current user is a member of for the dashboard.
        """
        # Get the user ID from the JWT
        current_user_id = get_jwt_identity() # Get the user ID from the JWT
        user = User.query.get(current_user_id)

        if not user:
            return {'message': 'User not found'}, 401 # Unauthorized

        projects = Project.query.filter(Project.members.any(id=user.id)).options(
            selectinload(Project.members) # Eager load members, meaning load all members when loading projects
        # faster loading then lazy loading each time we access project.members
        ).all()

        projects = user.projects # Get projects where the user is a member
        return [serialize_project(p, include_members=False) for p in projects], 200 
        # Return serialized projects without members for the dashboard

    @jwt_required()
    def post(self):
        """
        Creates a new project.
        The current user automatically becomes a member.
        """
        # Get the user ID from the JWT
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return {'message': 'User not found'}, 401 # Unauthorized
        
        data = request.get_json()
        if not data.get('name'):
            return {'message': 'Project name is required'}, 400 # Bad Request

        new_project = Project( # Create new project
            name=data['name'],
            description=data.get('description') # Optional description
        )
        
        # Automatically add the creator as a member
        new_project.members.append(user)
        
        db.session.add(new_project)
        db.session.commit() # Save to the database
        
        return serialize_project(new_project, include_members=True), 201 # Return the new project with members included

class ProjectResource(Resource):
    """
    Handles routes for a single project instance.
    - GET /api/projects/<int:project_id>
    - PUT /api/projects/<int:project_id>
    - DELETE /api/projects/<int:project_id>
    """
    @jwt_required()
    def get(self, project_id):
        """
        Gets a single project by its ID.
        Returns the project, its members, and all its tasks.
        """
        # Get the user ID from the JWT
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return {'message': 'User not found'}, 401 # Unauthorized

        project = Project.query.options(
            selectinload(Project.tasks).options(
                joinedload(Task.creator)      # Eager load creator for each task
            ),
            selectinload(Project.members)     # Eager load project members
        ).get(project_id)

        if not project:
            return {'message': 'Project not found'}, 404 # Not Found

        # --- SECURITY CHECK ---
        # Verify the current user is a member of this project
        if user not in project.members:
            return {'message': 'Unauthorized'}, 403 # Forbidden

        return serialize_project(project, include_tasks=True, include_members=True), 200 # OK
        # return project with tasks and members

    @jwt_required()
    def put(self, project_id):
        """
        Updates a project's details (name, description).
        """
        # Get the user ID from the JWT
        current_user_id = get_jwt_identity() # Get the user ID from the JWT
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
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        db.session.commit()

        return serialize_project(project), 200 # OK

    @jwt_required() # Require authentication
    def delete(self, project_id):
        """
        Deletes a project.
        """
        # Get the user ID from the JWT
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

        db.session.delete(project) # Delete the project
        db.session.commit()

        return {'message': 'Project deleted'}, 200 # OK

# --- Register the resources with our API ---
api.add_resource(ProjectListResource, '/projects')
api.add_resource(ProjectResource, '/projects/<int:project_id>')
