"""Starlink installation desk — thin alias over field_services_desk."""
from __future__ import annotations

from typing import Any

from app.services import field_services_desk as field

SERVICE_FEE_EUR = field.SERVICE_FEE_EUR
SERVICE_IDS = {k: v for k, v in field.SERVICE_IDS.items() if k.startswith("starlink-")}
WORKFLOW_CATALOG_EUR = {
    k: v for k, v in field.WORKFLOW_CATALOG_EUR.items() if k.startswith("starlink")
}


def catalog() -> dict[str, Any]:
    return field.starlink_catalog()


def find_service(service_id: str) -> dict[str, Any] | None:
    svc = field.find_service(service_id)
    if svc is None or svc.get("group_id") != "starlink":
        return None
    return svc


def quote(
    *,
    service_id: str,
    region: str | None = None,
    payment_currency: str = "ACP",
) -> dict[str, Any]:
    svc = find_service(service_id)
    if svc is None:
        raise ValueError(f"unknown service_id: {service_id}")
    return field.quote(
        service_id=service_id,
        region=region,
        payment_currency=payment_currency,
    )
