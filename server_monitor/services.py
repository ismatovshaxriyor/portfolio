from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from django.conf import settings
from django.utils import timezone

from .checks import (
    CheckResult,
    check_critical_paths,
    check_docker,
    check_git_changes,
    check_ssh_logins,
    check_system_health,
    check_watched_files,
    highest_status,
)
from .notifiers import build_notifier
from .state import load_state, save_state


@dataclass
class MonitorReport:
    status: str
    generated_at: str
    checks: list[CheckResult] = field(default_factory=list)
    alerts: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "generated_at": self.generated_at,
            "checks": [item.to_dict() for item in self.checks],
            "alerts": self.alerts,
        }


class ServerMonitorService:
    def __init__(self, config: dict[str, Any] | None = None) -> None:
        base_config = getattr(settings, "SERVER_MONITOR", {})
        merged_config = {**base_config, **(config or {})}

        self.config = merged_config
        self.base_dir = Path(getattr(settings, "BASE_DIR"))
        state_file = str(merged_config.get("STATE_FILE") or (self.base_dir / ".server_monitor_state.json"))
        self.state_path = Path(state_file).expanduser()
        if not self.state_path.is_absolute():
            self.state_path = self.base_dir / self.state_path

        self.notifier = build_notifier(merged_config)

    @property
    def enabled(self) -> bool:
        return bool(self.config.get("ENABLED", True))

    def run(self, *, notify: bool = True, persist_state: bool = True) -> MonitorReport:
        if not self.enabled:
            return MonitorReport(
                status="ok",
                generated_at=timezone.now().isoformat(),
                checks=[
                    CheckResult(
                        name="monitor",
                        status="ok",
                        summary="Server monitor is disabled.",
                        details={"enabled": False},
                    )
                ],
                alerts=[],
            )

        state = load_state(self.state_path)
        checks = self._collect_checks(state)
        status = highest_status([item.status for item in checks])

        alerts = self._build_alerts(checks=checks, state=state)

        if notify:
            for alert in alerts:
                self.notifier.send(
                    title=alert["title"],
                    message=alert["message"],
                    severity=alert["severity"],
                )

        if persist_state:
            save_state(self.state_path, state)

        return MonitorReport(
            status=status,
            generated_at=timezone.now().isoformat(),
            checks=checks,
            alerts=alerts,
        )

    def _collect_checks(self, state: dict[str, Any]) -> list[CheckResult]:
        watched_files = [str(item).strip() for item in self.config.get("WATCH_FILES", []) if str(item).strip()]
        critical_paths = [str(item).strip() for item in self.config.get("CRITICAL_PATHS", []) if str(item).strip()]
        docker_containers = [
            str(item).strip() for item in self.config.get("DOCKER_CONTAINER_NAMES", []) if str(item).strip()
        ]
        ssh_log_paths = [str(item).strip() for item in self.config.get("SSH_LOG_PATHS", []) if str(item).strip()]
        ssh_scan_lines = int(self.config.get("SSH_SCAN_LINES", 250) or 250)

        results = [
            check_system_health(base_dir=self.base_dir),
            check_watched_files(base_dir=self.base_dir, state=state, watched_files=watched_files),
            check_critical_paths(base_dir=self.base_dir, critical_paths=critical_paths),
            check_git_changes(base_dir=self.base_dir, enabled=bool(self.config.get("GIT_WATCH_ENABLED", True))),
            check_docker(
                required_containers=docker_containers,
                enabled=bool(self.config.get("DOCKER_ENABLED", False)),
            ),
            check_ssh_logins(
                base_dir=self.base_dir,
                state=state,
                log_paths=ssh_log_paths,
                scan_lines=ssh_scan_lines,
            ),
        ]
        return results

    def _build_alerts(self, checks: list[CheckResult], state: dict[str, Any]) -> list[dict[str, Any]]:
        alerts: list[dict[str, Any]] = []
        checks_state = state.setdefault("checks", {})

        for item in checks:
            fingerprint = self._fingerprint(item)
            previous = checks_state.get(item.name, {}) if isinstance(checks_state.get(item.name, {}), dict) else {}
            previous_status = str(previous.get("status", "ok"))
            previous_fingerprint = str(previous.get("fingerprint", ""))

            if item.status == "ok":
                if previous_status != "ok":
                    alerts.append(
                        {
                            "kind": "recovery",
                            "severity": "ok",
                            "check": item.name,
                            "title": f"Recovered: {item.name}",
                            "message": item.summary,
                        }
                    )
            else:
                if previous_status != item.status or previous_fingerprint != fingerprint:
                    alerts.append(
                        {
                            "kind": "incident",
                            "severity": item.status,
                            "check": item.name,
                            "title": f"Alert: {item.name}",
                            "message": self._build_alert_message(item),
                        }
                    )

            checks_state[item.name] = {
                "status": item.status,
                "fingerprint": fingerprint,
            }

        return alerts

    @staticmethod
    def _fingerprint(item: CheckResult) -> str:
        payload = json.dumps(
            {
                "status": item.status,
                "summary": item.summary,
                "details": item.details,
            },
            sort_keys=True,
            default=str,
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _build_alert_message(item: CheckResult) -> str:
        details = json.dumps(item.details, ensure_ascii=True, sort_keys=True, default=str)
        compact_details = details if len(details) <= 1000 else f"{details[:1000]}..."
        return f"{item.summary}\nDetails: {compact_details}"
