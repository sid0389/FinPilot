import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const strength = form.password.length >= 8 ? 3 : form.password.length >= 6 ? 2 : form.password.length > 0 ? 1 : 0;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#fb7185', '#fbbf24', '#a3e635'][strength];

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill all fields'); return; }
    if (form.password.length < 6) { toast.error('Password min 6 characters'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    const res = await register(form.name, form.email, form.password);
    setLoading(false);
    if (res.success) { toast.success('Account created!'); navigate('/dashboard'); }
    else toast.error(res.error || 'Registration failed');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-lime-400/4 rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-lime-400/15 border border-lime-400/25 flex items-center justify-center">
              <span className="text-lime-400 font-bold font-display">F</span>
            </div>
            <span className="font-display font-bold text-xl">Fin<span className="text-gradient">Pilot</span></span>
          </Link>
          <h1 className="font-display font-bold text-2xl text-slate-100 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm">Free forever · No credit card required</p>
        </div>

        <div className="fp-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Full Name</label>
              <input type="text" className="fp-input" placeholder="Arjun Mehta" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email address</label>
              <input type="email" className="fp-input" placeholder="you@example.com" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Password</label>
              <input type="password" className="fp-input" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Confirm Password</label>
              <input type="password" className="fp-input" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
            </div>
            <button type="submit" className="fp-btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">By registering, you agree this is for educational use only · Not financial advice</p>
        <p className="text-center text-sm text-slate-500 mt-3">
          Already have an account?{' '}
          <Link to="/login" className="text-lime-400 hover:text-lime-300 font-medium transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
