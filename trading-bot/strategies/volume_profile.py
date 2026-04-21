"""
Session Volume Profile (SVP) — LVN / HVN / POC detection.

The profile is built by distributing each 1-min candle's volume uniformly
across its high-low range, then binning into NUM_BINS price levels.
LVNs are price levels whose volume is below (mean × lvn_threshold).
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import List
import logging

logger = logging.getLogger(__name__)


@dataclass
class VolumeProfile:
    poc: float          # Point of Control (highest volume price)
    vah: float          # Value Area High (top of 70% volume band)
    val: float          # Value Area Low (bottom of 70% volume band)
    lvns: List[float]   # Low Volume Nodes (ledges)
    hvns: List[float]   # High Volume Nodes
    price_low: float
    price_high: float
    bin_size: float


def compute_volume_profile(
    df: pd.DataFrame,
    num_bins: int = 200,
    lvn_threshold: float = 0.35,
    value_area_pct: float = 0.70,
) -> VolumeProfile:
    price_low = float(df["low"].min())
    price_high = float(df["high"].max())
    price_range = price_high - price_low or price_high * 0.001

    bin_size = price_range / num_bins
    bin_edges = np.linspace(price_low, price_high, num_bins + 1)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    vol_at_price = np.zeros(num_bins)

    for _, row in df.iterrows():
        candle_range = row["high"] - row["low"]
        if candle_range == 0:
            idx = min(int((row["close"] - price_low) / bin_size), num_bins - 1)
            vol_at_price[max(0, idx)] += row["volume"]
        else:
            lo_idx = max(0, int((row["low"] - price_low) / bin_size))
            hi_idx = min(num_bins - 1, int((row["high"] - price_low) / bin_size))
            ticks = hi_idx - lo_idx + 1
            vol_at_price[lo_idx : hi_idx + 1] += row["volume"] / ticks

    # POC
    poc_idx = int(np.argmax(vol_at_price))
    poc = float(bin_centers[poc_idx])

    # Value Area (expand outward from POC until 70% volume is enclosed)
    total_vol = vol_at_price.sum()
    target_vol = total_vol * value_area_pct
    va_lo = va_hi = poc_idx
    va_vol = vol_at_price[poc_idx]

    while va_vol < target_vol:
        can_up = va_hi < num_bins - 1
        can_dn = va_lo > 0
        if not can_up and not can_dn:
            break
        if can_up and can_dn:
            if vol_at_price[va_hi + 1] >= vol_at_price[va_lo - 1]:
                va_hi += 1
                va_vol += vol_at_price[va_hi]
            else:
                va_lo -= 1
                va_vol += vol_at_price[va_lo]
        elif can_up:
            va_hi += 1
            va_vol += vol_at_price[va_hi]
        else:
            va_lo -= 1
            va_vol += vol_at_price[va_lo]

    vah = float(bin_centers[va_hi])
    val = float(bin_centers[va_lo])

    # LVN / HVN classification
    mean_vol = float(np.mean(vol_at_price))
    raw_lvns, raw_hvns = [], []

    for i, (price, vol) in enumerate(zip(bin_centers, vol_at_price)):
        if i == poc_idx:
            continue
        if vol < mean_vol * lvn_threshold:
            raw_lvns.append(float(price))
        elif vol > mean_vol * 1.5:
            raw_hvns.append(float(price))

    # Merge closely-spaced LVNs into single representative levels
    lvns = _merge_levels(raw_lvns, min_gap=bin_size * 3)
    hvns = _merge_levels(raw_hvns, min_gap=bin_size * 2)

    # Drop LVNs that sit directly on the POC
    lvns = [lvn for lvn in lvns if abs(lvn - poc) > bin_size * 4]

    logger.debug(
        "VP: POC=%.2f VAH=%.2f VAL=%.2f LVNs=%d HVNs=%d",
        poc, vah, val, len(lvns), len(hvns),
    )

    return VolumeProfile(
        poc=poc, vah=vah, val=val,
        lvns=lvns, hvns=hvns,
        price_low=price_low, price_high=price_high,
        bin_size=bin_size,
    )


def filter_clean_lvns(lvns: List[float], df: pd.DataFrame, max_consolidation_candles: int = 3) -> List[float]:
    """
    Remove LVNs that price has spent more than N candles consolidating through.
    A 'dirty' LVN is one where price lingered rather than quickly passing through.
    """
    price_range = df["high"].max() - df["low"].min()
    tolerance = price_range * 0.002

    clean = []
    for lvn in lvns:
        candles_through = df[
            (df["low"] <= lvn + tolerance) & (df["high"] >= lvn - tolerance)
        ]
        if len(candles_through) <= max_consolidation_candles:
            clean.append(lvn)
    return clean


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
