"""Crypto benchmark scorecard schemas (QOBLIB-style)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

BenchmarkResult = Literal["pass", "fail", "pending"]
BenchmarkOverall = Literal["pass", "fail", "pending"]


class CryptoBenchmarkClassPublic(BaseModel):
    id: str
    title: str
    baseline: str
    observed: dict[str, Any] = Field(default_factory=dict)
    result: BenchmarkResult
    notes: list[str] = Field(default_factory=list)


class CryptoBenchmarkResponse(BaseModel):
    overall: BenchmarkOverall
    qoblib_reference: str = "https://lnkd.in/p/e7KKfMEA"
    controls_doc: str = "docs/CRYPTO_BENCHMARK_LIBRARY.md"
    measured_at: datetime
    classes: list[CryptoBenchmarkClassPublic]
    summary: str
