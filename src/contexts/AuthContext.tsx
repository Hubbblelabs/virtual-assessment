'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'teacher' | 'student';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
}

interface RegisterData {
    email: string;
    password: string;
    name: string;
    role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            const token = sessionStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    if (response.data.user) {
                        setUser(response.data.user);
                        // Ensure cookie is synced (session cookie)
                        document.cookie = `token=${token}; path=/; SameSite=Strict`;
                    } else {
                        // If structure is different or user not found/valid
                        throw new Error('User not found in response');
                    }
                } catch (error) {
                    console.error('Token verification failed:', error);
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        verifyUser();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
            document.cookie = `token=${token}; path=/; SameSite=Strict`;
            setUser(user);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || 'Login failed');
        }
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        try {
            const response = await api.post('/auth/register', data);
            const { token, user } = response.data;

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
            document.cookie = `token=${token}; path=/; SameSite=Strict`;
            setUser(user);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || 'Registration failed');
        }
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
