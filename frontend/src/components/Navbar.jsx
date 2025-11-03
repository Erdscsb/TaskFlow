import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-brand">TaskFlow</Link>
      </div>
      <div className="navbar-right">
        {user && (
          <span className="navbar-user">{user.email}</span>
        )}
        <button onClick={logout} className="navbar-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
