# Cisco / enterprise segmentation appendix

Updated: 2026-09-28

ANCAP’s in-repo host baseline is Linux/Hestia oriented (`docs/SECURITY_SERVER_PLAN.md`: UFW, fail2ban, secret hygiene, CORS, CRON_SECRET). This appendix maps that baseline onto common Cisco-certified practice without embedding vendor-specific configs in the app.

## Suggested mapping

| ANCAP control | Cisco-oriented practice |
| --- | --- |
| Public web / API edge | Separate DMZ VLAN; reverse proxy only; deny direct DB/Redis from internet |
| `api.ancap.cloud` vs `ancap.cloud` | Same-site cookie (`SameSite=Lax`) + explicit CORS allowlist — keep origins on the trusted zone list |
| Postgres / Redis | Internal-only VLAN; no NAT; ACL deny from user Wi-Fi / guest |
| Bridge signer / hot wallet host | Isolated management VLAN; jump host + MFA; no Theodore / promo agents on this host |
| Theodore promo host | User/ops workstation VLAN; Telegram egress only; no wallet key material |
| Secret rotation | Out-of-band vault / HSM where available; never commit keys (see `scripts/check_secret_hygiene.py`) |

## Operator checklist

1. Keep bridge signer and promo agents on **different** hosts.
2. Prefer firewall object-groups for `ancap.cloud`, `api.ancap.cloud`, Telegram Bot API egress.
3. Log deny hits for unexpected outbound from API/DB hosts.
4. Re-run `docs/AUDIT_CHECKLIST.md` after any network change.

This document is operational guidance, not a Cisco TAC playbook and not a certification claim.
