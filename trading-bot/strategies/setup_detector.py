"""
3-Step Model setup detector.

Combines:
  1. Single Print  — used as target (and overnight hold adds bias confidence)
  2. ISMT signal   — liquidity sweep + rejection confirms the move
  3. LVN / Ledge   — entry price is the respected volume node

Quality tiers
  HIGH   — all three present AND bias aligned
  MEDIUM — two of three present OR bias misaligned with otherwise full setup
  LOW    — LVN approach only (no ISMT, no SP target); still worth watching

Entry  : at the LVN
Stop   : stop_loss_pct below/above the LVN
Target : nearest single print in the direction of the trade
Hold   : estimated from session context (aggressive window vs regular)
"""

import pandas as pd
from dataclasses import dataclass, field
from typing import List, Optional
import pytz
import logging

from strategies.volume_profile import VolumeProfile, filter_clean_lvns
from strategies.tpo import TPOAnalysis
from strategies.smt import ISMTSignal

logger = logging.getLogger(__name__)

NY_TZ = pytz.timezone("America/New_York")


@dataclass
class TradeSetup:
    direction: str          # "LONG" or "SHORT"
    quality: str            # "HIGH", "MEDIUM", "LOW"

    entry_price: float
    stop_loss: float
    target_1: float
    target_2: Optional[float]

    lvn_price: float
    single_print_price: Optional[float]
    ismt: Optional[ISMTSignal]

    bias: str               # "BULLISH", "BEARISH", "NEUTRAL"
    overnight_sp_held: bool
    is_aggressive_window: bool

    risk_pts: float
    reward_pts: float
    rr_ratio: float

    suggested_hold_min: int
    notes: List[str] = field(default_factory=list)


# ── helpers ──────────────────────────────────────────────────────────────────

def _nearest_lvn(price: float, lvns: List[float], max_pct: float = 0.008) -> Optional[float]:
    if not lvns:
        return None
    closest = min(lvns, key=lambda lvn: abs(lvn - price))
    if abs(closest - price) / price <= max_pct:
        return closest
    return None


def _nearest_sp_target(price: float, direction: str, sps: List[float]) -> Optional[float]:
    if not sps:
        return None
    if direction == "LONG":
        candidates = [sp for sp in sps if sp > price]
        return min(candidates) if candidates else None
    else:
        candidates = [sp for sp in sps if sp < price]
        return max(candidates) if candidates else None


def _build_setup(
    direction: str,
    lvn: float,
    sp_target: Optional[float],
    ismt: Optional[ISMTSignal],
    tpo: TPOAnalysis,
    vp: VolumeProfile,
    overnight_sp_held: bool,
    is_aggressive: bool,
    stop_loss_pct: float,
    target_multiplier: float,
) -> TradeSetup:
    if direction == "LONG":
        entry = lvn
        stop = entry * (1 - stop_loss_pct)
        default_target = entry * (1 + stop_loss_pct * target_multiplier)
        target_1 = sp_target if sp_target else default_target
        target_2 = vp.vah if vp.vah > target_1 else None
    else:
        entry = lvn
        stop = entry * (1 + stop_loss_pct)
        default_target = entry * (1 - stop_loss_pct * target_multiplier)
        target_1 = sp_target if sp_target else default_target
        target_2 = vp.val if vp.val < target_1 else None

    risk = abs(entry - stop)
    reward = abs(target_1 - entry)
    rr = reward / risk if risk else 0

    bias_aligned = (
        (direction == "LONG" and tpo.bias in ("BULLISH", "NEUTRAL")) or
        (direction == "SHORT" and tpo.bias in ("BEARISH", "NEUTRAL"))
    )

    has_sp = sp_target is not None
    has_ismt = ismt is not None

    if has_sp and has_ismt and bias_aligned:
        quality = "HIGH"
    elif (has_sp and has_ismt) or (has_ismt and bias_aligned) or (has_sp and bias_aligned):
        quality = "MEDIUM"
    else:
        quality = "LOW"

    notes: List[str] = []
    if is_aggressive:
        notes.append("Aggressive window (9:30 AM NY) — expect fast reaction")
    if overnight_sp_held:
        notes.append("Overnight single print held — directional bias confirmed")
    if not bias_aligned:
        notes.append("WARNING: trade direction counter to TPO bias")
    if rr < 1.5:
        notes.append("WARNING: R:R below 1.5 — consider skipping")

    hold_min = (5 if is_aggressive else 20) if quality == "HIGH" else (3 if is_aggressive else 10)

    return TradeSetup(
        direction=direction,
        quality=quality,
        entry_price=round(entry, 4),
        stop_loss=round(stop, 4),
        target_1=round(target_1, 4),
        target_2=round(target_2, 4) if target_2 else None,
        lvn_price=round(lvn, 4),
        single_print_price=round(sp_target, 4) if sp_target else None,
        ismt=ismt,
        bias=tpo.bias,
        overnight_sp_held=overnight_sp_held,
        is_aggressive_window=is_aggressive,
        risk_pts=round(risk, 4),
        reward_pts=round(reward, 4),
        rr_ratio=round(rr, 2),
        suggested_hold_min=hold_min,
        notes=notes,
    )


