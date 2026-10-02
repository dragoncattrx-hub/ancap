# ANCAP Dating Mesh

Status: foundation (2026-10-02)  
Audience: mobile wallet + proximity dating  
Inspiration: [bitchat](https://bitchat.free/) — decentralized BLE mesh messaging (no internet required). ANCAP does **not** clone bitchat binaries; we use a branded protocol for **ANCAP Dating**.

## Product

Proximity dating + optional cloud fallback:

| Plane | Behavior |
|-------|----------|
| Mesh | BLE advertise/scan, multi-hop relay, ephemeral peer IDs, no phone numbers |
| Cloud | Profiles, matches, DMs, access-point map when online |
| Web | Public catalog of access points at `/dating` |

**Age gate:** 18+ attestation required before mesh or cloud dating APIs.

**Device discovery label:** peers advertise local name prefix **`ANCAP Dating`** and service UUID below so scanners list them as ANCAP Dating devices (not generic BLE noise).

## Protocol constants

| Constant | Value |
|----------|--------|
| BLE service UUID | `a11c0001-a11c-4a7e-9c01-444154494e47` (`DATING` branded) |
| Local name prefix | `ANCAP Dating` |
| Max hop count | `5` |
| Packet types | `0x01` presence, `0x02` chat, `0x03` relay, `0x04` access-point beacon |
| Identity | ephemeral 32-byte peer id (rotate on session) |

Wi‑Fi path: same-subnet UDP/mDNS beacon as secondary discovery when BLE is restricted. SoftAP/hotspot APIs are **not** required (especially on iOS).

## Threat model (honest)

- Nearby adversaries can observe BLE advertisements and attempt relay flooding — rate-limit locally.
- Mesh is **not** strong anonymity; it is infrastructure-independent proximity chat.
- Coordinates on access points are public when published to the cloud catalog.
- Do not promise censorship-proof global dating; mesh works only where peers/radios exist.

## API (`/v1/dating`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/dating/catalog` | public |
| GET | `/dating/access-points` | public |
| POST | `/dating/access-points` | user |
| GET/PUT | `/dating/profile` | user |
| POST | `/dating/like` | user |
| GET | `/dating/matches` | user |
| POST/GET | `/dating/messages` | user |
| POST | `/dating/report` | user |

## Mobile

Expo tab **Dating** in `ancap-mobile/apps/acp-wallet-expo`:

1. 18+ gate  
2. Nearby scanner (BLE)  
3. Map + create access point  
4. Mesh chat store-and-forward  

See also: `docs/mobile/ROADMAP.md` (Dating Mesh phase).

## Related

- Legal: `/legal/dating`
- Public UI: `/dating`
- Nexus social (`/nexus`) is **separate** — people/robots feed, not dating.
