"""
This file contains the application factory for the TaskFlow Flask app.
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager  # Import JWTManager

from .models import db, User, Role  # User and Role are still needed for your logic
from .api import api_bp

def create_app():
    """
    Application factory function.
    Initializes the Flask app, configures extensions, and registers blueprints.
    """
    app = Flask(__name__)

    # --- Configuration ---
    # In a real app, load this from a config file or environment variables
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///taskflow.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'super-secret-key-change-me' # Used for session, CSRF, etc.
    
    # Configuration for Flask-JWT-Extended
    # This key is used to sign the JWTs. Keep it secret!
    app.config['JWT_SECRET_KEY'] = 'super-secret-jwt-key-change-me' 

    # --- Initialize Extensions ---
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
    
    # --- Setup Flask-JWT-Extended ---
    # This initializes the JWT manager
    jwt = JWTManager(app)

    # --- Register Blueprints ---
    app.register_blueprint(api_bp)

    return app
