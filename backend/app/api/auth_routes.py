"""
This file defines the RESTful API routes for authentication.
- /api/register
- /api/login
- /api/logout (Note: Logout is handled client-side with stateless JWTs)
"""

from flask import jsonify, request
from flask_restful import Resource
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies

from . import api                # Import the api object from app/api/__init__.py
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
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return {"message": "User with that email already exists"}, 409

        # Hash the password and create the user manually
        hashed_password = generate_password_hash(password)
        new_user = User(
            email=email,
            password=hashed_password
        )
        
        db.session.add(new_user)
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

        # Find the user
        user = User.query.filter_by(email=email).first()

        # Check the password hash
        if user and check_password_hash(user.password, password):
            # Create the JWT
            access_token = create_access_token(identity=str(user.id))
            
            # Create a JSON response
            response = jsonify({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email
                }
            })
            
            # Set the HttpOnly access cookie and the CSRF cookie
            set_access_cookies(response, access_token)
            return response
        else:
            return {"message": "Invalid email or password"}, 401

class LogoutResource(Resource):
    def post(self):
        response = jsonify({"message": "Logout successful"})
        unset_jwt_cookies(response)
        return response

# --- Register the resources with our API ---
api.add_resource(RegisterResource, '/register')
api.add_resource(LoginResource, '/login')
api.add_resource(LogoutResource, '/logout')
