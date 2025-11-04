"""
This file defines the database models for the TaskFlow application using Flask-SQLAlchemy.
It includes models for User, Role, Project, and Task, along with the necessary
many-to-many association tables.
"""

import json
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize the SQLAlchemy extension.
db = SQLAlchemy()


# --- Many-to-Many Association Tables ---

# This is an association table for the many-to-many relationship between Users and Projects.
project_members = db.Table('project_members',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True)
)

# --- Model Definitions ---

class User(db.Model):
    """
    Represents a user account.
    """
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    
    active = db.Column(db.Boolean(), default=True) 

    # Relationship to Projects (Many-to-Many)
    # A user can be a member of many projects.
    projects = db.relationship('Project', secondary=project_members, backref=db.backref('members', lazy=True))
 
    # Tasks a user has created
    created_tasks = db.relationship('Task', backref='creator', lazy=True, foreign_keys='Task.creator_id')

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
    order = db.Column(db.Integer, nullable=False, default=0)

    expiry_date = db.Column(db.DateTime, nullable=True)

    # This will store a JSON array of strings, e.g., '["Alice", "Bob"]'
    assignees_text = db.Column(db.Text, nullable=True)

    # Foreign Key for Creator (User)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Nullable in case creator is deleted

    # Foreign Key to link Task to a Project
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)

    @property
    def assignees(self):
        """Returns the list of assignees from the JSON text field."""
        if not self.assignees_text:
            return []
        try:
            return json.loads(self.assignees_text)
        except json.JSONDecodeError:
            return []

    @assignees.setter
    def assignees(self, value):
        """Sets the assignees list, storing it as JSON text."""
        if not isinstance(value, list):
            raise ValueError("Assignees must be a list of strings.")
        self.assignees_text = json.dumps(value)
