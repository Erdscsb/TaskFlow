"""
This file defines the RESTful API routes for authentication.
- /api/register
- /api/login
- /api/logout
"""

from flask import request
from flask_restful import Resource
from flask_security import login_user, logout_user, auth_token_required
from flask_security.utils import verify_password
import datetime

from . import api                 # Import the api object from app/api/__init__.py
from ..security import user_datastore # Import our user datastore
from ..models import db, User

class RegisterResource(Resource):
    def post(self):
        """
        Creates a new user account.
        Expects JSON: { "email": "...", "password": "..." }
        """
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {"message": "Email and password are required"}, 400
        
        if user_datastore.find_user(email=email):
            return {"message": "User with that email already exists"}, 409

        # Create the user
        user_datastore.create_user(
            email=email,
            password=password
        )
        db.session.commit()
        
        return {"message": "User created successfully"}, 201

class LoginResource(Resource):
    def post(self):
        """
        Logs in a user and returns an authentication token.
        Expects JSON: { "email": "...", "password": "..." }
        """
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        user = user_datastore.find_user(email=email)

        if user and verify_password(password, user.password):
            # login_user() tracks the user in the session
            login_user(user)
            
            # Get the authentication token
            token = user.get_auth_token()
            
            # Return the token and user info
            return {
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email
                }
            }, 200
        else:
            return {"message": "Invalid email or password"}, 401

class LogoutResource(Resource):
    @auth_token_required
    def post(self):
        """
        Logs out the user.
        Requires the "Authentication-Token" header.
        """
        logout_user()
        return {"message": "Logout successful"}, 200

# --- Register the resources with our API ---
api.add_resource(RegisterResource, '/register')
api.add_resource(LoginResource, '/login')
api.add_resource(LogoutResource, '/logout')
