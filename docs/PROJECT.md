# FinPilot - project definition (draft for your report)

## Problem
Retail investors in India choose between stocks, crypto and forex with generic labels ("high risk").
Forecasting papers report average accuracy or interval coverage, but not whether the **advice a person
receives keeps them inside their own loss limit**. FinPilot answers one question for any asset class:
*"How much can I put in so that a bad case (1 in 20) stays within what I can afford to lose?"*

## Contribution (modest, and honest)
1. **One pipeline for crypto, forex and stocks** (17 symbols, ~8 years of daily data): a 10-day volatility forecast (gradient boosting).
2. **Evaluation at the user-decision level**, not only forecast error: simulated cautious / balanced / aggressive users, how often the real loss broke their limit, Kupiec and Christoffersen tests, stress periods, and comparison against EWMA, HAR, historical simulation and a fixed-10% rule.
3. **A negative result we report openly**: a conformal "decision-level calibration" we proposed over-breaches on real data and was *not* adopted. The deployed rule is the one that passed the backtest.
4. **A complete system**: React app, Node API, ML service, forecast logging for live evaluation, a retraining gate, Docker.

## Related work (verified sources)
- Kupiec (1995), *Techniques for verifying the accuracy of risk measurement models*, J. Derivatives; Christoffersen (1998), *Evaluating interval forecasts*, Int. Economic Review. These are the backtests used here.
- Corsi (2009), HAR-RV model (our HAR baseline).
- Gibbs & Candes (2021), *Adaptive conformal inference under distribution shift* (basis of our adaptive intervals).
- "A machine learning approach to volatility forecasting", arXiv:2601.13014: ML volatility forecasts evaluated through VaR with Kupiec/Christoffersen tests (same evaluation style as ours).
- Multi-Transformer volatility paper, arXiv:2109.12621: neural volatility models evaluated with Kupiec/Christoffersen by year; most models fail in 2020.
- "Neural and Econometric Forecasting of Market Risk", Risks 14(10):228 (2026): a parsimonious GARCH(1,1) is a demanding benchmark and conditioning on dynamic volatility is what matters. Our finding (EWMA is hard to beat) agrees.
Note: these are arXiv/MDPI sources, not IEEE-hosted. Search IEEE Xplore for "Value-at-Risk backtesting volatility forecasting" and add 2-3 IEEE papers for your reference list. Do not claim novelty ("first"); claim a multi-asset, user-decision-level evaluation.

## Method
- Target: log realised volatility over the next H=10 days. Features: past vols (1-60d), Parkinson range vol, EWMA, regime ratio, returns, drawdown, asset class.
- Walk-forward evaluation (expanding window, H-day gap, 5 folds, test = last half of history).
- Mondrian split conformal intervals (class x regime) for volatility, with adaptive widening.
- **Deployed loss rule:** L = 1.645 x forecast daily vol x sqrt(H) (1-in-20 loss on the H-day log return).
- Allocation = min(savings, tolerance x savings / (1 - exp(-L))); tolerance 2%-10% of savings by risk score (design ASSUMPTION, not user-validated).

## Reproduce
    cd ml
    pip install -r requirements.txt
    python vol.py            # forecast accuracy, interval coverage, HAR/EWMA/naive + DM tests
    python backtest.py       # decision-level breach rates, Kupiec/Christoffersen, stress periods
    python -m pytest -q      # unit tests (look-ahead, calibration, allocation logic)
    uvicorn serve:app --port 8000
    python live_eval.py      # after the app has run for a few weeks
    python retrain.py        # weekly, with coverage gate

