"""Risk engine: forecast volatility + calibrated uncertainty + 'no edge' flag.

Target: realised volatility over the next HORIZON days (log scale).
Compared against two classic baselines (naive recent vol, EWMA/RiskMetrics) with a
Diebold-Mariano test. Intervals use Mondrian split-conformal prediction, bucketed by
asset class and recent volatility regime, so the 80% interval should really cover ~80%.

python vol.py                   # real data
python vol.py --synthetic       # offline check (GARCH-style fake prices)
"""
import argparse, json, math
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import LinearRegression

import data
from data import asset_class

H = 10            # forecast horizon in days
NON_FEATURES = ("y", "symbol", "cls", "fwd_ret", "hs_q")
HAR = ["rv_1", "rv_5", "rv_20"]  # daily / weekly / monthly vol (Corsi 2009)
ALPHA = 0.2       # 80% prediction intervals
CLASSES = ["crypto", "forex", "stocks"]
N_BUCKETS = 3     # volatility-regime buckets per asset class


def build_vol(df: pd.DataFrame, symbol: str, with_target: bool = True) -> pd.DataFrame:
    c = df["close"]
    r = np.log(c).diff()
    f = pd.DataFrame(index=df.index)
    for n in (1, 5, 10, 20, 60):
        f[f"rv_{n}"] = np.log(np.sqrt((r ** 2).rolling(n).mean()) + 1e-8) if n > 1 else np.log(r.abs() + 1e-8)
    f["ewma94"] = np.log(np.sqrt((r ** 2).ewm(alpha=0.06).mean()) + 1e-8)
    f["park_10"] = np.log(np.sqrt(((np.log(df["high"] / df["low"]) ** 2) / (4 * math.log(2))).rolling(10).mean()) + 1e-8)
    f["vol_ratio"] = f["rv_5"] - f["rv_60"]        # short vs long-run vol: regime signal
    f["ret_5"] = np.log(c).diff(5)
    f["ret_20"] = np.log(c).diff(20)
    f["drawdown_60"] = c / c.rolling(60).max() - 1
    cls = asset_class(symbol)
    for k in CLASSES:
        f[f"is_{k}"] = float(cls == k)
    if with_target:
        fwd = (r ** 2).rolling(H).mean().shift(-H)
        f["y"] = np.log(np.sqrt(fwd) + 1e-8)
        f["fwd_ret"] = np.log(c).shift(-H) - np.log(c)          # realised H-day log return (for backtests only)
    f["hs_q"] = np.log(c).diff(H).rolling(500, min_periods=250).quantile(0.05)  # historical-simulation VaR input
    f["symbol"] = symbol
    f["cls"] = cls
    feats = [x for x in f.columns if x not in NON_FEATURES]
    return f.replace([np.inf, -np.inf], np.nan).dropna(subset=feats)


def feat_names(ds):
    return [c for c in ds.columns if c not in NON_FEATURES]


def make_model():
    return HistGradientBoostingRegressor(max_depth=3, learning_rate=0.05, max_iter=200,
                                         l2_regularization=2.0, min_samples_leaf=50, random_state=0)


# ---------- conformal ----------
def fit_conformal(cal: pd.DataFrame, pred_col="pred"):
    """Per (class, regime bucket): the (1-alpha) quantile of |error| on held-out calibration data."""
    table = {}
    for cls, g in cal.groupby("cls"):
        edges = np.quantile(g["vol_ratio"], np.linspace(0, 1, N_BUCKETS + 1)[1:-1])
        b = np.digitize(g["vol_ratio"], edges)
        res = (g["y"] - g[pred_col]).abs().values
        qs = {}
        for k in range(N_BUCKETS):
            e = res[b == k]
            if len(e) < 30:
                e = res
            n = len(e)
            level = min(1.0, math.ceil((n + 1) * (1 - ALPHA)) / n)
            qs[k] = float(np.quantile(e, level))
        table[cls] = {"edges": edges.tolist(), "q": qs}
    return table


