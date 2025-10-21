"""
The main entry point for the Flask application.
"""

# Import the 'app' instance from our 'app' package
from app import app

if __name__ == '__main__':
    app.run(debug=True, port=5000)
