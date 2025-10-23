import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);

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
