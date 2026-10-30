/**
 * chatController.js
 * Proxies chat messages to Anthropic Claude API.
 * API key stays server-side — never exposed to frontend.
 */

const SYSTEM_PROMPT = `You are FinPilot AI, a friendly and knowledgeable financial assistant built into the FinPilot platform.

FinPilot is a web application that helps users discover which investment market — Stocks, Cryptocurrency, or Forex — best suits their financial profile. It analyzes income, expenses, risk tolerance, and investment goals.

Your role:
- Help users understand how FinPilot works
- Explain financial concepts in simple, clear language relevant to Indian investors
- Guide users through the platform's features (Expense Tracker, Risk Assessment, Recommendation engine, Market Comparison)
- Answer questions about Stocks, Crypto, and Forex markets
- Provide general financial education (not personalized investment advice)

Key platform facts:
- Risk scores: 0-29 = Very Conservative, 30-49 = Conservative, 50-74 = Moderate, 75-100 = Aggressive
- Markets analyzed: NSE/BSE Stocks, Cryptocurrency, Forex
- Recommendation engine uses: Risk alignment (30%), Savings ratio (25%), Duration (20%), Goals (15%), Income (10%)
- Demo login: demo@finpilot.app / 123456789

Rules:
- Always add: "This is educational information only, not financial advice."
- Be concise — 2-4 sentences unless a detailed explanation is needed
- Use ₹ for Indian currency examples
- Never promise specific returns
- If asked about real-time prices, say you don't have live data
- Be warm, encouraging, and non-judgmental about financial situations`;

const num  = (v, d = 1) => (Number.isFinite(Number(v)) ? Number(Number(v).toFixed(d)) : null);
const word = (v) => String(v ?? '').replace(/[^\w\s/().,%&-]/g, '').slice(0, 40);

/** Turn the client-supplied forecast summary into a short, sanitised block for the system prompt. */
const forecastBlock = (f) => {
  if (!f || typeof f !== 'object') return '';
  const inr = (n) => (num(n, 0) === null ? 'n/a' : '₹' + num(n, 0).toLocaleString('en-IN'));
  return `\n\nThe user's latest Risk Forecast (computed by FinPilot's ML model on real market data):
- Asset: ${word(f.name)}; savings entered: ${inr(f.savings)}; risk score used: ${num(f.riskScore, 0)}/100
- Expected daily swing over the next 10 days: ${num(f.dailyVolPct, 2)}%
- Bad-case (1 in 20) loss over 10 days: ${num(f.badCasePct)}%
- Suggested maximum to invest: ${inr(f.maxAllocInr)} (${num(f.maxAllocPct, 0)}% of savings)
- Market mood for this asset: ${word(f.mood)}
- Worst 10-day fall in its history: ${num(f.worstDropPct, 0)}% (ended ${word(f.worstDropDate)})
If the user asks about their forecast, explain these exact numbers in simple words. How it works: tolerated loss grows from 2% of savings (risk score 0) to 10% (score 100); suggested maximum = tolerated loss divided by the bad-case loss. Never tell them what to buy.`;
};

const chat = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback response when no API key configured
      return res.json({
        success: true,
        reply: "I'm FinPilot AI! I can help you understand the platform and financial concepts. To enable full AI responses, please configure the ANTHROPIC_API_KEY in your backend environment. For now, try exploring the Risk Assessment or Expense Tracker to get started!",
      });
    }

    // Build system prompt with user context if available
    let systemPrompt = SYSTEM_PROMPT;
    if (userContext) {
      systemPrompt += `\n\nCurrent user context:\n- Risk Score: ${userContext.riskScore ?? 'Not assessed yet'}/100\n- Monthly Income: ₹${userContext.income?.toLocaleString('en-IN') ?? 'Not set'}\n- Investment Duration: ${userContext.investmentDuration ?? 'Not set'}\n- Primary Goal: ${userContext.financialGoal ?? 'Not set'}`;
    }

    systemPrompt += forecastBlock(userContext?.riskForecast);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      process.env.CHAT_MODEL || 'claude-haiku-5-5',
        max_tokens: 400,
        system:     systemPrompt,
        messages:   messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.json({
        success: true,
        reply: "I'm having trouble connecting right now. Please try again in a moment, or explore the platform's features directly — the Risk Assessment and Expense Tracker are great places to start!",
      });
    }

    const data  = await response.json();
    const reply = data.content?.[0]?.text || "I couldn't generate a response. Please try again.";

    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.json({
      success: true,
      reply: "Something went wrong on my end. Please try again! In the meantime, you can navigate to the Risk Assessment page to get started with FinPilot.",
    });
  }
};

module.exports = { chat };
