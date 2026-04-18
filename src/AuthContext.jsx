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
      // si el usuario tiene más XP en la nube que en local, usar el de la nube
      const localXP = parseInt(localStorage.getItem('tradara_xp') || '0');
      if (data.xp > localXP) {
        localStorage.setItem('tradara_xp', String(data.xp));
      }
      // merge badges — unir los de la nube con los locales
      const localBadges = JSON.parse(localStorage.getItem('tradara_badges') || '[]');
      const merged = [...new Set([...data.badges, ...localBadges])];
      localStorage.setItem('tradara_badges', JSON.stringify(merged));
      // sincronizar el merge de vuelta a la nube
      if (merged.length > data.badges.length) {
        await fetch(`${SERVER}/auth/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ xp: Math.max(data.xp, localXP), badges: merged }),
        });
      }
    } else {
      localStorage.removeItem('tradara_token');
    }
  } catch (e) {}
  setLoading(false);
}
 async function syncProgress(xp, badges) {
  const token = localStorage.getItem('tradara_token');
  if (!token) return;
  try {
    await fetch(`${SERVER}/auth/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ xp, badges }),
    });
  } catch (e) {}
 }
  function login() {
    window.location.href = `${SERVER}/auth/google`;
  }

  function logout() {
    localStorage.removeItem('tradara_token');
    setUser(null);
  }

  return (
  <AuthContext.Provider value={{ user, loading, login, logout, syncProgress }}>
    {children}
  </AuthContext.Provider>
 );
}

export function useAuth() {
  return useContext(AuthContext);
}
