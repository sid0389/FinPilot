/**
 * dummyData.js — static seed data used across pages.
 * Replace with real API calls in production.
 */

// ── Savings trend (last 6 months) ─────────────────────────────
export const monthlySavingsTrend = [
  { month: 'Dec', savings: 14000, expenses: 52000 },
  { month: 'Jan', savings: 16500, expenses: 55000 },
  { month: 'Feb', savings: 13000, expenses: 58000 },
  { month: 'Mar', savings: 19000, expenses: 51000 },
  { month: 'Apr', savings: 17500, expenses: 53500 },
  { month: 'May', savings: 18000, expenses: 56000 },
];

// ── Expense categories (for pie/bar charts) ────────────────────
export const expenseCategories = [
  { name: 'Housing',       value: 15000, color: '#22d3ee' },
  { name: 'Food',          value: 8000,  color: '#34d399' },
  { name: 'Transport',     value: 4000,  color: '#a78bfa' },
  { name: 'Entertainment', value: 3500,  color: '#fbbf24' },
  { name: 'Utilities',     value: 2500,  color: '#fb7185' },
  { name: 'Healthcare',    value: 1500,  color: '#38bdf8' },
  { name: 'Education',     value: 2000,  color: '#818cf8' },
  { name: 'Others',        value: 2000,  color: '#6ee7b7' },
];

// ── Risk quiz questions ────────────────────────────────────────
export const riskQuestions = [
  {
    id: 'q1',
    question: 'If your investment dropped 20% in a month, what would you do?',
    options: [
      { label: 'Sell everything immediately',           value: 10 },
      { label: 'Move to safer investments',             value: 30 },
      { label: 'Hold and wait for recovery',            value: 60 },
      { label: 'Buy more at the lower price',           value: 90 },
    ],
  },
  {
    id: 'q2',
    question: 'How long do you plan to keep your investments?',
    options: [
      { label: 'Less than 1 year',                     value: 20 },
      { label: '1–3 years',                            value: 40 },
      { label: '3–7 years',                            value: 70 },
      { label: 'More than 7 years',                    value: 90 },
    ],
  },
  {
    id: 'q3',
    question: 'What is your primary investment goal?',
    options: [
      { label: 'Capital preservation (safety first)',   value: 15 },
      { label: 'Steady income',                        value: 40 },
      { label: 'Balanced growth',                      value: 65 },
      { label: 'Maximum wealth creation',              value: 90 },
    ],
  },
  {
    id: 'q4',
    question: 'What percentage of your savings can you afford to lose?',
    options: [
      { label: 'None — I cannot afford any loss',      value: 5  },
      { label: 'Up to 10%',                            value: 30 },
      { label: 'Up to 30%',                            value: 60 },
      { label: 'More than 50% is acceptable',          value: 90 },
    ],
  },
  {
    id: 'q5',
    question: 'How experienced are you with financial markets?',
    options: [
      { label: 'No experience at all',                 value: 10 },
      { label: 'Basic knowledge',                      value: 35 },
      { label: 'Some trading experience',              value: 65 },
      { label: 'Professional / advanced trader',       value: 90 },
    ],
  },
  {
    id: 'q6',
    question: 'Which best describes your income stability?',
    options: [
      { label: 'Very unstable / freelance',            value: 30 },
      { label: 'Somewhat stable',                      value: 50 },
      { label: 'Stable salaried job',                  value: 70 },
      { label: 'High income with multiple streams',    value: 90 },
    ],
  },
];

// ── Market comparison radar data ───────────────────────────────
export const marketComparisonData = [
  { metric: 'Return Potential', stocks: 70, crypto: 95, forex: 65 },
  { metric: 'Stability',        stocks: 72, crypto: 20, forex: 45 },
  { metric: 'Liquidity',        stocks: 78, crypto: 88, forex: 98 },
  { metric: 'Accessibility',    stocks: 75, crypto: 90, forex: 60 },
  { metric: 'Regulation',       stocks: 90, crypto: 30, forex: 72 },
];

// ── Mini sparkline datasets ────────────────────────────────────
export const stockSparkline  = [42,45,43,47,52,49,54,56,53,58,61,60];
export const cryptoSparkline = [30,55,40,80,60,95,50,70,85,45,75,90];
export const forexSparkline  = [48,49,47,51,50,52,51,53,52,54,53,55];

// ── Duration & Goal dropdown options ─────────────────────────
export const durationOptions = [
  { value: 'short',    label: 'Short-term  (< 1 year)'   },
  { value: 'medium',   label: 'Medium-term (1–3 years)'  },
  { value: 'long',     label: 'Long-term   (3–7 years)'  },
  { value: 'verylong', label: 'Very long   (7+ years)'   },
];

export const goalOptions = [
  { value: 'safety',     label: 'Capital Safety'           },
  { value: 'income',     label: 'Regular Income'           },
  { value: 'wealth',     label: 'Wealth Creation'          },
  { value: 'retirement', label: 'Retirement Planning'      },
];

// ── Helper: legacy calculateRiskScore (kept for compatibility) ─
export const calculateRiskScore = (answers) =>
  Math.round(answers.reduce((sum, a) => sum + (a.value || 0), 0) / answers.length);
