"""Fetches OHLCV market data from exchanges via ccxt."""

import ccxt
import pandas as pd
from datetime import datetime, timedelta
import pytz
import logging

logger = logging.getLogger(__name__)

NY_TZ = pytz.timezone("America/New_York")


class MarketDataFetcher:
    def __init__(self, exchange_id: str = "binance", symbol: str = "BTC/USDT"):
        self.symbol = symbol
        exchange_class = getattr(ccxt, exchange_id)
        self.exchange = exchange_class({"enableRateLimit": True})

    def get_session_candles(self, session_start: datetime, session_end: datetime = None) -> pd.DataFrame:
        """
        Fetch 1-min candles from session_start up to session_end (or now).
        For the 9 AM – 4 PM NY window, pass session_end = today 4 PM NY.
        """
        since_ts = int(session_start.timestamp() * 1000)
        end_ts = (
            int(session_end.timestamp() * 1000)
            if session_end
            else int(datetime.now(pytz.utc).timestamp() * 1000)
        )
        all_candles = []

        while True:
            candles = self.exchange.fetch_ohlcv(
                self.symbol, "1m", since=since_ts, limit=1000
            )
            if not candles:
                break
            # Drop candles beyond session end
            candles = [c for c in candles if c[0] <= end_ts]
            all_candles.extend(candles)
            last_ts = candles[-1][0] if candles else since_ts
            if last_ts >= end_ts - 60_000 or len(candles) < 1000:
                break
            since_ts = last_ts + 60_000

        if not all_candles:
            return pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])

        df = pd.DataFrame(all_candles, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True).dt.tz_convert(NY_TZ)
        df = df.drop_duplicates("timestamp").sort_values("timestamp").reset_index(drop=True)
        return df

    def get_latest_candles(self, n: int = 100) -> pd.DataFrame:
        """Fetch the most recent N 1-min candles."""
        candles = self.exchange.fetch_ohlcv(self.symbol, "1m", limit=n)
        df = pd.DataFrame(candles, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True).dt.tz_convert(NY_TZ)
        return df.sort_values("timestamp").reset_index(drop=True)

    def get_current_price(self) -> float:
        ticker = self.exchange.fetch_ticker(self.symbol)
        return float(ticker["last"])
