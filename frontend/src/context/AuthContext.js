import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // 1. Initialize user state from localStorage
    // We use JSON.parse to read the stored user object
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('appUser');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });

    // 2. Update login to accept a user object
    const login = useCallback((userData) => {
        setUser(userData);
        // We use JSON.stringify to store the user object
        localStorage.setItem('appUser', JSON.stringify(userData));
    }, []);

    // 3. Update logout to clear the user
    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('appUser');
    }, []);

    // 4. Memoize the context value
    const value = useMemo(() => ({
        user,
        // We can derive the token from the user object for App.js
        token: user?.token || null, 
        login,
        logout
    }), [user, login, logout]); // Dependency is on the 'user' object

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// 5. The useAuth hook remains the same
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
