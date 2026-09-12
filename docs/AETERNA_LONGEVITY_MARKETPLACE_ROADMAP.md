# ANCAP — AETERNA Longevity Marketplace Roadmap

> Status: foundation in progress | Added: 2026-09-07  
> Goal: **AETERNA** — ANCAP division for longevity / genomic wellness: ACP-paid analysis & partner-clinic workflows, DNA data vault (incl. Sequencing.com-style import), interactive genome sandbox.  
> Master priority **R12** · Related: Workflow Store, org identity, compliance matrix  
> Visual thesis: DNA + Cas9 awareness + blockchain settlement (see `/aeterna` hero)

## Product thesis

People pay ACP for **structured longevity workflows**: upload / link sequenced DNA or **partner blood-RNA / PCR panel metadata**, explore annotated variants in a sandbox, request AI briefs, and route **licensed clinical partners**.

Headline product (2026-09 modernization): **Molecular Aging Profile (15 axes)** — map consented expression-panel metadata onto hallmark themes (DNA repair, telomeres, epigenetics, proteostasis, autophagy, energy metabolism, senescence, stem-cell maintenance, mitochondria, inflammation, signaling, matrix, circadian/systemic, immune aging, nutrient sensing). Goal is an **individual configuration of aging processes**, not one universal “biological age” number; sex-aware framing preferred. Inspired by public research on multi-gene venous-blood RNA aging panels ([science.mail.ru / Gazeta.ru coverage, Sep 2026](https://science.mail.ru/news/56466-rossijskie-uchenyie-rabotayut-nad-testom-kotoryij-otsenivaet-starenie-po-15-genam/)) — **AETERNA claims no lab affiliation**.

**Non-goals (v1):** consumer DIY CRISPR/Cas9 kits, wet-lab protocols, gene synthesis, pathogen work, unlicensed enhancement procedures, diagnostic claims for home PCR, **LNP formulation recipes / mRNA sequences**.

**Goals (v1–v2):** DNA / panel vault → consent → paid workflow catalog → partner match → ACP settlement → audit receipt.

**2026-09-11 literacy add-on:** **Partial cellular reprogramming consult** (`aeterna-mrna-reprogramming-brief`, 1,000,000 ACP) — public USPTO notice-of-allowance journalism (Daewoong **eTurna** ionizable lipids for mRNA in LNPs; announced 27 Aug 2026; RU coverage 8 Sep 2026). Goal in coverage: restore some youthful cell functions **without** erasing cell identity. **Allowance ≠ issued patent ≠ approved drug.** ANCAP is not affiliated. See `docs/DAEWOONG_ETURNA_LNP.md` and `/legal/research-refs` §7.

## Compliance gates (must ship with MVP)

1. Explicit consent + genomic processing notice (region flags GDPR / health data).
2. Copy forbids medical diagnosis claims and DIY gene editing.
3. Intent categories are **consult / report / partner handoff**, not lab recipes.
4. Partner listings require jurisdiction + license_ref before `verified=true`.
5. Vault stores **content hash + metadata** first; raw genome blobs behind encrypted object store later.

## Sequencing.com bridge

- Users may paste / link Sequencing.com export URIs (`source=sequencing_com`).
- Later: OAuth / file-import adapter; v1 is URI + SHA-256 of local export.
- Docs: https://sequencing.com/

## Phased delivery

### Phase A0 — Spec & brand `[x]`

- Division name **AETERNA**, schemas in `app/schemas/aeterna.py`.
- Landing `/aeterna` with DNA/Cas9/blockchain visual.
- Workflow Store templates under category **AETERNA**.

### Phase A1 — Vault + intent API `[~]`

- Tables: `aeterna_dna_vault`, `aeterna_intent_orders`, `aeterna_partners`.
- Feature flag `FF_AETERNA`.
- APIs: status, vault CRUD metadata, intent orders, partner registry.

### Phase A2 — Checkout UX `[ ]`

- Filter `/ai/workflows?category=AETERNA`.
- Org desk + personal vault UI.
- Bundle: `aeterna-longevity-pack`.

### Phase A3 — Sandbox viz `[~]`

- `[x]` Procedural DNA helix on `/aeterna` (rotate + swap base pairs) — no PDB/genome blob on server.
- `[x]` Client streaming SHA-256 vault registration (hash + ≤8KB metadata only).
- `[x]` Homepage AETERNA promo; consult workflows **1,000,000 ACP**; stem-cell organ print **250,000 ACP** per organ (pack 2,500,000 ACP).
- `[x]` Partial mRNA-reprogramming consult (`aeterna-mrna-reprogramming-brief`) + USPTO eTurna citation (legal as of 11 Sep 2026).
- `[x]` Veterinary organ rails (12 Sep 2026): feline tissue cryoconservator-restorer (`aeterna-vet-cat-cryo-restore`, 75,000 ACP) + canine VET REGEN POD (`aeterna-vet-regen-pod`, 180,000 ACP) — conceptual partner architecture, licensed veterinarian only, no resurrection / survival-rate claims. Legal: `/legal/vet-regen`.
- `[x]` Vinci light chamber (12 Sep 2026): full-body photobiomodulation / LED session protocol (`aeterna-vinci-light-chamber`, 48,000 ACP) — Leonardo sunlight-health literacy, licensed phototherapy/dermatology partner only; not a reconstructed invention; not a safe-tanning or CE/FDA device claim. Legal: `/legal/light-chamber`.
- `[x]` Microwave body contouring (12 Sep 2026): contact-cooled 2.45 / 5.8 GHz ISM applicator (`aeterna-microwave-body-contouring`, 52,000 ACP) — licensed aesthetic/dermatology partner only; not liposuction; not a CE/FDA device; not a guaranteed fat-loss / centimetre / lymphatic claim. Legal: `/legal/body-contouring`.
- `[x]` BioFusion micromanipulation chamber (12 Sep 2026): IVF/ICSI, plant pollination, embryo observation, microorganism handling (`aeterna-biofusion-micromanipulation`, 88,000 ACP) — licensed ART / agricultural / BSL-lab partner only; not a fertility clinic; not a guaranteed pregnancy/embryo; not a gene-editing kit. Legal: `/legal/biofusion`.
- `[x]` Wisdom-tooth DPSC biomaterial (12 Sep 2026): autologous dental pulp stem cells expanded into a construct (`aeterna-dpsc-biomaterial`, 65,000 ACP) — licensed bioreactor only; not a full organ (organ print remains 250,000 ACP); not an FDA/CE cell therapy. Legal: `/legal/dpsc`.
- `[x]` Vascular Care+ (12 Sep 2026): anhydrous N2+O2 flow plus light-wave applicator (`aeterna-vascular-care-plus`, 54,000 ACP) — licensed phlebology/aesthetic partner only; not a thrombosis treatment; not a CE/FDA device; not a guaranteed varicose claim. Legal: `/legal/vascular-care-plus`.
- `[x]` Vascular Care (12 Sep 2026): ultrasound / radiofrequency / thermal applicator (`aeterna-vascular-care`, 58,000 ACP) — licensed phlebology/aesthetic partner only; not surgery; not a guaranteed vein-diameter claim. Legal: `/legal/vascular-care`.
- `[x]` Needle-free transdermal pistol (12 Sep 2026): aerosol actives plus carrier gas (`aeterna-transdermal-pistol`, 46,000 ACP) — licensed clinic partner only; not a prescription dispenser; not compounding; not a guaranteed dose. Legal: `/legal/transdermal`.
- `[x]` M-receptor delivery subscription (12 Sep 2026): patch / iontophoresis / inhaler / vagus-adjacent neuromodulation (`aeterna-m-receptor-subscription`, 12,000 ACP / month; 32,000 quarterly; 108,000 annual) — licensed clinic retainer only; not compounding; not a CE/FDA device; not a Parkinson / asthma / COPD / arrhythmia treatment claim. Legal: `/legal/m-receptor`.
- `[x]` Artificial oxygen carrier (12 Sep 2026): hemoglobin-vesicle or PFC-emulsion architecture literacy (`aeterna-oxygen-carrier`, 92,000 ACP) — licensed bioreactor / transfusion-medicine partner only; not a blood product; not compounding of hemoglobin or PFC; not a CE/FDA oxygen therapeutic; not a manufacturing SOP. Legal: `/legal/oxygen-carrier`.
- `[x]` Synthetic blood / Black Mamba architecture (12 Sep 2026): multi-layer HBOC/PFC + modified peptide literacy (`aeterna-synthetic-blood-mamba`, 98,000 ACP) — licensed bioreactor / transfusion-medicine partner only; not a blood product; not venom compounding; not a CE/FDA therapeutic; not a toxin or manufacturing SOP. Legal: `/legal/synthetic-blood-mamba`.
- `[x]` ADHD / СДВГ support brief (13 Sep 2026): licensed clinician / child psychiatry–neurology partner literacy (`aeterna-adhd-support`, 42,000 ACP) — not a diagnosis; not a prescription; not stimulant compounding; not a CE/FDA drug; not a guaranteed academic or financial outcome; “path to a billion” artwork is motivational literacy only. Legal: `/legal/adhd-support`.
- `[ ]` Variant browser / trait playground on vaulted VCF summaries (read-only annotation).
- No edit simulation that implies real wet-lab editing capability.

### Phase A4 — Partner network `[ ]`

- Verified clinics, escrow ACP until consult delivered.
- Mobile consent + PIN/biometrics step-up for vault unlock.

### Phase A5 — Economy `[ ]`

- Creator-listed genomic workflows under Vertical `AETERNA`.
- Insurance / employer longevity benefits rails (optional).

## API surface (MVP)

```
GET  /aeterna/status
POST /aeterna/vault
GET  /aeterna/vault
POST /aeterna/intents
GET  /aeterna/intents
GET  /organizations/{org_id}/aeterna/summary
POST /organizations/{org_id}/aeterna/partners
GET  /organizations/{org_id}/aeterna/partners
POST /organizations/{org_id}/aeterna/vault
GET  /organizations/{org_id}/aeterna/vault
POST /organizations/{org_id}/aeterna/intents
GET  /organizations/{org_id}/aeterna/intents
```

## Workflow slugs (catalog)

- `aeterna-dna-wellness-report`
- `aeterna-longevity-panel-brief`
- `aeterna-molecular-aging-profile` — **15-axis molecular aging brief** (blood-RNA / PCR panel metadata); not a single bio-age score
- `aeterna-pigmentation-consult-brief`
- `aeterna-telomere-panel-review`
- `aeterna-disease-risk-navigator`
- `aeterna-stem-cell-organ-print` — **250,000 ACP / organ**; autologous stem cells, wisdom-tooth DPSC fallback; licensed biochemical reactor partner only.
- `aeterna-mrna-reprogramming-brief` — **1,000,000 ACP**; partial reprogramming consult (mRNA-in-LNP literacy); USPTO eTurna notice-of-allowance citation only.
- `aeterna-vet-cat-cryo-restore` — **75,000 ACP**; feline tissue cryoconservator-restorer partner intake; conceptual architecture; licensed veterinarian only.
- `aeterna-vet-regen-pod` — **180,000 ACP**; canine VET REGEN POD organ-transplant / regeneration chamber pathway; conceptual architecture; licensed veterinarian only.
- `aeterna-vinci-light-chamber` — **48,000 ACP**; full-body photobiomodulation chamber (red / near-IR literacy + screened UVA); Leonardo sunlight-health framing; licensed phototherapy partner only; not a reconstructed invention and not a safe-tanning claim.
- `aeterna-microwave-body-contouring` — **52,000 ACP**; contact-cooled 2.45 / 5.8 GHz ISM applicator; licensed aesthetic/dermatology partner only; not liposuction, not a CE/FDA device, not a guaranteed fat-loss claim.
- `aeterna-dpsc-biomaterial` — **65,000 ACP**; autologous wisdom-tooth DPSC expanded into a biomaterial construct; licensed bioreactor only; not a full organ and not an FDA/CE cell therapy.
- `aeterna-biofusion-micromanipulation` — **88,000 ACP**; conceptual BioFusion micromanipulation chamber (IVF/ICSI, plant pollination, embryo observation, microorganism handling); licensed ART / agricultural / BSL-lab partner only; not a fertility clinic and not a gene-editing kit.
- `aeterna-vascular-care-plus` — **54,000 ACP**; anhydrous N2+O2 plus light-wave applicator; licensed phlebology/aesthetic partner only; not a thrombosis treatment and not a CE/FDA device.
- `aeterna-vascular-care` — **58,000 ACP**; ultrasound / radiofrequency / thermal applicator; licensed phlebology/aesthetic partner only; not surgery.
- `aeterna-transdermal-pistol` — **46,000 ACP**; needle-free aerosol plus carrier gas; licensed clinic partner only; not a prescription dispenser and not compounding.
- `aeterna-m-receptor-subscription` — **12,000 ACP / month** (32,000 quarterly; 108,000 annual); multimodal patch / iontophoresis / inhaler / vagus-adjacent neuromodulation; licensed clinic subscription retainer; not compounding and not a treatment claim.
- `aeterna-oxygen-carrier` — **92,000 ACP**; hemoglobin-vesicle or PFC-emulsion architecture literacy; licensed bioreactor / transfusion-medicine partner only; not a blood product, not compounding, not a CE/FDA oxygen therapeutic, not a manufacturing SOP.
- `aeterna-synthetic-blood-mamba` — **98,000 ACP**; synthetic-blood architecture with modified Black Mamba peptide literacy; licensed bioreactor / transfusion-medicine partner only; not a blood product, not venom compounding, not a CE/FDA therapeutic, not a toxin or manufacturing SOP.
- `aeterna-adhd-support` — **42,000 ACP**; ADHD / СДВГ support literacy; licensed clinician / child psychiatry–neurology partner only; not a diagnosis, not a prescription, not stimulant compounding, not a CE/FDA drug, not a guaranteed academic or financial outcome.

Bundle: `aeterna-longevity-pack` (2,500,000 ACP) — DNA wellness + molecular aging profile + longevity panel. Organ print is sold per organ, not inside the pack. The mRNA-reprogramming consult is sold separately.

Intent `molecular_aging_profile` defaults to `aeterna-molecular-aging-profile`. Intent `organ_bioprint` defaults to `aeterna-stem-cell-organ-print` and requires `budget_acp >= 250000`. Intent `partial_reprogramming_consult` defaults to `aeterna-mrna-reprogramming-brief` and requires `budget_acp >= 1000000`. Intent `vet_feline_cryo_restore` defaults to `aeterna-vet-cat-cryo-restore` (`>= 75000`). Intent `vet_canine_regen_pod` defaults to `aeterna-vet-regen-pod` (`>= 180000`). Intent `vinci_light_chamber` defaults to `aeterna-vinci-light-chamber` (`>= 48000`). Intent `microwave_body_contouring` defaults to `aeterna-microwave-body-contouring` (`>= 52000`). Intent `dpsc_biomaterial` defaults to `aeterna-dpsc-biomaterial` (`>= 65000`). Intent `biofusion_micromanipulation` defaults to `aeterna-biofusion-micromanipulation` (`>= 88000`). Intent `vascular_care_plus` defaults to `aeterna-vascular-care-plus` (`>= 54000`). Intent `vascular_care` defaults to `aeterna-vascular-care` (`>= 58000`). Intent `transdermal_pistol` defaults to `aeterna-transdermal-pistol` (`>= 46000`). Intent `m_receptor_subscription` defaults to `aeterna-m-receptor-subscription` (`>= 12000` per month). Intent `oxygen_carrier_brief` defaults to `aeterna-oxygen-carrier` (`>= 92000`). Intent `synthetic_blood_mamba_brief` defaults to `aeterna-synthetic-blood-mamba` (`>= 98000`). Intent `adhd_support_brief` defaults to `aeterna-adhd-support` (`>= 42000`). Vault source enum includes `venous_blood_rna` for panel hash registration.
