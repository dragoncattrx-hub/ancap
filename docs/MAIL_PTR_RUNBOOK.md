# Mail PTR runbook (R4)

## Goal

Improve outbound mail deliverability for `mail.ancap.cloud` by aligning reverse DNS with the sending host.

## Current target

- Server IP: `185.114.117.241`
- PTR record should resolve to: `mail.ancap.cloud`
- Forward DNS for `mail.ancap.cloud` should resolve back to `185.114.117.241`

## Operator steps

1. Open the VPS/provider panel for `185.114.117.241`.
2. Set reverse DNS (PTR) to `mail.ancap.cloud`.
3. Verify:
   - `dig -x 185.114.117.241 +short`
   - `dig mail.ancap.cloud +short`
4. Confirm SPF/DKIM/DMARC per `docs/MAIL_SETUP_GUIDE.md`.
5. Optional: relay through SES/SendGrid if direct SMTP reputation remains weak.

## Evidence

Record verification output and date in the operator incident log when PTR is live.
