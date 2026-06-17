import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const login = async (email, password) => {
    const { data } = await api.post('/users/login/', { email, password });
    localStorage.setItem('access',  data.tokens.access);
    localStorage.setItem('refresh', data.tokens.refresh);
    localStorage.setItem('user',    JSON.stringify(data.user));
    setUser({ ...data.user, is_admin: data.is_admin, role: data.role });
    return data;
  };

  const logout = async () => {
    try { await api.post('/users/logout/', { refresh: localStorage.getItem('refresh') }); } catch {}
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
