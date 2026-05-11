from __future__ import annotations

import hashlib
import os
import re
import shutil
import subprocess
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from django.core.cache import cache
from django.db import connections

STATUS_OK = "ok"
STATUS_WARNING = "warning"
STATUS_CRITICAL = "critical"

_STATUS_WEIGHT = {
    STATUS_OK: 0,
    STATUS_WARNING: 1,
    STATUS_CRITICAL: 2,
}

SSH_ACCEPTED_RE = re.compile(
    r"Accepted (?P<method>\S+) for (?P<user>\S+) from (?P<ip>\S+) port (?P<port>\d+)"
)




@dataclass
class CheckResult:
    name: str
    status: str
    summary: str
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status,
            "summary": self.summary,
            "details": self.details,
        }


def highest_status(statuses: list[str]) -> str:
    current = STATUS_OK
    for status in statuses:
        if _STATUS_WEIGHT.get(status, 0) > _STATUS_WEIGHT.get(current, 0):
            current = status
    return current


def _resolve_path(base_dir: Path, raw_path: str) -> Path:
    path = Path(raw_path).expanduser()
    if path.is_absolute():
        return path
    return base_dir / path


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _run_command(command: list[str], cwd: Path | None = None, timeout: int = 10) -> tuple[int, str, str]:
    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd) if cwd else None,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except Exception as exc:
        return 1, "", str(exc)

    return completed.returncode, completed.stdout.rstrip("\n"), completed.stderr.rstrip("\n")


def _tail_lines(path: Path, max_lines: int) -> list[str]:
    if max_lines <= 0:
        return []

    with path.open("rb") as file:
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        block_size = 8192
        blocks: deque[bytes] = deque()
        bytes_collected = 0
        position = file_size

        while position > 0 and bytes_collected < block_size * 32:
            read_size = min(block_size, position)
            position -= read_size
            file.seek(position)
            chunk = file.read(read_size)
            blocks.appendleft(chunk)
            bytes_collected += read_size
            if b"\n" in chunk and b"\n".join(blocks).count(b"\n") > max_lines + 3:
                break

    joined = b"".join(blocks)
    lines = joined.decode("utf-8", errors="ignore").splitlines()
    return lines[-max_lines:]


def check_system_health(base_dir: Path) -> CheckResult:
    issues: list[str] = []
    warnings: list[str] = []
    details: dict[str, Any] = {}

    try:
        connection = connections["default"]
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        details["database"] = "ok"
    except Exception as exc:
        details["database"] = "error"
        issues.append(f"Database error: {exc}")

    try:
        key = "server-monitor-health-check"
        cache.set(key, "ok", timeout=5)
        cached = cache.get(key)
        if cached != "ok":
            raise RuntimeError("cache mismatch")
        details["cache"] = "ok"
    except Exception as exc:
        details["cache"] = "error"
        issues.append(f"Cache error: {exc}")

    try:
        usage = shutil.disk_usage(base_dir)
        used_percent = round((usage.used / usage.total) * 100, 2) if usage.total else 0.0
        details["disk"] = {
            "used_percent": used_percent,
            "free_gb": round(usage.free / (1024 ** 3), 2),
        }
        if used_percent >= 95:
            issues.append(f"Disk usage is critical: {used_percent}%")
        elif used_percent >= 85:
            warnings.append(f"Disk usage is high: {used_percent}%")
    except Exception as exc:
        details["disk"] = "unavailable"
        warnings.append(f"Disk check failed: {exc}")

    if issues:
        return CheckResult(
            name="system_health",
            status=STATUS_CRITICAL,
            summary="System health has critical problems.",
            details={"critical": issues, "warnings": warnings, **details},
        )

    if warnings:
        return CheckResult(
            name="system_health",
            status=STATUS_WARNING,
            summary="System health has warnings.",
            details={"warnings": warnings, **details},
        )

    return CheckResult(
        name="system_health",
        status=STATUS_OK,
        summary="System health is stable.",
        details=details,
    )


