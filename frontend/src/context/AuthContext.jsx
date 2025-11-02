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

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });
            const { user } = response.data;
            
            // Set the state
            setUser(user);
            
            // Persist to localStorage
            localStorage.setItem('appUser', JSON.stringify(user));  
        } catch (error) {
            console.error('Login failed', error.response?.data);
            alert('Login failed: ' + (error.response?.data?.message || 'Unknown error'));
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error("Logout failed", error);
        }
        
        setUser(null);
        localStorage.removeItem('appUser');
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
        login,
        logout,
        register
    }), [user, login, logout, register]);

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
