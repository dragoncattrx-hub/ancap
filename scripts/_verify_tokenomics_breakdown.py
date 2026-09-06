#!/usr/bin/env python3
import asyncio
from app.services.acp_tokenomics import fetch_custodial_hot_breakdown

async def main():
    r = await fetch_custodial_hot_breakdown("acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9")
    for b in r.buckets:
        print(f"{b.label}: {b.acp} ACP ({b.utxo_count} UTXO)")
    print(f"TOTAL: {r.total_acp} ACP")

asyncio.run(main())
