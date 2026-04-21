"""
Discord webhook sender.

Trade signal embed format:
  Title  : direction + symbol
  Fields : entry / stop / targets / R:R / hold time
  Footer : strategy name + timestamp
"""

import json
import requests
from datetime import datetime
from typing import Optional
import pytz
import logging

from strategies.setup_detector import TradeSetup

logger = logging.getLogger(__name__)

NY_TZ = pytz.timezone("America/New_York")

_QUALITY_STARS = {"HIGH": "⭐⭐⭐ HIGH", "MEDIUM": "⭐⭐ MEDIUM", "LOW": "⭐ LOW"}
_BIAS_EMOJI    = {"BULLISH": "📈", "BEARISH": "📉", "NEUTRAL": "➡️"}
_DIR_COLOR     = {"LONG": 0x00CC66, "SHORT": 0xFF4444}


def send_trade_signal(
    webhook_url: str,
    setup: TradeSetup,
    symbol: str,
    current_price: float,
) -> bool:
    now = datetime.now(NY_TZ)
    dir_emoji = "🟢" if setup.direction == "LONG" else "🔴"
    bias_emoji = _BIAS_EMOJI[setup.bias]

    # Build conditions list
    conditions = []
    if setup.lvn_price:
        conditions.append(f"✅ LVN / Ledge: `{setup.lvn_price:.4f}`")
    if setup.single_print_price:
        conditions.append(f"✅ Single Print target: `{setup.single_print_price:.4f}`")
    if setup.ismt:
        conditions.append(
            f"✅ ISMT at `{setup.ismt.timestamp.strftime('%H:%M')}` "
            f"— sweep `{setup.ismt.sweep_price:.4f}`, closed `{setup.ismt.close_price:.4f}`"
        )
    if setup.overnight_sp_held:
        conditions.append("✅ Overnight single print held — bias confirmed")

    conditions_text = "\n".join(conditions) if conditions else "LVN approach detected"

    target2_line = (
        f"\n🎯 **Target 2:** `{setup.target_2:.4f}`  *(POC/VA edge)*"
        if setup.target_2 else ""
    )

    notes_text = ""
    if setup.notes:
        notes_text = "\n\n📝 **Notes:**\n" + "\n".join(f"• {n}" for n in setup.notes)

    aggressive_banner = (
        "\n> 🔥 **AGGRESSIVE WINDOW** — 9:30 AM NY open. Expect fast, clean reaction.\n"
        if setup.is_aggressive_window else ""
    )

    description = f"""{aggressive_banner}
**Symbol:** `{symbol}`   **Price:** `{current_price:.4f}`

{dir_emoji} **Direction:** {setup.direction}
**Setup quality:** {_QUALITY_STARS[setup.quality]}

───────────────────────
💰 **Entry:** `{setup.entry_price:.4f}`  *(at LVN ledge)*
🛑 **Stop Loss:** `{setup.stop_loss:.4f}`
🎯 **Target 1:** `{setup.target_1:.4f}`{target2_line}

📊 **Risk:** `{setup.risk_pts:.4f} pts`   **R:R:** `{setup.rr_ratio:.1f}R`
⏱️ **Suggested hold:** `{setup.suggested_hold_min} min`

───────────────────────
{bias_emoji} **Bias:** {setup.bias}
*(30-min TPO: {'upper' if setup.bias == 'BULLISH' else 'lower' if setup.bias == 'BEARISH' else 'balanced'} half dominant)*

**Conditions met:**
{conditions_text}{notes_text}

───────────────────────
⏰ `{now.strftime('%Y-%m-%d %H:%M:%S')} NY`"""

    payload = {
        "username": "LVN Signal Bot",
        "embeds": [
            {
                "title": f"{dir_emoji} {setup.direction} — {symbol}",
                "description": description,
                "color": _DIR_COLOR[setup.direction],
                "footer": {
                    "text": "Strategy: SVP / LVN Ledges + Single Prints + ISMT",
                },
            }
        ],
    }

    return _post(webhook_url, payload, label=f"{setup.direction}@{setup.entry_price:.4f}")


def send_status_update(
    webhook_url: str,
    symbol: str,
    current_price: float,
    bias: str,
    lvns: list,
    poc: float,
    vah: float,
    val: float,
) -> bool:
    now = datetime.now(NY_TZ)
    bias_emoji = _BIAS_EMOJI[bias]
    lvns_text = "  ".join(f"`{lvn:.4f}`" for lvn in sorted(lvns)[:6]) or "*none identified*"

    description = f"""**Symbol:** `{symbol}`   **Price:** `{current_price:.4f}`

{bias_emoji} **Bias:** {bias}
**POC:** `{poc:.4f}`   **VAH:** `{vah:.4f}`   **VAL:** `{val:.4f}`

**Key LVN ledges:**
{lvns_text}

⏰ `{now.strftime('%H:%M:%S')} NY`"""

    payload = {
        "username": "LVN Signal Bot",
        "embeds": [
            {
                "title": f"📊 Hourly Update — {symbol}",
                "description": description,
                "color": 0x5865F2,
            }
        ],
    }

    return _post(webhook_url, payload, label="status")


def _post(webhook_url: str, payload: dict, label: str = "") -> bool:
    try:
        r = requests.post(
            webhook_url,
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        r.raise_for_status()
        logger.info("Discord OK [%s]", label)
        return True
    except Exception as exc:
        logger.error("Discord FAIL [%s]: %s", label, exc)
        return False
