# ACP Arena

Prediction markets + provably-fair house games. All stakes/payouts in **ACP**.

## API

- `GET /v1/arena/catalog`
- `POST /v1/arena/markets/{id}/bets`
- `POST /v1/arena/house/play` (`coinflip` | `dice`)

House games reveal `server_seed` after play; verify `sha256(server_seed) == server_seed_hash`.

## UI

`/arena`

## Compliance

Entertainment / prediction desk only. Not available where gambling is restricted. 2% house edge on house games.
