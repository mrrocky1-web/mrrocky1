import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ra_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ra_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [restaurantStatus, setRestaurantStatus] = useState(() => localStorage.getItem('ra_status') || null);

  const login = useCallback((t, u, status) => {
    localStorage.setItem('ra_token', t);
    localStorage.setItem('ra_user', JSON.stringify(u));
    if (status) localStorage.setItem('ra_status', status);
    setToken(t);
    setUser(u);
    setRestaurantStatus(status || null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ra_token');
    localStorage.removeItem('ra_user');
    localStorage.removeItem('ra_status');
    setToken(null);
    setUser(null);
    setRestaurantStatus(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, restaurantId: user?.restaurant_id, restaurantStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
