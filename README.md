Kanban Board 🚀
========================

Full-stack project management application inspired by tools like Trello and Asana. It features a secure **Flask (Python)** backend serving a RESTful API and a modern, dynamic **React (JavaScript)** frontend built with Vite.

Users can register, create projects, manage project members, and organize tasks through a visual, drag-and-drop Kanban board. The app implements secure, cookie-based token authentication with CSRF protection and a robust role-based access control system.

Features
--------

*   **Secure User Authentication:** User registration, login, and logout functionality using **Flask-JWT-Extended**. Authentication tokens are stored in secure, HttpOnly cookies.
    
*   **CSRF Protection:** All authenticated requests are protected against Cross-Site Request Forgery.
    
*   **Role-Based Access Control (RBAC):** A secure, privilege-based access model ensures users have specific roles within each project:
    
    *   **Owner:** Can edit/delete the project, manage tasks, and add/remove other members or change their roles.
        
    *   **Member:** Can view the project and manage tasks (create, edit, delete, move), but cannot change project settings or manage other members.
        
*   **Project Management:** Full **CRUD** (Create, Read, Update, Delete) operations for projects from a central dashboard.
    
*   **Member Management:** Project owners can add new users to a project by email, change existing members' roles, or remove them from a project.
    
*   **Task Management:** Full **CRUD** operations for tasks, which belong to specific projects.
    
*   **Kanban Board:** A visual, interactive board with columns (**TODO**, **IN\_PROGRESS**, **DONE**).
    
*   **Drag-and-Drop:** Users can drag and drop tasks between columns and re-order them using **@dnd-kit/core**. Changes are saved to the database.
    
*   **Relational Data:**
    
    *   **Many-to-Many (with Roles):** A ProjectMember association model links Users and Projects, storing a role (e.g., 'owner', 'member') for each user in each project.
        
    *   **One-to-Many:** A project can have many tasks.
        

Tech Stack
----------

This project is built with a modern, decoupled frontend and backend.

### Backend (Flask)

*   **Framework:** **Flask**
    
*   **API:** **Flask-RESTful** for creating RESTful API endpoints.
    
*   **ORM:** **Flask-SQLAlchemy** for database modeling and interaction.
    
*   **Security:** **Flask-JWT-Extended** for token-based authentication (JWT) and management.
    
*   **Database:** **SQLite** (for development), with **psycopg2-binary** included for easy migration to PostgreSQL.
    
*   **CORS:** **Flask-CORS** to handle cross-origin requests from the React frontend.
    
*   **Migrations:** **Flask-Migrate** is included for managing database schema changes.
    

### Frontend (React)

*   **Framework:** **React** (using Hooks like useState, useEffect, and useContext).
    
*   **Build Tool:** **Vite**
    
*   **Routing:** **React Router** for client-side navigation.
    
*   **API Calls:** **Axios** for making asynchronous HTTP requests to the Flask API.
    
*   **Drag-and-Drop:** **@dnd-kit/core** for the interactive Kanban board.
    
*   **State Management:** React Context (AuthContext.jsx) for global user state.
    
*   **Styling:** Extensive custom styling with CSS variables and component-specific stylesheets.
    

Getting Started
---------------

Follow these instructions to get the project running on your local machine.

### Prerequisites

*   Python 3.10+
    
*   Node.js 20+ and npm
    
*   Git
    

### 1\. Clone the Repository

1. git clone https://github.com/Erdscsb/TaskFlow.git  
2. cd TaskFlow 

### 2\. Backend Setup (Flask)

1.  cd backend
    
2.  For macOS/Linux - python3 -m venv venvsource venv/bin/activate

3.  For Windows - python -m venv venv.\\venv\\Scripts\\activate
    
3.  pip install -r requirements.txt
    
4.  flask run - This will automatically create and use a taskflow.db SQLite file in the backend directory, as defined in run.py. Your backend API will be running at http://127.0.0.1:5000.
    

### 3\. Frontend Setup (React)

1.  cd frontend
    
2.  npm install
    
3.  npm run dev

Your frontend application will open at http://localhost:5173 (or the next available port).The frontend is pre-configured in vite.config.js to proxy all /api requests to your backend at http://localhost:5000, so no .env file is needed for API configuration.
    

API Endpoints
-------------

The Flask backend provides the following RESTful API endpoints:

### Auth

*   POST /api/register: Register a new user.
    
*   POST /api/login: Log in a user and receive auth cookies.
    
*   POST /api/logout: Log out a user and clear auth cookies.
    
*   GET /api/me: Get the profile of the currently logged-in user.
    

### Projects

*   GET /api/projects: Get all projects for the authenticated user (includes member/role data).
    
*   POST /api/projects: Create a new project (sets creator as 'owner').
    
*   GET /api/projects/<id>: Get details for a single project (and its tasks/members).
    
*   PUT /api/projects/<id>: Update a project's details (Owner only).
    
*   DELETE /api/projects/<id>: Delete a project (Owner only).
    
### Members (New)

*   POST /api/projects/<id>/members: Add a new user to a project (Owner only).
    
*   PUT /api/projects/<id>/members/<user_id>: Change a member's role (Owner only).
    
*   DELETE /api/projects/<id>/members/<user_id>: Remove a member from a project (Owner only).

### Tasks

*   POST /api/projects/<id>/tasks: Create a new task for a project (Members+).
    
*   PUT /api/tasks/<id>: Update a task's details (Members+).
    
*   DELETE /api/tasks/<id>: Delete a task (Members+).
    
*   PATCH /api/tasks/<id>/move: **(Workflow)** Updates a task's status (column) and order after a drag-and-drop (Members+).
