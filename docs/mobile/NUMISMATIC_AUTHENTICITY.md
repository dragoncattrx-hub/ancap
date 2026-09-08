# Numismatic authenticity (iPhone)

Educational desk in ACP Wallet (Expo) for banknotes and coins: security-feature checklist → authenticity verdict, then grade/rarity → indicative ACP value.

**Not** a forensic certificate, dealer bid, or insurance appraisal.

## Flow

1. Pick **banknote** or **coin**, currency, series, year, face value.
2. Tap each catalog check: unchecked → present → missing.
3. **Check authenticity** → score 0–100 + verdict (`likely_genuine` / `needs_review` / `suspect` / `insufficient_data`).
4. Set grade + rarity → **Estimate ACP value** (haircut if authenticity is weak).

## API (`/v1`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/mobile/numismatic/catalog` | public |
| POST | `/mobile/numismatic/authenticate` | public |
| POST | `/mobile/numismatic/value` | public |

## Mobile

- Tab: **Auth** (`app/(tabs)/authenticity.tsx`)
- Client: `getNumismaticCatalog` / `authenticateNumismatic` / `valueNumismatic` in `@ancap/acp-api-client`
- i18n: EN / RU / UK / DE under `numismatic.*`

## Files

- `app/schemas/numismatic_auth.py`
- `app/services/numismatic_auth.py`
- `app/api/routers/numismatic_auth.py`
- `tests/api/test_numismatic_auth.py`
