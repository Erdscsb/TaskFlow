import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectBoardPage from './pages/ProjectBoardPage.jsx';
import Navbar from './components/Navbar.jsx';

function App() {
  const { token } = useAuth();

  return (
    <div className="App">
      {token && <Navbar />}
      
      <main>
        <Routes>
          {token ? (
            /* --- Protected Routes (User is Logged In) --- */
            <>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/project/:projectId" element={<ProjectBoardPage />} />
              
              {/* Redirect root and auth pages to dashboard if logged in */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/login" element={<Navigate to="/dashboard" />} />
              <Route path="/register" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            /* --- Public Routes (User is Logged Out) --- */
            <>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            
              
              {/* Any other route redirects to login if not logged in */}
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;
