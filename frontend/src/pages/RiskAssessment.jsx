import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';

const QUESTIONS = [
  { id:'q1', q:'If your portfolio dropped 20% in a month, you would:', options:[
    { label:'Sell everything immediately',           value:1 },
    { label:'Sell some to reduce exposure',          value:2 },
    { label:'Hold and wait for recovery',            value:3 },
    { label:'Buy more — great buying opportunity!', value:5 },
  ]},
  { id:'q2', q:'Your primary investment goal is:', options:[
    { label:'Preserve capital at all costs',         value:1 },
    { label:'Steady income with low risk',           value:2 },
    { label:'Balanced growth and income',            value:3 },
    { label:'Maximum long-term growth',              value:5 },
  ]},
  { id:'q3', q:'How long can you keep money invested without needing it?', options:[
    { label:'Less than 1 year',                      value:1 },
    { label:'1–3 years',                             value:2 },
    { label:'3–7 years',                             value:4 },
    { label:'7+ years',                              value:5 },
  ]},
  { id:'q4', q:'How stable is your primary income?', options:[
    { label:'Unstable or irregular',                 value:1 },
    { label:'Somewhat stable with variability',      value:2 },
    { label:'Stable salaried income',                value:4 },
    { label:'Very stable — multiple income sources', value:5 },
  ]},
  { id:'q5', q:'How experienced are you with investing?', options:[
    { label:'No experience at all',                  value:1 },
    { label:'Basic — savings / FDs only',            value:2 },
    { label:'Intermediate — mutual funds / stocks',  value:4 },
    { label:'Advanced — direct equities / derivatives', value:5 },
  ]},
  { id:'q6', q:'When markets are volatile, you typically:', options:[
    { label:'Check portfolio daily with anxiety',    value:1 },
    { label:'Check weekly and feel uncomfortable',   value:2 },
    { label:'Check monthly, relatively calm',        value:4 },
    { label:'Rarely check — trust the long game',   value:5 },
  ]},
];

const RISK_BANDS = [
  { min:0,  max:29,  label:'Very Conservative', color:'#22d3ee', desc:'You prefer capital safety over returns. Low-risk instruments like FDs and bonds suit you best.' },
  { min:30, max:49,  label:'Conservative',      color:'#34d399', desc:'Modest growth with limited volatility. Debt mutual funds and large-cap equities are a good fit.' },
  { min:50, max:74,  label:'Moderate',          color:'#a3e635', desc:'You seek balanced growth. Diversified equity mutual funds and blue-chip stocks align well.' },
  { min:75, max:100, label:'Aggressive',        color:'#fb7185', desc:'You can handle high volatility for high returns. Direct equities, crypto, and growth funds suit your profile.' },
];

const getRisk = (score) => RISK_BANDS.find(b => score >= b.min && score <= b.max) || RISK_BANDS[2];

