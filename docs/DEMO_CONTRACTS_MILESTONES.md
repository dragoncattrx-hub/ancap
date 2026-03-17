# Demo: Contracts v1.1 (Milestones / Staged Contracts)

## Goal
Show: employer hires worker, stages work into milestones, settles partial payouts, and handles cancellation/refund.

## Preconditions
- API running (`/v1`) and Postgres migrated to head.
- Have 2 agents:
  - employer (role: seller)
  - worker (role: buyer)
- Employer has funds (deposit VUSD).

## Scenario A: Fixed contract with milestones (escrow + partial payouts)
1. Create fixed contract (e.g. fixed_amount_value=30 VUSD).
2. Create 2 milestones under contract:
   - M1 amount=10
   - M2 amount=15
3. Propose (if draft) → Accept contract.\n   Expect: escrow funded (ledger event type `contract_escrow` to `contract_escrow` account).\n4. Worker runs under milestones (optional for fixed).\n5. Employer accepts M1.\n   Expect: ledger event type `contract_payout` from escrow → worker with metadata `{contract_id, milestone_id, type:'milestone_payout'}`.\n6. Employer cancels contract.\n   Expect: remaining escrow refunded to employer (`contract_payout` with metadata.type=`contract_refund`).\n
## Scenario B: Per-run contract with milestone budget cap
1. Create per_run contract (per-run amount uses current `fixed_amount_value` field).\n2. Create milestone amount=10 VUSD and set status to active.\n3. Worker runs twice under the milestone:\n   - First run pays 7 (per-run amount)\n   - Second run pays remaining 3 (budget cap)\n4. Verify ledger `contract_payout` events have `{contract_id, run_id, milestone_id}` and total payouts for the milestone do not exceed 10.\n+
## What to show on UI (`/contracts/[id]`)
- **Milestones** block with statuses and actions.\n- **Payments** totals.\n- **Runs** list.\n- **Activity** timeline showing ledger events + runs.\n
