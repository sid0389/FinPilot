"""Turn a volatility forecast into numbers a user understands. No web framework needed."""
import math
import os
import joblib
import numpy as np
import pandas as pd

import data
import vol

_bundle = None


def bundle():
    global _bundle
    if _bundle is None:
        _bundle = joblib.load("vol_model.joblib")
    return _bundle


# --- plain-language insights built on the same features the model uses -------------------------
def market_mood(X: pd.DataFrame) -> dict:
    """Is today unusually calm or stressed *for this asset*? Percentile of today's EWMA vol in its own history."""
    ew = X["ewma94"]
    pct = float((ew <= ew.iloc[-1]).mean())
    label = "stressed" if pct > 0.80 else ("calm" if pct < 0.25 else "normal")
    return {"label": label, "percentile": round(pct * 100),
            "history_years": round(len(X) / 252, 1)}


def worst_drop(df: pd.DataFrame, h: int) -> dict:
    """Worst h-day fall in the asset's own downloaded history (real data), for the crash replay."""
    c = df["close"]
    ch = (c / c.shift(h) - 1).dropna()
    if ch.empty:
        return {}
    end = ch.idxmin()
    return {"worst_10d_drop": float(ch.min()), "worst_10d_end": pd.Timestamp(end).strftime("%Y-%m-%d"),
            "worst_10d_years": round(len(c) / 252, 1)}


def drivers(model, feats, X: pd.DataFrame) -> list:
    """Why is the forecast what it is? Plain facts: today's swings vs this asset's own normal.
    (We tried model-attribution by resetting inputs to the median; it gave confusing, sometimes contradictory
    answers because the inputs are correlated, so we report observable comparisons instead.)"""
    last = X.iloc[-1]
    out = []
    for col, label in (("rv_5", "this week's daily swing"), ("rv_20", "last month's daily swing")):
        now, typ = math.exp(last[col]), math.exp(X[col].median())
        ratio = now / typ
        out.append({"factor": label, "now_pct": round(now * 100, 2), "typical_pct": round(typ * 100, 2),
                    "direction": "up" if ratio > 1.15 else ("down" if ratio < 0.87 else "similar")})
    dd = float(last["drawdown_60"])
    if dd <= -0.10:
        out.append({"factor": f"price is {abs(dd) * 100:.0f}% below its 60-day high", "direction": "up"})
    return out


def forecast(df: pd.DataFrame, symbol: str) -> dict:
    """Latest volatility forecast + conformal 80% interval for one asset (daily vol, next H days)."""
    b = bundle()
    X = vol.build_vol(df, symbol, with_target=False)
    if X.empty:
        raise ValueError("Not enough history")
    row = X.tail(1)
    pred = float(b["model"].predict(row[b["features"]])[0])
    cls = row["cls"].iloc[0]
    t = b["conformal"][cls]
    k = int(np.digitize(row["vol_ratio"].iloc[0], t["edges"]))
    q = t["q"][k]
    # relative interval width, compared with this class's typical widths -> "unsure" flag
    widest = max(t["q"].values())
    # 1-in-20 loss threshold on the H-day log return = z * forecast vol * sqrt(H).
    # Real-data backtest (backtest_results.json): model vol x normal z=1.645 gave 5.6% breaches
    # (Kupiec p=0.28, passes) while the conformal-calibrated multiplier gave 6.4% (p=0.009, fails),
    # so the normal curve is the default. Set FINPILOT_CALIBRATED=1 to use the learned multiplier.
    mult = b.get("loss_multiplier", {}).get(cls) if os.environ.get("FINPILOT_CALIBRATED") == "1" else None
    thr = (mult if mult else 1.645) * math.exp(pred) * math.sqrt(b["horizon"])
    return {
        "symbol": symbol, "asset_class": cls, "horizon_days": b["horizon"],
        "daily_vol": math.exp(pred), "daily_vol_low": math.exp(pred - q), "daily_vol_high": math.exp(pred + q),
        "interval_coverage": 1 - b["alpha"],
        "reliability": "low" if q >= widest * 0.999 else "normal",
        "loss_threshold_log": thr, "calibrated": bool(mult),
        "mood": market_mood(X),
        "drivers": drivers(b["model"], b["features"], X),
        "as_of": pd.Timestamp(df.index[-1]).strftime("%Y-%m-%d"),
        "data_source": "Yahoo Finance (yfinance)",
        **worst_drop(df, b["horizon"]),
    }


def risk_for_user(fc: dict, savings: float, risk_score: float) -> dict:
    """1-in-20 loss over the horizon (vol forecast x 1.645, validated by backtest.py),
    and the largest allocation that keeps that loss within the user's tolerance.
    Tolerance (2%..10% of savings, rising with risk score) is an ASSUMPTION - tune it."""
    loss_frac = 1 - math.exp(-fc["loss_threshold_log"])   # 1-in-20 loss over the horizon
    max_loss_pct = 0.02 + 0.08 * min(max(risk_score, 0), 100) / 100
    alloc = min(savings, savings * max_loss_pct / max(loss_frac, 1e-9))
    drop = fc.get("worst_10d_drop")
    replay = {}
    if drop is not None:
        replay = {"crash_loss_on_suggested_inr": alloc * abs(drop), "crash_loss_all_in_inr": savings * abs(drop)}
    return {**replay, "loss_fraction_1_in_20": loss_frac,
            "tolerated_loss_inr": savings * max_loss_pct,
            "max_suggested_allocation_inr": alloc,
            "max_suggested_allocation_pct_of_savings": alloc / savings if savings else 0}
