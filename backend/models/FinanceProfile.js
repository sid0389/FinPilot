/**
 * FinanceProfile model — user's financial data, risk scores, recommendations.
 */
const mongoose = require('mongoose');

const expensesSchema = new mongoose.Schema({
  housing:       { type: Number, default: 0 },
  food:          { type: Number, default: 0 },
  transport:     { type: Number, default: 0 },
  entertainment: { type: Number, default: 0 },
  utilities:     { type: Number, default: 0 },
  healthcare:    { type: Number, default: 0 },
  education:     { type: Number, default: 0 },
  others:        { type: Number, default: 0 },
}, { _id: false });

const historySchema = new mongoose.Schema({
  month:    { type: String, required: true },            // 'YYYY-MM'
  income:   { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  savings:  { type: Number, default: 0 },                // income - expenses (can be negative)
}, { _id: false });

const financeProfileSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },
    income:             { type: Number, default: 0,        min: 0 },
    savings:            { type: Number, default: 0,        min: 0 },
    expenses:           { type: expensesSchema, default: () => ({}) },
    investmentDuration: {
      type:    String,
      enum:    ['short', 'medium', 'long', 'verylong'],
      default: 'medium',
    },
    financialGoal: {
      type:    String,
      enum:    ['safety', 'income', 'wealth', 'retirement'],
      default: 'wealth',
    },
    financialGoals: {
      type:    [String],
      default: ['wealth'],
    },
    history:        { type: [historySchema], default: [] },
    riskScore:      { type: Number, default: null, min: 0, max: 100 },
    riskAnswers:    { type: Array,  default: [] },
    recommendation: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinanceProfile', financeProfileSchema);
