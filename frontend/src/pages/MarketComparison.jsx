import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const MARKETS = [
  { id:'stocks', name:'Stock Market',   icon:'📈', color:'#22d3ee', risk:'Moderate',  vol:'Medium-High', ret:'10–15% p.a.', liq:'High',      min:'₹500',    hours:'9:15am–3:30pm', reg:'SEBI Regulated',   desc:'Equity investments in publicly listed companies on NSE/BSE. Regulated, transparent, and liquid market best for long-term wealth creation.' },
  { id:'crypto', name:'Cryptocurrency', icon:'₿',  color:'#a3e635', risk:'Very High', vol:'Extreme',     ret:'20–1000%+',  liq:'Very High', min:'₹100',    hours:'24×7 Global',    reg:'Unregulated (India)', desc:'Decentralized digital assets. Extremely volatile but highly liquid. Operates globally 24×7 with no central authority.' },
  { id:'forex',  name:'Forex Market',   icon:'💱', color:'#a78bfa', risk:'High',      vol:'High',        ret:'5–20% p.a.', liq:'Extreme',   min:'₹5,000',  hours:'24×5 Global',    reg:'RBI / SEBI',        desc:'World\'s largest financial market trading currency pairs. Requires leverage knowledge and macroeconomic understanding.' },
];

const RADAR = [
  { metric:'Return Potential', stocks:70, crypto:95, forex:55 },
  { metric:'Stability',        stocks:78, crypto:22, forex:50 },
  { metric:'Liquidity',        stocks:80, crypto:90, forex:99 },
  { metric:'Accessibility',    stocks:85, crypto:92, forex:62 },
  { metric:'Regulation',       stocks:96, crypto:18, forex:72 },
];

const TABLE = [
  { feature:'Volatility',      stocks:'Medium-High',        crypto:'Extreme',              forex:'High',                best:'stocks' },
  { feature:'Expected Return', stocks:'10–15% p.a.',        crypto:'Variable',             forex:'5–20% p.a.',          best:'crypto' },
  { feature:'Liquidity',       stocks:'High',               crypto:'Very High',            forex:'Extreme',             best:'forex'  },
  { feature:'Min Investment',  stocks:'₹500 (via SIP)',     crypto:'₹100',                 forex:'₹5,000',             best:'crypto' },
  { feature:'Regulation',      stocks:'SEBI Regulated',     crypto:'Unregulated',          forex:'RBI/SEBI',            best:'stocks' },
  { feature:'Trading Hours',   stocks:'9:15am–3:30pm IST',  crypto:'24×7',                 forex:'24×5',                best:'crypto' },
  { feature:'Tax (India)',      stocks:'10–15% LTCG/STCG',  crypto:'30% flat',             forex:'Slab rate',           best:'stocks' },
  { feature:'Complexity',      stocks:'Moderate',           crypto:'Moderate',             forex:'High',                best:'stocks' },
];

const FUTURE = [
  { icon:'📡', title:'Real-Time Data',       desc:'Live WebSocket feeds from NSE, Binance, and Forex APIs.' },
  { icon:'💼', title:'Portfolio Tracker',    desc:'Track holdings, P&L, and allocation across all markets.' },
  { icon:'🤖', title:'ML Price Prediction',  desc:'LSTM and Random Forest models for trend forecasting.' },
  { icon:'💳', title:'Direct Investing',     desc:'Broker API integration to execute trades in-platform.' },
  { icon:'📱', title:'Mobile App',           desc:'React Native app with push alerts and biometric login.' },
  { icon:'📊', title:'Tax Calculator',       desc:'Automatic capital gains computation for all markets.' },
];

