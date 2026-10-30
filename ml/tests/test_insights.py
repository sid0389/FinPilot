"""Tests for mood, crash replay, drivers, caching/stale fallback and input validation (offline, synthetic data)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import numpy as np
import pandas as pd
import data, risk, vol


def _df(sym="BTC-USD", n=1500, seed=1):
    return data.synthetic_universe(n_days=n, garch=True, seed=seed)[sym]


def test_forecast_has_new_fields():
    fc = risk.forecast(_df(), "BTC-USD")
    assert fc["mood"]["label"] in ("calm", "normal", "stressed")
    assert 0 <= fc["mood"]["percentile"] <= 100
    assert fc["worst_10d_drop"] < 0 and fc["worst_10d_end"]
    assert fc["data_source"] and fc["as_of"]
    assert fc["drivers"] and all(d["direction"] in ("up", "down", "similar") for d in fc["drivers"])


def test_worst_drop_is_exact():
    idx = pd.bdate_range("2020-01-01", periods=40)
    c = np.full(40, 100.0); c[20:] = 60.0          # a 40% overnight crash on day 20
    d = pd.DataFrame({"close": c}, index=idx)
    w = risk.worst_drop(d, 10)
    assert abs(w["worst_10d_drop"] + 0.40) < 1e-9


def test_mood_extremes():
    X = vol.build_vol(_df(), "BTC-USD", with_target=False)
    X = X.copy(); X.iloc[-1, X.columns.get_loc("ewma94")] = X["ewma94"].max() + 1
    assert risk.market_mood(X)["label"] == "stressed"
    X.iloc[-1, X.columns.get_loc("ewma94")] = X["ewma94"].min() - 1
    assert risk.market_mood(X)["label"] == "calm"


def test_crash_replay_scales_with_allocation():
    fc = risk.forecast(_df(), "BTC-USD")
    r = risk.risk_for_user(fc, 100000, 50)
    assert abs(r["crash_loss_all_in_inr"] - 100000 * abs(fc["worst_10d_drop"])) < 1e-6
    assert r["crash_loss_on_suggested_inr"] <= r["crash_loss_all_in_inr"] + 1e-6


def test_cache_and_stale_fallback(tmp_path, monkeypatch):
    monkeypatch_env = os.environ.setdefault("FORECAST_LOG", str(tmp_path / "log.csv"))
    import serve
    calls = {"n": 0, "fail": False}
    d = _df()

    def fake_download(sym, years=8):
        calls["n"] += 1
        if calls["fail"]:
            raise RuntimeError("offline")
        return d
    orig = data.download; data.download = fake_download; serve._cache.clear()
    try:
        a = serve.get_forecast("BTC-USD"); b = serve.get_forecast("BTC-USD")
        assert calls["n"] == 1 and a is b                      # second call served from cache
        serve._cache["BTC-USD"] = (0, a)                       # expire it
        calls["fail"] = True
        c = serve.get_forecast("BTC-USD")                      # internet down -> stale copy, not a crash
        assert c["stale"] is True
    finally:
        data.download = orig; serve._cache.clear()


def test_endpoint_validation():
    import serve
    from fastapi import HTTPException
    for bad in [dict(symbol="FAKE123"), dict(symbol="BTC-USD", savings=-5), dict(symbol="BTC-USD", savings=float("nan"))]:
        try:
            serve.risk_endpoint(**bad); assert False, bad
        except HTTPException as e:
            assert e.status_code == 400
