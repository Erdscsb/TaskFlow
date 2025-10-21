"""
This is the main application factory file.
It initializes the Flask app, configures security, enables CORS,
and registers the API blueprint.
"""

from flask_security import Security
from flask_cors import CORS
from .models import app, db  # Import app and db from models.py
from .security import user_datastore # Import the datastore
from .api import api_bp # Import our API blueprint

# --- Flask-Security-Too Configuration ---
app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = "Authentication-Token"
app.config['SECURITY_REGISTERABLE'] = True       # Allow user registration
app.config['SECURITY_SEND_REGISTER_EMAIL'] = False # Don't send emails
app.config['SECURITY_UNAUTHORIZED_VIEW'] = None    # Don't redirect
app.config['SECURITY_LOGIN_USER_TEMPLATE'] = None  # Don't use templates

# --- Initialize Extensions ---

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Initialize Flask-Security-Too
security = Security(app, user_datastore)

# --- Register Blueprints ---
app.register_blueprint(api_bp)
