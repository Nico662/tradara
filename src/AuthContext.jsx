import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const SERVER = 'https://tradara-production.up.railway.app';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // si hay token en la URL (viene de Google OAuth)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('tradara_token', token);
      window.history.replaceState({}, '', '/');
    }
    // cargar usuario
    const saved = localStorage.getItem('tradara_token');
    if (saved) {
      fetchUser(saved);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser(token) {
    try {
      const res = await fetch(`${SERVER}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('tradara_token');
      }
    } catch (e) {}
    setLoading(false);
  }

  function login() {
    window.location.href = `${SERVER}/auth/google`;
  }

  function logout() {
    localStorage.removeItem('tradara_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
