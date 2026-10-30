"""Tiny prediction API.  uvicorn serve:app --port 8000
GET /predict?symbol=BTC-USD  ->  {"p_up":0.57,"signal":"lean_up","confidence":"low",...}
"""
import csv, math, os, threading, time
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import data
import features as F
import risk

bundle = joblib.load("model.joblib") if __import__('os').path.exists("model.joblib") else None
app = FastAPI(title="FinPilot ML")
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
                   allow_methods=["GET"], allow_headers=["*"])


@app.get("/predict")
def predict(symbol: str):
    try:
        df = data.download(symbol, years=2)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(404, f"No data for {symbol}: {e}")
    X = F.build(df, symbol, with_target=False)
    if X.empty:
        raise HTTPException(422, "Not enough history")
    if bundle is None:
        raise HTTPException(503, "Run train.py first")
    p = float(bundle["model"].predict_proba(X[bundle["features"]].tail(1))[0, 1])
    edge = abs(p - 0.5)
    return {
        "symbol": symbol,
        "asset_class": data.asset_class(symbol),
        "horizon_days": bundle["horizon"],
        "p_up": round(p, 3),
        "signal": "no_edge" if edge < 0.05 else ("lean_up" if p > 0.5 else "lean_down"),
        "confidence": "low" if edge < 0.1 else "moderate",
        "disclaimer": "Statistical estimate, not advice. Historical accuracy is only slightly above chance.",
    }


ALLOWED = {s for v in data.UNIVERSE.values() for s in v}
CACHE_TTL = float(os.environ.get("FORECAST_CACHE_HOURS", "3")) * 3600
_cache: dict = {}
_lock = threading.Lock()


def get_forecast(symbol: str) -> dict:
    """Cached per-asset forecast. If Yahoo is unreachable, serve the last good one (marked stale) so the demo survives."""
    now = time.time()
    hit = _cache.get(symbol)
    if hit and now - hit[0] < CACHE_TTL:
        return hit[1]
    with _lock:
        hit = _cache.get(symbol)                       # another request may have just filled it
        if hit and time.time() - hit[0] < CACHE_TTL:
            return hit[1]
        try:
            fc = risk.forecast(data.download(symbol, years=8), symbol)
        except Exception:
            if hit:
                return {**hit[1], "stale": True}
            raise
        fc["computed_at"] = int(time.time())
        _cache[symbol] = (time.time(), fc)
        _log(fc)                                       # log only fresh forecasts (cache hits would double-count)
        return fc


@app.get("/risk")
def risk_endpoint(symbol: str, savings: float = 100000, risk_score: float = 50):
    """Volatility forecast with calibrated range + what it means in rupees for this user."""
    if symbol not in ALLOWED:
        raise HTTPException(400, f"Unsupported symbol {symbol}. Supported: {sorted(ALLOWED)}")
    if not (math.isfinite(savings) and savings > 0 and math.isfinite(risk_score)):
        raise HTTPException(400, "savings must be a positive number and risk_score a number")
    risk_score = min(max(risk_score, 0.0), 100.0)
    try:
        fc = get_forecast(symbol)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(503, f"Could not get data for {symbol} (is the internet on?): {e}")
    return {**fc, **risk.risk_for_user(fc, savings, risk_score), "savings": savings, "risk_score": risk_score,
            "disclaimer": "Statistical estimate, not advice. Past volatility does not guarantee future risk."}


def _log(fc: dict):
    """Append every served forecast so live_eval.py can score it once the outcome is known."""
    path = os.environ.get("FORECAST_LOG", "forecast_log.csv")
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    new = not os.path.exists(path)
    with open(path, "a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["ts", "symbol", "horizon_days", "loss_threshold_log", "daily_vol"])
        w.writerow([int(time.time()), fc["symbol"], fc["horizon_days"], fc["loss_threshold_log"], fc["daily_vol"]])
