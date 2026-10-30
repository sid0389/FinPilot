"""Run:  cd ml && python -m pytest -q"""
import math, os, sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import data, features, vol, backtest, risk  # noqa: E402


def _prices(n=600, seed=1):
    return data.synthetic_universe(n_days=n, garch=True, seed=seed)["BTC-USD"]


def test_no_lookahead_in_vol_features():
    df = _prices()
    a = vol.build_vol(df, "BTC-USD", with_target=False)
    df2 = df.copy()
    df2.iloc[-50:, :] = df2.iloc[-50:, :] * 3.0          # wreck the "future"
    b = vol.build_vol(df2, "BTC-USD", with_target=False)
    t = a.index[-80]                                      # a day before the change
    feats = [c for c in a.columns if c not in vol.NON_FEATURES]
    pd.testing.assert_series_equal(a.loc[t, feats], b.loc[t, feats])


def test_no_lookahead_in_direction_features():
    df = _prices()
    a = features.build(df, "BTC-USD", with_target=False)
    df2 = df.copy(); df2.iloc[-50:, :] = df2.iloc[-50:, :] * 3.0
    b = features.build(df2, "BTC-USD", with_target=False)
    t = a.index[-80]
    cols = [c for c in a.columns if c != "symbol"]
    pd.testing.assert_series_equal(a.loc[t, cols], b.loc[t, cols])


def test_kupiec_accepts_target_rate_rejects_bad_rate():
    assert backtest.kupiec(5, 100)[1] > 0.5
    assert backtest.kupiec(20, 100)[1] < 0.001
    assert backtest.kupiec(0, 100)[1] < 0.05            # far too conservative is also rejected


def test_diebold_mariano_direction():
    rng = np.random.default_rng(0)
    good = rng.normal(0, 0.5, 400); bad = rng.normal(0, 1.0, 400)
    stat, p = vol.diebold_mariano(good, bad)
    assert stat > 0 and p < 0.01


def test_adaptive_band_widens_after_misses_and_is_causal():
    n = 60
    idx = pd.bdate_range("2024-01-01", periods=n)
    p = pd.DataFrame({"y": np.r_[np.zeros(30), np.full(30, 5.0)], "pred": 0.0, "q": 0.5,
                      "symbol": "X"}, index=idx)
    out = vol.adaptive_adjust(p)
    assert out["q_ad"].iloc[-1] > out["q_ad"].iloc[0]       # widened after repeated misses
    # causality: the first H rows cannot have been adjusted
    assert np.allclose(out["q_ad"].iloc[:vol.H], 0.5)


def test_risk_allocation_logic():
    fc = {"horizon_days": 10, "loss_threshold_log": 0.18}
    low = risk.risk_for_user(fc, 100000, 10)
    high = risk.risk_for_user(fc, 100000, 90)
    assert high["max_suggested_allocation_inr"] > low["max_suggested_allocation_inr"]
    assert high["max_suggested_allocation_inr"] <= 100000
    calm = risk.risk_for_user({**fc, "loss_threshold_log": 0.02}, 100000, 10)
    assert calm["max_suggested_allocation_inr"] >= low["max_suggested_allocation_inr"]
    assert 0 < low["loss_fraction_1_in_20"] < 1


def test_decision_calibration_hits_target_on_synthetic():
    raw = data.synthetic_universe(garch=True)
    ds = pd.concat([vol.build_vol(d, s) for s, d in raw.items()]).dropna(subset=["y", "fwd_ret"]).sort_index()
    p = vol.walk_forward(ds, vol.feat_names(ds), n_folds=3)
    L = backtest.calibrate_multiplier(p, "pred")
    ok = ~np.isnan(L)
    rate = float((p["fwd_ret"].values[ok] < -L[ok]).mean())
    assert 0.03 < rate < 0.07, rate
