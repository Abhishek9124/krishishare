import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('krishishare_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('krishishare_token', data.token);
    localStorage.setItem('krishishare_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('krishishare_token', data.token);
    localStorage.setItem('krishishare_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('krishishare_token');
    localStorage.removeItem('krishishare_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
