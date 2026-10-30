/**
 * Chatbot.jsx — Floating AI chat widget powered by Claude via backend proxy.
 * Falls back to helpful static responses when backend is unavailable.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';

const FALLBACK_RESPONSES = [
  "FinPilot analyzes your income, expenses, risk tolerance, and goals to find the market that suits you best — Stocks, Crypto, or Forex.",
  "Start with the Expense Tracker to enter your income and monthly spending. Then take the Risk Assessment quiz. Your personalized recommendation will be ready in minutes!",
  "Your risk score ranges from 0–100: 0–29 is Very Conservative, 30–49 Conservative, 50–74 Moderate, and 75–100 Aggressive.",
  "The recommendation engine uses 5 factors: Risk Alignment (30%), Savings Ratio (25%), Investment Duration (20%), Financial Goal (15%), and Income Stability (10%).",
  "Stocks offer regulated, stable growth (10–15% p.a.). Crypto offers high risk/high reward (20%–1000%+). Forex is the world's most liquid market (5–20% p.a.).",
  "This is educational information only — not financial advice. Always consult a SEBI-registered advisor before investing.",
];

const QUICK_PROMPTS = [
  "How does FinPilot work?",
  "What is a risk score?",
  "Stocks vs Crypto vs Forex?",
  "How is my recommendation calculated?",
  "Explain my latest risk forecast",
];

let fallbackIdx = 0;
const getFallback = () => FALLBACK_RESPONSES[fallbackIdx++ % FALLBACK_RESPONSES.length];

export default function Chatbot({ open, onToggle }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm FinPilot AI 👋 I can help you understand the platform, explain financial concepts, and guide you through your analysis. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { profile, riskForecast } = useFinance();
  const { useBackend, user } = useAuth();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      let reply;
      if (useBackend && !user?.token) {
        reply = "The AI assistant needs a full account. You're logged in on this browser only (the server login didn't go through, usually because MongoDB isn't connected). Log out, check MONGODB_URI in backend/.env, then register or log in again.";
      } else if (useBackend) {
        const userContext = {
          riskScore: profile.riskScore,
          income: profile.income,
          investmentDuration: profile.investmentDuration,
          financialGoal: profile.financialGoal,
          riskForecast,
        };
        const data = await chatAPI.send(
          newMessages.map(m => ({ role: m.role, content: m.content })),
          userContext
        );
        reply = data.reply;
      } else {
        await new Promise(r => setTimeout(r, 800));
        reply = getFallback();
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const m = String(err?.message || '');
      const why = /token|expired|inactive/i.test(m) ? 'Your session expired — please log out and log in again.'
        : /fetch|network/i.test(m) ? 'I can\'t reach the backend. Is it running on port 5000?'
          : m || 'Something went wrong.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting. ${why}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-lime"
        style={{ background: 'linear-gradient(135deg, #a3e635, #65a30d)' }}
        title="Chat with FinPilot AI"
      >
        <span className="text-2xl">{open ? '✕' : '🤖'}</span>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              height: 460,
              background: 'rgba(18,18,22,0.96)',
              border: '1px solid rgba(163,230,53,0.2)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6 flex-shrink-0"
              style={{ background: 'rgba(163,230,53,0.06)' }}>
              <div className="w-8 h-8 rounded-xl bg-lime-400/15 border border-lime-400/25 flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-100 font-display">FinPilot AI</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                  <span className="text-xs text-slate-500">Online · Educational assistant</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                >
                  {m.content}
                </motion.div>
              ))}

              {/* Loading */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chat-bubble-ai">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick prompts — show after first message only */}
              {messages.length === 1 && !loading && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-xs text-slate-600">Quick questions:</span>
                  {QUICK_PROMPTS.map(q => (
                    <button key={q} onClick={() => send(q)}
                      className="text-left text-xs px-3 py-2 rounded-xl text-lime-400 transition-all duration-200"
                      style={{ background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.15)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/6 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything about FinPilot..."
                  className="fp-input py-2 text-sm flex-1"
                  disabled={loading}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #a3e635, #65a30d)' }}
                >
                  <span className="text-zinc-950 text-sm font-bold">↑</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 text-center mt-1.5">Educational only · Not financial advice</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}