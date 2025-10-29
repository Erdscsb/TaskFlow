import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import api from '../services/api'; // Make sure this file is updated! (See below)

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('appUser');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });

    // --- CHANGE 1: Store the token in state ---
    // This makes the context "reactive" to token changes.
    const [token, setToken] = useState(() => localStorage.getItem('token'));

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });
            const { user, token } = response.data;
            
            // Set the state
            setUser(user);
            setToken(token); // <-- Add this
            
            // Persist to localStorage
            localStorage.setItem('appUser', JSON.stringify(user));
            localStorage.setItem('token', token);
        } catch (error) {
            console.error('Login failed', error.response?.data);
            alert('Login failed: ' + (error.response?.data?.message || 'Unknown error'));
        }
    }, []);

    const logout = useCallback(() => {
        // Clear the state
        setUser(null);
        setToken(null); // <-- Add this
        
        // Remove from localStorage
        localStorage.removeItem('appUser');
        localStorage.removeItem('token');
    }, []);

    const register = useCallback(async (email, password) => {
        try {
            const response = await api.post('/register', { email, password });
            alert(response.data.message); 
        } catch (error) {
            console.error('Registration failed', error.response?.data);
            alert('Registration failed: ' + (error.response?.data?.message || 'Unknown error'));
        }
    }, []);

    const value = useMemo(() => ({
        user,
        token, // <-- CHANGE 2: Use the token from state
        login,
        logout,
        register
    }), [user, token, login, logout, register]); // <-- CHANGE 3: Add token to dependency array

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
