"""
This file defines the database models for the TaskFlow application using Flask-SQLAlchemy.
It includes models for User, Role, Project, and Task, along with the necessary
many-to-many association tables.
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_security_too import UserMixin, RoleMixin

# --- App and Database Configuration ---

# Initialize the Flask application
app = Flask(__name__)

# Configure the database connection.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///taskflow.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# A secret key is needed for session management and security features.
app.config['SECRET_KEY'] = 'super-secret-key-change-me'
# Required for Flask-Security-Too
app.config['SECURITY_PASSWORD_SALT'] = 'super-secret-salt-change-me'


# Initialize the SQLAlchemy extension with the Flask app
db = SQLAlchemy(app)


# --- Many-to-Many Association Tables ---

# This is an association table for the many-to-many relationship between Users and Roles.
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

class Role(db.Model, RoleMixin):
    """
    Represents a user role in the system (e.g., 'admin', 'user').
    Inherits from RoleMixin for compatibility with Flask-Security-Too.
    """
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    """
    Represents a user account.
    Inherits from UserMixin to get all the required fields for Flask-Security-Too
    (e.g., password, active, etc.).
    """
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean(), default=True)

    # Relationship to Roles (Many-to-Many)
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