def apply_conformal(df: pd.DataFrame, table, pred_col="pred"):
    q = np.empty(len(df))
    bucket = np.empty(len(df), dtype=int)
    for cls, t in table.items():
        m = (df["cls"] == cls).values
        if m.any():
            b = np.digitize(df.loc[m, "vol_ratio"], t["edges"])
            bucket[m] = b
            q[m] = [t["q"][k] for k in b]
    out = df.copy()
    out["q"], out["bucket"] = q, bucket
    out["lo"], out["hi"] = out[pred_col] - q, out[pred_col] + q
    return out


def adaptive_adjust(p: pd.DataFrame, gamma: float = 0.05) -> pd.DataFrame:
    """Online (Robbins-Monro / ACI-style) widening of the conformal band.
    After a miss the band widens, after a hit it shrinks slowly, so coverage recovers in crashes.
    Honest timing: the outcome for day j is only known H days later, so day i may only use j <= i-H."""
    out = []
    for _, g in p.sort_index().groupby("symbol"):
        g = g.copy(); n = len(g)
        y, pred, q0 = g["y"].values, g["pred"].values, g["q"].values
        qs = np.empty(n); b = 0.0
        for i in range(n):
            if i >= H:
                j = i - H
                b += gamma * (float(abs(y[j] - pred[j]) > qs[j]) - ALPHA)
            qs[i] = max(q0[i] + b, 0.02)
        g["q_ad"], g["lo_ad"], g["hi_ad"] = qs, pred - qs, pred + qs
        out.append(g)
    return pd.concat(out).sort_index()


# ---------- stats ----------
def diebold_mariano(e1, e2, h=H):
    """H0: equal squared-error accuracy. Positive stat = model 1 (e1) better... see below.
    d = e2^2 - e1^2 ; stat>0 means model 1 has lower loss. Newey-West variance with h-1 lags."""
    d = (np.asarray(e2) ** 2 - np.asarray(e1) ** 2)
    n = len(d); dm = d.mean(); d0 = d - dm
    var = np.dot(d0, d0) / n
    for k in range(1, h):
        var += 2 * (1 - k / h) * np.dot(d0[k:], d0[:-k]) / n
    stat = dm / math.sqrt(var / n)
    p = math.erfc(abs(stat) / math.sqrt(2))
    return float(stat), float(p)


def split_dates(ds, train_end_idx_date, dates):
    pass


def run_fold_fit(train: pd.DataFrame, feats, dates_sorted):
    """Fit mean model on first 80% of training dates, calibrate conformal on last 20% (H-day gap)."""
    d = np.sort(train.index.unique())
    cut = int(len(d) * 0.8)
    fit = train[train.index < d[max(cut - H, 0)]]
    cal = train[train.index >= d[cut]].copy()
    m = make_model().fit(fit[feats], fit["y"])
    cal["pred"] = m.predict(cal[feats])
    har = LinearRegression().fit(fit[HAR], fit["y"])   # classic HAR benchmark (log form)
    return m, fit_conformal(cal), har


def walk_forward(ds, feats, n_folds=5):
    dates = np.sort(ds.index.unique())
    edges = np.linspace(int(len(dates) * 0.5), len(dates), n_folds + 1, dtype=int)
    out = []
    for a, b in zip(edges[:-1], edges[1:]):
        train = ds[ds.index < dates[max(a - H, 0)]]
        te = ds[ds.index >= dates[a]]
        if b < len(dates):
            te = te[te.index < dates[b]]
        m, table, har = run_fold_fit(train, feats, dates)
        te = te.copy()
        te["pred"] = m.predict(te[feats])
        te["har"] = har.predict(te[HAR])
        out.append(apply_conformal(te, table))
    return pd.concat(out)


