import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { generateInsights } from '../utils/insightsEngine';

const PIE_COLORS = ['#a3e635','#22d3ee','#a78bfa','#fbbf24','#fb7185','#34d399','#38bdf8','#f97316'];

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
};
const curMonthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#121216', border:'1px solid rgba(163,230,53,0.2)', borderRadius:10, padding:'8px 12px', fontSize:11 }}>
      {label && <div style={{ color:'#64748b', marginBottom:4 }}>{label}</div>}
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom:2 }}>
          {p.name}: ₹{p.value?.toLocaleString('en-IN')}
        </div>
      ))}
    </div>
  );
};

const fade = (delay=0) => ({
  initial:{ opacity:0, y:16 }, animate:{ opacity:1, y:0 },
  transition:{ duration:0.4, delay }
});

export default function Dashboard() {
  const { user }  = useAuth();
  const { profile, totalExpenses, savingsRatio, disposable } = useFinance();
  const navigate  = useNavigate();

  // Everything below is derived from live profile data (no hard-coded sample numbers).
  const expenseData = Object.entries(profile.expenses)
    .map(([k,v], i) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: Number(v) || 0, color: PIE_COLORS[i % PIE_COLORS.length] }))
    .filter(d => d.value > 0);
  const pieKey = expenseData.map(d => d.value).join('-');

  const trend = useMemo(() => {
    const key = curMonthKey();
    const past = (profile.history || []).filter(h => h.month !== key).slice(-5);
    const live = { month: key, savings: Math.max(0, profile.income - totalExpenses), expenses: totalExpenses };
    return [...past.map(h => ({ month: monthLabel(h.month), savings: Math.max(0, h.savings), expenses: h.expenses })),
            { ...live, month: monthLabel(key) + ' (now)' }];
  }, [profile.history, profile.income, totalExpenses]);

  const insights = useMemo(() => generateInsights(profile, profile.riskScore ?? 50), [profile]);

  const STATS = [
    { label:'Monthly Income',  value:`₹${profile.income.toLocaleString('en-IN')}`,      sub:'Gross monthly',          icon:'💼', color:'#22d3ee',  border:'rgba(34,211,238,0.2)'  },
    { label:'Total Expenses',  value:`₹${totalExpenses.toLocaleString('en-IN')}`,        sub:'This month',             icon:'📊', color:'#fb7185',  border:'rgba(251,113,133,0.2)' },
    { label:'Savings',         value:`₹${profile.savings.toLocaleString('en-IN')}`,      sub:`${savingsRatio.toFixed(1)}% rate`, icon:'💰', color:'#a3e635', border:'rgba(163,230,53,0.2)' },
    { label: disposable < 0 ? 'Monthly Deficit' : 'Disposable', value:`${disposable < 0 ? '-' : ''}₹${Math.abs(disposable).toLocaleString('en-IN')}`, sub: disposable < 0 ? 'Spending exceeds income' : 'Available to invest', icon:'🚀', color: disposable < 0 ? '#fb7185' : '#a78bfa', border:'rgba(167,139,250,0.2)' },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Greeting */}
      <motion.div {...fade(0)}>
        <h2 className="font-display font-bold text-xl text-slate-100">
          {greeting()}, <span className="text-gradient">{user?.name?.split(' ')[0]} 👋</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">Here's your financial snapshot</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div {...fade(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((s,i) => (
          <div key={s.label} className="fp-card" style={{ borderColor: s.border }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ background:`${s.color}12`, border:`1px solid ${s.color}25` }}>
                {s.icon}
              </div>
              {i===2 && savingsRatio > 15 && (
                <span className="fp-badge-lime text-xs">↑ Good</span>
              )}
            </div>
            <div className="font-display font-bold text-xl mb-0.5" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div {...fade(0.1)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="fp-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="section-title text-sm">Savings vs Expenses</div>
              <div className="section-subtitle">Monthly saved vs spent · updates as you edit</div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-lime-400 inline-block" />Saved
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />Expenses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend} margin={{ top:4, right:4, left:-20, bottom:0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
              <Tooltip content={<CT />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="savings"  name="Saved"    fill="#a3e635" radius={[4,4,0,0]} animationDuration={350} />
              <Bar dataKey="expenses" name="Expenses" fill="#fb7185" radius={[4,4,0,0]} animationDuration={350} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="fp-card">
          <div className="section-title text-sm mb-1">Expense Split</div>
          <div className="section-subtitle mb-3">By category</div>
          {expenseData.length === 0 ? (
            <div className="h-[150px] flex items-center justify-center text-xs text-slate-500">No expenses entered yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie key={pieKey} data={expenseData} cx="50%" cy="50%" innerRadius={42} outerRadius={62}
                    paddingAngle={expenseData.length > 1 ? 3 : 0} dataKey="value" nameKey="name" animationDuration={350}>
                    {expenseData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v,n) => [`₹${v.toLocaleString('en-IN')}`, n]}
                    contentStyle={{ background:'#121216', border:'1px solid rgba(163,230,53,0.2)', borderRadius:8, fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                {expenseData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Savings rate */}
      <motion.div {...fade(0.15)} className="fp-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="section-title text-sm">Savings Rate Progress</div>
            <div className="section-subtitle">Target: 20% of income</div>
          </div>
          <span className="font-display font-bold text-lg" style={{ color: savingsRatio >= 20 ? '#a3e635' : '#fbbf24' }}>
            {savingsRatio.toFixed(1)}%
          </span>
        </div>
        <div className="fp-progress">
          <motion.div className="fp-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, savingsRatio))}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            style={{ background: savingsRatio >= 20 ? 'linear-gradient(90deg,#a3e635,#65a30d)' : 'linear-gradient(90deg,#fbbf24,#d97706)' }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1.5">
          <span>0%</span><span>10%</span><span>20% ← Target</span><span>30%+</span>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div {...fade(0.2)} className="fp-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-title text-sm">🤖 AI Financial Insights</div>
            <div className="section-subtitle">Personalized analysis based on your profile</div>
          </div>
          <span className="fp-badge-lime">{insights.length} insights</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map(ins => (
            <div key={ins.id} className={`rounded-xl p-3.5 flex gap-3 ${
              ins.type==='positive' ? 'bg-lime-400/5 border border-lime-400/15' :
              ins.type==='warning'  ? 'bg-amber-400/5 border border-amber-400/15' :
                                      'bg-cyan-400/5 border border-cyan-400/15'
            }`}>
              <span className="text-lg flex-shrink-0">{ins.icon}</span>
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-1">{ins.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{ins.message}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fade(0.25)}>
        <div className="section-title text-sm mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Update Expenses', icon:'₹',  to:'/expenses'          },
            { label:'Risk Assessment', icon:'◎', to:'/risk-assessment'   },
            { label:'Get Recommendation', icon:'✦', to:'/recommendation'  },
            { label:'Compare Markets',  icon:'📊', to:'/market-comparison' },
          ].map(a => (
            <button key={a.to} onClick={() => navigate(a.to)}
              className="fp-card text-left flex items-center gap-3 cursor-pointer hover:border-lime-400/20 transition-all duration-200 hover:-translate-y-0.5">
              <span className="text-xl">{a.icon}</span>
              <span className="text-sm font-medium text-slate-300">{a.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Risk score banner (if not done) */}
      {profile.riskScore === null && (
        <motion.div {...fade(0.3)} className="fp-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderColor:'rgba(163,230,53,0.2)', background:'rgba(163,230,53,0.04)' }}>
          <div>
            <div className="font-display font-semibold text-slate-100 mb-1">⚡ Complete Your Risk Assessment</div>
            <div className="text-sm text-slate-400">Answer 6 quick questions to unlock your personalized market recommendation.</div>
          </div>
          <button onClick={() => navigate('/risk-assessment')} className="fp-btn-primary flex-shrink-0">
            Start Quiz →
          </button>
        </motion.div>
      )}
    </div>
  );
}
