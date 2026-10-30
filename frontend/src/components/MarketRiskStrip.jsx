import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mlAPI } from '../services/api';

const REP = [
  { id: 'stocks', name: 'Stocks (NIFTY 50)', symbol: '^NSEI',    color: '#22d3ee' },
  { id: 'crypto', name: 'Crypto (Bitcoin)',   symbol: 'BTC-USD',  color: '#a3e635' },
  { id: 'forex',  name: 'Forex (USD/INR)',    symbol: 'USDINR=X', color: '#a78bfa' },
];
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const pct = (n, d = 0) => (n * 100).toFixed(d) + '%';

/** Live ML risk numbers next to the rule-based suitability scores. Fails quietly if the ML service is off. */
export default function MarketRiskStrip({ riskScore, savings }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled(REP.map((r) => mlAPI.risk(r.symbol, Number(savings) || 100000, riskScore)))
      .then((res) => alive && setRows(res.map((x, i) => ({ ...REP[i], data: x.status === 'fulfilled' ? x.value : null }))));
    return () => { alive = false; };
  }, [riskScore, savings]);

  if (!rows) return <div className="fp-card text-sm text-slate-500">Loading live risk forecasts…</div>;
  if (rows.every((r) => !r.data)) {
    return <div className="fp-card text-xs text-slate-500">Live risk forecasts are offline (start the ML service in /ml).</div>;
  }
  return (
    <div className="fp-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="section-title text-sm">Risk outlook, next 10 days</div>
          <div className="section-subtitle">Suitability tells you what fits you; this shows how bumpy it is right now.</div>
        </div>
        <Link to="/risk-forecast" className="text-xs text-lime-400">Details →</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-xs font-medium" style={{ color: r.color }}>{r.name}</div>
            {r.data ? (
              <>
                <div className="text-xs text-slate-400 mt-2">Bad-case loss (1 in 20)</div>
                <div className="text-lg font-bold text-slate-100">{pct(r.data.loss_fraction_1_in_20, 1)}</div>
                <div className="text-xs text-slate-400 mt-1">Suggested max: <span className="text-slate-200">{inr(r.data.max_suggested_allocation_inr)}</span></div>
                {r.data.reliability === 'low' && <div className="text-xs text-amber-400 mt-1">Low confidence right now</div>}
              </>
            ) : <div className="text-xs text-slate-500 mt-2">Unavailable</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
