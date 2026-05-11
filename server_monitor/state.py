from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEFAULT_STATE: dict[str, Any] = {
    "checks": {},
    "file_hashes": {},
    "seen_ssh_events": [],
}


def _default_state() -> dict[str, Any]:
    return {
        "checks": {},
        "file_hashes": {},
        "seen_ssh_events": [],
    }


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return _default_state()

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return _default_state()

    if not isinstance(raw, dict):
        return _default_state()

    state = _default_state()
    state["checks"] = raw.get("checks", {}) if isinstance(raw.get("checks"), dict) else {}
    state["file_hashes"] = raw.get("file_hashes", {}) if isinstance(raw.get("file_hashes"), dict) else {}

    seen_events = raw.get("seen_ssh_events", [])
    state["seen_ssh_events"] = seen_events if isinstance(seen_events, list) else []
    return state


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    payload = json.dumps(state, ensure_ascii=True, indent=2, sort_keys=True)
    temp_path.write_text(payload, encoding="utf-8")
    temp_path.replace(path)
