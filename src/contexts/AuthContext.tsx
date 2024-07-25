import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/interfaces';
import { setCookie, eraseCookie,getCookie } from '../lib/cookies';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
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
    const id = getCookie('bmcamp_user_id') ? Number(getCookie('bmcamp_user_id')) : 0;
    const token = getCookie('bmcamp_user_token');
    const firstName = getCookie('bmcamp_user_firstName') ?? '';
    const lastName = getCookie('bmcamp_user_lastName') ?? '';
    const email = getCookie('bmcamp_user_email') ?? '';
    const phoneNumber = getCookie('bmcamp_user_phoneNumber') ?? '';
    const role = getCookie('bmcamp_user_role') ?? '';
    if (token && role) {
      setUser({ id, token, firstName, lastName, email, phoneNumber, role });
    }
    setLoading(false);
  }, []);

  const login = (user: User) => {
    if(user.role === undefined || user.role == null || user.role.length === 0 ){
      return logout();
    };

    if(user.token === undefined || user.token == null || user.token.length === 0){
      return logout();
    };

    setCookie('bmcamp_user_id', String(user.id), 3600000);
    setCookie('bmcamp_user_token', user.token, 3600000);
    setCookie('bmcamp_user_firstName', user.firstName ?? '', 3600000);
    setCookie('bmcamp_user_lastName', user.lastName ?? '', 3600000);
    setCookie('bmcamp_user_email', user.email ?? '', 3600000);
    setCookie('bmcamp_user_phoneNumber', user.phoneNumber ?? '', 3600000);
    setCookie('bmcamp_user_role', user.role ?? '', 3600000);
    setUser(user);
  };

  const logout = () => {
    eraseCookie('bmcamp_user_id');
    eraseCookie('bmcamp_user_token');
    eraseCookie('bmcamp_user_firstName');
    eraseCookie('bmcamp_user_lastName');
    eraseCookie('bmcamp_user_email');
    eraseCookie('bmcamp_user_phoneNumber');
    eraseCookie('bmcamp_user_role');
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
