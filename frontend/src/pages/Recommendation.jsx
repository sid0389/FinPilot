import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import MarketRiskStrip from '../components/MarketRiskStrip';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const MARKETS = {
  stocks: { id:'stocks', name:'Stock Market',    icon:'📈', color:'#22d3ee', risk:'Moderate', return:'10–15% p.a.', liquidity:'High',      min:'₹500',   horizon:'3–7 years', desc:'Regulated equity investments in listed companies. Best for stable, long-term wealth creation through SIPs and Demat accounts.' },
  crypto: { id:'crypto', name:'Cryptocurrency',  icon:'₿',  color:'#a3e635', risk:'Very High', return:'20–1000%+',  liquidity:'Very High', min:'₹100',   horizon:'1–5 years', desc:'Decentralized digital assets. High potential rewards with extreme volatility. 24×7 global markets, unregulated in India.' },
  forex:  { id:'forex',  name:'Forex Market',    icon:'💱', color:'#a78bfa', risk:'High',      return:'5–20% p.a.', liquidity:'Extreme',   min:'₹5,000', horizon:'Short–Med', desc:'Trade global currency pairs. World\'s most liquid market. Requires strong macroeconomic knowledge and leverage discipline.' },
};

const GOAL_LABELS = { wealth:'wealth building', retirement:'retirement', home:'buying a home', education:'child education', emergency:'an emergency fund' };
const DURATION_LABELS = { short:'Short-term', medium:'Medium-term', long:'Long-term', verylong:'Very long-term' };
const totalOf = (p) => Object.values(p.expenses || {}).reduce((a,b)=>a+(Number(b)||0),0);
// Signature of everything the recommendation depends on — used to detect a stale result.
const inputsKey = (profile, riskScore) => JSON.stringify([
  profile.income, totalOf(profile), profile.investmentDuration, profile.financialGoal, [...(profile.financialGoals||[])].sort(), riskScore,
]);

const generate = (profile, riskScore) => {
  const sr = profile.income > 0
    ? ((profile.income - totalOf(profile)) / profile.income) * 100
    : 0;
  let s = 50, c = 50, f = 50;
  if (riskScore >= 75) { c += 28; f += 15; }
  else if (riskScore >= 50) { s += 22; c += 6; }
  else if (riskScore >= 30) { s += 30; c -= 15; }
  else { s += 35; c -= 25; f -= 10; }
  if (sr >= 25) { s += 10; c += 8; }
  if (profile.investmentDuration === 'long' || profile.investmentDuration === 'verylong') { s += 15; }
  if (profile.investmentDuration === 'short') { c += 12; f += 10; }
  const clamp = v => Math.min(98, Math.max(20, Math.round(v)));
  s = clamp(s); c = clamp(c); f = clamp(f);
  const ranked = [
    { market: MARKETS.stocks, score: s },
    { market: MARKETS.crypto, score: c },
    { market: MARKETS.forex,  score: f },
  ].sort((a,b) => b.score - a.score);
  return {
    ranked, scores: { stocks:s, crypto:c, forex:f },
    savingsRate: sr,
    inputsKey: inputsKey(profile, riskScore),
    reasons: [
      `Risk score of ${riskScore}/100 aligns ${riskScore>=60?'strongly':'moderately'} with ${ranked[0].market.name}.`,
      `Savings rate of ${sr.toFixed(1)}% provides ${sr>=20?'strong':'moderate'} investment capacity.`,
      `${DURATION_LABELS[profile.investmentDuration] || profile.investmentDuration} investment horizon vs. ${ranked[0].market.name}'s typical ${ranked[0].market.horizon} time frame.`,
      `Your goals (${(profile.financialGoals?.length ? profile.financialGoals : [profile.financialGoal]).map(g => GOAL_LABELS[g] || g).join(', ')}) were weighed against ${ranked[0].market.name}'s return profile.`,
    ],
    disclaimer: 'This is educational analysis only — not financial advice. Consult a SEBI-registered advisor before investing real money.',
  };
};

