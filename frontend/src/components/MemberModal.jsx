import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './MemberModal.css';

function MemberModal({ project, onClose, onDataRefresh }) {
  const { user } = useAuth(); // Get the currently logged-in user
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handler for the "Add Member" form
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      setError('Email cannot be empty.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      await api.post(`/projects/${project.id}/members`, {
        email: newMemberEmail,
      });
      setNewMemberEmail(''); // Clear input
      onDataRefresh();      // Refresh the project data on the board
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to remove a member from the project
  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await api.delete(`/projects/${project.id}/members/${memberId}`);
        onDataRefresh(); // Refresh the project data
      } catch (err) {
        alert('Failed to remove member: ' + err.response?.data?.message);
      }
    }
  };

  // Handler to change a member's role
  const handleChangeRole = async (memberId, newRole) => {
    try {
      await api.put(`/projects/${project.id}/members/${memberId}`, {
        role: newRole,
      });
      onDataRefresh(); // Refresh the project data
    } catch (err) {
      alert('Failed to change role: ' + err.response?.data?.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title-header">Manage Members</h2>
        
        {/* --- Add New Member Form --- */}
        <p className="modal-label">Add New Member</p>
        <form className="add-member-form" onSubmit={handleAddMember}>
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Enter user's email"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}

        {/* --- Member List --- */}
        <p className="modal-label">Project Members</p>
        <div className="member-list">
          {project.members.map((member) => (
            <div key={member.id} className="member-item">
              <span className="member-email">{member.email}</span>
              
              {/* --- Check if this member is the current user --- */}
              {member.id === user.id ? (
                <span className="member-role-you">{member.role} (You)</span>
              ) : (
                <div className="member-actions">
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button
                    className="remove-member-btn"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MemberModal;
