import logging
import sys

from app.poller import poll_once

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("poller_once")


def main() -> None:
    logger.info("Starting one-time Gmail polling cycle...")
    try:
        count = poll_once()
        logger.info("One-time poll cycle complete. Processed %s new message(s).", count)
    except Exception:
        logger.exception("One-time poll cycle failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
