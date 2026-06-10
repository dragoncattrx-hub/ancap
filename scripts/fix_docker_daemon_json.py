#!/usr/bin/env python3
"""Write Docker log-rotation config (run on server with sudo)."""
import json
from pathlib import Path

config = {
    "log-driver": "json-file",
    "log-opts": {"max-size": "10m", "max-file": "3"},
}
path = Path("/etc/docker/daemon.json")
path.write_text(json.dumps(config) + "\n", encoding="utf-8")
print(path.read_text(encoding="utf-8"))
