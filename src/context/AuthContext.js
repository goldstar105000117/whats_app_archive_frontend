import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('token');
            if (savedToken) {
                try {
                    const response = await authService.verifyToken();
                    if (response.valid) {
                        setUser(response.user);
                        setToken(savedToken);
                    } else {
                        localStorage.removeItem('token');
                        setToken(null);
                    }
                } catch (error) {
                    console.error('Token verification failed:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('token', response.token);
            toast.success('Login successful!');
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Login failed';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await authService.register(username, email, password);
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('token', response.token);
            toast.success('Registration successful!');
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Registration failed';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        toast.success('Logged out successfully');
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};