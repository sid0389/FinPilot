/**
 * api.js — centralised HTTP client for FinPilot backend.
 * Falls back gracefully to localStorage when the backend is unreachable.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ── helpers ─────────────────────────────────────────────────── */
const getToken = () => {
  try {
    const s = localStorage.getItem('fp_session');
    return s ? JSON.parse(s).token : null;
  } catch { return null; }
};

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
};

/* ── Auth ────────────────────────────────────────────────────── */
export const authAPI = {
  register : (name, email, password) => req('POST', '/auth/register', { name, email, password }),
  login    : (email, password)        => req('POST', '/auth/login',    { email, password }),
  getMe    : ()                        => req('GET',  '/auth/me'),
  updateProfile: (updates)             => req('PUT',  '/auth/profile', updates),
};

/* ── Finance ─────────────────────────────────────────────────── */
export const financeAPI = {
  get               : ()      => req('GET',    '/finance'),
  update            : (data)  => req('PUT',    '/finance', data),
  saveRisk          : (score, answers) => req('POST', '/finance/risk', { riskScore: score, riskAnswers: answers }),
  saveRecommendation: (rec)   => req('POST',   '/finance/recommendation', { recommendation: rec }),
  reset             : ()      => req('DELETE', '/finance/reset'),
};

/* ── Chat ────────────────────────────────────────────────────── */
export const chatAPI = {
  send: (messages, userContext) => req('POST', '/chat', { messages, userContext }),
};

/* ── Health ──────────────────────────────────────────────────── */
export const ping = () =>
  fetch(`${BASE}/health`).then(r => r.ok).catch(() => false);

/* ── ML risk engine (Python service in /ml, run: uvicorn serve:app --port 8000) ── */
const ML_BASE = import.meta.env.VITE_ML_URL || 'http://localhost:8000';
export const mlAPI = {
  risk: async (symbol, savings, riskScore) => {
    const q = new URLSearchParams({ symbol, savings, risk_score: riskScore });
    const res = await fetch(`${ML_BASE}/risk?${q}`);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || `ML service error (${res.status})`);
    }
    return res.json();
  },
};
