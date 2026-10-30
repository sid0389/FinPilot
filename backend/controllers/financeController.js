/**
 * financeController.js — CRUD for user's financial profile + recommendation.
 */
const FinanceProfile = require('../models/FinanceProfile');

/** GET /api/finance — get current user's profile */
const getProfile = async (req, res) => {
  try {
    let profile = await FinanceProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await FinanceProfile.create({ user: req.user._id });
    }
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** PUT /api/finance — update income, expenses, goals */
const updateProfile = async (req, res) => {
  try {
    const allowed = ['income', 'savings', 'expenses', 'investmentDuration', 'financialGoal', 'financialGoals', 'history'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const nonNeg = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
    if ('income'  in updates) updates.income  = nonNeg(updates.income);
    if ('savings' in updates) updates.savings = nonNeg(updates.savings);

    // Expenses: whitelist categories, force non-negative numbers
    if (updates.expenses && typeof updates.expenses === 'object') {
      const clean = {};
      ['housing','food','transport','entertainment','utilities','healthcare','education','others']
        .forEach((k) => { clean[k] = nonNeg(updates.expenses[k]); });
      updates.expenses = clean;
    } else delete updates.expenses;

    const DURATIONS = ['short', 'medium', 'long', 'verylong'];
    const GOALS     = ['safety', 'income', 'wealth', 'retirement'];
    const UI_GOALS  = ['wealth', 'retirement', 'home', 'education', 'emergency'];
    if (updates.investmentDuration && !DURATIONS.includes(updates.investmentDuration)) delete updates.investmentDuration;
    if (updates.financialGoal && !GOALS.includes(updates.financialGoal)) delete updates.financialGoal;
    if ('financialGoals' in updates) {
      updates.financialGoals = Array.isArray(updates.financialGoals)
        ? updates.financialGoals.filter((g) => UI_GOALS.includes(g)) : [];
    }
    if ('history' in updates) {
      updates.history = Array.isArray(updates.history)
        ? updates.history
            .filter((h) => h && /^\d{4}-\d{2}$/.test(h.month))
            .slice(-12)
            .map((h) => ({ month: h.month, income: nonNeg(h.income), expenses: nonNeg(h.expenses), savings: Number(h.savings) || 0 }))
        : [];
    }

    const profile = await FinanceProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, profile });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** POST /api/finance/risk — save risk score & answers */
const saveRiskScore = async (req, res) => {
  try {
    const { riskScore, riskAnswers } = req.body;

    if (typeof riskScore !== 'number' || riskScore < 0 || riskScore > 100) {
      return res.status(400).json({ success: false, message: 'Invalid risk score' });
    }

    const profile = await FinanceProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { riskScore, riskAnswers: riskAnswers || [] } },
      { new: true, upsert: true }
    );

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** POST /api/finance/recommendation — save recommendation result */
const saveRecommendation = async (req, res) => {
  try {
    const { recommendation } = req.body;

    const profile = await FinanceProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { recommendation } },
      { new: true, upsert: true }
    );

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** DELETE /api/finance/reset — reset to defaults */
const resetProfile = async (req, res) => {
  try {
    await FinanceProfile.findOneAndDelete({ user: req.user._id });
    const fresh = await FinanceProfile.create({ user: req.user._id });
    res.json({ success: true, profile: fresh });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, saveRiskScore, saveRecommendation, resetProfile };