def evaluate(p: pd.DataFrame):
    e_model = p["y"] - p["pred"]
    e_naive = p["y"] - p["rv_10"]
    e_ewma = p["y"] - p["ewma94"]
    e_har = p["y"] - p["har"]
    rm = lambda e: float(np.sqrt((e ** 2).mean()))
    rep = {"rows": len(p),
           "rmse_log_vol": {"model": rm(e_model), "naive_recent_vol": rm(e_naive), "ewma": rm(e_ewma), "har": rm(e_har)}}
    # DM test per symbol (stacked rows of different assets are not one time series)
    for name, base in (("naive_recent_vol", "rv_10"), ("ewma", "ewma94"), ("har", "har")):
        better = sig = tot = 0
        for _, g in p.sort_index().groupby("symbol"):
            if len(g) < 100:
                continue
            s_, pv = diebold_mariano((g["y"] - g["pred"]).values, (g["y"] - g[base]).values)
            tot += 1; better += s_ > 0; sig += (s_ > 0 and pv < 0.05)
        rep[f"dm_vs_{name}"] = {"symbols": tot, "model_better_on": int(better), "significantly_better_on_5pct": int(sig)}
    cov = ((p["y"] >= p["lo"]) & (p["y"] <= p["hi"]))
    rep["interval"] = {"target_coverage": 1 - ALPHA, "coverage": float(cov.mean()),
                       "coverage_by_class": {k: float(v) for k, v in cov.groupby(p["cls"]).mean().items()},
                       "coverage_by_regime_bucket": {int(k): float(v) for k, v in cov.groupby(p["bucket"]).mean().items()}}
    if "lo_ad" in p:
        cov_ad = ((p["y"] >= p["lo_ad"]) & (p["y"] <= p["hi_ad"]))
        yrs = p.index.year
        rep["adaptive_interval"] = {
            "coverage": float(cov_ad.mean()),
            "coverage_by_regime_bucket": {int(k): float(v) for k, v in cov_ad.groupby(p["bucket"]).mean().items()},
            "coverage_by_year_static": {int(k): float(v) for k, v in cov.groupby(yrs).mean().items()},
            "coverage_by_year_adaptive": {int(k): float(v) for k, v in cov_ad.groupby(yrs).mean().items()},
            "mean_width_static": float((2 * p["q"]).mean()), "mean_width_adaptive": float((2 * p["q_ad"]).mean())}
    # Abstain on the 20% widest intervals ("model is unsure")
    width = 2 * p["q"]
    keep = width <= width.quantile(0.8)
    ae = e_model.abs()
    rep["abstention"] = {"mae_all": float(ae.mean()), "mae_kept_80pct": float(ae[keep].mean()),
                         "mae_abstained_20pct": float(ae[~keep].mean()),
                         "coverage_kept": float(cov[keep].mean())}
    return rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--synthetic", action="store_true")
    ap.add_argument("--years", type=int, default=8)
    ap.add_argument("--out", default="vol_model.joblib")
    ap.add_argument("--metrics", default="vol_metrics.json")
    a = ap.parse_args()
    raw = data.synthetic_universe(garch=True) if a.synthetic else data.load_universe(a.years)
    ds = pd.concat([build_vol(d, s) for s, d in raw.items()]).dropna(subset=["y"]).sort_index()
    feats = feat_names(ds)
    print(f"{len(ds)} rows, {ds.symbol.nunique()} symbols, {len(feats)} features")

    p = adaptive_adjust(walk_forward(ds, feats))
    rep = evaluate(p)
    print(json.dumps(rep, indent=2))
    # decision-level calibration: 95th percentile of (realised loss / forecast H-day vol), per asset class,
    # from OUT-OF-SAMPLE predictions -> makes the "1-in-20 loss" statement calibrated, not assumed normal.
    mult = {}
    for cls, g in p.groupby("cls"):
        sc = -g["fwd_ret"].values / (np.exp(g["pred"].values) * math.sqrt(H))
        mult[cls] = float(np.quantile(sc, 0.95))
    rep["loss_multiplier_95"] = mult
    print("loss multipliers:", mult)
    json.dump(rep, open(a.metrics, "w"), indent=2)

    m, table, _ = run_fold_fit(ds, feats, None)
    joblib.dump({"model": m, "features": feats, "conformal": table, "horizon": H, "alpha": ALPHA,
                 "loss_multiplier": mult}, a.out)
    print(f"saved {a.out} + {a.metrics}")


if __name__ == "__main__":
    main()
