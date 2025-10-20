# TaskFlow  Kanban Board 🚀

TaskFlow is a full-stack project management application inspired by tools like Trello and Asana. It features a secure **Flask (Python)** backend serving a RESTful API and a modern, dynamic **React (JavaScript)** frontend.

Users can register, create projects, manage tasks through a visual Kanban board, and collaborate with other users. The app implements token-based authentication and role-based access control.

---

## Features

* **User Authentication:** Secure user registration, login, and logout functionality using JWT (JSON Web Tokens).
* **Role-Based Access:** Distinction between user roles (e.g., `ROLE_USER`, `ROLE_ADMIN`) using Flask-Security-Too.
* **Project Management:** Full **CRUD** (Create, Read, Update, Delete) operations for projects.
* **Task Management:** Full **CRUD** operations for tasks, which belong to specific projects.
* **Kanban Board:** A visual, interactive board with columns (e.g., **TODO**, **IN_PROGRESS**, **DONE**).
* **Drag-and-Drop:** Users can drag and drop tasks between columns and re-order them. The changes are saved to the database instantly.
* **Relational Data:**
    * **Many-to-Many:** Users can be members of multiple projects, and projects can have multiple users.
    * **One-to-Many:** A project can have many tasks.

---

## Tech Stack

This project is built with a modern, decoupled frontend and backend.

### Backend (Flask)
* **Framework:** **Flask**
* **API:** **Flask-RESTful** for creating RESTful API endpoints.
* **ORM:** **Flask-SQLAlchemy** for database modeling and interaction.
* **Security:** **Flask-Security-Too** for token-based authentication (JWT) and role management.
* **Database:** **PostgreSQL** (or MySQL).
* **CORS:** **Flask-CORS** to handle cross-origin requests from the React frontend.

### Frontend (React)
* **Framework:** **React** (using Hooks like `useState` and `useEffect`).
* **Routing:** **React Router** for client-side navigation (`/login`, `/dashboard`, `/project/:id`).
* **API Calls:** **Axios** for making asynchronous HTTP requests to the Flask API.
* **Drag-and-Drop:** **react-beautiful-dnd** (or **@dnd-kit/core**) for the interactive Kanban board.
* **Styling:** (e.g., **Tailwind CSS**, **Styled-Components**, or **CSS Modules**).

---

## Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

* Python 3.10+
* Node.js 16+ and npm (or yarn)
* Git
* A running PostgreSQL (or MySQL) server

### 1. Clone the Repository

```bash
git clone https://github.com/Erdscsb/TaskFlow.git
cd TaskFlow

### 2. Backend Setup (Flask)

1.  **Navigate to the backend folder:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the `backend` directory. Copy the contents of `.env.example` (you should create this file) and fill in your details.

    **`.env` example:**
    ```
    SECRET_KEY='your_super_secret_key'
    SECURITY_PASSWORD_SALT='your_password_salt'
    DATABASE_URL='postgresql://user:password@localhost/taskflow_db'
    JWT_SECRET_KEY='your_jwt_secret'
    ```

5.  **Initialize the Database:**
    (This assumes you are using Flask-Migrate)
    ```bash
    flask db init
    flask db migrate -m "Initial database migration."
    flask db upgrade
    ```

6.  **Run the Flask Server:**
    ```bash
    flask run
    ```
    Your backend API will be running at `http://127.0.0.1:5000`.

### 3. Frontend Setup (React)

1.  **Navigate to the frontend folder (in a new terminal):**
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `frontend` directory.

    **`.env` example:**
    ```
    REACT_APP_API_URL=[http://127.0.0.1:5000](http://127.0.0.1:5000)
    ```

4.  **Run the React Development Server:**
    ```bash
    npm start
    # or
    yarn start
    ```
    Your frontend application will open at `http://localhost:3000`.

---

## API Endpoints

The Flask backend provides the following RESTful API endpoints:

### Auth
* `POST /register`: Register a new user.
* `POST /login`: Log in a user and receive a JWT.
* `POST /logout`: Log out a user.

### Projects
* `GET /api/projects`: Get all projects for the authenticated user.
* `POST /api/projects`: Create a new project.
* `GET /api/projects/<int:id>`: Get details for a single project (and its tasks).
* `PUT /api/projects/<int:id>`: Update a project's details.
* `DELETE /api/projects/<int:id>`: Delete a project.

### Tasks
* `POST /api/projects/<int:id>/tasks`: Create a new task for a project.
* `PUT /api/tasks/<int:id>`: Update a task's details.
* `DELETE /api/tasks/<int:id>`: Delete a task.
* `PATCH /api/tasks/<int:task_id>/move`: **(Workflow)** Updates a task's `status` (column) and `order` after a drag-and-drop.