def check_watched_files(
    base_dir: Path,
    state: dict[str, Any],
    watched_files: list[str],
) -> CheckResult:
    previous_hashes: dict[str, str] = state.get("file_hashes", {})

    changed: list[str] = []
    missing: list[str] = []
    newly_tracked: list[str] = []
    current_hashes: dict[str, str] = {}

    for raw_path in watched_files:
        resolved = _resolve_path(base_dir, raw_path)
        key = str(resolved)

        if not resolved.exists():
            missing.append(key)
            continue

        try:
            file_hash = _sha256(resolved)
        except OSError as exc:
            missing.append(f"{key} (unreadable: {exc})")
            continue

        current_hashes[key] = file_hash
        previous_hash = previous_hashes.get(key)
        if previous_hash is None:
            newly_tracked.append(key)
        elif previous_hash != file_hash:
            changed.append(key)

    state["file_hashes"] = current_hashes

    if missing:
        return CheckResult(
            name="watched_files",
            status=STATUS_CRITICAL,
            summary="One or more watched files are missing.",
            details={"missing": missing, "changed": changed, "new": newly_tracked},
        )

    if changed:
        return CheckResult(
            name="watched_files",
            status=STATUS_WARNING,
            summary="Watched files changed.",
            details={"changed": changed, "new": newly_tracked},
        )

    return CheckResult(
        name="watched_files",
        status=STATUS_OK,
        summary="Watched files have no changes.",
        details={"tracked": sorted(current_hashes.keys()), "new": newly_tracked},
    )


def check_critical_paths(base_dir: Path, critical_paths: list[str]) -> CheckResult:
    missing: list[str] = []

    for raw_path in critical_paths:
        resolved = _resolve_path(base_dir, raw_path)
        if not resolved.exists():
            missing.append(str(resolved))

    if missing:
        return CheckResult(
            name="critical_paths",
            status=STATUS_CRITICAL,
            summary="Critical files are missing.",
            details={"missing": missing},
        )

    return CheckResult(
        name="critical_paths",
        status=STATUS_OK,
        summary="All critical files are present.",
        details={"checked": [str(_resolve_path(base_dir, item)) for item in critical_paths]},
    )


def check_git_changes(base_dir: Path, enabled: bool) -> CheckResult:
    if not enabled:
        return CheckResult(
            name="git_changes",
            status=STATUS_OK,
            summary="Git change watch is disabled.",
            details={"enabled": False},
        )

    return_code, inside, _ = _run_command(["git", "rev-parse", "--is-inside-work-tree"], cwd=base_dir)
    if return_code != 0 or inside.strip() != "true":
        return CheckResult(
            name="git_changes",
            status=STATUS_WARNING,
            summary="Git repository not detected.",
            details={"enabled": True},
        )

    return_code, output, error = _run_command(["git", "status", "--porcelain"], cwd=base_dir)
    if return_code != 0:
        return CheckResult(
            name="git_changes",
            status=STATUS_WARNING,
            summary="Git status command failed.",
            details={"error": error},
        )

    lines = [line for line in output.splitlines() if line.strip()]
    if not lines:
        return CheckResult(
            name="git_changes",
            status=STATUS_OK,
            summary="No project file changes detected.",
            details={"changes": []},
        )

    deleted_paths: list[str] = []
    parsed_changes: list[dict[str, str]] = []
    for line in lines:
        code = line[:2]
        path = line[3:] if len(line) >= 4 else line
        parsed_changes.append({"code": code, "path": path})
        if "D" in code:
            deleted_paths.append(path)

    if deleted_paths:
        return CheckResult(
            name="git_changes",
            status=STATUS_CRITICAL,
            summary="Project has file deletions in git status.",
            details={"changes": parsed_changes, "deleted": deleted_paths},
        )

    return CheckResult(
        name="git_changes",
        status=STATUS_WARNING,
        summary="Project has uncommitted changes.",
        details={"changes": parsed_changes},
    )


