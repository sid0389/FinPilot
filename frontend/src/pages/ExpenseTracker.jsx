import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const EXPENSE_FIELDS = [
  { key:'housing',       label:'Housing / Rent',   icon:'🏠' },
  { key:'food',          label:'Food & Dining',     icon:'🍽️' },
  { key:'transport',     label:'Transport',         icon:'🚗' },
  { key:'entertainment', label:'Entertainment',     icon:'🎮' },
  { key:'utilities',     label:'Utilities',         icon:'⚡' },
  { key:'healthcare',    label:'Healthcare',        icon:'🏥' },
  { key:'education',     label:'Education',         icon:'📚' },
  { key:'others',        label:'Others',            icon:'📦' },
];

const DURATIONS = [
  { id:'short',  label:'Short Term',  sub:'< 1 year'  },
  { id:'medium', label:'Medium Term', sub:'1–5 years' },
  { id:'long',   label:'Long Term',   sub:'5+ years'  },
];

const GOALS = [
  { id:'wealth',     label:'Wealth Building',  icon:'💰' },
  { id:'retirement', label:'Retirement',        icon:'🏖️' },
  { id:'home',       label:'Buy a Home',        icon:'🏠' },
  { id:'education',  label:'Child Education',   icon:'🎓' },
  { id:'emergency',  label:'Emergency Fund',    icon:'🛡️' },
];

const COLORS = ['#a3e635','#22d3ee','#a78bfa','#fbbf24','#fb7185','#34d399','#38bdf8','#f97316'];

