"""
This file initializes the API Blueprint and the Flask-RESTful Api object.

It creates a Blueprint named 'api' and attaches a RESTful Api instance to it.
It then imports the route modules from this directory (auth_routes, project_routes, task_routes)
so that their @api.resource decorators can be registered.
"""

from flask import Blueprint
from flask_restful import Api

api_bp = Blueprint('api', __name__, url_prefix='/api') # API Blueprint, with URL prefix /api

api = Api(api_bp) # Flask-RESTful Api instance, attached to the api_bp Blueprint

from . import auth_routes, project_routes, task_routes
