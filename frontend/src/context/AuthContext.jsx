import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('hp_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(res => setUser(res.data.data))
        .catch(() => { localStorage.removeItem('hp_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (tokenVal, userData) => {
    localStorage.setItem('hp_token', tokenVal);
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenVal}`;
    setToken(tokenVal);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('hp_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const isStudent  = user?.role === 'student';
  const isCollege  = user?.role === 'college';
  const isCompany  = user?.role === 'company';
  const isOrganizer = isCollege || isCompany;
  const isAdmin    = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, loading,
      isLoggedIn: !!token,
      isStudent, isCollege, isCompany, isOrganizer, isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