export default function ExpenseTracker() {
  const { profile, updateProfile, updateExpense, totalExpenses, savingsRatio, disposable, flushSync } = useFinance();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await flushSync();                       // push any pending edits to the server right now
    setSaving(false);
    toast.success('Profile saved successfully!');
  };

  const toggleGoal = (id) => {
    const goals = profile.financialGoals || [];
    const updated = goals.includes(id) ? goals.filter(g => g !== id) : [...goals, id];
    updateProfile('financialGoals', updated);
  };

  // Recomputed on every render from live state, so both charts follow the inputs.
  const pieData = useMemo(() => EXPENSE_FIELDS
    .map((f,i) => ({ name: f.label, value: Number(profile.expenses[f.key]) || 0, color: COLORS[i] }))
    .filter(d => d.value > 0),
  [profile.expenses]);

  const barData = EXPENSE_FIELDS.map((f,i) => ({
    name: f.label.split('/')[0].trim(), amount: Number(profile.expenses[f.key]) || 0, fill: COLORS[i],
  }));

  const chartKey = EXPENSE_FIELDS.map(f => profile.expenses[f.key] || 0).join('-');
  const pct = (v) => totalExpenses > 0 ? ((v / totalExpenses) * 100).toFixed(1) : '0.0';
  const barMax = Math.max(...barData.map(b => b.amount), 0);

  return (
    <div className="pb-6 space-y-4">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <h2 className="font-display font-bold text-xl text-slate-100">Expense Tracker</h2>
        <p className="text-sm text-slate-500 mt-1">Enter your monthly income and spending across all categories</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: inputs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Income */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }} className="fp-card">
            <div className="section-title text-sm mb-4">💼 Income & Savings</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Monthly Income (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                  <input type="number" min="0" inputMode="numeric" className="fp-input pl-7"
                    value={profile.income || ''} placeholder="0"
                    onChange={e => updateProfile('income', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Current Savings (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                  <input type="number" min="0" inputMode="numeric" className="fp-input pl-7"
                    value={profile.savings || ''} placeholder="0"
                    onChange={e => updateProfile('savings', e.target.value)} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Expenses */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="fp-card">
            <div className="section-title text-sm mb-4">📊 Monthly Expenses (₹)</div>
            <div className="grid grid-cols-2 gap-4">
              {EXPENSE_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-400 mb-1.5">{f.icon} {f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                    <input type="number" min="0" inputMode="numeric" className="fp-input pl-7"
                      value={profile.expenses[f.key] || ''}
                      placeholder="0"
                      onChange={e => updateExpense(f.key, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="fp-card">
            <div className="section-title text-sm mb-4">🎯 Investment Preferences</div>
            <div className="mb-5">
              <div className="text-xs text-slate-400 mb-3">Investment Duration</div>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(d => (
                  <button key={d.id}
                    onClick={() => updateProfile('investmentDuration', d.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      profile.investmentDuration === d.id
                        ? 'border-lime-400/40 bg-lime-400/10 text-lime-400'
                        : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}>
                    {d.label} <span className="text-xs opacity-60 ml-1">{d.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-3">Financial Goals <span className="text-slate-600">(select all that apply)</span></div>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => {
                  const active = (profile.financialGoals || []).includes(g.id);
                  return (
                    <button key={g.id} onClick={() => toggleGoal(g.id)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center gap-1.5 ${
                        active
                          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400'
                          : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/20'
                      }`}>
                      {g.icon} {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <button onClick={handleSave} disabled={saving} className="fp-btn-primary w-full py-3">
            {saving ? '✓ Saving…' : 'Save Financial Profile'}
          </button>
        </div>

        {/* Right: summary + charts */}
        <div className="space-y-4">
          {/* Summary */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="fp-card">
            <div className="section-title text-sm mb-4">💡 Live Summary</div>
            {[
              { label:'Total Income',   val:`₹${profile.income.toLocaleString('en-IN')}`,      color:'#22d3ee' },
              { label:'Total Expenses', val:`₹${totalExpenses.toLocaleString('en-IN')}`,       color:'#fb7185' },
              { label: disposable < 0 ? 'Deficit' : 'Disposable', val:`${disposable < 0 ? '-' : ''}₹${Math.abs(disposable).toLocaleString('en-IN')}`, color: disposable < 0 ? '#fb7185' : '#a3e635' },
              { label:'Savings Rate',   val:`${savingsRatio.toFixed(1)}%`,                     color: savingsRatio>=20?'#a3e635':'#fbbf24' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-white/4 last:border-0">
                <span className="text-xs text-slate-500">{r.label}</span>
                <span className="text-sm font-semibold" style={{ color: r.color }}>{r.val}</span>
              </div>
            ))}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Savings Rate</span><span>Target: 20%</span>
              </div>
              <div className="fp-progress">
                <div className="fp-progress-fill"
                  style={{ width:`${Math.max(0, Math.min(100, savingsRatio))}%`,
                    background: savingsRatio>=20 ? 'linear-gradient(90deg,#a3e635,#65a30d)' : 'linear-gradient(90deg,#fbbf24,#d97706)' }} />
              </div>
            </div>
          </motion.div>

          {/* Pie chart — live */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} className="fp-card">
            <div className="section-title text-sm mb-3">Expense Distribution</div>
            {pieData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-500">Enter some expenses to see the split</div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie key={chartKey} data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                        paddingAngle={pieData.length > 1 ? 3 : 0} dataKey="value" nameKey="name"
                        isAnimationActive animationDuration={350}>
                        {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v,n) => [`₹${v.toLocaleString('en-IN')} (${pct(v)}%)`, n]}
                        contentStyle={{ background:'#121216', border:'1px solid rgba(163,230,53,0.2)', borderRadius:8, fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-500">Total</span>
                    <span className="text-sm font-bold text-slate-100">₹{totalExpenses.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:d.color }} />
                        <span className="truncate">{d.name.split('/')[0].trim()}</span>
                      </span>
                      <span className="text-slate-500">{pct(d.value)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Bar chart */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="fp-card">
            <div className="section-title text-sm mb-3">Category Breakdown</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top:0, right:0, left:-25, bottom:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:8 }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:9 }} axisLine={false} tickLine={false}
                  domain={[0, barMax > 0 ? 'auto' : 1000]} allowDecimals={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(v % 1000 ? 1 : 0)}k` : `₹${v}`} />
                <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ background:'#121216', border:'1px solid rgba(163,230,53,0.2)', borderRadius:8, fontSize:11 }} />
                <Bar dataKey="amount" radius={[4,4,0,0]} fillOpacity={0.85} isAnimationActive animationDuration={350}>
                  {barData.map((b) => <Cell key={b.name} fill={b.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
