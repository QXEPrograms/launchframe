"""
ISMT / SMT detection.

ISMT (Inter-candle SMT) — two consecutive 1-min candles where:
  LONG:  Candle 2 prints a lower low than Candle 1, but then closes ABOVE
         Candle 1's low  →  liquidity sweep below, then rejection (buy signal).
  SHORT: Candle 2 prints a higher high than Candle 1, but then closes BELOW
         Candle 1's high →  liquidity sweep above, then rejection (sell signal).

The key idea: price briefly violated a prior extreme to grab liquidity, then
reversed — this is the "SMT" between the two candle extremes.
"""

import pandas as pd
from dataclasses import dataclass
from typing import List
import logging

logger = logging.getLogger(__name__)


@dataclass
class ISMTSignal:
    timestamp: pd.Timestamp
    direction: str      # "LONG" or "SHORT"
    sweep_price: float  # The liquidity level that was briefly violated
    close_price: float  # Where price closed after the sweep
    candle_idx: int     # Row index in df (relative to the window passed in)


def detect_ismt(df: pd.DataFrame, lookback: int = 15) -> List[ISMTSignal]:
    """
    Scan the most recent `lookback` candles for ISMT patterns.
    Returns signals ordered oldest → newest.
    """
    signals: List[ISMTSignal] = []
    window = df.tail(lookback).reset_index(drop=True)

    for i in range(1, len(window)):
        c1 = window.iloc[i - 1]
        c2 = window.iloc[i]

        # ISMT LONG: C2 dips below C1's low but closes back above it
        if c2["low"] < c1["low"] and c2["close"] > c1["low"]:
            signals.append(ISMTSignal(
                timestamp=c2["timestamp"],
                direction="LONG",
                sweep_price=float(c2["low"]),   # the swept low
                close_price=float(c2["close"]),
                candle_idx=i,
            ))

        # ISMT SHORT: C2 pokes above C1's high but closes back below it
        elif c2["high"] > c1["high"] and c2["close"] < c1["high"]:
            signals.append(ISMTSignal(
                timestamp=c2["timestamp"],
                direction="SHORT",
                sweep_price=float(c2["high"]),  # the swept high
                close_price=float(c2["close"]),
                candle_idx=i,
            ))

    return signals


def most_recent_ismt(df: pd.DataFrame, lookback: int = 5) -> ISMTSignal | None:
    """Return the single most recent ISMT signal within `lookback` candles, or None."""
    signals = detect_ismt(df, lookback=lookback)
    return signals[-1] if signals else None