export default function RiskAssessment() {
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({});
  const [done,    setDone]    = useState(false);
  const [score,   setScore]   = useState(null);
  const { saveRiskScore } = useFinance();
  const navigate = useNavigate();
  const total = QUESTIONS.length;

  const select = (qid, val) => {
    const updated = { ...answers, [qid]: val };
    setAnswers(updated);
    if (step < total - 1) setTimeout(() => setStep(s => s+1), 350);
  };

  const submit = () => {
    const sum = Object.values(answers).reduce((a,b) => a+b, 0);
    const s   = Math.round((sum / 30) * 100);
    setScore(s);
    saveRiskScore(s, answers);
    setDone(true);
  };

  /* ── Result screen ── */
  if (done && score !== null) {
    const risk = getRisk(score);
    const circ = 2 * Math.PI * 52;
    const breakdown = QUESTIONS.map((q,i) => ({
      label: ['Loss Tolerance','Growth Ambition','Time Horizon','Income Stability','Experience','Volatility Comfort'][i],
      val: answers[q.id] || 0,
    }));

    return (
      <div className="max-w-xl mx-auto pb-8 space-y-4">
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="fp-card text-center">
          {/* Gauge */}
          <div className="relative w-32 h-32 mx-auto mb-5">
            <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
              <motion.circle cx="60" cy="60" r="52" fill="none" stroke={risk.color} strokeWidth="9"
                strokeLinecap="round" strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ * (1 - score/100) }}
                transition={{ duration:1.4, ease:'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-black text-3xl" style={{ color: risk.color }}>{score}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 text-sm font-semibold"
            style={{ background:`${risk.color}15`, border:`1px solid ${risk.color}30`, color: risk.color }}>
            {risk.label} Investor
          </div>

          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto mb-6">{risk.desc}</p>

          {/* Breakdown */}
          <div className="text-left space-y-3 mb-6">
            {breakdown.map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{b.label}</span>
                  <span style={{ color: risk.color }}>{b.val}/5</span>
                </div>
                <div className="fp-progress">
                  <motion.div className="fp-progress-fill"
                    initial={{ width:0 }}
                    animate={{ width:`${(b.val/5)*100}%` }}
                    transition={{ duration:0.8, delay:0.2 }}
                    style={{ background: risk.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setStep(0); setAnswers({}); setDone(false); setScore(null); }}
              className="fp-btn-secondary flex-1 py-2.5">Retake</button>
            <button onClick={() => navigate('/recommendation')}
              className="fp-btn-primary flex-1 py-2.5">Get Recommendation →</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q    = QUESTIONS[step];
  const prog = ((step) / total) * 100;

  return (
    <div className="max-w-xl mx-auto pb-8 space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
        <h2 className="font-display font-bold text-xl text-slate-100">Risk Assessment</h2>
        <p className="text-sm text-slate-500 mt-1">6 questions · ~2 minutes · Honest answers give the best results</p>
      </motion.div>

      {/* Progress */}
      <div className="fp-card py-4">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Question {step+1} of {total}</span>
          <span className="text-lime-400">{Math.round(prog)}% complete</span>
        </div>
        <div className="fp-progress mb-3">
          <motion.div className="fp-progress-fill"
            animate={{ width:`${prog}%` }}
            transition={{ duration:0.4 }}
            style={{ background:'linear-gradient(90deg,#a3e635,#65a30d)' }} />
        </div>
        <div className="flex gap-1.5 justify-center">
          {QUESTIONS.map((_,i) => (
            <button key={i} onClick={() => setStep(i)}
              className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: i===step ? 24 : 8,
                background: i===step ? '#a3e635' : answers[QUESTIONS[i].id] ? '#34d399' : 'rgba(255,255,255,0.1)',
              }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
          transition={{ duration:0.25 }}
          className="fp-card">
          <div className="flex gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center flex-shrink-0 font-display font-bold text-lime-400 text-sm">
              {step+1}
            </div>
            <h3 className="font-display font-semibold text-slate-100 leading-snug text-base">{q.q}</h3>
          </div>
          <div className="space-y-2.5">
            {q.options.map(opt => {
              const sel = answers[q.id] === opt.value;
              return (
                <button key={opt.value} onClick={() => select(q.id, opt.value)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
                    sel
                      ? 'border-lime-400/40 bg-lime-400/10 text-lime-400'
                      : 'border-white/7 bg-white/2 text-slate-300 hover:border-white/20 hover:bg-white/5'
                  }`}>
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    sel ? 'border-lime-400 bg-lime-400' : 'border-slate-600'
                  }`}>
                    {sel && <span className="w-2 h-2 rounded-full bg-zinc-950 block" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex gap-3">
        <button onClick={() => setStep(s => Math.max(0,s-1))} disabled={step===0}
          className="fp-btn-secondary flex-1 py-2.5 disabled:opacity-30">← Previous</button>
        {step < total-1
          ? <button onClick={() => setStep(s => s+1)} disabled={!answers[q.id]}
              className="fp-btn-primary flex-1 py-2.5 disabled:opacity-40">Next →</button>
          : <button onClick={submit} disabled={Object.keys(answers).length < total}
              className="fp-btn-primary flex-1 py-2.5 disabled:opacity-40">Calculate Score →</button>
        }
      </div>
    </div>
  );
}
