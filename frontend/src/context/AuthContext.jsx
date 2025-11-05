import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = not logged in, object = logged in
    const [isLoading, setIsLoading] = useState(true); // Loading state while checking auth status

    // This runs once when the app loads to check if the user is already logged in
    useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await api.get('/me');
                // If successful, set the user
                setUser(response.data.user); // Assuming the backend returns { user: { ... } }
            } catch (error) {
                // If it fails (401, etc.), the user is not logged in
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkUser();
    }, []); // Empty dependency array = runs once on mount

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });
            const { user } = response.data;
            
            // Set the state
            setUser(user);
            
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

    const value = useMemo(() => ({ // Memorize the context value
        user,
        isLoading,
        login,
        logout,
        register
    }), [user, isLoading, login, logout, register]);

    return ( // Provide the auth context to children
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
