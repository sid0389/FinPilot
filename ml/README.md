# FinPilot ML (starter)

One pooled model for crypto, forex and stocks. Predicts P(price is higher in 5 trading days).

## Run
    pip install -r requirements.txt
    python train.py --synthetic     # offline sanity check (should score ~50%)
    python train.py                 # real data via yfinance -> model.joblib + metrics.json
    uvicorn serve:app --port 8000   # GET /predict?symbol=BTC-USD

## Reading metrics.json
- accuracy vs majority_class_baseline: only the gap matters.
- auc: 0.50 = coin flip. 0.52-0.55 out-of-sample is a realistic good result.
- backtest: compare strategy vs buy-and-hold AFTER costs. Set COST per market in train.py.

## Rules for yourself
- Never tune on the test folds. Never shuffle rows. Keep the gap = horizon.
- If a result looks great (>60% accuracy), assume leakage first.
- Show users probabilities and "no edge" states, never certainty.

## Next steps
1. Add features: BTC dominance, VIX, DXY, interest rates, news sentiment.
2. Try per-class models, other horizons, and a regression target (expected return).
3. Add probability calibration (sklearn CalibratedClassifierCV).
4. Retrain on a schedule; log live predictions vs outcomes.

## Risk engine (vol.py, risk.py)  <- the main contribution
Forecasts 10-day volatility per asset, wraps it in a conformal 80% interval, flags "low reliability",
and converts it to rupees for the user (1-in-20 loss, max suggested allocation).

    python vol.py --synthetic    # offline check
    python vol.py                # real data -> vol_model.joblib + vol_metrics.json
    uvicorn serve:app --port 8000
    GET /risk?symbol=BTC-USD&savings=500000&risk_score=70

What to look for in vol_metrics.json:
- rmse_log_vol: model should beat naive_recent_vol, ewma and har (the standard benchmark); dm_* show on how many symbols it is significant.
- interval.coverage should be ~0.80 overall, per class and per regime bucket. THIS is the key result.
- abstention: error on the 80% kept vs the 20% flagged unsure.
Tolerance mapping in risk.py (2%-10% of savings) is an assumption - tune it.

## Evaluation pipeline (final-year project)
    python backtest.py --synthetic   # offline check
    python backtest.py               # real data -> backtest_results.json
Read: `exceedance_rate` should be ~0.05; `kupiec_p` and `christoffersen_cc_p` > 0.05 mean "not rejected".
Compare `ours_calibrated` with `ewma_calibrated` (value of the model) and `ewma_normal` / `hist_sim` (standard practice).
See ../docs/PROJECT.md for the full project definition, limitations and status.