# ── main detector ─────────────────────────────────────────────────────────────

def detect_setups(
    df: pd.DataFrame,
    vp: VolumeProfile,
    tpo: TPOAnalysis,
    overnight_sps: List[float],
    ismt_signals: List[ISMTSignal],
    overnight_sp_held: bool = False,
    stop_loss_pct: float = 0.003,
    target_multiplier: float = 2.0,
    min_rr: float = 1.5,
) -> List[TradeSetup]:
    """
    Return valid trade setups sorted HIGH → MEDIUM → LOW.
    Only setups with rr_ratio >= min_rr are returned.
    """
    if df.empty or not vp.lvns:
        return []

    now = df.iloc[-1]["timestamp"]
    current_price = float(df.iloc[-1]["close"])

    is_aggressive = now.hour == 9 and 28 <= now.minute <= 37

    clean_lvns = filter_clean_lvns(vp.lvns, df)
    all_sps = sorted(set(tpo.single_prints + overnight_sps))

    setups: List[TradeSetup] = []
    seen_entries: set = set()

    # Path 1: ISMT-driven setups — the highest quality
    recent_ismt = [s for s in ismt_signals if s.candle_idx >= len(df) - 5]
    for ismt in recent_ismt:
        rejection = ismt.sweep_price
        lvn = _nearest_lvn(rejection, clean_lvns, max_pct=0.008)
        if lvn is None:
            continue

        sp = _nearest_sp_target(current_price, ismt.direction, all_sps)
        setup = _build_setup(
            direction=ismt.direction,
            lvn=lvn, sp_target=sp, ismt=ismt,
            tpo=tpo, vp=vp,
            overnight_sp_held=overnight_sp_held,
            is_aggressive=is_aggressive,
            stop_loss_pct=stop_loss_pct,
            target_multiplier=target_multiplier,
        )
        if setup.rr_ratio >= min_rr:
            key = (setup.direction, round(setup.entry_price, 2))
            if key not in seen_entries:
                seen_entries.add(key)
                setups.append(setup)

    # Path 2: Price-approaching-LVN setups (aggressive ledge trade)
    for lvn in clean_lvns:
        dist_pct = abs(current_price - lvn) / current_price
        if dist_pct > 0.003:
            continue

        direction = "LONG" if current_price > lvn else "SHORT"

        # Skip if counter-trend AND not aggressive window
        if direction == "LONG" and tpo.bias == "BEARISH" and not is_aggressive:
            continue
        if direction == "SHORT" and tpo.bias == "BULLISH" and not is_aggressive:
            continue

        key = (direction, round(lvn, 2))
        if key in seen_entries:
            continue

        sp = _nearest_sp_target(current_price, direction, all_sps)
        setup = _build_setup(
            direction=direction,
            lvn=lvn, sp_target=sp, ismt=None,
            tpo=tpo, vp=vp,
            overnight_sp_held=overnight_sp_held,
            is_aggressive=is_aggressive,
            stop_loss_pct=stop_loss_pct,
            target_multiplier=target_multiplier,
        )
        if setup.rr_ratio >= min_rr:
            seen_entries.add(key)
            setups.append(setup)

    quality_rank = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    setups.sort(key=lambda s: (quality_rank[s.quality], -s.rr_ratio))
    return setups
