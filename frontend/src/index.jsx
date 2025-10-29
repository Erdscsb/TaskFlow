import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';     // <-- 1. Import BrowserRouter
import { AuthProvider } from './context/AuthContext.jsx'; // <-- 2. Import AuthProvider
import App from './App.jsx';
import './index.css';

// 3. Call createRoot() directly, not ReactDOM.createRoot()
const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
