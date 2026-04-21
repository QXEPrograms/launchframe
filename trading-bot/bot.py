#!/usr/bin/env python3
"""
LVN / SVP Trading Signal Bot
==============================
Strategy  : Session Volume Profile + Single Prints + ISMT (3-Step Model)
Timeframe : 1-minute candles, 6 PM – 6 PM NY session
Signals   : Discord webhook

Usage:
  1. Copy .env.example to .env and fill in your values
  2. pip install -r requirements.txt
  3. python bot.py
"""

import os
import sys
import time
import logging
from datetime import datetime, timedelta
from typing import Set
import pytz
from dotenv import load_dotenv

load_dotenv()

# ── logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("bot.log"),
    ],
)
logger = logging.getLogger("bot")

# ── config from env ───────────────────────────────────────────────────────────
DISCORD_WEBHOOK   = os.getenv("DISCORD_WEBHOOK_URL", "")
EXCHANGE          = os.getenv("EXCHANGE", "binance")
SYMBOL            = os.getenv("TRADING_SYMBOL", "BTC/USDT")
LVN_THRESHOLD     = float(os.getenv("LVN_THRESHOLD", "0.35"))
STOP_LOSS_PCT     = float(os.getenv("STOP_LOSS_PCT", "0.003"))
MIN_RR            = float(os.getenv("MIN_RR_RATIO", "1.5"))
SCAN_INTERVAL     = int(os.getenv("SCAN_INTERVAL", "60"))
HOURLY_STATUS     = os.getenv("HOURLY_STATUS", "true").lower() == "true"

NY_TZ = pytz.timezone("America/New_York")

# ── lazy imports (after env is loaded) ────────────────────────────────────────
from data.fetcher import MarketDataFetcher
from strategies.volume_profile import compute_volume_profile
from strategies.tpo import compute_tpo, get_overnight_single_prints, overnight_single_print_held
from strategies.smt import detect_ismt
from strategies.setup_detector import detect_setups, TradeSetup
from signals.discord_webhook import send_trade_signal, send_status_update


# ── helpers ───────────────────────────────────────────────────────────────────

def current_session_start() -> datetime:
    """Return the start of the current 6 PM – 6 PM NY session."""
    now = datetime.now(NY_TZ)
    start = now.replace(hour=18, minute=0, second=0, microsecond=0)
    if now.hour < 18:
        start -= timedelta(days=1)
    return start


def print_signal(setup: TradeSetup, symbol: str, price: float) -> None:
    bar = "=" * 60
    print(f"\n{bar}")
    print(f"{'🟢 LONG' if setup.direction == 'LONG' else '🔴 SHORT'} SIGNAL — {symbol}")
    print(f"Quality   : {setup.quality}  |  Bias: {setup.bias}")
    print(f"Price now : {price:.4f}")
    print(f"Entry     : {setup.entry_price:.4f}  (LVN ledge)")
    print(f"Stop Loss : {setup.stop_loss:.4f}")
    print(f"Target 1  : {setup.target_1:.4f}")
    if setup.target_2:
        print(f"Target 2  : {setup.target_2:.4f}")
    print(f"Risk      : {setup.risk_pts:.4f} pts  |  R:R: {setup.rr_ratio:.1f}R")
    print(f"Hold ~    : {setup.suggested_hold_min} min")
    if setup.notes:
        for note in setup.notes:
            print(f"  NOTE: {note}")
    print(bar + "\n")


# ── scan cycle ────────────────────────────────────────────────────────────────

