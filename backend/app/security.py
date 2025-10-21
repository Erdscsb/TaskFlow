"""
This file initializes the Flask-Security-Too datastore.
It bridges the gap between our SQLAlchemy models (User, Role)
and the functions that Flask-Security-Too uses.
"""

from flask_security import SQLAlchemyUserDatastore
from .models import db, User, Role

# Create the datastore object
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
