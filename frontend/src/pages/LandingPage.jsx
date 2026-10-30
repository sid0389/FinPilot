import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: '📊', title: 'Expense Intelligence', desc: 'AI categorizes and analyzes your spending across 8 categories. See where your money goes and how to optimize it.' },
  { icon: '🎯', title: 'Risk DNA Profiling', desc: 'Our 6-question psychometric quiz uncovers your true risk tolerance — not what you think it is, but what the data says.' },
  { icon: '⚡', title: 'Smart Recommendation', desc: 'A 5-factor weighted algorithm matches your profile to the right market. Stocks, Crypto, or Forex — personalized.' },
  { icon: '📈', title: 'Market Deep Dive', desc: 'Side-by-side comparison across return potential, stability, liquidity, accessibility, and regulation.' },
];

const STATS = [
  { val: '5-Factor', label: 'Analysis Engine' },
  { val: '3 Markets', label: 'Compared' },
  { val: '6-Question', label: 'Risk Quiz' },
  { val: '100%', label: 'Free to Use' },
];

const MARKETS = [
  { name: 'Stock Market', icon: '📈', color: '#22d3ee', risk: 'Moderate Risk', desc: '10–15% p.a.', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
  { name: 'Cryptocurrency', icon: '₿', color: '#a3e635', risk: 'High Risk', desc: '20–1000%+', border: 'border-lime-500/20', bg: 'bg-lime-500/5' },
  { name: 'Forex Market', icon: '💱', color: '#a78bfa', risk: 'High Risk', desc: '5–20% p.a.', border: 'border-violet-500/20', bg: 'bg-violet-500/5' },
];

const fade = (delay=0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-slate-100 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-lime-400/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-0 w-80 h-80 bg-violet-500/4 rounded-full blur-[80px] pointer-events-none" />

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 glass sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-lime-400/15 border border-lime-400/25 flex items-center justify-center">
            <span className="text-lime-400 font-bold text-sm font-display">F</span>
          </div>
          <span className="font-display font-bold text-lg">Fin<span className="text-gradient">Pilot</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="fp-btn-secondary text-sm px-4 py-2">Sign In</Link>
          <Link to="/register" className="fp-btn-primary text-sm px-4 py-2">Get Started →</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div {...fade(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6" style={{ background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)', color: '#a3e635' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
          AI-Powered Financial Intelligence · Made for Indian Investors
        </motion.div>

        <motion.h1 {...fade(0.1)} className="font-display font-black text-5xl md:text-7xl leading-none mb-6">
          Find Your <br />
          <span className="text-gradient">Perfect Market</span>
        </motion.h1>

        <motion.p {...fade(0.2)} className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          FinPilot analyzes your income, expenses, risk tolerance, and goals — then tells you exactly which market suits you: <strong className="text-slate-200">Stocks, Crypto, or Forex.</strong>
        </motion.p>

        <motion.div {...fade(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/register" className="fp-btn-primary px-8 py-3.5 text-base w-full sm:w-auto">
            Analyze My Profile — It's Free
          </Link>
          <Link to="/login" className="fp-btn-secondary px-8 py-3.5 text-base w-full sm:w-auto">
            Sign In
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div {...fade(0.4)} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-16">
          {STATS.map(s => (
            <div key={s.val} className="fp-card text-center py-4">
              <div className="font-display font-bold text-xl text-lime-400">{s.val}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Market pills */}
        <motion.div {...fade(0.5)} className="flex flex-wrap items-center justify-center gap-3">
          {MARKETS.map(m => (
            <div key={m.name} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${m.border} ${m.bg}`}>
              <span className="text-xl">{m.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-sm" style={{ color: m.color }}>{m.name}</div>
                <div className="text-xs text-slate-500">{m.risk} · {m.desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div {...fade(0)} viewport={{ once:true }} className="text-center mb-12">
          <div className="fp-badge-lime mb-3">How It Works</div>
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">From Profile to Market <span className="text-gradient">in Minutes</span></h2>
          <p className="text-slate-400 max-w-xl mx-auto">Four steps. No jargon. Just data-driven clarity.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { step:'01', icon:'💼', title:'Set Your Financial Profile', desc:'Enter income, savings, and categorized monthly expenses across 8 buckets. Takes under 3 minutes.' },
            { step:'02', icon:'🧠', title:'Complete Risk Assessment', desc:'Answer 6 psychometric questions. Our algorithm scores your true risk DNA on a 0–100 scale.' },
            { step:'03', icon:'⚡', title:'Get Your Recommendation', desc:'The 5-factor engine analyzes risk, savings ratio, time horizon, goals, and income — producing a ranked suitability score.' },
            { step:'04', icon:'📊', title:'Compare & Decide', desc:'Deep-dive into any market with radar charts, comparison tables, and personalized reasoning.' },
          ].map((f,i) => (
            <motion.div key={f.step} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} transition={{delay:i*0.1}} viewport={{once:true}} className="fp-card-hover">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{f.icon}</span>
                </div>
                <div>
                  <div className="text-xs font-mono text-lime-400 mb-1">Step {f.step}</div>
                  <h3 className="font-display font-semibold text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div {...fade(0)} viewport={{ once:true }} className="text-center mb-12">
          <div className="fp-badge-lime mb-3">Features</div>
          <h2 className="font-display font-bold text-3xl md:text-4xl">Everything You Need to <span className="text-gradient">Invest Smarter</span></h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f,i) => (
            <motion.div key={f.title} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} transition={{delay:i*0.08}} viewport={{once:true}} className="fp-card-hover">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-display font-semibold text-slate-100 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-16 text-center">
        <motion.div initial={{opacity:0,scale:0.96}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} className="fp-card py-14 relative overflow-hidden" style={{borderColor:'rgba(163,230,53,0.15)'}}>
          <div className="absolute inset-0 bg-lime-400/3 rounded-2xl" />
          <div className="relative">
            <div className="fp-badge-lime mb-4">Free · No Card Required</div>
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">Ready to Find Your Market?</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">No financial advice. No jargon. Just data-driven insights built for you.</p>
            <Link to="/register" className="fp-btn-primary px-10 py-3.5 text-base inline-flex">
              Start Free Analysis →
            </Link>
            <p className="text-slate-600 text-xs mt-4">Educational purposes only · Not financial advice · SEBI disclaimer applies</p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-lime-400/15 flex items-center justify-center"><span className="text-lime-400 text-xs font-bold">F</span></div>
          <span className="font-display font-semibold text-sm">Fin<span className="text-gradient">Pilot</span></span>
        </div>
        <p className="text-slate-600 text-xs">© 2024 FinPilot · Educational purposes only · Not a registered financial advisor</p>
      </footer>
    </div>
  );
}
