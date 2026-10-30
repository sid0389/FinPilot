/**
 * recommendationEngine.js
 * Rule-based market recommendation engine.
 */

export const MARKETS = {
  stocks: {
    id:             'stocks',
    name:           'Stock Market',
    icon:           '📈',
    color:          '#22d3ee',
    tagline:        'Regulated, stable, long-term wealth',
    description:    'Equity markets offer regulated investments in company shares. Best suited for investors with moderate risk tolerance seeking long-term wealth creation through SIPs and Demat accounts.',
    pros:           ['SEBI regulated & transparent', 'Dividend income potential', 'SIP-friendly for beginners', 'NIFTY ~12% CAGR historically'],
    cons:           ['Market hours limited', 'Requires research', 'Short-term volatility'],
    minInvestment:  '₹500 (via SIP)',
    risk:           'Moderate',
    expectedReturn: '10–15% p.a.',
    liquidity:      'High',
    timeframe:      '3–10 years ideal',
  },
  crypto: {
    id:             'crypto',
    name:           'Cryptocurrency',
    icon:           '₿',
    color:          '#f59e0b',
    tagline:        'High-risk, high-reward digital assets',
    description:    'Cryptocurrency markets are decentralized digital asset exchanges. Best for high-risk tolerant investors with strong financial foundations and shorter time horizons.',
    pros:           ['24×7 trading', 'Extreme return potential', 'Low entry barrier (₹100+)', 'Global access'],
    cons:           ['Unregulated in India', 'Extreme volatility', 'Security risks', '30% flat tax on gains'],
    minInvestment:  '₹100',
    risk:           'Very High',
    expectedReturn: 'Variable (−90% to +1000%)',
    liquidity:      'Very High',
    timeframe:      '1–3 years',
  },
  forex: {
    id:             'forex',
    name:           'Forex Market',
    icon:           '💱',
    color:          '#a78bfa',
    tagline:        "World's most liquid market",
    description:    'Foreign exchange markets allow trading currency pairs with high leverage. Requires strong financial knowledge. Best for experienced investors with stable income.',
    pros:           ['Highest liquidity globally', '24×5 market access', 'Leverage opportunities', 'Hedging possible'],
    cons:           ['Complex for beginners', 'RBI/FEMA restrictions in India', 'High leverage = high risk', 'Requires macro knowledge'],
    minInvestment:  '₹5,000',
    risk:           'High',
    expectedReturn: '5–20% p.a. (skill-dependent)',
    liquidity:      'Very High',
    timeframe:      'Short to medium term',
  },
};

export const calculateRiskScore = (answers) => {
  if (!answers || answers.length === 0) return 50;
  const total = answers.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
  return Math.min(100, Math.round(total / answers.length));
};

export const generateRecommendation = (profile, riskScore) => {
  const totalExp    = Object.values(profile.expenses || {}).reduce((a, b) => a + b, 0);
  const savingsRatio = profile.income > 0
    ? ((profile.income - totalExp) / profile.income) * 100
    : 0;

  const stocksData = scoreStocks(riskScore, savingsRatio, profile);
  const cryptoData = scoreCrypto(riskScore, savingsRatio, profile);
  const forexData  = scoreForex(riskScore, savingsRatio, profile);

  const all = [
    { market: MARKETS.stocks, ...stocksData },
    { market: MARKETS.crypto, ...cryptoData },
    { market: MARKETS.forex,  ...forexData  },
  ].sort((a, b) => b.score - a.score);

  const [primary, secondary, tertiary] = all;

  // Collect scores for radar
  const scores = {
    stocks: stocksData.score,
    crypto: cryptoData.score,
    forex:  forexData.score,
  };

  return {
    primary,
    secondary,
    tertiary,
    ranked: all,
    scores,
    reasons:    primary.reasons,
    warnings:   primary.warnings,
    riskScore,
    savingsRatio: savingsRatio.toFixed(1),
    disclaimer: 'This analysis is for educational purposes only and does not constitute financial advice. Consult a SEBI-registered investment advisor before investing.',
    generatedAt: new Date().toISOString(),
  };
};

