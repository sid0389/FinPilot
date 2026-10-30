"""Prospective (live) validation: score the forecasts the running app actually served.
Run any time:  python live_eval.py      Needs forecast_log.csv written by serve.py.
A forecast is 'due' once horizon_days business days have passed; we then check whether the
real return fell below -loss_threshold (an exceedance). Target rate: 5%."""
import math, sys
import numpy as np
import pandas as pd
import data
from backtest import kupiec


def main(path="forecast_log.csv"):
    log = pd.read_csv(path)
    log["date"] = pd.to_datetime(log["ts"], unit="s").dt.normalize()
    rows = []
    for sym, g in log.groupby("symbol"):
        px = data.download(sym, years=1)["close"]
        for _, r in g.iterrows():
            start = px[px.index <= r["date"]]
            if start.empty:
                continue
            i = px.index.get_loc(start.index[-1])
            j = i + int(r["horizon_days"])
            if j >= len(px):
                continue  # not due yet
            rows.append({"symbol": sym, "fwd": math.log(px.iloc[j] / px.iloc[i]), "thr": r["loss_threshold_log"]})
    if not rows:
        print("No forecasts are due yet - check back after the horizon has passed."); return
    d = pd.DataFrame(rows)
    x, n = int((d["fwd"] < -d["thr"]).sum()), len(d)
    print(f"{n} scored forecasts, {x} exceedances = {x/n:.1%} (target 5.0%), Kupiec p = {kupiec(x, n)[1]:.3f}")
    if n < 100:
        print("Note: fewer than 100 scored forecasts - not enough to conclude anything yet.")


if __name__ == "__main__":
    main(*sys.argv[1:])
