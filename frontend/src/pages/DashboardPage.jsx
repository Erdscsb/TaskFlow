import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProjectModal from '../components/ProjectModal.jsx';
import './DashboardPage.css';
import { useAuth } from '../context/AuthContext.jsx';

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [projectToEdit, setProjectToEdit] = useState(null);

  const { user } = useAuth();

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true); // Start loading
        const response = await api.get("/projects");
        setProjects(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to fetch projects. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Handle new project creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return; // Do not create if name is empty

    try {
      const response = await api.post('/projects', { name: newProjectName });
      // Add the new project to our state
      setProjects([...projects, response.data]);
      setNewProjectName(''); // Clear the input
    } catch (err) {
      console.error("Error creating project:", err);
      setError("Failed to create project.");
    }
  };

  const handleDeleteProject = async (e, projectId) => {
   if (window.confirm("Are you sure you want to permanently delete this project and all its tasks?")) {
      try {
        await api.delete(`/projects/${projectId}`);
        // Remove the project from the local state
        setProjects(projects.filter(p => p.id !== projectId)); // Update state to remove deleted project
      } catch (err) {
        console.error("Error deleting project:", err);
        setError("Failed to delete project.");
      }
    }
  };

const handleOpenEditModal = (project) => {
    setProjectToEdit(project); // Open the modal with the project data
  };

const handleUpdateProjectInState = (updatedProject) => {
    setProjects(projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    ));
    setProjectToEdit(null); // Close the modal by assigning null
  };

  if (isLoading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>My Projects</h1>
        <form className="new-project-form" onSubmit={handleCreateProject}>
          <input
            type="text"
            placeholder="New Project Name"
            name="projectName"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="project-list">
      {projects.length === 0 && !isLoading ? (
          <p>You don't have any projects yet. Create one to get started!</p>
        ) : (
          projects.map(project => {
            // --- ADD ROLE LOGIC ---
            const myRole = project.members.find(m => m.id === user.id)?.role;
            const isOwner = myRole === 'owner';

            return (
              <div key={project.id} className="project-card">
                
                <Link to={`/project/${project.id}`} className="project-card-main-link">
                  <h3>{project.name}</h3>
                  <p>{project.description || 'No description'}</p>
                </Link>

                {/* --- CONDITIONALLY RENDER ACTIONS --- */}
                {isOwner && (
                  <div className="project-card-actions">
                    <button 
                      onClick={() => handleOpenEditModal(project)} 
                      className="project-card-edit-btn"
                      title="Edit project"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => handleDeleteProject(e, project.id)} 
                      className="project-card-delete-btn"
                      title="Delete project"
                    >
                      &times;
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* --- Render the project modal --- */}
      {projectToEdit && (
        <ProjectModal
          project={projectToEdit}
          onUpdateProject={handleUpdateProjectInState}
          onClose={() => setProjectToEdit(null)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
