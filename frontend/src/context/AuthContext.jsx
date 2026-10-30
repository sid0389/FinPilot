/**
 * AuthContext — auth with backend + localStorage fallback.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 'demo_user_001', name: 'Demo User',
  email: 'demo@finpilot.app', password: '123456789',
  createdAt: new Date().toISOString(),
};

/* ── localStorage helpers ─────────────────────────────────────── */
const getUsers  = () => { try { return JSON.parse(localStorage.getItem('fp_users') || '[]'); } catch { return []; } };
const saveUsers = (u) => localStorage.setItem('fp_users', JSON.stringify(u));
if (!getUsers().find(u => u.email === DEMO_USER.email)) saveUsers([...getUsers(), DEMO_USER]);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(false);

  /* Restore session */
  useEffect(() => {
    const stored = localStorage.getItem('fp_session');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (_) {}
    }
    // Check if backend is reachable
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/health')
      .then(r => r.ok && setUseBackend(true))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    await new Promise(r => setTimeout(r, 500));

    if (useBackend) {
      try {
        const data = await authAPI.login(email, password);
        const sessionUser = { ...data.user, token: data.token };
        localStorage.setItem('fp_session', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { success: true };
      } catch (err) {
        // Fall through to localStorage
      }
    }

    // localStorage fallback
    const users = getUsers();
    const found = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { success: false, error: 'Invalid email or password. Try: demo@finpilot.app / 123456789' };
    const { password: _p, ...safe } = found;
    localStorage.setItem('fp_session', JSON.stringify(safe));
    setUser(safe);
    return { success: true };
  };

  const register = async (name, email, password) => {
    await new Promise(r => setTimeout(r, 600));

    if (useBackend) {
      try {
        const data = await authAPI.register(name, email, password);
        const sessionUser = { ...data.user, token: data.token };
        localStorage.setItem('fp_session', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { success: true };
      } catch (err) {
        if (err.message?.includes('already')) return { success: false, error: err.message };
      }
    }

    // localStorage fallback
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser = { id: `u-${Date.now()}`, name, email, password, createdAt: new Date().toISOString() };
    saveUsers([...users, newUser]);
    const { password: _p, ...safe } = newUser;
    localStorage.setItem('fp_session', JSON.stringify(safe));
    setUser(safe);
    return { success: true };
  };

  const updateProfile = async (updates) => {
    if (useBackend && user?.token) {
      try { await authAPI.updateProfile(updates); } catch (_) {}
    }
    const updated = { ...user, ...updates };
    localStorage.setItem('fp_session', JSON.stringify(updated));
    setUser(updated);
    const users = getUsers().map(u => (u.id === updated.id ? { ...u, ...updates } : u));
    saveUsers(users);
  };

  const logout = () => {
    localStorage.removeItem('fp_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, useBackend }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
