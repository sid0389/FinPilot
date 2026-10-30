import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import toast from 'react-hot-toast';

const GOALS_MAP = [
  { id:'wealth', label:'Wealth Building', icon:'💰' },
  { id:'retirement', label:'Retirement', icon:'🏖️' },
  { id:'home', label:'Buy a Home', icon:'🏠' },
  { id:'education', label:'Child Education', icon:'🎓' },
  { id:'emergency', label:'Emergency Fund', icon:'🛡️' },
];

const getRisk = s => s>=75?{ label:'Aggressive', color:'#fb7185' }:s>=50?{ label:'Moderate', color:'#a3e635' }:s>=30?{ label:'Conservative', color:'#34d399' }:{ label:'Very Conservative', color:'#22d3ee' };

export default function Profile() {
  const { user, logout, updateProfile: updateUser } = useAuth();
  const { profile, totalExpenses, resetProfile } = useFinance();
  const [name, setName] = useState(user?.name || '');
  const [confirmReset, setConfirmReset] = useState(false);
  const navigate = useNavigate();
  const risk = profile.riskScore !== null ? getRisk(profile.riskScore) : null;
  const sr = profile.income > 0 ? ((profile.income - totalExpenses) / profile.income * 100).toFixed(1) : '0.0';

  const handleSave = async () => {
    await updateUser?.({ name });
    toast.success('Profile updated!');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleReset = () => {
    if (confirmReset) { resetProfile(); toast.success('Profile reset'); setConfirmReset(false); }
    else { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); }
  };

  return (
    <div className="pb-8 space-y-4">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <h2 className="font-display font-bold text-xl text-slate-100">Profile Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your account and financial preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left panel */}
        <div className="space-y-4">
          {/* Avatar card */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }} className="fp-card text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center font-display font-black text-3xl text-violet-400"
              style={{ background:'rgba(167,139,250,0.12)', border:'2px solid rgba(167,139,250,0.25)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="font-display font-bold text-lg text-slate-100">{user?.name}</div>
            <div className="text-xs text-slate-500 mt-0.5 mb-4">{user?.email}</div>

            {risk && (
              <div className="rounded-xl p-3 mb-4 text-left"
                style={{ background:`${risk.color}10`, border:`1px solid ${risk.color}25` }}>
                <div className="text-xs text-slate-500 mb-1">Risk Profile</div>
                <div className="font-display font-bold text-xl mb-0.5" style={{ color: risk.color }}>{risk.label}</div>
                <div className="text-xs text-slate-500 mb-2">{profile.riskScore}/100</div>
                <div className="fp-progress">
                  <div className="fp-progress-fill" style={{ width:`${profile.riskScore}%`, background: risk.color }} />
                </div>
              </div>
            )}

            {[
              { l:'Monthly Income',      v:`₹${profile.income.toLocaleString('en-IN')}` },
              { l:'Current Savings',     v:`₹${profile.savings.toLocaleString('en-IN')}` },
              { l:'Investment Duration', v: ({ short:'Short term', medium:'Medium term', long:'Long term', verylong:'Very long term' })[profile.investmentDuration] || profile.investmentDuration },
              { l:'Savings Rate',        v:`${sr}%` },
              { l:'Goals Selected',      v:`${(profile.financialGoals||[]).length}` },
            ].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-white/4 last:border-0">
                <span className="text-xs text-slate-500">{r.l}</span>
                <span className="text-xs font-medium text-slate-200">{r.v}</span>
              </div>
            ))}
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="fp-card">
            <div className="section-title text-sm mb-3">Notifications</div>
            {[
              { l:'Weekly Insights', on:true },
              { l:'Price Alerts',    on:false },
              { l:'Risk Updates',    on:true },
              { l:'Market Digest',   on:false },
            ].map(r => (
              <div key={r.l} className="flex justify-between items-center py-2.5 border-b border-white/4 last:border-0">
                <span className="text-xs text-slate-400">{r.l}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: r.on?'rgba(163,230,53,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${r.on?'rgba(163,230,53,0.25)':'rgba(255,255,255,0.08)'}`, color: r.on?'#a3e635':'#475569' }}>
                  {r.on?'ON':'OFF'}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right panels */}
        <div className="lg:col-span-2 space-y-4">
          {/* Account details */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="fp-card">
            <div className="section-title text-sm mb-4">👤 Account Details</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Display Name</label>
                <input type="text" className="fp-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email Address</label>
                <input type="email" className="fp-input opacity-50 cursor-not-allowed" value={user?.email || ''} readOnly />
              </div>
            </div>
            <button onClick={handleSave} className="fp-btn-primary">Save Changes</button>
          </motion.div>

          {/* Financial overview */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="fp-card">
            <div className="section-title text-sm mb-4">📊 Financial Overview</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { l:'Income',   v:`₹${profile.income.toLocaleString('en-IN')}`, c:'#22d3ee' },
                { l:'Expenses', v:`₹${totalExpenses.toLocaleString('en-IN')}`,  c:'#fb7185' },
                { l:'Savings',  v:`₹${profile.savings.toLocaleString('en-IN')}`, c:'#a3e635' },
              ].map(s => (
                <div key={s.l} className="rounded-xl p-3 text-center"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-xs text-slate-500 mb-1">{s.l}</div>
                  <div className="font-display font-bold text-base" style={{ color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            {/* Savings rate bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Savings Rate</span>
                <span style={{ color: Number(sr)>=20?'#a3e635':'#fbbf24' }}>{sr}% (target: 20%)</span>
              </div>
              <div className="fp-progress">
                <div className="fp-progress-fill"
                  style={{ width:`${Math.min(100,Number(sr))}%`, background: Number(sr)>=20?'#a3e635':'#fbbf24' }} />
              </div>
            </div>
            {/* Goals */}
            <div className="mt-4">
              <div className="text-xs text-slate-400 mb-2">Financial Goals</div>
              <div className="flex flex-wrap gap-2">
                {GOALS_MAP.map(g => {
                  const active = (profile.financialGoals||[]).includes(g.id);
                  return (
                    <span key={g.id} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: active?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${active?'rgba(52,211,153,0.3)':'rgba(255,255,255,0.07)'}`, color: active?'#34d399':'#64748b' }}>
                      {g.icon} {g.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* App preferences */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="fp-card">
            <div className="section-title text-sm mb-4">⚙️ App Preferences</div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[['Currency','INR (₹)'],['Language','English'],['Theme','Dark Mode'],['Date Format','DD/MM/YYYY']].map(([l,v]) => (
                <div key={l}>
                  <label className="block text-xs text-slate-400 mb-1.5">{l}</label>
                  <input className="fp-input opacity-50 cursor-not-allowed text-sm" value={v} readOnly />
                </div>
              ))}
            </div>

            {/* Danger zone */}
            <div className="rounded-xl p-4" style={{ background:'rgba(251,113,133,0.04)', border:'1px solid rgba(251,113,133,0.18)' }}>
              <div className="font-semibold text-sm text-rose-400 mb-2">⚠️ Danger Zone</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Resetting your profile clears all financial data, risk scores, and recommendations. Cannot be undone.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleReset}
                  className="text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                  style={{ background: confirmReset?'rgba(251,113,133,0.18)':'rgba(251,113,133,0.08)', border:'1px solid rgba(251,113,133,0.35)', color:'#fb7185' }}>
                  {confirmReset ? 'Click again to confirm' : 'Reset Profile'}
                </button>
                <button onClick={handleLogout}
                  className="text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200 text-slate-400 hover:text-white"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}>
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