function scoreStocks(risk, savingsRatio, profile) {
  let score = 0;
  const reasons = [], warnings = [];

  if (risk >= 30 && risk <= 75)      { score += 30; reasons.push('Your risk tolerance is well-suited for equity markets.'); }
  else if (risk < 30)                { score += 20; warnings.push('Low risk tolerance — prefer index funds & blue chips.'); }
  else                               { score += 15; warnings.push('Stocks may feel slow given your high risk appetite.'); }

  if (savingsRatio >= 20)            { score += 25; reasons.push(`Excellent ${savingsRatio.toFixed(1)}% savings rate supports regular SIP investments.`); }
  else if (savingsRatio >= 10)       { score += 15; reasons.push('Moderate savings — suitable for small SIP allocations.'); }
  else                               { score += 5;  warnings.push('Low savings ratio may limit investment capital.'); }

  if (['long','verylong'].includes(profile.investmentDuration))  { score += 20; reasons.push('Long horizon is ideal for equity compounding.'); }
  else if (profile.investmentDuration === 'medium')              { score += 12; reasons.push('Medium horizon suits mid-cap and balanced funds.'); }
  else                                                           { score += 5;  warnings.push('Short-term stock trading is risky; consider liquid funds.'); }

  if (['wealth','retirement'].includes(profile.financialGoal))   { score += 15; reasons.push('Wealth creation & retirement goals align perfectly with equities.'); }
  else if (profile.financialGoal === 'income')                   { score += 8;  reasons.push('Dividend stocks can provide income alongside growth.'); }
  else                                                           { score += 5;  warnings.push('Safety goal — consider debt instruments first.'); }

  if (profile.income >= 60000)       { score += 10; reasons.push('Strong income enables diversified portfolio construction.'); }
  else if (profile.income >= 30000)  { score += 6; }
  else                               { score += 2;  warnings.push('Lower income — build emergency fund before investing.'); }

  return { score, reasons, warnings };
}

function scoreCrypto(risk, savingsRatio, profile) {
  let score = 0;
  const reasons = [], warnings = [];

  if (risk >= 70)                    { score += 30; reasons.push('Aggressive risk profile aligns with crypto volatility.'); }
  else if (risk >= 50)               { score += 18; warnings.push('Moderate risk — limit crypto to 5–10% of portfolio.'); }
  else                               { score += 5;  warnings.push('⚠️ Crypto is unsuitable for low risk tolerance investors.'); }

  if (savingsRatio >= 30)            { score += 25; reasons.push('High savings ratio means you can afford high-risk allocation.'); }
  else if (savingsRatio >= 15)       { score += 12; reasons.push('Allocate only surplus savings to crypto.'); }
  else                               { score += 3;  warnings.push('Insufficient savings cushion for high-risk assets.'); }

  if (profile.investmentDuration === 'short')   { score += 15; reasons.push('Short-term horizon can capture crypto market cycles.'); }
  else if (profile.investmentDuration === 'medium') { score += 20; reasons.push('Medium horizon lets you ride bull cycles with exit strategy.'); }
  else                               { score += 8;  warnings.push('Very long crypto holds require strong conviction and security.'); }

  if (profile.financialGoal === 'wealth')        { score += 15; reasons.push('Wealth creation goals match crypto upside potential.'); }
  else if (['safety','retirement'].includes(profile.financialGoal)) { score += 2; warnings.push('Safety/retirement goals are misaligned with crypto risk.'); }
  else                               { score += 7; }

  if (profile.income >= 80000)       { score += 10; reasons.push('High income provides buffer for volatile positions.'); }
  else if (profile.income >= 50000)  { score += 6; }
  else                               { score += 1;  warnings.push('Low income + high risk = dangerous combination.'); }

  return { score, reasons, warnings };
}

function scoreForex(risk, savingsRatio, profile) {
  let score = 0;
  const reasons = [], warnings = [];

  if (risk >= 60)                    { score += 28; reasons.push('Your risk tolerance is appropriate for leveraged forex trading.'); }
  else if (risk >= 40)               { score += 16; warnings.push('Forex leverage can amplify losses — trade conservatively.'); }
  else                               { score += 5;  warnings.push('⚠️ Forex is complex and high-risk for conservative investors.'); }

  if (savingsRatio >= 25)            { score += 22; reasons.push('Strong savings provide margin buffer for forex positions.'); }
  else if (savingsRatio >= 12)       { score += 12; }
  else                               { score += 3;  warnings.push('Low savings may not cover forex margin requirements.'); }

  if (['short','medium'].includes(profile.investmentDuration)) { score += 20; reasons.push('Forex suits short-to-medium term trading strategies.'); }
  else                               { score += 8;  warnings.push('Very long forex positions require sophisticated macro analysis.'); }

  if (profile.financialGoal === 'income')        { score += 15; reasons.push('Income goal aligns with disciplined forex strategies.'); }
  else if (profile.financialGoal === 'wealth')   { score += 10; }
  else                               { score += 4;  warnings.push('Forex may not align with your stated financial goal.'); }

  if (profile.income >= 70000)       { score += 10; reasons.push('Income stability supports active forex participation.'); }
  else if (profile.income >= 40000)  { score += 5; }
  else                               { score += 1;  warnings.push('Forex requires reliable capital — ensure financial stability first.'); }

  return { score, reasons, warnings };
}
