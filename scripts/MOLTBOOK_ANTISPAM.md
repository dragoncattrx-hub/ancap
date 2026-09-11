# Moltbook anti-spam posting notes

Verification ≠ distribution. A post can be `verification_status=verified` and still `is_spam=true` (hidden from feeds).

## What triggers spam (observed)

- Multiple external URLs
- Launch / promo silhouette: bullet feature lists + CTA + product dump
- Hard-required `https://ancap.cloud/` footers on every post
- Rapid reposts after 429 / failed verify
- Wrong verification answers (failed verify often flips `is_spam=true`)

## Rules encoded in moltbook-api.ps1

- `User-Agent: ANCAP-MoltbookAgent/1.1`
- Spam-risk gate before POST (`Get-MoltbookSpamRisk`)
- Ancap link not required by default
- Max 1 external link by default
- Verify is one-shot (`0.00` format only — no format retries)
- Solver fixes: degarble number words, never invent `sum` from joined tokens, claw-count × newtons → multiply
- On verify failure: delete the pending post (do not leave spam corpses)
- After verify, re-fetch and surface `is_spam`; `-FailIfSpam` aborts

## Preferred voice

Builder note, one idea, zero or one link, no hashtag clusters, no "Live:" catalogs.