def run_scan(fetcher: MarketDataFetcher, sent_keys: Set[str]) -> None:
    try:
        session_start = current_session_start()
        logger.info(
            "Scanning %s | session from %s NY",
            SYMBOL,
            session_start.strftime("%Y-%m-%d %H:%M"),
        )

        df = fetcher.get_session_candles(session_start)
        if len(df) < 30:
            logger.warning("Not enough candles yet (%d), skipping", len(df))
            return

        current_price = float(df.iloc[-1]["close"])
        logger.info("Price: %.4f | Candles: %d", current_price, len(df))

        # Volume profile
        vp = compute_volume_profile(df, num_bins=200, lvn_threshold=LVN_THRESHOLD)
        logger.info(
            "VP: POC=%.4f VAH=%.4f VAL=%.4f LVNs=%d",
            vp.poc, vp.vah, vp.val, len(vp.lvns),
        )

        # TPO + bias
        tpo = compute_tpo(df, period_minutes=30)
        logger.info(
            "TPO: bias=%s SPs=%d POC=%.4f",
            tpo.bias, len(tpo.single_prints), tpo.poc,
        )

        # Overnight context
        overnight_sps = get_overnight_single_prints(df)
        on_sp_held = any(overnight_single_print_held(sp, df) for sp in overnight_sps)
        if overnight_sps:
            logger.info(
                "Overnight SPs: %d found | held=%s",
                len(overnight_sps), on_sp_held,
            )

        # ISMT
        ismt_signals = detect_ismt(df, lookback=15)
        recent = [s for s in ismt_signals if s.candle_idx >= len(df) - 5]
        if recent:
            logger.info("ISMT: %s", [f"{s.direction}@{s.sweep_price:.4f}" for s in recent])

        # Setup detection
        setups = detect_setups(
            df=df,
            vp=vp,
            tpo=tpo,
            overnight_sps=overnight_sps,
            ismt_signals=ismt_signals,
            overnight_sp_held=on_sp_held,
            stop_loss_pct=STOP_LOSS_PCT,
            min_rr=MIN_RR,
        )

        if not setups:
            logger.info("No setups found this scan.")
            return

        for setup in setups:
            # De-duplicate: same direction + entry at same level = same signal
            key = f"{setup.direction}_{setup.entry_price:.4f}"
            if key in sent_keys:
                continue

            if DISCORD_WEBHOOK:
                ok = send_trade_signal(DISCORD_WEBHOOK, setup, SYMBOL, current_price)
                if ok:
                    sent_keys.add(key)
            else:
                print_signal(setup, SYMBOL, current_price)
                sent_keys.add(key)

    except Exception:
        logger.exception("Scan cycle error")


# ── main loop ─────────────────────────────────────────────────────────────────

def main() -> None:
    logger.info("=" * 60)
    logger.info("LVN / SVP Trading Signal Bot")
    logger.info("Symbol   : %s  |  Exchange: %s", SYMBOL, EXCHANGE)
    logger.info("Stop%%    : %.3f%%  |  Min R:R: %.1f", STOP_LOSS_PCT * 100, MIN_RR)
    logger.info("Interval : %ds", SCAN_INTERVAL)
    if not DISCORD_WEBHOOK:
        logger.warning("DISCORD_WEBHOOK_URL not set — signals print to console only")
    logger.info("=" * 60)

    fetcher = MarketDataFetcher(exchange_id=EXCHANGE, symbol=SYMBOL)
    sent_keys: Set[str] = set()
    last_status = datetime.now(NY_TZ)
    last_key_flush = datetime.now(NY_TZ)

    while True:
        try:
            run_scan(fetcher, sent_keys)

            now = datetime.now(NY_TZ)

            # Hourly status embed
            if HOURLY_STATUS and DISCORD_WEBHOOK and (now - last_status).total_seconds() >= 3600:
                try:
                    df = fetcher.get_latest_candles(200)
                    vp = compute_volume_profile(df)
                    tpo = compute_tpo(df)
                    send_status_update(
                        DISCORD_WEBHOOK, SYMBOL,
                        float(df.iloc[-1]["close"]),
                        tpo.bias, vp.lvns, vp.poc, vp.vah, vp.val,
                    )
                    last_status = now
                except Exception:
                    logger.exception("Hourly status error")

            # Flush seen-signal cache every hour so levels can re-fire
            if (now - last_key_flush).total_seconds() >= 3600:
                sent_keys.clear()
                last_key_flush = now
                logger.info("Signal cache cleared")

            time.sleep(SCAN_INTERVAL)

        except KeyboardInterrupt:
            logger.info("Stopped by user.")
            break
        except Exception:
            logger.exception("Main loop error — retrying in 30s")
            time.sleep(30)


if __name__ == "__main__":
    main()
