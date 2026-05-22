# ANCAP Mail System — Setup Guide
**Date:** 2026-05-22 | **ARDO Agent**

---

## Current State

### What's Working
- **Exim4** configured as LOCAL mode, listening on `0.0.0.0:25`
- **Dovecot** running on ports 143/993/110/995 (IMAP/POP3)
- **Local mail delivery** works: `admin@ancap.cloud` delivers to `/home/admin/mail/ancap.cloud/admin/Maildir/`
- **Outbound mail** works via direct SMTP to external servers (gmail tested successfully)
- **SPF** configured and published
- **DMARC** configured and published

### What's NOT Working
- **Port 25 inbound from outside** — external SMTP servers can't connect to port 25
  - This is a **VPS provider-level block**, not a server configuration issue
  - The server IS listening on port 25 (exim4 confirmed)
  - UFW firewall has port 25 ALLOW
  - But external connections timeout — provider NAT blocks it
- **DKIM** — key generated, needs DNS record added to Cloudflare

### Provider Issue
The VPS (provider: likely a budget KVM host based on hostname `v575190186.local`) 
blocks inbound port 25 at the network level. This is a common anti-spam measure.

**Solution options:**
1. Request the VPS provider to open port 25 (most budget providers don't)
2. Use a mail relay service (SendGrid, Mailgun, AWS SES) — they provide SMTP credentials
3. Use Cloudflare Email Routing (already set up for MX, but it's forwarding-only)
4. Accept that external mail needs to come through a relay

---

## DNS Records to Add (Cloudflare)

### 1. DKIM Record — CRITICAL for deliverability
Add a TXT record to Cloudflare for `ancap.cloud`:

| Type | Name | Content |
|------|------|---------|
| TXT | `mail._domainkey` | `v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArz0zLuDe/YMnyE6OTdXcqIlLAJfHgAG22tngetBdNJYSsUsUYLwyCeiInFEJWjFGlsjh9yw4u33ROWx6XNg1S3WeJPiXZNfgVqVIRmqR0gjCEkdVBuEGUiqMIAcTXLLWLWMSbenxL80gRU+84oTKj8iwmQAo1+PLeXkrs/VvVulyjlaxFr/QMybHSrXyINtBGJKPp4St8Is1P6s+2Ebygs85hgNApkQv8YnthWU1supQJ3esdATz83y2TF9KI74Z7c6ZEQZpAGDDxOYjqHlGf2YScHHgZZx/8cSEVfoWmao8l+TY5JfFzj/sAn1fMXtsOF+IqQPM0mqoSMnImmz7/QIDAQAB` |

Set DKIM to **active** in Cloudflare if they have DKIM management.

### 2. Existing DNS (already correct)
- **MX:** `mail.ancap.cloud` → `10 mail.ancap.cloud`
- **SPF:** `v=spf1 mx a:mail.ancap.cloud ip4:185.114.117.241 ~all`
- **DMARC:** `v=DMARC1; p=none; rua=mailto:admin@ancap.cloud; adkim=s; aspf=s`

---

## How to Set Up Mail Relay (Recommended)

If the VPS provider won't open port 25, set up a mail relay:

### Option 1: SendGrid (Free tier: 100 emails/day)
1. Create account at sendgrid.com
2. Create API key
3. Configure exim4:
```bash
# Add to /etc/exim4/passwd.client:
smtp.sendgrid.net:apikey:YOUR_SENDGRID_API_KEY

# Configure exim4 as satellite with auth:
# Edit /etc/exim4/update-exim4.conf.conf:
dc_eximconfig_configtype='satellite'
dc_smarthost='smtp.sendgrid.net::587'
dc_relay_domains='ancap.cloud'
```

### Option 2: Mailgun (Free tier: 5,000 emails/month)
Same approach, just replace `smtp.sendgrid.net` with `smtp.mailgun.org`.

### Option 3: HestiaCP Built-in SMTP
Check HestiaCP panel → Mail → Domain Settings for SMTP relay credentials.

---

## Testing Commands

```bash
# Test from server to external SMTP
echo 'EHLO test' | timeout 5 bash -c 'cat < /dev/tcp/gmail-smtp-in.l.google.com/25'

# Test local mail delivery
echo 'Test' | /usr/sbin/sendmail admin@ancap.cloud

# Check mail received
ls /home/admin/mail/ancap.cloud/admin/Maildir/new/

# Verify DKIM signing
grep -i dkim /var/log/exim4/mainlog 2>/dev/null || echo 'check exim4 split logs'

# Test DNS records
dig TXT mail._domainkey.ancap.cloud +short
```

---

## Dovecot Access (for admin@ancap.cloud)

- **IMAP:** `mail.ancap.cloud` port 993 (SSL/TLS)
- **SMTP:** `mail.ancap.cloud` port 587 (STARTTLS) or port 465 (SSL/TLS)
- **POP3:** `mail.ancap.cloud` port 995 (SSL/TLS)
- **Username:** `admin@ancap.cloud`
- **Password:** `AncapInbox2026Q9`

Webmail: https://webmail.ancap.cloud/ (via Apache/Roundcube if installed)

---

## Quick Fix: If Port 25 is Permanently Blocked

1. **Use HestiaCP Mail Relay:**
   - In HestiaCP panel → Mail → Domain → Configure
   - Set up external SMTP relay (SMTP credentials)
   - Or use Cloudflare Email Routing (free, forward-only)

2. **Cloudflare Email Routing (already partially set up):**
   - MX points to Cloudflare servers
   - Cloudflare forwards to `admin@ancap.cloud`
   - **BUT:** Cloudflare Email Routing doesn't give a real mailbox login
   - For a real mailbox, keep HestiaCP mail + use SMTP relay for outbound

3. **Recommended combo:**
   - **Receiving:** Keep HestiaCP/Dovecot (IMAP works for webmail)
   - **Sending:** Configure exim4 to use SMTP relay (SendGrid/Mailgun)
   - **DKIM:** Add DKIM TXT record to Cloudflare (see above)
   - **SPF/DMARC:** Already configured

---

## ARDO Actions Taken

1. ✅ Exim4 restored to LOCAL mode (not satellite — satellite requires SMTP creds)
2. ✅ DKIM keys generated at `/etc/opendkim/keys/mail.private`
3. ✅ DKIM config added to exim4 split config
4. ✅ UFW firewall: port 25 ALLOW
5. ✅ fail2ban active (7 jails)
6. ✅ SPF and DMARC verified
7. ✅ Local mail delivery works
8. ✅ External mail sending works (tested with ProtonMail)

## ARDO Pending Actions

1. ⏳ Add DKIM TXT record to Cloudflare (needs Cloudflare access)
2. ⏳ Set up SMTP relay (SendGrid/Mailgun) if port 25 remains blocked
3. ⏳ Verify DKIM signing in email headers
4. ⏳ Update packages (226 pending)
5. ⏳ Implement Idempotency-Key

---

## Cloudflare Access Needed For

1. **DKIM record** — Add the TXT record above
2. **Email routing settings** — Check if forwarding is active
3. **Domain settings** — Verify DNSSEC, check for any blocks
4. **SSL certificates** — Check Cloudflare Origin SSL settings

---

*Last updated: 2026-05-22 by ARDO*