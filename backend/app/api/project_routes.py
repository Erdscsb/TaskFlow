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
from ..models import db, Project, Task, User, ProjectMember

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
        'creator': serialize_user_simple(task.creator) if task.creator else None,
        
        # Include the list of assignees
        'assignees': task.assignees
    }

def serialize_user_simple(user):
    """Converts a User model object (as a member) into a dictionary."""
    if not user:
        return None
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
    
    if include_members:
        # We now serialize the association object to include the role
        data['members'] = []
        for assoc in project.member_associations:
            member_data = serialize_user_simple(assoc.user)
            if member_data:
                member_data['role'] = assoc.role
                data['members'].append(member_data)

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

        projects = Project.query.join(ProjectMember).filter(
            ProjectMember.user_id == current_user_id
        ).options(
            selectinload(Project.member_associations).joinedload(ProjectMember.user)
        ).all()

        return [serialize_project(p, include_members=True) for p in projects], 200 
        # Return serialized projects without members for the dashboard

    @jwt_required()
    def post(self):
        """
        Creates a new project.
        The current user automatically becomes the 'owner' and a member.
        """
        # Get the user ID from the JWT
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return {'message': 'User not found'}, 401 # Unauthorized
        
        data = request.get_json()
        if not data.get('name'):
            return {'message': 'Project name is required'}, 400 # Bad Request

        # 1. Create the project
        new_project = Project(
            name=data['name'],
            description=data.get('description')
        )
        db.session.add(new_project)
        
        # 2. Create the ProjectMember link with the 'owner' role
        owner_membership = ProjectMember(
            user=user,
            project=new_project,
            role='owner'
        )
        db.session.add(owner_membership)
        
        db.session.commit()
        
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

        membership = ProjectMember.query.filter_by(
            user_id=current_user_id,
            project_id=project_id
        ).first()
        
        if not membership:
            return {'message': 'Unauthorized'}, 403 # Forbidden

        # 2. If they are a member, fetch the full project data
        project = Project.query.options(
            selectinload(Project.tasks).options(
                joinedload(Task.creator)
            ),
            # Eager load associations AND the user data for each association
            selectinload(Project.member_associations).joinedload(ProjectMember.user)
        ).get(project_id)

        if not project:
            return {'message': 'Project not found'}, 404

        return serialize_project(project, include_tasks=True, include_members=True), 200

    @jwt_required()
    def put(self, project_id):
        """
        Updates a project's details (name, description).
        Only 'owner' role can do this.
        """
        # Get the user ID from the JWT
        current_user_id = get_jwt_identity() # Get the user ID from the JWT

        # --- SECURITY CHECK ---
        membership = ProjectMember.query.filter_by(
            user_id=current_user_id,
            project_id=project_id
        ).first()

        if not membership:
            return {'message': 'Unauthorized'}, 403
        
        # --- ROLE-BASED CHECK ---
        if membership.role != 'owner':
            return {'message': 'Only the project owner can edit this project'}, 403

        project = Project.query.get(project_id)
        if not project:
            return {'message': 'Project not found'}, 404

        data = request.get_json()
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        db.session.commit()

        return serialize_project(project), 200

    @jwt_required() # Require authentication
    def delete(self, project_id):
        """
        Deletes a project.
        """
        # Get the user ID from the JWT
        current_user_id = get_jwt_identity()

        # --- SECURITY CHECK ---
        membership = ProjectMember.query.filter_by(
            user_id=current_user_id,
            project_id=project_id
        ).first()

        if not membership:
            return {'message': 'Unauthorized'}, 403
        
        # --- ROLE-BASED CHECK ---
        if membership.role != 'owner':
            return {'message': 'Only the project owner can delete this project'}, 403

        project = Project.query.get(project_id)
        if not project:
            return {'message': 'Project not found'}, 404

        db.session.delete(project)
        db.session.commit()

        return {'message': 'Project deleted'}, 200
    
