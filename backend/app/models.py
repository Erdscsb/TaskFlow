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
    id = db.Column(db.Integer, primary_key=True) # Primary key
    email = db.Column(db.String(255), unique=True, nullable=False) # Has to be unique
    password = db.Column(db.String(255), nullable=False) # Hashed password
    
    active = db.Column(db.Boolean(), default=True)  # Is the user active?

    # Relationship to Projects (Many-to-Many)
    # A user can be a member of many projects.
    projects = db.relationship('Project', secondary=project_members, backref=db.backref('members', lazy=True))
 
    # Tasks a user has created
    created_tasks = db.relationship('Task', backref='creator', lazy=True, foreign_keys='Task.creator_id')
    # Reverse relationship defined in Task model for tasks assigned to the user

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
    # deleted-orphan ensures tasks are deleted when no longer associated with a project
    # lazy=True means tasks are loaded only when accessed

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
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Nullable in case creator is deleted, tasks remain

    # Foreign Key to link Task to a Project
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)

    @property # Returns the list of assignees as a Python list, @property decorator makes it accessible as an attribute, which is needed for serialization
    def assignees(self):
        """Returns the list of assignees from the JSON text field."""
        if not self.assignees_text:
            return [] # Return empty list if no assignees
        try:
            return json.loads(self.assignees_text) # Parse JSON text to list
        except json.JSONDecodeError:
            return []
    # task.assignees in itself is useless, thats why we need the property decorator, to
    # convert it to a list

    @assignees.setter # Setter to update the assignees list
    def assignees(self, value):
        """Sets the assignees list, storing it as JSON text."""
        if not isinstance(value, list): # Ensure value is a list of strings
            raise ValueError("Assignees must be a list of strings.")
        self.assignees_text = json.dumps(value) # Convert list to JSON text for storage
