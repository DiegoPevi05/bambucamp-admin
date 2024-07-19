import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/interfaces';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const firstName = localStorage.getItem('firstName') ?? '';
    const lastName = localStorage.getItem('lastName') ?? '';
    const email = localStorage.getItem('email') ?? '';
    const phoneNumber = localStorage.getItem('phoneNumber') ?? '';
    const role = JSON.parse(localStorage.getItem('role') || '[]');
    if (token) {
      setUser({ token, firstName, lastName, email, phoneNumber, role });
    }
    setLoading(false);
  }, []);

  const login = (token: string) => {
    const role = ['ADMIN','SUPERVISOR']; // Example role
    const firstName = 'John'; // Example firstName
    const lastName = 'Doe'; // Example lastName
    const email = 'example@gmail.com';
    const phoneNumber = '1234567890';
    localStorage.setItem('token', token);
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
    localStorage.setItem('email', email);
    localStorage.setItem('phoneNumber', phoneNumber);
    localStorage.setItem('role', JSON.stringify(role));
    setUser({ token, firstName, lastName, email, phoneNumber, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('phoneNumber');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
