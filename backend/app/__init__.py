"""
This file contains the application factory for the TaskFlow Flask app.
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .models import db, User
from .api import api_bp

def create_app():
    """
    Application factory function.
    Initializes the Flask app, configures extensions, and registers blueprints.
    """
    app = Flask(__name__)

    # --- Configuration ---
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///taskflow.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'super-secret-key-change-me'
    
    # Configuration for Flask-JWT-Extended
    app.config['JWT_SECRET_KEY'] = 'super-secret-jwt-key-change-me' 

    # Tells JWT-Extended to set a "csrf_access_token" cookie
    app.config['JWT_CSRF_IN_COOKIES'] = True 
    # Enables checking for the X-CSRF-TOKEN header on all protected requests
    app.config['JWT_CSRF_CHECK_FORM'] = False
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']

    # --- Initialize Extensions ---
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
    
    # --- Setup Flask-JWT-Extended ---
    jwt = JWTManager(app)

    # --- Register Blueprints ---
    app.register_blueprint(api_bp)

    return app
