import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { mlAPI } from '../services/api';

const ASSETS = {
  Crypto: [['BTC-USD', 'Bitcoin'], ['ETH-USD', 'Ethereum'], ['SOL-USD', 'Solana'], ['XRP-USD', 'XRP'], ['BNB-USD', 'BNB']],
  Forex:  [['EURUSD=X', 'EUR/USD'], ['GBPUSD=X', 'GBP/USD'], ['USDJPY=X', 'USD/JPY'], ['USDINR=X', 'USD/INR'], ['AUDUSD=X', 'AUD/USD']],
  Stocks: [['^NSEI', 'NIFTY 50'], ['^GSPC', 'S&P 500'], ['RELIANCE.NS', 'Reliance'], ['TCS.NS', 'TCS'], ['HDFCBANK.NS', 'HDFC Bank'], ['AAPL', 'Apple'], ['MSFT', 'Microsoft']],
};

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const pct = (n, d = 1) => (n * 100).toFixed(d) + '%';
const MOOD = {
  calm:     { text: 'Calm',     cls: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
  normal:   { text: 'Normal',   cls: 'text-lime-400 border-lime-400/30 bg-lime-400/10' },
  stressed: { text: 'Stressed', cls: 'text-rose-400 border-rose-400/30 bg-rose-400/10' },
};
const nameOf = (sym) => Object.values(ASSETS).flat().find(([s]) => s === sym)?.[1] || sym;
const monthYear = (iso) => new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
const driverText = (d) => {
  const f = d.factor.charAt(0).toUpperCase() + d.factor.slice(1);
  if (d.now_pct == null) return `${f} (riskier)`;
  const how = { up: 'higher than usual', down: 'lower than usual', similar: 'close to usual' }[d.direction];
  return `${f} is ${d.now_pct}% — ${how} for this asset (typical ${d.typical_pct}%)`;
};

export default function RiskForecast() {
  const { profile, setRiskForecast } = useFinance();
  const riskScore = profile.riskScore ?? 50;
  const [symbol, setSymbol]   = useState('BTC-USD');
  const [savings, setSavings] = useState(profile.savings || 100000);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const d = await mlAPI.risk(symbol, Number(savings), riskScore);
      setData(d);
      // share a compact summary so the chatbot can explain it
      setRiskForecast?.({
        name: nameOf(symbol), savings: d.savings, riskScore: d.risk_score,
        dailyVolPct: d.daily_vol * 100, badCasePct: d.loss_fraction_1_in_20 * 100,
        maxAllocInr: d.max_suggested_allocation_inr, maxAllocPct: d.max_suggested_allocation_pct_of_savings * 100,
        mood: d.mood?.label, worstDropPct: d.worst_10d_drop != null ? d.worst_10d_drop * 100 : null,
        worstDropDate: d.worst_10d_end,
      });
    } catch (e) {
      setError(/fetch/i.test(e.message)
        ? 'Cannot reach the ML service. Start it with: cd ml && python -m uvicorn serve:app --port 8000'
        : e.message);
    } finally { setLoading(false); }
  };

  const lossFrac = data?.loss_fraction_1_in_20 ?? 0;
  // position of the point forecast inside its range, for the little range bar
  const span = data ? data.daily_vol_high - data.daily_vol_low : 1;
  const mid  = data && span > 0 ? Math.min(100, Math.max(0, ((data.daily_vol - data.daily_vol_low) / span) * 100)) : 50;
  const sav  = data?.savings ?? Number(savings);   // the savings this forecast was computed for

  return (
    <div className="max-w-3xl mx-auto pb-8 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-2xl text-slate-100">Risk Forecast</h1>
        <p className="text-sm text-slate-400 mt-1">
          How much could this asset swing over the next 10 days, and what does that mean for your money?
        </p>
      </motion.div>

      <div className="fp-card space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-slate-400">Asset</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-slate-100">
              {Object.entries(ASSETS).map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map(([sym, name]) => <option key={sym} value={sym}>{name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Your savings (₹)</span>
            <input type="number" min="1" value={savings} onChange={(e) => setSavings(e.target.value)}
              className="mt-1 w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-slate-100" />
          </label>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Using your risk score: {riskScore}/100{profile.riskScore == null && ' (default — take the Risk Analysis quiz)'}
          </span>
          <button onClick={run} disabled={loading || !(Number(savings) > 0)}
            className="px-4 py-2 rounded-lg bg-lime-400 text-zinc-950 text-sm font-semibold disabled:opacity-50">
            {loading ? 'Forecasting…' : 'Forecast risk'}
          </button>
        </div>
      </div>

      {error && <div className="fp-card text-sm text-rose-400">{error}</div>}

      {data && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="fp-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">Expected daily swing, next {data.horizon_days} days</div>
                <div className="font-display font-bold text-3xl text-slate-100">{pct(data.daily_vol, 2)}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {pct(data.interval_coverage, 0)} likely range: {pct(data.daily_vol_low, 2)} – {pct(data.daily_vol_high, 2)}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${data.reliability === 'low'
                ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                : 'text-lime-400 border-lime-400/30 bg-lime-400/10'}`}>
                {data.reliability === 'low' ? 'Low confidence — market unusually unsettled' : 'Normal confidence'}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-zinc-800 mt-4">
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-lime-400/25" />
              <div className="absolute -top-1 w-1 h-4 rounded bg-lime-400" style={{ left: `${mid}%` }} />
            </div>
            {data.mood && (
              <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                <span>Market mood</span>
                <span className={`px-2 py-0.5 rounded-full border ${MOOD[data.mood.label]?.cls}`}>{MOOD[data.mood.label]?.text}</span>
                <span>— today's swings are bigger than {data.mood.percentile}% of days in the last {data.mood.history_years} years.</span>
              </div>
            )}
          </div>

          {data.drivers?.length > 0 && (
            <div className="fp-card">
              <div className="text-xs text-slate-400 mb-2">Why this forecast</div>
              <ul className="space-y-1.5 text-sm text-slate-300 list-disc pl-5">
                {data.drivers.map((d) => <li key={d.factor}>{driverText(d)}</li>)}
              </ul>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="fp-card">
              <div className="text-xs text-slate-400">Bad-case loss (1 in 20)</div>
              <div className="font-display font-bold text-2xl text-rose-400">{pct(lossFrac)}</div>
              <div className="text-xs text-slate-400 mt-1">
                On {inr(sav)} that is about {inr(sav * lossFrac)} over {data.horizon_days} days if everything is invested.
              </div>
            </div>
            <div className="fp-card">
              <div className="text-xs text-slate-400">Suggested maximum to put in</div>
              <div className="font-display font-bold text-2xl text-lime-400">{inr(data.max_suggested_allocation_inr)}</div>
              <div className="text-xs text-slate-400 mt-1">
                {pct(data.max_suggested_allocation_pct_of_savings, 0)} of savings — keeps a bad-case loss within {inr(data.tolerated_loss_inr)}.
              </div>
            </div>
          </div>
          {data.worst_10d_drop != null && data.crash_loss_on_suggested_inr != null && (
            <div className="fp-card">
              <div className="text-xs text-slate-400">Crash replay</div>
              <p className="text-sm text-slate-200 mt-1">
                The worst 10-day fall in the last {data.worst_10d_years} years ended in {monthYear(data.worst_10d_end)}:
                {' '}<span className="text-rose-400 font-semibold">{pct(Math.abs(data.worst_10d_drop), 0)} down</span>.
                If that happened again you would lose about{' '}
                <span className="text-rose-400 font-semibold">{inr(data.crash_loss_on_suggested_inr)}</span> on the suggested{' '}
                {inr(data.max_suggested_allocation_inr)} — or {inr(data.crash_loss_all_in_inr)} if you put all {inr(sav)} in.
              </p>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Data: {data.data_source}, latest price {data.as_of}.
            {data.stale && <span className="text-amber-400"> Live data unavailable — showing an earlier saved forecast.</span>}
          </p>
          <p className="text-xs text-slate-500">{data.disclaimer}</p>
        </motion.div>
      )}
    </div>
  );
}
