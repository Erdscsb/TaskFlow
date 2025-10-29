"""
The main entry point for the Flask application.
"""

# Import the factory function and the db instance
from app import create_app
from app.models import db

# 1. Call the factory to create the application instance
app = create_app()

# 2. Use the 'app' instance to create an application context
with app.app_context():
    # This creates your database tables based on your models
    # It's okay for development, but for production, you'd use Flask-Migrate
    db.create_all()

if __name__ == '__main__':
    # 3. Call .run() on the 'app' instance, not the factory
    app.run(debug=True, port=5000)
