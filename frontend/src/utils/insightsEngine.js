/**
 * insightsEngine.js
 * Generates personalized AI-style financial insights from user profile.
 */

/**
 * generateInsights(profile, riskScore) → Insight[]
 * Insight: { id, icon, title, message, type: 'positive'|'warning'|'info' }
 */
export const generateInsights = (profile, riskScore = 50) => {
  const insights = [];
  const expenses  = profile.expenses || {};
  const income    = profile.income   || 0;
  const totalExp  = Object.values(expenses).reduce((a, b) => a + b, 0);
  const savings   = income - totalExp;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;

  // ── Savings rate ──────────────────────────────────────────
  if (savingsPct >= 30) {
    insights.push({
      id: 'savings-excellent',
      icon: '🌟',
      title: 'Excellent Savings Rate',
      message: `You save ${savingsPct.toFixed(1)}% of your income — well above the recommended 20%. This positions you strongly for long-term investments.`,
      type: 'positive',
    });
  } else if (savingsPct >= 15) {
    insights.push({
      id: 'savings-good',
      icon: '💰',
      title: 'Healthy Savings Habit',
      message: `Your ${savingsPct.toFixed(1)}% savings rate is solid. Consider automating transfers to increase it toward 25%.`,
      type: 'positive',
    });
  } else if (savingsPct >= 5) {
    insights.push({
      id: 'savings-low',
      icon: '⚠️',
      title: 'Savings Rate Needs Attention',
      message: `Only ${savingsPct.toFixed(1)}% saved. Financial experts recommend saving at least 20%. Identify discretionary expenses to cut.`,
      type: 'warning',
    });
  } else {
    insights.push({
      id: 'savings-critical',
      icon: '🚨',
      title: 'Critical: Near-Zero Savings',
      message: 'Your expenses nearly match income. Building even a ₹5,000/month emergency fund should be the first priority before any investing.',
      type: 'warning',
    });
  }

  // ── Entertainment spend ───────────────────────────────────
  const entPct = income > 0 ? ((expenses.entertainment || 0) / income) * 100 : 0;
  if (entPct > 10) {
    insights.push({
      id: 'entertainment-high',
      icon: '🎮',
      title: 'High Entertainment Spend',
      message: `Entertainment consumes ${entPct.toFixed(1)}% of income (₹${(expenses.entertainment || 0).toLocaleString('en-IN')}). Reducing by 30% could free ₹${Math.round((expenses.entertainment || 0) * 0.3).toLocaleString('en-IN')}/month for investments.`,
      type: 'warning',
    });
  }

  // ── Housing ratio ─────────────────────────────────────────
  const housingPct = income > 0 ? ((expenses.housing || 0) / income) * 100 : 0;
  if (housingPct > 35) {
    insights.push({
      id: 'housing-high',
      icon: '🏠',
      title: 'Housing Cost is High',
      message: `Housing takes ${housingPct.toFixed(1)}% of your income. The 30% rule suggests keeping it below ₹${Math.round(income * 0.3).toLocaleString('en-IN')}/month.`,
      type: 'warning',
    });
  } else if (income > 0 && housingPct <= 25) {
    insights.push({
      id: 'housing-good',
      icon: '🏠',
      title: 'Healthy Housing Ratio',
      message: `At ${housingPct.toFixed(1)}%, your housing cost is well-managed, leaving more room for investments and savings.`,
      type: 'positive',
    });
  }

  // ── Risk profile insight ──────────────────────────────────
  if (riskScore >= 70) {
    insights.push({
      id: 'risk-aggressive',
      icon: '🔥',
      title: 'Aggressive Risk Profile',
      message: 'Your risk DNA is aggressive. You can explore equities, crypto, and high-growth sectors — but always diversify across 3–4 asset classes.',
      type: 'info',
    });
  } else if (riskScore >= 40) {
    insights.push({
      id: 'risk-moderate',
      icon: '⚖️',
      title: 'Balanced Investor Profile',
      message: 'Moderate risk tolerance suits a 60/40 portfolio — 60% equities (index funds, large-caps) and 40% in stable instruments like FD, bonds.',
      type: 'info',
    });
  } else {
    insights.push({
      id: 'risk-conservative',
      icon: '🛡️',
      title: 'Conservative Risk Profile',
      message: 'Focus on capital preservation. Consider PPF, NSC, debt mutual funds, and high-grade bonds before exploring equities.',
      type: 'info',
    });
  }

  // ── Investment duration insight ────────────────────────────
  if (profile.investmentDuration === 'long' || profile.investmentDuration === 'verylong') {
    insights.push({
      id: 'duration-long',
      icon: '🌱',
      title: 'Compounding Advantage',
      message: 'Long investment horizon is your biggest asset. ₹10,000/month invested at 12% CAGR for 10 years grows to ~₹23 lakhs. Start today!',
      type: 'positive',
    });
  } else if (profile.investmentDuration === 'short') {
    insights.push({
      id: 'duration-short',
      icon: '⏱️',
      title: 'Short Horizon Alert',
      message: 'Short-term investing limits compounding gains. Consider liquid mutual funds, short-duration bonds, or arbitrage funds for safety.',
      type: 'warning',
    });
  }

  // ── Income level ──────────────────────────────────────────
  if (income >= 100000) {
    insights.push({
      id: 'income-high',
      icon: '💼',
      title: 'High Income Advantage',
      message: 'Your income level enables multi-asset diversification. Consider consulting a SEBI-registered advisor for tax-efficient portfolio structuring.',
      type: 'positive',
    });
  }

  // ── Transport spend ───────────────────────────────────────
  const transportPct = income > 0 ? ((expenses.transport || 0) / income) * 100 : 0;
  if (transportPct > 15) {
    insights.push({
      id: 'transport-high',
      icon: '🚗',
      title: 'Transport Costs Elevated',
      message: `Transport at ${transportPct.toFixed(1)}% of income is above average. Carpooling or public transport could save ₹${Math.round((expenses.transport || 0) * 0.25).toLocaleString('en-IN')}/month.`,
      type: 'warning',
    });
  }

  // Return top 6 insights sorted by type (warnings first, then positive, then info)
  const order = { warning: 0, positive: 1, info: 2 };
  return insights
    .sort((a, b) => order[a.type] - order[b.type])
    .slice(0, 6);
};