export default function MarketComparison() {
  const [active, setActive] = useState('all');

  return (
    <div className="pb-8 space-y-5">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <h2 className="font-display font-bold text-xl text-slate-100">Market Comparison</h2>
        <p className="text-sm text-slate-500 mt-1">Deep dive into Stocks, Crypto, and Forex across 5 dimensions</p>
      </motion.div>

      {/* Market cards */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MARKETS.map(m => (
          <div key={m.id} className="fp-card-hover" style={{ borderColor: `${m.color}18` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{m.icon}</div>
              <span className="fp-badge text-xs"
                style={{ background:`${m.color}12`, border:`1px solid ${m.color}25`, color: m.color }}>
                {m.risk} Risk
              </span>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 mb-2">{m.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{m.desc}</p>
            {[['Volatility',m.vol],['Exp. Return',m.ret],['Liquidity',m.liq],['Min. Invest',m.min],['Hours',m.hours],['Regulation',m.reg]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2 border-b border-white/4 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-medium text-slate-200">{v}</span>
              </div>
            ))}
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="fp-card">
          <div className="section-title text-sm mb-1">Multi-Dimension Radar</div>
          <div className="section-subtitle mb-4">Normalized scoring across 5 key attributes</div>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={RADAR}>
              <PolarGrid stroke="rgba(163,230,53,0.07)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill:'#64748b', fontSize:10 }} />
              <Radar name="Stocks" dataKey="stocks" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.08} strokeWidth={2} />
              <Radar name="Crypto" dataKey="crypto" stroke="#a3e635" fill="#a3e635" fillOpacity={0.06} strokeWidth={1.5} />
              <Radar name="Forex"  dataKey="forex"  stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.06} strokeWidth={1.5} />
              <Tooltip contentStyle={{ background:'#121216', border:'1px solid rgba(163,230,53,0.2)', borderRadius:8, fontSize:11 }} />
              <Legend wrapperStyle={{ fontSize:11, color:'#64748b' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="fp-card">
          <div className="section-title text-sm mb-1">Attribute Scores</div>
          <div className="section-subtitle mb-4">Comparison across all 5 attributes (0–100)</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={RADAR} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="metric" tick={{ fill:'#64748b', fontSize:8 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill:'#64748b', fontSize:9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#121216', border:'1px solid rgba(163,230,53,0.2)', borderRadius:8, fontSize:11 }} />
              <Legend wrapperStyle={{ fontSize:10, color:'#64748b' }} />
              <Bar dataKey="stocks" name="Stocks" fill="#22d3ee" fillOpacity={0.75} radius={[3,3,0,0]} />
              <Bar dataKey="crypto" name="Crypto" fill="#a3e635" fillOpacity={0.75} radius={[3,3,0,0]} />
              <Bar dataKey="forex"  name="Forex"  fill="#a78bfa" fillOpacity={0.75} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Feature matrix */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="fp-card">
        <div className="section-title text-sm mb-4">Feature Comparison Matrix</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">Feature</th>
                <th className="text-center py-3 px-3 text-xs font-medium" style={{ color:'#22d3ee' }}>📈 Stocks</th>
                <th className="text-center py-3 px-3 text-xs font-medium" style={{ color:'#a3e635' }}>₿ Crypto</th>
                <th className="text-center py-3 px-3 text-xs font-medium" style={{ color:'#a78bfa' }}>💱 Forex</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map(row => (
                <tr key={row.feature} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-3 text-xs text-slate-500">{row.feature}</td>
                  {['stocks','crypto','forex'].map(mkt => (
                    <td key={mkt} className={`py-3 px-3 text-xs text-center ${row.best===mkt ? 'font-semibold' : ''}`}
                      style={{ color: row.best===mkt ? MARKETS.find(m=>m.id===mkt)?.color : '#94a3b8' }}>
                      {row.best===mkt && <span className="mr-1 text-xs">✓</span>}
                      {row[mkt]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Future scope */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="fp-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center text-xl">🔭</div>
          <div>
            <div className="section-title text-sm">Future Roadmap</div>
            <div className="section-subtitle">Features planned for the next version of FinPilot</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FUTURE.map(f => (
            <div key={f.title} className="rounded-xl p-4"
              style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-slate-200 mb-1">{f.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed mb-2">{f.desc}</div>
              <span className="fp-badge text-xs"
                style={{ background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.18)', color:'#a78bfa' }}>
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