def check_docker(
    required_containers: list[str],
    enabled: bool,
) -> CheckResult:
    if not enabled:
        return CheckResult(
            name="docker",
            status=STATUS_OK,
            summary="Docker check is disabled.",
            details={"enabled": False},
        )

    if shutil.which("docker") is None:
        return CheckResult(
            name="docker",
            status=STATUS_WARNING,
            summary="Docker CLI is not installed.",
            details={"enabled": True},
        )

    rc_all, output_all, error_all = _run_command(["docker", "ps", "-a", "--format", "{{.Names}}|{{.Status}}"])
    if rc_all != 0:
        return CheckResult(
            name="docker",
            status=STATUS_CRITICAL,
            summary="Docker command failed.",
            details={"error": error_all or output_all},
        )

    rc_running, output_running, _ = _run_command(["docker", "ps", "--format", "{{.Names}}"])
    if rc_running != 0:
        output_running = ""

    all_containers: dict[str, str] = {}
    for line in output_all.splitlines():
        if "|" not in line:
            continue
        name, status = line.split("|", 1)
        all_containers[name.strip()] = status.strip()

    running_names = {line.strip() for line in output_running.splitlines() if line.strip()}

    if required_containers:
        missing = [name for name in required_containers if name not in all_containers]
        stopped = [
            {
                "name": name,
                "status": all_containers.get(name, "missing"),
            }
            for name in required_containers
            if name in all_containers and name not in running_names
        ]

        if missing or stopped:
            return CheckResult(
                name="docker",
                status=STATUS_CRITICAL,
                summary="Required Docker containers are not healthy.",
                details={
                    "required": required_containers,
                    "missing": missing,
                    "stopped": stopped,
                    "running": sorted(running_names),
                },
            )

        return CheckResult(
            name="docker",
            status=STATUS_OK,
            summary="Required Docker containers are running.",
            details={
                "required": required_containers,
                "running": sorted(running_names),
            },
        )

    stopped_any = [
        {"name": name, "status": status}
        for name, status in all_containers.items()
        if name not in running_names
    ]
    if stopped_any:
        return CheckResult(
            name="docker",
            status=STATUS_WARNING,
            summary="Some Docker containers are not running.",
            details={"stopped": stopped_any, "running": sorted(running_names)},
        )

    return CheckResult(
        name="docker",
        status=STATUS_OK,
        summary="Docker containers are running.",
        details={"running": sorted(running_names)},
    )


def check_ssh_logins(
    base_dir: Path,
    state: dict[str, Any],
    log_paths: list[str],
    scan_lines: int,
) -> CheckResult:
    resolved_paths = [_resolve_path(base_dir, path) for path in log_paths]
    available_paths = [path for path in resolved_paths if path.exists()]

    if not available_paths:
        return CheckResult(
            name="ssh_logins",
            status=STATUS_WARNING,
            summary="No SSH auth log file found.",
            details={"checked": [str(path) for path in resolved_paths]},
        )

    seen_events = state.get("seen_ssh_events", [])
    seen_set = set(item for item in seen_events if isinstance(item, str))

    new_events: list[str] = []
    read_errors: list[str] = []
    all_detected: set[str] = set(seen_set)

    for log_path in available_paths:
        try:
            lines = _tail_lines(log_path, scan_lines)
        except OSError as exc:
            read_errors.append(f"{log_path}: {exc}")
            continue

        for line in lines:
            match = SSH_ACCEPTED_RE.search(line)
            if not match:
                continue

            event = f"{log_path.name} | {line.strip()}"
            if event not in seen_set:
                new_events.append(event)
            all_detected.add(event)

    # Keep the state bounded.
    state["seen_ssh_events"] = list(sorted(all_detected))[-500:]

    if new_events:
        return CheckResult(
            name="ssh_logins",
            status=STATUS_WARNING,
            summary="New SSH login detected.",
            details={
                "events": new_events[:20],
                "count": len(new_events),
                "log_files": [str(path) for path in available_paths],
                "errors": read_errors,
            },
        )

    if read_errors:
        return CheckResult(
            name="ssh_logins",
            status=STATUS_WARNING,
            summary="SSH logs could not be fully read.",
            details={
                "errors": read_errors,
                "log_files": [str(path) for path in available_paths],
            },
        )

    return CheckResult(
        name="ssh_logins",
        status=STATUS_OK,
        summary="No new SSH login events.",
        details={"log_files": [str(path) for path in available_paths]},
    )