export default function Recommendation() {
  const { profile, saveRecommendation } = useFinance();
  const [result,  setResult]  = useState(profile.recommendation);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const riskScore = profile.riskScore ?? 50;

  // profile loads asynchronously (backend / localStorage) — pick up a saved recommendation when it arrives
  useEffect(() => { if (profile.recommendation) setResult(profile.recommendation); }, [profile.recommendation]);
  const isStale = !!result && result.inputsKey !== inputsKey(profile, riskScore);

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const rec = generate(profile, riskScore);
    saveRecommendation(rec);
    setResult(rec);
    setLoading(false);
  };

  if (!result) {
    const sr = profile.income > 0
      ? ((profile.income - totalOf(profile)) / profile.income * 100).toFixed(1)
      : '0.0';
    return (
      <div className="max-w-lg mx-auto pb-8">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="fp-card text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center mx-auto mb-5 text-3xl">✦</div>
          <h2 className="font-display font-bold text-2xl text-slate-100 mb-2">Get Your Recommendation</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto mb-6">
            Our 5-factor engine analyzes your income, expenses, savings ratio, risk score, and investment goals.
          </p>
          {profile.riskScore === null && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-left"
              style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)' }}>
              <span className="text-amber-400 font-semibold">⚠️ Risk quiz not completed</span>
              <span className="text-slate-400"> — using default score. </span>
              <button onClick={() => navigate('/risk-assessment')} className="text-amber-400 underline">Complete it first</button>
              <span className="text-slate-400"> for best results.</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mb-6 text-left">
            {[
              { icon:'◎', label:'Risk Score', val:`${riskScore}/100` },
              { icon:'💰', label:'Savings Rate', val:`${sr}%` },
              { icon:'📅', label:'Duration', val: DURATION_LABELS[profile.investmentDuration] || profile.investmentDuration },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="font-display font-bold text-lime-400 text-base capitalize">{s.val}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={loading} className="fp-btn-primary px-8 py-3">
            {loading ? 'Analyzing…' : 'Generate Recommendation →'}
          </button>
        </motion.div>
      </div>
    );
  }

  // Radar is driven by the user's actual inputs (savings rate, horizon, goal) — not fixed numbers.
  const srNow = profile.income > 0 ? ((profile.income - totalOf(profile)) / profile.income) * 100 : 0;
  const savingsFit  = srNow >= 20 ? { stocks:80, crypto:60, forex:65 } : srNow >= 10 ? { stocks:65, crypto:40, forex:50 } : { stocks:45, crypto:25, forex:35 };
  const dur = profile.investmentDuration;
  const durationFit = (dur === 'long' || dur === 'verylong') ? { stocks:90, crypto:55, forex:45 } : dur === 'short' ? { stocks:40, crypto:70, forex:75 } : { stocks:70, crypto:55, forex:60 };
  const goalFit = ['wealth','retirement'].includes(profile.financialGoal) ? { stocks:85, crypto:65, forex:45 }
                : profile.financialGoal === 'income' ? { stocks:60, crypto:25, forex:65 } : { stocks:55, crypto:10, forex:30 };
  const radarData = [
    { subject:'Risk Fit',   stocks: result.scores.stocks, crypto: result.scores.crypto, forex: result.scores.forex },
    { subject:'Savings',    ...savingsFit },
    { subject:'Duration',   ...durationFit },
    { subject:'Goals',      ...goalFit },
    { subject:'Stability',  stocks:85, crypto:40, forex:65 },
  ];
  const RANK_LABELS = ['🥇 Best Match','🥈 Secondary','🥉 Alternative'];

  return (
    <div className="pb-8 space-y-4">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <h2 className="font-display font-bold text-xl text-slate-100">Your Market Recommendation</h2>
        <p className="text-sm text-slate-500 mt-1">Based on your complete financial profile</p>
      </motion.div>

      {isStale && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)' }}>
          <span className="text-amber-400">⚠️ Your income, expenses, goals or risk score changed since this was generated.</span>
          <button onClick={handleGenerate} disabled={loading} className="fp-btn-primary px-4 py-1.5 text-xs">
            {loading ? 'Updating…' : 'Update recommendation'}
          </button>
        </div>
      )}

      {/* Market cards */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {result.ranked.map(({ market:m, score }, rank) => (
          <div key={m.id} className="fp-card relative"
            style={{ borderColor: rank===0 ? `${m.color}30` : 'rgba(255,255,255,0.06)' }}>
            {rank===0 && (
              <div className="absolute top-3 right-3 fp-badge text-xs"
                style={{ background:`${m.color}12`, border:`1px solid ${m.color}25`, color: m.color }}>
                Best Match
              </div>
            )}
            <div className="text-3xl mb-2">{m.icon}</div>
            <div className="text-xs text-slate-500 mb-1">{RANK_LABELS[rank]}</div>
            <h3 className="font-display font-bold text-lg text-slate-100 mb-3">{m.name}</h3>
            {/* Score bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Suitability</span>
                <span style={{ color: m.color }}>{score}%</span>
              </div>
              <div className="fp-progress">
                <motion.div className="fp-progress-fill"
                  initial={{ width:0 }} animate={{ width:`${score}%` }}
                  transition={{ duration:1, delay: rank*0.15 }}
                  style={{ background: m.color }} />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">{m.desc}</p>
            <div className="grid grid-cols-2 gap-2">
              {[['Risk',m.risk],['Return',m.return],['Liquidity',m.liquidity],['Min. Invest',m.min]].map(([l,v]) => (
                <div key={l} className="rounded-lg p-2" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-xs text-slate-500">{l}</div>
                  <div className="text-xs font-medium text-slate-200 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Radar + Reasons */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="fp-card">
          <div className="section-title text-sm mb-1">Suitability Radar</div>
          <div className="section-subtitle mb-4">Multi-dimensional fit analysis</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(163,230,53,0.07)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#64748b', fontSize:10 }} />
              <Radar name="Stocks" dataKey="stocks" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.08} strokeWidth={2} />
              <Radar name="Crypto" dataKey="crypto" stroke="#a3e635" fill="#a3e635" fillOpacity={0.06} strokeWidth={1.5} />
              <Radar name="Forex"  dataKey="forex"  stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.06} strokeWidth={1.5} />
              <Tooltip contentStyle={{ background:'#121216', border:'1px solid rgba(163,230,53,0.2)', borderRadius:8, fontSize:11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="fp-card">
          <div className="section-title text-sm mb-1">Analysis Rationale</div>
          <div className="section-subtitle mb-4">Why this recommendation fits you</div>
          <div className="space-y-3">
            {result.reasons.map((r,i) => (
              <div key={i} className="flex gap-3 pb-3 border-b border-white/4 last:border-0">
                <span className="text-lime-400 font-mono text-xs mt-0.5 flex-shrink-0">→</span>
                <p className="text-sm text-slate-300 leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <MarketRiskStrip riskScore={riskScore} savings={profile.savings} />

      {/* Disclaimer */}
      <div className="text-xs text-slate-600 text-center py-3 px-4 rounded-xl"
        style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
        ⚠️ {result.disclaimer}
      </div>

      <div className="flex gap-3">
        <button onClick={() => { saveRecommendation(null); setResult(null); }} className="fp-btn-secondary">
          Regenerate
        </button>
        <button onClick={() => navigate('/market-comparison')} className="fp-btn-primary">
          Compare Markets →
        </button>
      </div>
    </div>
  );
}
