/**
 * FinanceContext — financial profile with backend sync + localStorage fallback.
 *
 * Fixes vs. the previous version:
 *  - updateProfile now accepts BOTH (key, value) and ({ key: value }) — the Expense
 *    Tracker calls it as updateProfile('income', 90000), which used to be silently
 *    ignored (it spread the string "income" into the state), so Income / Savings /
 *    Duration / Goals could never change.
 *  - Backend syncing is debounced (was one request per keystroke → hit the rate limit).
 *  - No side effects inside a setState updater.
 *  - Local persistence only starts after the profile has been loaded (previously the
 *    defaults could overwrite saved data).
 *  - financialGoals (multi-select) is kept in sync with financialGoal (single value
 *    used by the recommendation engine).
 *  - A monthly history is recorded automatically so the Dashboard trend is real data.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { financeAPI } from '../services/api';

const FinanceContext = createContext(null);

const EXPENSE_KEYS = ['housing','food','transport','entertainment','utilities','healthcare','education','others'];

const DEFAULT_PROFILE = {
  income: 75000, savings: 18000,
  investmentDuration: 'medium',
  financialGoal: 'wealth',
  financialGoals: ['wealth'],
  expenses: { housing:15000, food:8000, transport:4000, entertainment:3500, utilities:2500, healthcare:1500, education:2000, others:2000 },
  history: [],
  riskScore: null, riskAnswers: [], recommendation: null,
};

/* Multi-select UI goals → the single goal the recommendation engine understands. */
const GOAL_PRIORITY = ['wealth', 'retirement', 'home', 'education', 'emergency'];
const GOAL_TO_ENGINE = { wealth:'wealth', retirement:'retirement', home:'income', education:'income', emergency:'safety' };
export const deriveGoal = (goals = []) => {
  const first = GOAL_PRIORITY.find(g => goals.includes(g));
  return first ? GOAL_TO_ENGINE[first] : 'wealth';
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Merge any stored/remote profile with defaults and repair missing/legacy fields. */
const normalize = (raw = {}) => {
  const p = { ...DEFAULT_PROFILE, ...raw };
  p.expenses = { ...DEFAULT_PROFILE.expenses, ...(raw.expenses || {}) };
  EXPENSE_KEYS.forEach(k => { p.expenses[k] = toNum(p.expenses[k]); });
  p.income  = toNum(p.income);
  p.savings = toNum(p.savings);
  p.history = Array.isArray(raw.history) ? raw.history : [];
  if (!Array.isArray(raw.financialGoals) || raw.financialGoals.length === 0) {
    // legacy profiles only had the single financialGoal
    const legacy = raw.financialGoal && GOAL_PRIORITY.includes(raw.financialGoal) ? [raw.financialGoal] : ['wealth'];
    p.financialGoals = Array.isArray(raw.financialGoals) ? raw.financialGoals : legacy;
  }
  p.financialGoal = deriveGoal(p.financialGoals);
  return p;
};

export const FinanceProvider = ({ children }) => {
  const { user, useBackend } = useAuth();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [hydratedKey, setHydratedKey] = useState(null);       // storageKey whose data has been loaded
  const [syncing, setSyncing] = useState(false);
  const [riskForecast, setRiskForecast] = useState(null);     // latest ML forecast, so the chatbot can explain it

  const storageKey = user ? `fp_finance_${user.id}` : null;
  const canSync = !!(useBackend && user?.token);

  /* ── Debounced backend sync ───────────────────────────────── */
  const pending = useRef({});
  const timer   = useRef(null);
  const canSyncRef = useRef(canSync);
  canSyncRef.current = canSync;

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const batch = pending.current;
    pending.current = {};
    if (!canSyncRef.current || Object.keys(batch).length === 0) return;
    setSyncing(true);
    try { await financeAPI.update(batch); } catch (_) { /* local copy is still saved */ }
    setSyncing(false);
  }, []);

  const queueSync = useCallback((updates) => {
    if (!canSyncRef.current) return;
    pending.current = { ...pending.current, ...updates };
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  }, [flush]);

  useEffect(() => () => { flush(); }, [flush]);

  /* ── Load profile ─────────────────────────────────────────── */
  useEffect(() => {
    if (!storageKey) { setProfile(DEFAULT_PROFILE); setHydratedKey(null); return; }
    let cancelled = false;

    const loadProfile = async () => {
      if (canSync) {
        try {
          const data = await financeAPI.get();
          if (!cancelled && data.profile) {
            setProfile(normalize(data.profile));
            setHydratedKey(storageKey);
            return;
          }
        } catch (_) { /* fall back to local copy */ }
      }
      if (cancelled) return;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try { setProfile(normalize(JSON.parse(stored))); }
        catch (_) { setProfile(DEFAULT_PROFILE); }
      } else {
        setProfile(DEFAULT_PROFILE);
      }
      setHydratedKey(storageKey);
    };
    loadProfile();
    return () => { cancelled = true; };
  }, [storageKey, canSync]);

  const hydrated = !!storageKey && hydratedKey === storageKey;

  /* ── Persist locally on every change (only after load) ────── */
  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [profile, storageKey, hydrated]);

  /* ── Derived numbers ──────────────────────────────────────── */
  const totalExpenses = useMemo(
    () => Object.values(profile.expenses).reduce((a, b) => a + (Number(b) || 0), 0),
    [profile.expenses]
  );
  const savingsRatio = profile.income > 0 ? ((profile.income - totalExpenses) / profile.income) * 100 : 0;
  const disposable   = profile.income - totalExpenses;

  /* ── Record this month's numbers automatically ────────────── */
  useEffect(() => {
    if (!hydrated) return;
    const key = monthKey();
    const entry = { month: key, income: profile.income, expenses: totalExpenses, savings: profile.income - totalExpenses };
    const hist = profile.history || [];
    const existing = hist.find(h => h.month === key);
    if (existing && existing.income === entry.income && existing.expenses === entry.expenses) return;
    const history = [...hist.filter(h => h.month !== key), entry].sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
    setProfile(prev => ({ ...prev, history }));
    queueSync({ history });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, profile.income, totalExpenses]);

  /* ── Updaters ─────────────────────────────────────────────── */
  /** updateProfile('income', 90000)  OR  updateProfile({ income: 90000, savings: 1000 }) */
  const updateProfile = useCallback((keyOrUpdates, maybeValue) => {
    const raw = typeof keyOrUpdates === 'string' ? { [keyOrUpdates]: maybeValue } : { ...(keyOrUpdates || {}) };
    const updates = { ...raw };
    if ('income'  in updates) updates.income  = toNum(updates.income);
    if ('savings' in updates) updates.savings = toNum(updates.savings);
    if ('financialGoals' in updates) {
      updates.financialGoals = Array.isArray(updates.financialGoals) ? updates.financialGoals : [];
      updates.financialGoal  = deriveGoal(updates.financialGoals);
    }
    setProfile(prev => ({ ...prev, ...updates }));
    queueSync(updates);
  }, [queueSync]);

  const updateExpense = useCallback((key, value) => {
    const amount = toNum(value);
    setProfile(prev => {
      const expenses = { ...prev.expenses, [key]: amount };
      pending.current = { ...pending.current, expenses };
      return { ...prev, expenses };
    });
    // schedule flush outside of the state updater
    if (canSyncRef.current) { clearTimeout(timer.current); timer.current = setTimeout(flush, 700); }
  }, [flush]);

  const saveRiskScore = useCallback(async (score, answers) => {
    setProfile(prev => ({ ...prev, riskScore: score, riskAnswers: answers }));
    if (canSync) { try { await financeAPI.saveRisk(score, answers); } catch (_) {} }
  }, [canSync]);

  const saveRecommendation = useCallback(async (result) => {
    setProfile(prev => ({ ...prev, recommendation: result }));
    if (canSync && result) { try { await financeAPI.saveRecommendation(result); } catch (_) {} }
  }, [canSync]);

  const resetProfile = useCallback(async () => {
    pending.current = {};
    clearTimeout(timer.current);
    setProfile(DEFAULT_PROFILE);
    if (storageKey) localStorage.removeItem(storageKey);
    if (canSync) {
      try {
        await financeAPI.reset();
        // the server resets to zeros; push the same defaults the UI is showing so both agree
        const { income, savings, expenses, investmentDuration, financialGoal, financialGoals } = DEFAULT_PROFILE;
        await financeAPI.update({ income, savings, expenses, investmentDuration, financialGoal, financialGoals, history: [] });
      } catch (_) {}
    }
  }, [storageKey, canSync]);

  return (
    <FinanceContext.Provider value={{
      profile, totalExpenses, savingsRatio, disposable, syncing, hydrated, riskForecast, setRiskForecast,
      updateProfile, updateExpense, saveRiskScore, saveRecommendation, resetProfile, flushSync: flush,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be inside FinanceProvider');
  return ctx;
};
