import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForms.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form default submission
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    try {
      await login(email, password); // Call login from AuthContext
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } catch (error) {
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login to TaskFlow</h2>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            autoComplete='email'
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Login</button>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