class ProjectMemberListResource(Resource):
    """
    Handles adding new members to a project.
    - POST /api/projects/<int:project_id>/members
    """
    @jwt_required()
    def post(self, project_id):
        """Adds a new user to the project as a 'member'."""
        current_user_id = get_jwt_identity()
        
        # 1. Security Check: Only owners can add new members.
        auth_membership = ProjectMember.query.filter_by(
            user_id=current_user_id,
            project_id=project_id
        ).first()
        
        if not auth_membership or auth_membership.role != 'owner':
            return {'message': 'Only the project owner can add members'}, 403
        
        data = request.get_json()
        email = data.get('email')
        if not email:
            return {'message': 'Email is required'}, 400
            
        # 2. Find the user to add
        user_to_add = User.query.filter_by(email=email).first()
        if not user_to_add:
            return {'message': f'User with email {email} not found'}, 404
            
        # 3. Check if user is already a member
        existing_membership = ProjectMember.query.filter_by(
            user_id=user_to_add.id,
            project_id=project_id
        ).first()
        
        if existing_membership:
            return {'message': 'User is already a member of this project'}, 409 # Conflict
            
        # 4. Create the new membership
        new_membership = ProjectMember(
            user_id=user_to_add.id,
            project_id=project_id,
            role='member' # Default role
        )
        db.session.add(new_membership)
        db.session.commit()
        
        # 5. Return the new member's data
        member_data = serialize_user_simple(user_to_add)
        member_data['role'] = new_membership.role
        
        return member_data, 201 # Created
    
class ProjectMemberResource(Resource):
    """
    Handles updating a role or removing a member.
    - PUT /api/projects/<int:project_id>/members/<int:user_id>
    - DELETE /api/projects/<int:project_id>/members/<int:user_id>
    """
    @jwt_required()
    def put(self, project_id, user_id):
        """Updates a member's role."""
        current_user_id = get_jwt_identity()

        # 1. Security Check: Only owners can change roles.
        auth_membership = ProjectMember.query.filter_by(
            user_id=current_user_id,
            project_id=project_id
        ).first()
        
        if not auth_membership or auth_membership.role != 'owner':
            return {'message': 'Only the project owner can change roles'}, 403
            
        # 2. Owner cannot change their own role.
        if auth_membership.user_id == user_id:
            return {'message': 'Owner cannot change their own role'}, 400
            
        data = request.get_json()
        new_role = data.get('role')
        if new_role not in ['owner', 'member']:
            return {'message': "Invalid role. Must be 'owner' or 'member'"}, 400
            
        # 3. Find the membership to update
        membership_to_update = ProjectMember.query.filter_by(
            user_id=user_id,
            project_id=project_id
        ).first()
        
        if not membership_to_update:
            return {'message': 'Member not found in this project'}, 404
            
        # 4. Update the role
        membership_to_update.role = new_role
        db.session.commit()
        
        member_data = serialize_user_simple(membership_to_update.user)
        member_data['role'] = membership_to_update.role
        return member_data, 200
        
    @jwt_required()
    def delete(self, project_id, user_id):
        """Removes a member from a project."""
        current_user_id = get_jwt_identity()

        # 1. Security Check: Only owners can remove members.
        auth_membership = ProjectMember.query.filter_by(
            user_id=current_user_id,
            project_id=project_id
        ).first()
        
        if not auth_membership or auth_membership.role != 'owner':
            return {'message': 'Only the project owner can remove members'}, 403
            
        # 2. Owner cannot remove themselves.
        if auth_membership.user_id == user_id:
            return {'message': 'Owner cannot remove themselves from the project'}, 400
            
        # 3. Find the membership to delete
        membership_to_delete = ProjectMember.query.filter_by(
            user_id=user_id,
            project_id=project_id
        ).first()
        
        if not membership_to_delete:
            return {'message': 'Member not found in this project'}, 404
            
        # 4. Delete the membership
        db.session.delete(membership_to_delete)
        db.session.commit()
        
        return {'message': 'Member removed'}, 200

# --- Register the resources with our API ---
api.add_resource(ProjectListResource, '/projects')
api.add_resource(ProjectResource, '/projects/<int:project_id>')
api.add_resource(ProjectMemberListResource, '/projects/<int:project_id>/members')
api.add_resource(ProjectMemberResource, '/projects/<int:project_id>/members/<int:user_id>')
