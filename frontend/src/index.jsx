import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

// 3. Call createRoot() directly, not ReactDOM.createRoot()
const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Wrap the app with BrowserRouter for routing, /login, /dashboard etc */}
      <AuthProvider> {/* Provide auth context to the entire app, to know that the user is logged in*/}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
