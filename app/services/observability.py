from __future__ import annotations

import threading
from collections import Counter


_lock = threading.Lock()
_http_requests: Counter[tuple[str, str, str]] = Counter()


def record_http_request(method: str, path: str, status_code: int) -> None:
    normalized_path = path.split("?")[0]
    with _lock:
        _http_requests[(method.upper(), normalized_path, str(status_code))] += 1


def render_http_metrics() -> str:
    lines = [
        "# HELP ancap_http_requests_total HTTP requests handled by the API process.",
        "# TYPE ancap_http_requests_total counter",
    ]
    with _lock:
        for (method, path, status), count in sorted(_http_requests.items()):
            safe_path = path.replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'ancap_http_requests_total{{method="{method}",path="{safe_path}",status="{status}"}} {count}')
    return "\n".join(lines)
