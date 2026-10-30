"""Data loading for stocks, crypto and forex through one interface (yfinance)."""
import numpy as np
import pandas as pd

# One universe, three asset classes. Add/remove tickers freely.
UNIVERSE = {
    "crypto": ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "BNB-USD"],
    "forex":  ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDINR=X", "AUDUSD=X"],
    "stocks": ["^NSEI", "^GSPC", "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "AAPL", "MSFT"],
}


def asset_class(symbol: str) -> str:
    for cls, syms in UNIVERSE.items():
        if symbol in syms:
            return cls
    if symbol.endswith("=X"):
        return "forex"
    if symbol.endswith("-USD"):
        return "crypto"
    return "stocks"


def download(symbol: str, years: int = 8) -> pd.DataFrame:
    """Daily OHLCV for one symbol. Requires internet + `pip install yfinance`."""
    import yfinance as yf
    df = yf.download(symbol, period=f"{years}y", interval="1d",
                     auto_adjust=True, progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df.rename(columns=str.lower)[["open", "high", "low", "close", "volume"]].dropna()
    return df


def load_universe(years: int = 8) -> dict[str, pd.DataFrame]:
    out = {}
    for syms in UNIVERSE.values():
        for s in syms:
            try:
                d = download(s, years)
                if len(d) > 500:
                    out[s] = d
                    print(f"  {s}: {len(d)} rows")
            except Exception as e:  # noqa: BLE001
                print(f"  {s}: skipped ({e})")
    return out


def synthetic_universe(n_days: int = 2000, signal: float = 0.0, seed: int = 0, garch: bool = False):
    """Fake prices for testing the pipeline offline.
    signal=0 is a pure random walk (nothing to learn -> a good sanity check:
    a correct pipeline MUST score ~50%). signal>0 adds weak momentum."""
    rng = np.random.default_rng(seed)
    idx = pd.bdate_range("2016-01-01", periods=n_days)
    out = {}
    for i, (cls, syms) in enumerate(UNIVERSE.items()):
        vol = {"crypto": 0.035, "forex": 0.005, "stocks": 0.012}[cls]
        for s in syms[:3]:
            if garch:  # volatility clustering, like real markets
                r = np.zeros(n_days); h = vol ** 2
                for t in range(n_days):
                    r[t] = np.sqrt(h) * rng.standard_t(6) * np.sqrt(4 / 6)
                    h = 0.05 * vol ** 2 + 0.08 * r[t] ** 2 + 0.87 * h
            else:
                r = rng.normal(0, vol, n_days)
            for t in range(1, n_days):
                r[t] += signal * r[t - 1]
            close = 100 * np.exp(np.cumsum(r))
            hi = close * (1 + np.abs(rng.normal(0, vol / 2, n_days)))
            lo = close * (1 - np.abs(rng.normal(0, vol / 2, n_days)))
            out[s] = pd.DataFrame({"open": close, "high": hi, "low": lo,
                                   "close": close,
                                   "volume": rng.integers(1e5, 1e6, n_days)}, index=idx)
    return out
