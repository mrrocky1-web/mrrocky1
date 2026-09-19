import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sa_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('sa_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((t, u) => {
    localStorage.setItem('sa_token', t);
    localStorage.setItem('sa_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user');
    setToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
