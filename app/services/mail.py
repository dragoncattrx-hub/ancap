from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage

from app.config import get_settings


WALLET_LOCAL_EMAIL_SUFFIX = "@wallet.ancap.local"


def mail_configured() -> bool:
    settings = get_settings()
    return bool(settings.mail_enabled and settings.smtp_host and settings.smtp_from_email)


def can_receive_system_email(email: str | None) -> bool:
    value = (email or "").strip().lower()
    return bool(value) and not value.endswith(WALLET_LOCAL_EMAIL_SUFFIX)


def send_email(*, to_email: str, subject: str, text_body: str, html_body: str | None = None) -> bool:
    settings = get_settings()
    if not mail_configured():
        return False

    message = EmailMessage()
    from_name = (settings.smtp_from_name or "").strip()
    if from_name:
        message["From"] = f"{from_name} <{settings.smtp_from_email}>"
    else:
        message["From"] = settings.smtp_from_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(text_body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    timeout = max(int(settings.smtp_timeout_seconds), 1)
    if settings.smtp_use_ssl:
        server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=timeout)
    else:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=timeout)

    with server:
        server.ehlo()
        if settings.smtp_use_tls and not settings.smtp_use_ssl:
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)
    return True
