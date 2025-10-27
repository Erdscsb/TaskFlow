import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import api from '../services/api';

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
            const { user, token } = response.data;
            setUser(user);
            localStorage.setItem('appUser', JSON.stringify(user));
            localStorage.setItem('token', token);
        } catch (error) {
            console.error('Login failed', error.response?.data);
            alert('Login failed: ' + (error.response?.data?.message || 'Unknown error'));
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
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
        token: localStorage.getItem('token'),
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
