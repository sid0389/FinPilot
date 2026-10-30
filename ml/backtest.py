"""Decision-level validation: does the ADVICE keep users inside their own loss limit?

For simulated users (cautious / balanced / aggressive, savings 1,00,000) we replay history:
each non-overlapping 10-day window, the method forecasts a 1-in-20 loss, the user is advised an
allocation so that loss stays within their tolerance, and we count how often the REAL loss broke it.

Methods compared:  ours_calibrated (model + decision-level conformal, THE PROPOSED METHOD),
                   ewma_calibrated (same calibration, simpler vol model -> isolates the model's value),
                   ours / ours_adaptive (upper bound of the vol interval), ours_point (normal curve),
                   ewma_normal (RiskMetrics), hist_sim (historical simulation), fixed_10pct (simple rule).
Tests: Kupiec (is exceedance rate 5%?) and Christoffersen conditional coverage (and are they independent?).

python backtest.py              # real data
python backtest.py --synthetic  # offline check
"""
import argparse, json, math
import numpy as np
import pandas as pd
from scipy.special import xlogy, xlog1py
from scipy.stats import chi2

import data
import vol

Z, P_TARGET, SAVINGS = 1.645, 0.05, 100000.0
PROFILES = {"cautious": 20, "balanced": 50, "aggressive": 80}


def tolerance(score):  # same mapping as risk.py (an ASSUMPTION, state it in the report)
    return 0.02 + 0.08 * score / 100


def kupiec(x, n, p=P_TARGET):
    ph = x / n
    ll0 = xlogy(n - x, 1 - p) + xlogy(x, p)
    ll1 = xlog1py(n - x, -ph) + xlogy(x, ph)
    lr = -2 * (ll0 - ll1)
    return float(lr), float(chi2.sf(lr, 1))


def christoffersen_cc(seqs, p=P_TARGET):
    """Conditional coverage = Kupiec + independence of exceedances (transition counts pooled over symbols)."""
    n00 = n01 = n10 = n11 = 0
    for s in seqs:
        s = np.asarray(s, dtype=int)
        a, b = s[:-1], s[1:]
        n00 += int(((a == 0) & (b == 0)).sum()); n01 += int(((a == 0) & (b == 1)).sum())
        n10 += int(((a == 1) & (b == 0)).sum()); n11 += int(((a == 1) & (b == 1)).sum())
    n = n00 + n01 + n10 + n11
    x = n01 + n11
    pi = x / n
    pi01 = n01 / max(n00 + n01, 1); pi11 = n11 / max(n10 + n11, 1)
    ll_ind0 = xlog1py(n00 + n10, -pi) + xlogy(n01 + n11, pi)
    ll_ind1 = xlog1py(n00, -pi01) + xlogy(n01, pi01) + xlog1py(n10, -pi11) + xlogy(n11, pi11)
    lr_ind = -2 * (ll_ind0 - ll_ind1)
    lr_pof, _ = kupiec(x, n, p)
    return float(chi2.sf(lr_pof + lr_ind, 2)), float(chi2.sf(lr_ind, 1))


def calibrate_multiplier(p: pd.DataFrame, col: str, target=P_TARGET, gap_days=14, min_n=300):
    """Decision-level conformal calibration (causal, per asset class).
    score = realised loss / forecast H-day volatility. For each date we take the (1-target) quantile of
    scores whose outcomes were already known (>= gap_days earlier). Threshold L = multiplier * sigma,
    so the '1-in-20' claim is calibrated by construction instead of assumed from a normal curve."""
    sig = np.exp(p[col].values) * math.sqrt(vol.H)
    score = -p["fwd_ret"].values / sig
    dates, cls = p.index.values, p["cls"].values
    mult = np.full(len(p), np.nan)
    for c in np.unique(cls):
        idx = np.where(cls == c)[0]
        order = idx[np.argsort(dates[idx], kind="stable")]
        d, sc = dates[order], score[order]
        cut = np.searchsorted(d, d - np.timedelta64(gap_days, "D"), side="right")
        for k in np.unique(cut):
            if k >= min_n:
                mult[order[cut == k]] = np.quantile(sc[:k], 1 - target)
    return mult * sig


