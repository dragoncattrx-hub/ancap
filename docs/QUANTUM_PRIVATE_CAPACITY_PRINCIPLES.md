# ANCAP principles — private capacity & multi-path secrecy (literacy)

> Status: research literacy for `/quantum-sim` and ACP PQC posture | 2026-09-11  
> Not a product warranty, QKD claim, or ANCAP-owned theorem.

Public journalism cite (no affiliation):  
[iXBT Live — «0 + 0 > 0: ИИ помог доказать невозможный квантовый парадокс в защите данных»](https://www.ixbt.com/live/science/0-0-0-ii-pomog-dokazat-nevozmozhnyy-kvantovyy-paradoks-v-zaschite-dannyh.html)  
Underlying science as reported: Zhu & Wang private-capacity superadditivity (arXiv), Lean 4 / Lean-QIT verification.

ANCAP maps these ideas into **engineering principles** for multi-path mesh intents (satellites, BTS, repeaters) and post-quantum channel profiles. We do **not** claim to operate Zhu–Wang physical channels on ancap.cloud today.

## Principles

### P1 — Private capacity ≠ ordinary capacity

Ordinary capacity is about reliable delivery under noise. **Private** capacity additionally requires that a legitimate receiver extract more information than the environment / eavesdropper (Holevo-bounded leakage). Classical FEC alone cannot create secrecy when the environment already matches or beats the receiver.

**ANCAP use:** channel briefs distinguish “delivery SLA” from “secrecy budget”; PQC envelopes bind authenticity even when a hop is noisy.

### P2 — Classical wiretap additivity of zero

Under classical wiretap theorems (Wyner / Csiszár–Körner lineage), if each path is dominated by the eavesdropper, stacking identical compromised paths still yields **zero** private capacity. Classically, **0 + 0 = 0**.

**ANCAP use:** never market “more hops = more secrecy” without a cryptographic or joint-measurement story.

### P3 — Quantum private-capacity superadditivity (“0 + 0 > 0”)

In quantum information, two channels that each have **strictly zero private capacity** can, when used **together**, yield **positive** private capacity (superadditivity). Secrecy can be an **emergent** joint property, not a per-link attribute.

**ANCAP use:** mesh policies may keep individually “weak” legs (high loss sat hop + noisy terrestrial hop) when a **joint** decode / key-agreement design is specified by a licensed partner — literacy only until partner attestation exists.

### P4 — Do not write off a hop for zero private capacity alone

A segment must not be classified as “cryptographically useless forever” solely because its standalone private capacity is zero. Paired with another imperfect segment it may still participate in a secure architecture.

**ANCAP use:** `/quantum-sim` global-mesh intents score **path diversity** and partner joint profiles, not single-link private-capacity labels alone.

### P5 — Secrecy requires joint (non-separable) measurement / decode

Independent local measurement of each channel (even with classical coordination) can destroy the superadditive private capacity. Secrecy appears at an **indivisible joint** quantum measurement / decode over both outputs.

**ANCAP use:** dual-path product briefs require partner **joint termination** (or cryptographically joint KEM binding). Split-and-recombine with only classical compare is treated as **non-equivalent**.

### P6 — Scale separation (linear receiver vs quadratic leakage)

The reported protocol family keeps signal intensity small so legitimate mutual information grows **linearly** while environment leakage is bounded **quadratically** (geometry of noise), producing a positive secrecy rate in a limited parameter window.

**ANCAP use:** prefer **low-signal / high-diversity** scheduling over brute-force power; document partner rate regions honestly (small absolute rates can still prove a principle).

### P7 — AI may propose; machines must verify

LLM-assisted search can find candidate channel parameters; **formal verification** (Lean 4 / Mathlib / Lean-QIT as reported) is required before treating a proof as settled.

**ANCAP use:** aligns with ACP Lean / hybrid PQC culture — exploratory AI for design search; CI, vectors, and reviews for acceptance (`docs/ACP_PQC_ENCRYPTION.md`, `docs/ACP_LEAN_CHAIN.md`).

### P8 — Local eavesdropper dominance ≠ global dominance

Superiority of the environment over the receiver on an **isolated** hop does not guarantee the same superiority when hops are used **in parallel** under a joint protocol.

**ANCAP use:** satellite + BTS + repeater mesh is framed as **parallel imperfect capacity**, not as “one trusted trunk.” Export, spectrum, and MNO law still bind every hop.

## Related product surfaces

| Surface | Role |
|---------|------|
| `/quantum-sim` | Digital eSIM + PQC channel + global low-ping mesh intents; **compute-stack literacy** (Floquet bosonic codes) |
| `/tech` | TECH auction stack row `stack-floquet-bosonic` |
| `/legal/research-refs` | Public citation + no-affiliation notice (§6 iXBT, §8 Chalmers PRL) |
| `docs/ACP_PQC_ENCRYPTION.md` | Concrete ML-KEM / X-Wing envelope (classical+PQ hybrid) |
| `docs/CHALMERS_FLOQUET_BOSONIC_CODES.md` | Huang–Du–Guo single-period Floquet / lattice-gate literacy |
| Orbital / Galaxy desks | Partner capacity legs, not ANCAP-owned QKD constellation |

## Disclaimer

These principles are **educational**. They do not certify ANCAP as a quantum-optics lab, do not imply affiliation with iXBT or the paper authors, and do not replace partner QKD contracts, telecom licenses, or independent crypto review.
