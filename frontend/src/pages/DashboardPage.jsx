import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './DashboardPage.css';

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
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
    if (!newProjectName.trim()) return;

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
          projects.map(project => (
            <Link to={`/project/${project.id}`} key={project.id} className="project-card">
              <h3>{project.name}</h3>
              <p>{project.description || 'No description'}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