## User-facing features (Risk Forecast page)
- **Market mood** (calm / normal / stressed): percentile of today's EWMA volatility in the asset's own history.
- **Why this forecast**: this week's and last month's swings vs the asset's own typical level (plain comparisons; a model-attribution version was tried and dropped because correlated inputs made it contradict the mood label).
- **Crash replay**: worst 10-day fall in ~8 years of real history, applied to the user's suggested amount in rupees.
- **Chatbot link**: the latest forecast is passed (sanitised) to the chat backend so users can ask "why is my suggested amount this low?".
- **Reliability**: forecasts are cached for 3 hours (FORECAST_CACHE_HOURS); if Yahoo Finance is unreachable the last saved forecast is shown and marked stale. Only fresh forecasts are logged for live evaluation. Inputs are validated (unsupported symbols and bad savings return HTTP 400).

## Honest limitations (write these in the report)
- Windows overlap (10-day horizon) and assets crash together, so Kupiec/Christoffersen p-values are overconfident in both directions.
- The deployed method was chosen after seeing the test results (it is the textbook rule, not tuned, but this is still selection). Prospective evidence must come from live_eval.py.
- Direction (up/down) prediction showed no edge (AUC 0.51); the product is a RISK tool, not a trading signal.
- ~8 years of data, one macro regime; yfinance data quality; no transaction costs.
- Tolerance mapping and the 10-day horizon are design choices, not user-validated.
- Not financial advice; SEBI/RBI constraints apply.

## Results (real data, from ml/vol_metrics.json and ml/backtest_results.json)
**Forecast accuracy** (log-vol RMSE): model 0.438, HAR 0.452, EWMA 0.450, naive 0.509. Better than HAR on 15/17 symbols (13 significant, Diebold-Mariano 5%), better than EWMA on 15/17 (11 significant).
**Interval coverage** (target 80%): static 79.1%, adaptive 79.9% (adaptive is worse in 2022: 72.9% vs 76.6%, and ~12% wider).

**Decision-level backtest** (1,798 windows, target breach rate 5%):
| Method | Breach rate | Kupiec p | Christoffersen p | Mean balanced allocation |
|---|---|---|---|---|
| Model vol x normal z (DEPLOYED) | 5.6% | 0.28 | 0.55 | 76% |
| EWMA x normal z | 4.8% | 0.75 | 0.67 | 76% |
| Historical simulation | 4.95% | 0.92 | 0.96 | 75% |
| Model + conformal calibration (proposed, rejected) | 6.4% | 0.009 | 0.029 | 79% |
| EWMA + conformal calibration | 6.5% | 0.007 | 0.017 | 80% |
| Model interval upper bound (very cautious) | 0.9% | ~1e-22 | ~1e-21 | 59-61% |
| Fixed 10% | 0% | n/a | n/a | 10% |
Stress periods only: deployed 3.4%, calibrated 4.0%, EWMA-normal 3.4%, hist. sim. 5.4%.

**Interpretation.** (a) The ML model forecasts volatility modestly but significantly better than EWMA/HAR. (b) At the decision level it is no better than EWMA: breach rates are similar and both are close to target. (c) The learned loss multipliers (1.57-1.73) are close to the normal 1.645, so extra calibration adds nothing and slightly over-breaches. (d) The deployed rule keeps real losses inside the user's limit about 94-95% of the time, versus 10% fixed advice that is safe but ignores both the asset and the user.

## Status
| Item | State |
|---|---|
| Data pipeline, features, no-look-ahead tests | done, tested |
| Volatility model + baselines + DM tests | done, real-data results above |
| Conformal intervals, adaptive update, per-year coverage | done, real-data results above |
| Breach backtest + Kupiec/Christoffersen | done, real-data results above |
| API (/risk), React page, Recommendation integration | done; UI not run in the build environment |
| Live logging + prospective evaluation, retraining gate, Docker | written; run `docker compose up --build` and test locally |
| Unit tests | 13 passing (offline, synthetic data) |
| User study (15-20 people) | TODO, plan below |
| Final report | TODO, structure in this file |

## User study (suggested, ~1 week)
15-20 students/friends. Show half the plain label ("Crypto: very high risk") and half the FinPilot output
(rupee loss + max amount). Ask: how much would you invest, how confident, can you explain the risk (1-5).
Compare answers and comprehension. Keep consent + anonymity.
