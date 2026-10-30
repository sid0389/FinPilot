"""Train + honestly evaluate a pooled direction model across crypto/forex/stocks.

python train.py              # real data (needs internet + yfinance)
python train.py --synthetic  # offline pipeline check, pure random walk
python train.py --synthetic --signal 0.15   # random walk with weak momentum
"""
import argparse, json
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score, accuracy_score

import data
import features as F

COST = 0.001  # 0.1% round-trip cost assumption per position change (set per market!)


def make_model():
    # Small, heavily regularised: financial data is mostly noise.
    return HistGradientBoostingClassifier(max_depth=3, learning_rate=0.03,
                                          max_iter=200, l2_regularization=5.0,
                                          min_samples_leaf=100, random_state=0)


def walk_forward(ds: pd.DataFrame, feats, n_folds=5):
    """Expanding window, split by DATE (all assets share the same cutoff) with a
    HORIZON-day gap so the target of training rows never overlaps the test period."""
    dates = np.sort(ds.index.unique())
    first = int(len(dates) * 0.5)
    edges = np.linspace(first, len(dates), n_folds + 1, dtype=int)
    preds = []
    for a, b in zip(edges[:-1], edges[1:]):
        train_end = dates[max(a - F.HORIZON, 0)]
        tr = ds[ds.index < train_end]
        te = ds[ds.index >= dates[a]]
        if b < len(dates):
            te = te[te.index < dates[b]]
        m = make_model().fit(tr[feats], tr["y"])
        te = te.copy()
        te["p_up"] = m.predict_proba(te[feats])[:, 1]
        preds.append(te)
    return pd.concat(preds)


def backtest(p: pd.DataFrame, threshold=0.55):
    """Long when p_up>threshold, short when p_up<1-threshold, else flat.
    Uses non-overlapping 5-day trades per symbol, minus trading cost."""
    rows = []
    for sym, g in p.groupby("symbol"):
        g = g.iloc[::F.HORIZON]
        pos = np.where(g.p_up > threshold, 1, np.where(g.p_up < 1 - threshold, -1, 0))
        ret = pos * g.fwd_ret.values - COST * (pos != 0)
        rows.append(pd.DataFrame({"symbol": sym, "ret": ret, "bh": g.fwd_ret.values,
                                  "traded": pos != 0}))
    r = pd.concat(rows)
    return {"trades": int(r.traded.sum()),
            "avg_5d_return_strategy": float(r.ret.mean()),
            "avg_5d_return_buy_and_hold": float(r.bh.mean()),
            "hit_rate_when_traded": float((r.ret[r.traded] > 0).mean()) if r.traded.any() else None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--synthetic", action="store_true")
    ap.add_argument("--signal", type=float, default=0.0)
    ap.add_argument("--years", type=int, default=8)
    a = ap.parse_args()

    raw = data.synthetic_universe(signal=a.signal) if a.synthetic else data.load_universe(a.years)
    ds = pd.concat([F.build(d, s) for s, d in raw.items()]).dropna(subset=["y"]).sort_index()
    feats = F.feature_names(ds)
    print(f"{len(ds)} rows, {ds.symbol.nunique()} symbols, {len(feats)} features")

    p = walk_forward(ds, feats)
    base = max(p.y.mean(), 1 - p.y.mean())
    report = {
        "out_of_sample_rows": len(p),
        "accuracy": float(accuracy_score(p.y, p.p_up > 0.5)),
        "majority_class_baseline": float(base),
        "auc": float(roc_auc_score(p.y, p.p_up)),
        "by_asset_class": {},
        "backtest": backtest(p),
    }
    for cls in F.CLASSES:
        s = p[p[f"is_{cls}"] == 1]
        if len(s) and s.y.nunique() > 1:
            report["by_asset_class"][cls] = {"auc": float(roc_auc_score(s.y, s.p_up)),
                                             "accuracy": float(accuracy_score(s.y, s.p_up > 0.5))}
    print(json.dumps(report, indent=2))
    json.dump(report, open("metrics.json", "w"), indent=2)

    final = make_model().fit(ds[feats], ds["y"])
    joblib.dump({"model": final, "features": feats, "horizon": F.HORIZON}, "model.joblib")
    print("saved model.joblib + metrics.json")


if __name__ == "__main__":
    main()