def thresholds(w: pd.DataFrame):
    """Per method: L = loss threshold on the H-day log return (exceed if fwd_ret < -L)."""
    H = vol.H
    return {
        "ours":          np.exp(w["hi"]) * math.sqrt(H) * Z,
        "ours_adaptive": np.exp(w["hi_ad"]) * math.sqrt(H) * Z,
        "ours_point":    np.exp(w["pred"]) * math.sqrt(H) * Z,
        "ewma_normal":   np.exp(w["ewma94"]) * math.sqrt(H) * Z,
        "hist_sim":      (-w["hs_q"]).clip(lower=1e-4),
        "ours_calibrated": w["L_ours_cal"].clip(lower=1e-4),
        "ewma_calibrated": w["L_ewma_cal"].clip(lower=1e-4),
    }


def summarise(w: pd.DataFrame):
    L = thresholds(w)
    out = {}
    for name, thr in L.items():
        exceed = (w["fwd_ret"] < -thr).astype(int)
        x, n = int(exceed.sum()), len(exceed)
        seqs = [exceed[w["symbol"] == s].values for s in w["symbol"].unique()]
        entry = {"windows": n, "exceedance_rate": x / n, "target": P_TARGET,
                 "kupiec_p": kupiec(x, n)[1], "christoffersen_cc_p": christoffersen_cc(seqs)[0],
                 "by_class": {c: float(exceed[w["cls"] == c].mean()) for c in w["cls"].unique()},
                 "by_regime": {int(b): float(exceed[w["bucket"] == b].mean()) for b in sorted(w["bucket"].unique())},
                 "profiles": {}}
        loss_frac = 1 - np.exp(-thr)
        real_loss = (1 - np.exp(w["fwd_ret"])).clip(lower=0)
        for pname, sc in PROFILES.items():
            tol = tolerance(sc)
            alloc = np.minimum(1.0, tol / loss_frac)            # fraction of savings
            breach = (alloc * real_loss > tol)
            entry["profiles"][pname] = {"limit_breach_rate": float(breach.mean()),
                                        "mean_allocation_pct": float(alloc.mean())}
        out[name] = entry
    # naive rule: always 10% of savings, ignores risk
    real_loss = (1 - np.exp(w["fwd_ret"])).clip(lower=0)
    out["fixed_10pct"] = {"windows": len(w), "profiles": {
        pname: {"limit_breach_rate": float((0.10 * real_loss > tolerance(sc)).mean()), "mean_allocation_pct": 0.10}
        for pname, sc in PROFILES.items()}}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--synthetic", action="store_true")
    ap.add_argument("--years", type=int, default=8)
    a = ap.parse_args()
    raw = data.synthetic_universe(garch=True) if a.synthetic else data.load_universe(a.years)
    ds = pd.concat([vol.build_vol(d, s) for s, d in raw.items()]).dropna(subset=["y", "fwd_ret"]).sort_index()
    feats = vol.feat_names(ds)

    p = vol.adaptive_adjust(vol.walk_forward(ds, feats)).dropna(subset=["hs_q"])
    p["L_ours_cal"] = calibrate_multiplier(p, "pred")
    p["L_ewma_cal"] = calibrate_multiplier(p, "ewma94")
    p = p.dropna(subset=["L_ours_cal", "L_ewma_cal"])
    # non-overlapping H-day windows per symbol -> independent-ish decisions
    w = pd.concat([g.iloc[::vol.H] for _, g in p.sort_index().groupby("symbol")])
    res = summarise(w)
    # stress view: the 10% most turbulent dates (cross-asset median short-vs-long vol ratio)
    stress_dates = p.groupby(level=0)["vol_ratio"].median()
    hot = stress_dates[stress_dates >= stress_dates.quantile(0.9)].index
    res["stress_periods_only"] = {k: v["exceedance_rate"] for k, v in summarise(w[w.index.isin(hot)]).items() if "exceedance_rate" in v} if w.index.isin(hot).sum() > 50 else "too few windows"
    print(json.dumps(res, indent=2))
    json.dump(res, open("backtest_results.json", "w"), indent=2)


if __name__ == "__main__":
    main()
