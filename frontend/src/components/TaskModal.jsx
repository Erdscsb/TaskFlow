import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TaskModal.css';

function TaskModal({ task, projectMembers, onUpdateTask, onClose, onDeleteTask }) {
  // --- State for Editable Fields ---
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  
  // Format the date for the <input type="date">
  const initialDate = task.expiry_date ? task.expiry_date.split('T')[0] : '';
  const [expiryDate, setExpiryDate] = useState(initialDate);

  const [assignees, setAssignees] = useState(task.assignees || []); // task.assignees is string[]
  const [newAssignee, setNewAssignee] = useState('');
  
  // --- API Handlers ---

  const handleSaveChanges = async () => {
    try {
      const response = await api.put(`/tasks/${task.id}`, {
        title: title,
        description: description,
        expiry_date: expiryDate || null,
        assignees: assignees,
      });
      onUpdateTask(response.data); // Update the task in the parent state
      onClose(); // Close the modal
    } catch (err) {
      console.error('Failed to save task', err);
      alert('Failed to save task.');
    }
  };

  const handleAddAssignee = (e) => {
    e.preventDefault();
    const trimmedName = newAssignee.trim();
    if (trimmedName && !assignees.includes(trimmedName)) {
      setAssignees([...assignees, trimmedName]);
    }
    setNewAssignee(''); // Clear input
  };

  const handleRemoveAssignee = (indexToRemove) => {
    setAssignees(assignees.filter((_, index) => index !== indexToRemove));
  };

  const handleDeleteTask = async () => {
    if (window.confirm("Are you sure you want to delete this task permanently?")) {
      try {
        await api.delete(`/tasks/${task.id}`);
        onDeleteTask(task.id); // Tell the parent board to remove it
        onClose(); // Close the modal
      } catch (err) {
        console.error("Failed to delete task", err);
        alert("Failed to delete task.");
      }
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
          {assignees.length === 0 && <p className="empty-text">No one assigned.</p>}
          {assignees.map((name, index) => (
            <span key={index} className="user-badge assignee">
              {name}
              <button onClick={() => handleRemoveAssignee(index)}>&times;</button>
            </span>
          ))}
        </div>

        <form className="modal-assign-form" onSubmit={handleAddAssignee}>
          <input
            type="text"
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            placeholder="Assign a new person..."
          />
          <button type="submit">Add</button>
        </form>
        
        <div className="modal-footer">
          <button className="modal-save-button" onClick={handleSaveChanges} style={{width: 'auto'}}>
            Save Changes
          </button>
          <button className="modal-delete-button" onClick={handleDeleteTask}>
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
