"""
This file defines the database models for the TaskFlow application using Flask-SQLAlchemy.
It includes models for User, Role, Project, and Task, along with the necessary
many-to-many association tables.
"""

from flask_sqlalchemy import SQLAlchemy
# from flask_security import UserMixin, RoleMixin  <- Removed
# import uuid <- Removed, no longer needed

# Initialize the SQLAlchemy extension.
# The app instance will be associated with it in the app factory.
db = SQLAlchemy()


# --- Many-to-Many Association Tables ---

# This is an association table for the many-to-many relationship between Users and Roles.
# This is standard SQLAlchemy and is not dependent on Flask-Security-Too.
roles_users = db.Table('roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)

# This is an association table for the many-to-many relationship between Users and Projects.
project_members = db.Table('project_members',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True)
)

# --- Model Definitions ---

class Role(db.Model): # <- Removed RoleMixin
    """
    Represents a user role in the system (e.g., 'admin', 'user').
    """
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

# --- Removed generate_fs_uniquifier function ---

class User(db.Model): # <- Removed UserMixin
    """
    Represents a user account.
    """
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    
    # You are now 100% responsible for managing this field.
    # You must hash passwords before saving them here.
    password = db.Column(db.String(255), nullable=False)
    
    # Kept this field as it's generally useful for disabling accounts.
    active = db.Column(db.Boolean(), default=True) 
    
    # --- Removed fs_uniquifier column ---

    # Relationship to Roles (Many-to-Many)
    # This works perfectly without the mixin.
    roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))

    # Relationship to Projects (Many-to-Many)
    # A user can be a member of many projects.
    projects = db.relationship('Project', secondary=project_members, backref=db.backref('members', lazy='dynamic'))

class Project(db.Model):
    """
    Represents a project, which is a container for tasks.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))

    # Relationship to Tasks (One-to-Many)
    # If a project is deleted, all of its tasks will be deleted as well.
    tasks = db.relationship('Task', backref='project', lazy=True, cascade="all, delete-orphan")

class Task(db.Model):
    """
    Represents a single task within a project.
    """
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='TODO')
    
    # This 'order' column will be used to maintain the position of the task within its status column.
    # Essential for the drag-and-drop feature.
    order = db.Column(db.Integer, nullable=False, default=0)

    # Foreign Key to link Task to a Project
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
