from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Protocol
from urllib.error import URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)


class Notifier(Protocol):
    def send(self, title: str, message: str, severity: str) -> bool:
        ...


class LoggingNotifier:
    def send(self, title: str, message: str, severity: str) -> bool:
        logger.warning("[%s] %s | %s", severity.upper(), title, message)
        return True


class TelegramNotifier:
    def __init__(self, token: str, chat_id: str, timeout_seconds: int = 8) -> None:
        self.api_url = f"https://api.telegram.org/bot{token}/sendMessage"
        self.chat_id = chat_id
        self.timeout_seconds = timeout_seconds

    def send(self, title: str, message: str, severity: str) -> bool:
        text = f"[{severity.upper()}] {title}\n{message}"
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "disable_web_page_preview": True,
        }
        request = Request(
            self.api_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                return 200 <= response.status < 300
        except URLError as exc:
            logger.exception("Telegram notifier error: %s", exc)
            return False


class WebhookNotifier:
    def __init__(self, url: str, timeout_seconds: int = 8) -> None:
        self.url = url
        self.timeout_seconds = timeout_seconds

    def send(self, title: str, message: str, severity: str) -> bool:
        payload = {
            "severity": severity,
            "title": title,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        request = Request(
            self.url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                return 200 <= response.status < 300
        except URLError as exc:
            logger.exception("Webhook notifier error: %s", exc)
            return False


class CompositeNotifier:
    def __init__(self, notifiers: list[Notifier]) -> None:
        self.notifiers = notifiers

    def send(self, title: str, message: str, severity: str) -> bool:
        outcomes: list[bool] = []
        for notifier in self.notifiers:
            try:
                outcomes.append(notifier.send(title=title, message=message, severity=severity))
            except Exception:
                logger.exception("Notifier failure")
                outcomes.append(False)
        return all(outcomes) if outcomes else True


def build_notifier(config: dict) -> Notifier:
    token = str(config.get("TELEGRAM_BOT_TOKEN", "")).strip()
    chat_id = str(config.get("TELEGRAM_CHAT_ID", "")).strip()
    webhook_url = str(config.get("WEBHOOK_URL", "")).strip()
    timeout = int(config.get("NOTIFIER_TIMEOUT_SECONDS", 8) or 8)

    notifiers: list[Notifier] = []
    if token and chat_id:
        notifiers.append(TelegramNotifier(token=token, chat_id=chat_id, timeout_seconds=timeout))
    if webhook_url:
        notifiers.append(WebhookNotifier(url=webhook_url, timeout_seconds=timeout))

    if not notifiers:
        notifiers.append(LoggingNotifier())

    if len(notifiers) == 1:
        return notifiers[0]
    return CompositeNotifier(notifiers)
