"""
TPO (Time Price Opportunity) chart analysis.

Each 30-minute window is one "period". Every price level visited during
that period gets one mark. Single prints = levels visited in only ONE period.
Bias = compare total marks in upper half vs lower half of the range.
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import List
import pytz
import logging

logger = logging.getLogger(__name__)

NY_TZ = pytz.timezone("America/New_York")


@dataclass
class TPOAnalysis:
    single_prints: List[float]      # Price levels visited in exactly 1 period
    bias: str                       # "BULLISH", "BEARISH", or "NEUTRAL"
    upper_marks: float              # Total marks in upper half
    lower_marks: float              # Total marks in lower half
    poc: float                      # Highest-mark price
    price_low: float
    price_high: float
    tick_size: float


def compute_tpo(
    df: pd.DataFrame,
    period_minutes: int = 30,
    tick_size: float = None,
) -> TPOAnalysis:
    if df.empty:
        return TPOAnalysis([], "NEUTRAL", 0, 0, 0, 0, 0, 0)

    price_low = float(df["low"].min())
    price_high = float(df["high"].max())
    price_range = price_high - price_low or price_high * 0.001

    if tick_size is None:
        tick_size = price_range / 200

    bins = np.arange(price_low, price_high + tick_size, tick_size)
    centers = (bins[:-1] + bins[1:]) / 2
    counts = np.zeros(len(centers), dtype=int)

    # Group 1-min candles into 30-min periods
    t0 = df["timestamp"].iloc[0]
    df = df.copy()
    df["period"] = ((df["timestamp"] - t0).dt.total_seconds() // (period_minutes * 60)).astype(int)

    for _, period_df in df.groupby("period"):
        lo = period_df["low"].min()
        hi = period_df["high"].max()
        mask = (centers >= lo) & (centers <= hi)
        counts[mask] += 1

    # POC
    poc = float(centers[np.argmax(counts)])

    # Single prints (exactly 1 mark)
    raw_sps = [float(p) for p, c in zip(centers, counts) if c == 1]
    single_prints = _merge_levels(raw_sps, tick_size * 2)

    # Bias: compare marks above and below midpoint
    mid = (price_high + price_low) / 2
    upper_marks = float(counts[centers >= mid].sum())
    lower_marks = float(counts[centers < mid].sum())
    total = upper_marks + lower_marks

    if total > 0:
        upper_pct = upper_marks / total
        lower_pct = lower_marks / total
    else:
        upper_pct = lower_pct = 0.5

    if upper_pct > 0.55:
        bias = "BULLISH"
    elif lower_pct > 0.55:
        bias = "BEARISH"
    else:
        bias = "NEUTRAL"

    logger.debug(
        "TPO: bias=%s upper=%.0f lower=%.0f SPs=%d POC=%.2f",
        bias, upper_marks, lower_marks, len(single_prints), poc,
    )

    return TPOAnalysis(
        single_prints=single_prints,
        bias=bias,
        upper_marks=upper_marks,
        lower_marks=lower_marks,
        poc=poc,
        price_low=price_low,
        price_high=price_high,
        tick_size=tick_size,
    )


def get_overnight_single_prints(df: pd.DataFrame) -> List[float]:
    """
    Single prints from the overnight session (4 PM prior day – 9:30 AM today).
    These carry extra weight: if they hold overnight, they add directional bias.
    """
    overnight = df[
        (df["timestamp"].dt.hour >= 16) |
        (df["timestamp"].dt.hour < 9) |
        ((df["timestamp"].dt.hour == 9) & (df["timestamp"].dt.minute < 30))
    ].copy()

    if len(overnight) < 2:
        return []

    return compute_tpo(overnight).single_prints


def overnight_single_print_held(sp_price: float, df: pd.DataFrame, tolerance_pct: float = 0.001) -> bool:
    """
    Return True if price stayed consistently on one side of sp_price during
    the overnight session (meaning the level was respected, not crossed).
    """
    tol = sp_price * tolerance_pct
    overnight = df[
        (df["timestamp"].dt.hour >= 16) | (df["timestamp"].dt.hour < 9)
    ]
    if overnight.empty:
        return False

    above = overnight[overnight["close"] > sp_price + tol]
    below = overnight[overnight["close"] < sp_price - tol]
    return len(above) == 0 or len(below) == 0


def _merge_levels(levels: List[float], min_gap: float) -> List[float]:
    if not levels:
        return []
    levels = sorted(levels)
    merged = [levels[0]]
    for lvl in levels[1:]:
        if lvl - merged[-1] > min_gap:
            merged.append(lvl)
        else:
            merged[-1] = (merged[-1] + lvl) / 2
    return merged
