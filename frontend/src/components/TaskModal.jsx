import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TaskModal.css';

function TaskModal({ task, projectMembers, onUpdateTask, onClose }) {
  // --- State for Editable Fields ---
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  
  // Format the date for the <input type="date">
  const initialDate = task.expiry_date ? task.expiry_date.split('T')[0] : '';
  const [expiryDate, setExpiryDate] = useState(initialDate);

  // --- Helper to get available users to assign ---
  const assignableMembers = projectMembers.filter(
    (pm) => !task.assignees.find((a) => a.id === pm.id)
  );
  
  // --- API Handlers ---

  const handleSaveChanges = async () => {
    try {
      const response = await api.put(`/tasks/${task.id}`, {
        title: title,
        description: description,
        expiry_date: expiryDate || null, // Send null if empty
      });
      onUpdateTask(response.data); // Update the task in the parent state
      onClose(); // Close the modal
    } catch (err) {
      console.error('Failed to save task', err);
      alert('Failed to save task.');
    }
  };

  const handleAssignUser = async (userId) => {
    try {
      const response = await api.post(`/tasks/${task.id}/assign`, {
        user_id: userId,
      });
      onUpdateTask(response.data); // Update parent state
    } catch (err) {
      console.error('Failed to assign user', err);
      alert('Failed to assign user.');
    }
  };

  const handleUnassignUser = async (userId) => {
    try {
      // The backend expects a 'delete' request with a 'body',
      // which is why we use the 'data' key here.
      const response = await api.delete(`/tasks/${task.id}/assign`, {
        data: { user_id: userId },
      });
      onUpdateTask(response.data); // Update parent state
    } catch (err) {
      console.error('Failed to unassign user', err);
      alert('Failed to unassign user.');
    }
  };
  
  const formattedDate = task.expiry_date 
    ? new Date(task.expiry_date).toLocaleDateString() 
    : 'None';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        {/* --- Title --- */}
        <input 
          className="modal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)} 
        />
        
        {/* --- Description --- */}
        <p className="modal-label">Description</p>
        <textarea
          className="modal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a more detailed description..."
        />

        {/* --- Metadata --- */}
        <div className="modal-meta">
          <div>
            <p className="modal-label">Creator</p>
            <span className="user-badge creator">
              {task.creator?.email || 'Unknown'}
            </span>
          </div>
          <div>
            <p className="modal-label">Expiry Date</p>
            <input 
              type="date"
              className="modal-date-input"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        {/* --- Assignees --- */}
        <p className="modal-label">Assignees</p>
        <div className="assignees-list">
          {task.assignees.length === 0 && <p className="empty-text">No one assigned.</p>}
          {task.assignees.map(user => (
            <span key={user.id} className="user-badge assignee">
              {user.email}
              <button onClick={() => handleUnassignUser(user.id)}>&times;</button>
            </span>
          ))}
        </div>

        {/* --- Assign New User Dropdown --- */}
        {assignableMembers.length > 0 && (
          <select 
            className="modal-assign-select"
            onChange={(e) => handleAssignUser(e.target.value)}
            value=""
          >
            <option value="" disabled>Assign a project member...</option>
            {assignableMembers.map(user => (
              <option key={user.id} value={user.id}>{user.email}</option>
            ))}
          </select>
        )}
        
        <button className="modal-save-button" onClick={handleSaveChanges}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default TaskModal;
