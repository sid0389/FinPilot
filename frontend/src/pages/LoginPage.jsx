import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm]   = useState({ email: 'demo@finpilot.app', password: '123456789' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.success) { toast.success('Welcome back!'); navigate('/dashboard'); }
    else toast.error(res.error || 'Login failed');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-lime-400/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-lime-400/15 border border-lime-400/25 flex items-center justify-center">
              <span className="text-lime-400 font-bold font-display">F</span>
            </div>
            <span className="font-display font-bold text-xl">Fin<span className="text-gradient">Pilot</span></span>
          </Link>
          <h1 className="font-display font-bold text-2xl text-slate-100 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm">Sign in to continue your financial analysis</p>
        </div>

        {/* Demo banner */}
        <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.15)' }}>
          <span className="text-lime-400 font-semibold">Demo account pre-filled.</span>
          <span className="text-slate-400"> Just click Sign In to explore.</span>
        </div>

        {/* Card */}
        <div className="fp-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email address</label>
              <input type="email" className="fp-input" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Password</label>
              <input type="password" className="fp-input" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} autoComplete="current-password" />
            </div>
            <button type="submit" className="fp-btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-lime-400 hover:text-lime-300 font-medium transition-colors">Create one free</Link>
        </p>
      </motion.div>
    </div>
  );
}
