"""Feature engineering. Every feature uses only data available at that day's close."""
import numpy as np
import pandas as pd
from data import asset_class

HORIZON = 5  # predict direction of the next 5 trading days
CLASSES = ["crypto", "forex", "stocks"]


def _rsi(close: pd.Series, n: int = 14) -> pd.Series:
    d = close.diff()
    up = d.clip(lower=0).rolling(n).mean()
    dn = (-d.clip(upper=0)).rolling(n).mean()
    return 100 - 100 / (1 + up / (dn + 1e-12))


def build(df: pd.DataFrame, symbol: str, with_target: bool = True) -> pd.DataFrame:
    c = df["close"]
    r1 = np.log(c).diff()
    f = pd.DataFrame(index=df.index)
    for n in (1, 2, 5, 10, 20, 60):
        f[f"ret_{n}"] = np.log(c).diff(n)
    for n in (5, 20, 60):
        f[f"vol_{n}"] = r1.rolling(n).std()
    f["vol_ratio"] = f["vol_5"] / (f["vol_60"] + 1e-12)
    for n in (10, 50):
        f[f"dist_sma{n}"] = c / c.rolling(n).mean() - 1
    f["rsi14"] = _rsi(c)
    ema12, ema26 = c.ewm(span=12).mean(), c.ewm(span=26).mean()
    f["macd"] = (ema12 - ema26) / c
    f["range_pct"] = (df["high"] - df["low"]) / c
    f["drawdown_60"] = c / c.rolling(60).max() - 1
    f["dow"] = df.index.dayofweek
    cls = asset_class(symbol)
    for k in CLASSES:
        f[f"is_{k}"] = float(cls == k)
    if with_target:
        fwd = np.log(c).shift(-HORIZON) - np.log(c)
        f["fwd_ret"] = fwd
        f["y"] = (fwd > 0).astype(float).where(fwd.notna())
    f["symbol"] = symbol
    return f.replace([np.inf, -np.inf], np.nan).dropna(
        subset=[x for x in f.columns if x not in ("fwd_ret", "y", "symbol")])


FEATURES = None


def feature_names(sample: pd.DataFrame) -> list[str]:
    return [c for c in sample.columns if c not in ("fwd_ret", "y", "symbol")]
