import React, { useState } from 'react';
import api from '../services/api';
import './ProjectModal.css';

function ProjectModal({ project, onUpdateProject, onClose }) {
  // State for the form fields
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');

  const handleSave = async () => {
    try {
      const response = await api.put(`/projects/${project.id}`, {
        name: name,
        description: description,
      });
      onUpdateProject(response.data); // Update the project in the dashboard's state
      onClose(); // Close the modal
    } catch (err) {
      console.error('Failed to save project', err);
      alert('Failed to save project.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2 className="modal-title-header">Edit Project</h2>
        
        {/* --- Project Name --- */}
        <p className="modal-label">Project Name</p>
        <input 
          className="modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)} 
        />
        
        {/* --- Description --- */}
        <p className="modal-label">Description</p>
        <textarea
          className="modal-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a project description..."
          rows={4}
        />

        <button className="modal-save-button" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default ProjectModal;
