type Language = "en" | "ru" | "uk" | "de" | "zh-Hant";

type Tree = { [key: string]: string | Tree };

export const legalByLang: Record<Language, Tree> = {
  en: {
    lastUpdated: "Last updated: 12 September 2026.",
    privacyLink: "Privacy Notice",
    cookiesLink: "Cookie Policy",
    termsLink: "User Agreement",
    cyberLink: "Collective cyber defense",
    clarityLink: "CLARITY Act",
    acpLink: "ACP Whitepaper",
    riskLink: "Risk disclosure",
    refundsLink: "Payments & refunds",
    welcomeGrantLink: "Welcome grant",
    humanitarianLink: "Humanitarian aid",
    hubLink: "Legal center",
    complianceLink: "Compliance",
    contactLegal: "legal@ancap.cloud",
    contactPrivacy: "privacy@ancap.cloud",
    contactSupport: "support@ancap.cloud",
    hubKicker: "Legal center",
    hubTitle: "Legal information for ANCAP clients",
    hubIntro: "Clear terms for people and teams using ancap.cloud: agreements, privacy, cookies, payments, AI/crypto risks, and how to contact us.",
    hubCardTerms: "Binding rules for accounts, wallets, paid workflows, API use, creators, and prohibited conduct.",
    hubCardPrivacy: "What data we process, why, retention, your rights, and privacy contacts.",
    hubCardCookies: "Necessary vs optional storage and how consent works on this site.",
    hubCardRisk: "Honest disclosure: AI outputs, ACP utility nature, bridge/wallet risks, no guaranteed returns.",
    marketDataLink: "Market data",
    hubCardMarketData: "How ANCAP uses CoinGecko prices and AccuWeather conditions — indicative only.",
    footerMarketData: "Market data",
    researchRefsLink: "Research references",
    hubCardResearchRefs:
      "Third-party scientific instruments, mRNA/LNP patent journalism, Floquet bosonic-code PRL, quantum-info cites, and 2026 IT-gazelle / startup-market journalism (ZEISS Lightfield 4D, Daewoong eTurna USPTO allowance, Chalmers Huang–Du–Guo, iXBT Live, CNews/Spark-Interfax, Forbes/FRIИ) — trademarks stay with their owners; no affiliation.",
    footerResearchRefs: "Research refs",
    researchRefsKicker: "Third-party science",
    researchRefsTitle: "Research references and instrument citations",
    researchRefsIntro:
      "How ANCAP cites public third-party scientific instruments and technology notes. Downloads and trademarks remain with their owners.",
    rr1Title: "1. Purpose",
    rr1Body:
      "ANCAP may cite public product pages and technology notes as educational context for longevity, imaging, and AETERNA research workflows. Citations help users understand imaging modalities that partners may use. They are not an endorsement, distribution, or resale of third-party hardware.",
    rr2Title: "2. ZEISS Lightfield 4D",
    rr2Body:
      "ANCAP references ZEISS LSM Lightfield 4D — instant volumetric light-field microscopy for high-speed, gentle imaging of living samples — as public technical context. The ZEISS product page and technology note (Instant volume acquisition for high-speed and gentle imaging) are linked from this Legal center and from AETERNA. Gated thank-you or download pages after a ZEISS form are served by ZEISS under ZEISS terms.",
    rr3Title: "3. No affiliation or trademark license",
    rr3Body:
      "ZEISS, Carl Zeiss, Lightfield 4D, LSM, ZEN, and related marks are trademarks of Carl Zeiss AG, Carl Zeiss Microscopy GmbH, or their affiliates. ANCAP is not affiliated with, sponsored by, or endorsed by ZEISS. Nothing on ancap.cloud grants a trademark license or implies a commercial partnership unless a separate written agreement says otherwise.",
    rr4Title: "4. Downloads and hosting",
    rr4Body:
      "ANCAP does not host or redistribute ZEISS proprietary PDFs. We link to ZEISS-controlled URLs (product page, technology note guide, and official flyer assets). If a download requires registration on a ZEISS thank-you page, that processing is governed by ZEISS privacy and terms — not by ANCAP.",
    rr5Title: "5. Not medical or clinical advice",
    rr5Body:
      "Instrument citations do not create medical, diagnostic, or clinical advice. AETERNA and DNA/RNA bank features remain research/workflow tooling with their own compliance notes. Always verify partner licenses and local law before any clinical use.",
    rr6Title: "6. Quantum information / data-protection research (iXBT Live)",
    rr6Body:
      "ANCAP cites the public iXBT Live article “0 + 0 > 0: ИИ помог доказать невозможный квантовый парадокс в защите данных” (superadditivity of private capacity; AI-assisted discovery with Lean 4 verification) as educational context for the quantum-link digital SIM desk. ANCAP engineering principles P1–P8 (private vs ordinary capacity; classical 0+0=0; quantum 0+0>0; joint non-separable decode; linear/quadratic scale separation; AI propose / machines verify; multi-path mesh) live on /quantum-sim and in docs/QUANTUM_PRIVATE_CAPACITY_PRINCIPLES.md. The article is third-party journalism; ANCAP is not affiliated with iXBT. Citation does not imply ownership of QKD hardware or a guaranteed private capacity on any ANCAP channel.",
    rr7Title: "7. Daewoong / eTurna mRNA LNP (USPTO notice of allowance)",
    rr7Body:
      "As of 11 September 2026, ANCAP cites public journalism that Daewoong Pharmaceutical received a USPTO notice of allowance (announced 27 August 2026) for ionizable-lipid structures used in the eTurna lipid-nanoparticle (LNP) platform to deliver mRNA encoding partial cellular-reprogramming factors (Epigenetic Reprogramming of Aging / ERA; assets acquired from Turn Biotechnologies). The cited application title is “Lipid Structures and Compositions Comprising the Same.” A notice of allowance is not a fully issued U.S. patent and is not FDA/EMA marketing authorization. Reported work remains preclinical (human dermal fibroblasts / aged-tissue assays in the patent specification). ANCAP is not affiliated with Daewoong Pharmaceutical, Turn Biotechnologies, HanAll Biopharma, or eTurna. Citation is educational context for AETERNA licensed-partner consult workflows only. ANCAP does not host patent PDFs, lipid recipes, mRNA sequences, LNP formulation steps, or any wet-lab protocol.",
    rr8Title: "8. Chalmers Floquet bosonic codes / quantum lattice gates (PRL 2026)",
    rr8Body:
      "As of 11 September 2026, ANCAP cites public journalism (Nauka TV, 10 September 2026) of the theoretical Physical Review Letters paper “Single-Period Floquet Control of Bosonic Codes with Quantum Lattice Gates” (Huang, Du, Guo; DOI 10.1103/tnb8-3m8m). Reported idea: encode in microwave/resonator bosonic codes and implement quantum lattice gates in one Floquet drive period instead of thousands of adiabatic cycles (~1000× fewer periods on that axis). Work is theoretical; authors discuss a future check on Chalmers’ developing 100-qubit superconducting platform. ANCAP is not affiliated with Chalmers University of Technology, Tianjin University, APS/PRL, or Nauka TV. Citation is literacy for the /tech stack and /quantum-sim compute layer — not a claim that ANCAP operates a quantum computer, not a speed SLA, and not an error-correction warranty.",
    rr9Title: "9. Startup investment desk — IT gazelle / B2B retail & AI market cites (2026)",
    rr9Body:
      "As of 12 September 2026, ANCAP cites public market journalism for the /startups desk: CNews (13 Aug 2026) on Spark-Interfax ICT gazelles 2021–2025 (leader OOO «Джиэй Тэктим» / GA Tech Team serving «Золотое яблоко», ~112.71% CAGR, single-client concentration); Forbes/FRIИ small-IT gazelles (farm/herd software, AI tutors); Sky.pro idea ranges for AI and SECaaS; businessmens.ru 2026 agrotech/production-IT niches. These are third-party rankings and idea sketches, not ANCAP forecasts, not a securities offering, not equity in named issuers, and not investment advice. ANCAP is not affiliated with CNews, Spark-Interfax, Forbes, FRIИ, Sky.pro, businessmens.ru, GA Tactic, or Zolotoe Yabloko. ACP on /startups pays for research briefs and licensed-partner handoffs only.",
    researchRefsLinksTitle: "Canonical research links",
    researchRefsLinksBody:
      "Use these public URLs. Prefer the publisher page if a deep link changes. ZEISS imaging notes, Daewoong/eTurna USPTO-allowance journalism, Chalmers/PRL Floquet bosonic-code coverage, the iXBT quantum-info article, and 2026 IT-gazelle / startup-market journalism are cited for literacy only.",
    cryoLink: "Cryonics & constitutions",
    hubCardCryo:
      "Cryopreservation desk, tardigrade-inspired research framing, partners KrioRus and Tomorrow.bio, veterinary tissue-cryo / VET REGEN POD rails, and constitutional jurisdiction notes as of this notice date.",
    footerCryo: "Cryonics",
    cryoKicker: "Legal / longevity",
    cryoTitle: "Cryopreservation, partners, and constitutional limits",
    cryoIntro:
      "How ANCAP frames cryonics intents, licensed partners, tardigrade-inspired research protocols, and veterinary tissue / organ rails under applicable constitutions and health law as of 12 September 2026.",
    cryo1Title: "1. Platform role",
    cryo1Body:
      "ANCAP provides ACP-settled intents, briefs, and partner handoff tooling. ANCAP does not operate cryonics storage facilities, clinical labs, or emergency SST teams. Physical cryopreservation is performed only by licensed partners under their own contracts and local law.",
    cryo2Title: "2. Partners — КриоРус (KrioRus) and Tomorrow.bio",
    cryo2Body:
      "Desk listings currently include КриоРус (KrioRus, RU) and Tomorrow.bio (EU). A listing is a licensed-partner handoff rail, not a clinical, ethical, or regulatory audit. Partner websites and agreements govern eligibility, consent, standby, and storage. Public reporting has questioned some cryonics providers’ methods and ethics; Tomorrow.bio remains early-stage on long-horizon efficacy. ANCAP does not endorse revival, wrap cryonics as an RWA yield product, or treat a desk listing as proof of life extension.",
    cryo3Title: "3. Tardigrade (тихоходки) blood / cryptobiosis",
    cryo3Body:
      "References to tardigrade blood or cryptobiosis are research-inspired protocol metadata for partner discussion. They are not an approved human transfusion product, drug, or DIY medical protocol. Do not attempt self-administration.",
    cryo4Title: "4. Constitutions and supreme law (notice date)",
    cryo4Body:
      "Services are offered subject to the constitutions and supreme laws of the jurisdictions where users and licensed partners operate, as in force on 11 September 2026 — including the Constitution of the Russian Federation, the Basic Law (Grundgesetz) of the Federal Republic of Germany, the Constitution of Ukraine, and applicable EU and U.S. constitutional / fundamental-rights frameworks. Where a constitution or statute prohibits a cryonics activity, that prohibition controls; ANCAP will not facilitate unlawful acts.",
    cryo5Title: "5. Not medical advice; user reviews",
    cryo5Body:
      "Catalog copy and AI/user reviews are informational. They are not medical, legal, or investment advice. Mandatory consumer and patient rights that cannot be waived remain unaffected.",
    cryo6Title: "6. Veterinary tissue cryopreservation (feline)",
    cryo6Body:
      "The feline tissue cryoconservator-restorer listing is a licensed-veterinary-partner intake brief. ANCAP does not manufacture the chamber, does not practice veterinary medicine, and does not claim that frozen tissue will restore life, regenerate an organ, or succeed at any stated survival rate. Harvest, freeze, store, thaw, and any reimplantation occur only under a licensed veterinarian and applicable animal-health law.",
    cryo7Title: "7. Veterinary organ regeneration chamber (canine / VET REGEN POD)",
    cryo7Body:
      "VET REGEN POD is the name of a conceptual canine organ-transplant and regeneration chamber illustrated for partner literacy. Infographic figures (including any survival percentage or “faster than natural regeneration” claim) are not ANCAP product claims, not clinical evidence, and not a warranty. Physical procedures occur only in a licensed veterinary operating environment. See /legal/vet-regen.",
    cryo8Title: "8. Scrutiny, speculation, and what ACP pays",
    cryo8Body:
      "Cryonics partners remain under public and regulatory scrutiny; listing them does not clear that record. ACP on this desk pays a consult/intake brief and a handoff, not a tokenized person, not a DeFi yield on revival, and not a security. Companion literary-license auctions are a separate nascent IP desk: published genre medians are comparables, not NAV, and pump bids fail closed. See /literary and /legal/risk.",
    vetRegenLink: "Veterinary organ rails",
    hubCardVetRegen:
      "Feline tissue cryoconservator-restorer and canine VET REGEN POD: conceptual partner architecture, licensed veterinarians only, no resurrection or survival-rate warranty.",
    vetRegenKicker: "Legal / veterinary",
    vetRegenTitle: "Veterinary organ rails — cryoconservator and VET REGEN POD",
    vetRegenIntro:
      "How ANCAP frames companion-animal tissue banking and organ-regeneration partner rails as of 12 September 2026. These pages sell ACP-settled consult and intake briefs, not hardware and not veterinary treatment.",
    vr1Title: "1. Platform role",
    vr1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching for AETERNA veterinary organ rails. ANCAP does not operate veterinary clinics, does not manufacture cryochambers or VET REGEN POD hardware, does not issue veterinary medicinal products, and does not perform surgery on animals.",
    vr2Title: "2. Not a marketed medical device",
    vr2Body:
      "Infographics of the feline cryoconservator-restorer and the canine VET REGEN POD are conceptual architecture for partner discussion. They are not an EU MDR / IVDR device brochure, not an FDA 510(k) or New Animal Drug Application, not an EAEU registered veterinary device, and not a CE-marked product sold by ANCAP. Listing a workflow does not create a device placing-on-the-market.",
    vr3Title: "3. Forbidden outcome claims",
    vr3Body:
      "ANCAP does not claim return to life, resurrection, immortality, a numeric survival rate (including any “up to 98%” figure that may appear on an illustration), or regeneration “2–5× faster than natural.” Tissue cryopreservation can preserve some cells under partner protocols; whole-organ vitrification, bioprint, transplant, and functional recovery remain uncertain and partner-dependent. Do not treat illustrations as clinical evidence.",
    vr4Title: "4. Licensed veterinarians only",
    vr4Body:
      "Harvest, anesthesia, transplant, immunomodulation, stem-cell stimulation, and aftercare are veterinary acts. They may be performed only by a person licensed to practice veterinary medicine in the relevant jurisdiction (for example a DVM / veterinarian under applicable practice acts). Owners must not attempt home cryo, DIY bioreactors, or unlicensed cell culture.",
    vr5Title: "5. Animal-health and welfare law (notice date)",
    vr5Body:
      "Services are offered subject to animal-health and welfare law where the owner and the licensed partner operate, as in force on 12 September 2026 — including the Russian Federation law on veterinary medicine, EU Veterinary Medicinal Products Regulation (EU) 2019/6, Directive 2010/63/EU where research animals are involved, U.S. state veterinary practice acts and FDA Center for Veterinary Medicine rules, German TierSchG / TAppV, and corresponding Ukrainian veterinary legislation. Where a statute prohibits an activity, that prohibition controls.",
    vr6Title: "6. Not veterinary, medical, or pharmacological advice",
    vr6Body:
      "Catalog copy, infographics, workflow outputs, and reviews are informational. They are not a diagnosis, prescription, treatment plan, or guarantee for any animal. Mandatory consumer and animal-owner rights that cannot be waived remain unaffected.",
    vr7Title: "7. Pet health data",
    vr7Body:
      "If you submit identifiers or clinical history about an animal, treat them as sensitive. Do not upload regulated veterinary records without a lawful basis. ANCAP vaults remain hash-first: do not upload raw genomic blobs. Partner clinics process clinical data under their own privacy notices.",
    vr8Title: "8. Relationship to human organ print",
    vr8Body:
      "Human stem-cell organ print (250,000 ACP per organ) remains a separate licensed-bioreactor handoff. Veterinary rails (75,000 ACP feline cryo intake; 180,000 ACP canine VET REGEN POD pathway) do not authorize human clinical use of the illustrated chambers and do not change AETERNA’s ban on DIY CRISPR, gene synthesis, or LNP recipes.",
    vr9Title: "9. Payments",
    vr9Body:
      "ACP paid for these workflows buys a consult / intake brief and partner match — not title to hardware, not a guaranteed surgical slot, and not a refundable clinical outcome. Refunds follow /legal/refunds.",
    vr10Title: "10. Contact",
    vr10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#vet-regen and /cryo. Related notices: /legal/cryo-constitution, /legal/terms, /legal/risk.",
    lightChamberLink: "Vinci light chamber",
    hubCardLightChamber:
      "Full-body photobiomodulation chamber: Leonardo sunlight literacy, licensed phototherapy partner only, no safe-tanning or CE/FDA device claim.",
    lightChamberKicker: "Legal / phototherapy",
    lightChamberTitle: "Vinci light chamber — photobiomodulation partner rail",
    lightChamberIntro:
      "How ANCAP frames the full-body LED / UVA / red / near-IR chamber as of 12 September 2026. These pages sell ACP-settled consult and session-protocol briefs, not hardware and not a phototherapy treatment.",
    lc1Title: "1. Platform role",
    lc1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching for the AETERNA Vinci light chamber. ANCAP does not operate dermatology clinics, does not manufacture LED/UVA pods, does not issue medical devices, and does not administer light sessions.",
    lc2Title: "2. Not a marketed medical device",
    lc2Body:
      "The infographic is conceptual architecture for partner discussion. It is not an EU MDR device brochure, not an FDA 510(k) or PMA, not a CE-marked tanning or phototherapy product sold by ANCAP, and not a reconstructed Leonardo invention. Listing a workflow does not place a device on the market.",
    lc3Title: "3. Forbidden outcome claims",
    lc3Body:
      "ANCAP does not claim safe tanning, a guaranteed tan, vitamin-D treatment, collagen increase, wound closure, nerve regeneration, anti-aging, or a numeric success rate. Red / near-IR photobiomodulation (including cytochrome-c oxidase / ATP framing around 600–950 nm) is public research literacy, not a product effect. UV (including UVA 320–400 nm on the illustration) remains a known skin-cancer risk class.",
    lc4Title: "4. Licensed clinicians only",
    lc4Body:
      "Phototherapy, UV exposure, and related aftercare are clinical acts. They may be performed only by a person licensed to practice in the relevant jurisdiction (dermatology, phototherapy, or other applicable practice acts). Users must not build home LED arrays, tanning beds, or DIY UV cabinets from these pages.",
    lc5Title: "5. Screening and contraindications",
    lc5Body:
      "Partner protocols must screen for photosensitivity, melanoma or atypical-mole history, photosensitizing drugs, pregnancy where relevant, and skin phototype. The rotating platform, cooling, and sensor callouts on the infographic are architecture notes, not a validated safety system ANCAP certifies.",
    lc6Title: "6. Not medical advice",
    lc6Body:
      "Catalog copy, infographics, Leonardo attributions, workflow outputs, and reviews are informational. They are not a diagnosis, prescription, or treatment plan. A quotation or paraphrase associated with Leonardo is historical colour — not a verified specification for this chamber.",
    lc7Title: "7. Health data",
    lc7Body:
      "If you submit skin history or identifiers, treat them as sensitive. Do not upload medical records without a lawful basis. Partner clinics process clinical data under their own privacy notices.",
    lc8Title: "8. Relationship to other AETERNA rails",
    lc8Body:
      "Human stem-cell organ print, mRNA-reprogramming consults, and veterinary organ rails remain separate. The Vinci light chamber does not authorize DIY CRISPR, LNP recipes, or unlicensed phototherapy hardware, and does not change AETERNA’s ban on diagnostic claims.",
    lc9Title: "9. Payments",
    lc9Body:
      "ACP paid for this workflow buys a consult / session-protocol brief and partner match — not title to hardware, not a guaranteed clinic slot, and not a refundable cosmetic outcome. Refunds follow /legal/refunds.",
    lc10Title: "10. Contact",
    lc10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#vinci-light. Related notices: /legal/terms, /legal/risk, /legal/research-refs.",
    bodyContouringLink: "Microwave body contouring",
    hubCardBodyContouring:
      "Contact-cooled 2.45 / 5.8 GHz applicator: licensed aesthetic/dermatology partner only, not liposuction, not a CE/FDA device, not a guaranteed fat-loss claim.",
    bodyContouringKicker: "Legal / aesthetic",
    bodyContouringTitle: "Microwave body contouring — licensed aesthetic partner rail",
    bodyContouringIntro:
      "How ANCAP frames contact-cooled microwave body contouring as of 12 September 2026. These pages sell ACP-settled consult and session-protocol briefs, not hardware and not a fat-reduction treatment.",
    bc1Title: "1. Platform role",
    bc1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching for AETERNA microwave body contouring. ANCAP does not operate aesthetic clinics, does not manufacture microwave carts or applicators, does not issue medical devices, and does not administer body-contouring sessions.",
    bc2Title: "2. Not a marketed medical device",
    bc2Body:
      "The infographic is conceptual architecture for partner discussion. It is not an EU MDR device brochure, not an FDA 510(k) or PMA, not a CE-marked aesthetic product sold by ANCAP, and not a home microwave-antenna recipe. Listing a workflow does not place a device on the market.",
    bc3Title: "3. Forbidden outcome claims",
    bc3Body:
      "ANCAP does not claim liposuction-equivalent fat removal, a guaranteed centimetre loss, weight-loss, adipocyte destruction, blebbing, macrophage clearance, lymphatic drainage, or a numeric success rate. 2.45 GHz / 5.8 GHz ISM bands are public radio-spectrum literacy, not a verified device specification ANCAP certifies.",
    bc4Title: "4. Licensed clinicians only",
    bc4Body:
      "Microwave aesthetic procedures and related aftercare are clinical acts. They may be performed only by a person licensed to practice in the relevant jurisdiction (aesthetic medicine, dermatology, or other applicable practice acts). Users must not build home microwave applicators or antenna arrays from these pages.",
    bc5Title: "5. Screening and contraindications",
    bc5Body:
      "Partner protocols must screen for implants, pacemakers and other implanted electronics, pregnancy, metal in the treatment field, thermal injury history, and other clinic-defined contraindications. Contact cooling on the infographic is an architecture note, not a validated no-burn safety system ANCAP certifies.",
    bc6Title: "6. Not medical advice",
    bc6Body:
      "Catalog copy, infographics, workflow outputs, and reviews are informational. They are not a diagnosis, prescription, or treatment plan.",
    bc7Title: "7. Health data",
    bc7Body:
      "If you submit identifiers or clinical history, treat them as sensitive. Do not upload medical records without a lawful basis. Partner clinics process clinical data under their own privacy notices.",
    bc8Title: "8. Relationship to other AETERNA rails",
    bc8Body:
      "Human stem-cell organ print, mRNA-reprogramming consults, veterinary organ rails, and the Vinci light chamber remain separate. Microwave body contouring does not authorize DIY CRISPR, LNP recipes, unlicensed microwave hardware, or liposuction, and does not change AETERNA’s ban on diagnostic claims.",
    bc9Title: "9. Payments",
    bc9Body:
      "ACP paid for this workflow buys a consult / session-protocol brief and partner match — not title to hardware, not a guaranteed clinic slot, and not a refundable cosmetic outcome. Refunds follow /legal/refunds.",
    bc10Title: "10. Contact",
    bc10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#microwave-body. Related notices: /legal/terms, /legal/risk, /legal/research-refs.",
    biofusionLink: "BioFusion chamber",
    hubCardBiofusion:
      "Micromanipulation chamber: licensed ART / agricultural / BSL-lab partner only. Not a fertility clinic, not a guaranteed embryo or pregnancy, not a gene-editing kit.",
    biofusionKicker: "Legal / lab",
    biofusionTitle: "BioFusion micromanipulation chamber — licensed lab partner rail",
    biofusionIntro:
      "How ANCAP frames the BioFusion micromanipulation chamber as of 12 September 2026. These pages sell ACP-settled consult and session-protocol briefs, not hardware, not IVF treatment, and not a gene-editing service.",
    bf1Title: "1. Platform role",
    bf1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching for the AETERNA BioFusion chamber. ANCAP does not operate fertility clinics, agricultural stations, or BSL labs; does not manufacture the cart; does not create, freeze, or transfer embryos; and does not administer ICSI.",
    bf2Title: "2. Not a marketed medical device",
    bf2Body:
      "The infographic is conceptual architecture for partner discussion. It is not an EU MDR or FDA device brochure, not a CE-marked IVF workstation sold by ANCAP, and not a reconstructed BioFusion product. Listing a workflow does not place a device on the market.",
    bf3Title: "3. Forbidden outcome claims",
    bf3Body:
      "ANCAP does not claim a guaranteed pregnancy, live birth, viable zygote, plant hybrid, or microorganism strain. IVF/ICSI, plant pollination, embryo observation, and synthetic-biology callouts are protocol literacy. Infographic 'genetic manipulations' copy is not a CRISPR, gene-synthesis, or pathogen recipe.",
    bf4Title: "4. Licensed operators only",
    bf4Body:
      "Assisted reproduction is a clinical act under the relevant jurisdiction. Plant hybridization and microorganism handling are laboratory acts. They may be performed only by licensed ART clinicians, licensed agricultural researchers, or licensed BSL-lab operators. Users must not build home ICSI rigs, UV cabinets, or DIY micromanipulators from these pages.",
    bf5Title: "5. Screening and law",
    bf5Body:
      "Partner protocols must follow local ART, embryo-research, GMO, and biosafety rules, including consent, gamete provenance, and prohibited genetic modification. Temperature, pH, O2, HEPA/UV, and 0.1 µm callouts are architecture notes, not a validated sterile system ANCAP certifies.",
    bf6Title: "6. Not medical advice",
    bf6Body:
      "Catalog copy, infographics, workflow outputs, and reviews are informational. They are not a diagnosis, fertility plan, or treatment.",
    bf7Title: "7. Health and genetic data",
    bf7Body:
      "If you submit identifiers, gamete history, or clinical notes, treat them as sensitive. Do not upload medical records without a lawful basis. Partner clinics process clinical data under their own privacy notices. ANCAP vaults remain hash-first.",
    bf8Title: "8. Relationship to other AETERNA rails",
    bf8Body:
      "Organ print, DPSC biomaterial, mRNA-reprogramming consults, veterinary rails, the Vinci light chamber, and microwave body contouring remain separate. BioFusion does not authorize DIY CRISPR, LNP recipes, unlicensed IVF hardware, or pathogen work, and does not change AETERNA’s ban on diagnostic claims.",
    bf9Title: "9. Payments",
    bf9Body:
      "ACP paid for this workflow buys a consult / session-protocol brief and partner match — not title to hardware, not a guaranteed clinic slot, and not a refundable clinical outcome. Refunds follow /legal/refunds.",
    bf10Title: "10. Contact",
    bf10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#biofusion. Related notices: /legal/dpsc, /legal/terms, /legal/risk.",
    dpscLink: "DPSC biomaterial",
    hubCardDpsc:
      "Wisdom-tooth dental pulp stem cells expanded into a biomaterial construct: licensed bioreactor only, not a full organ, not an FDA/CE cell therapy.",
    dpscKicker: "Legal / bioreactor",
    dpscTitle: "Wisdom-tooth DPSC biomaterial — licensed bioreactor rail",
    dpscIntro:
      "How ANCAP frames autologous wisdom-tooth dental pulp stem cell (DPSC) biomaterial as of 12 September 2026. These pages sell ACP-settled consult briefs, not cell therapy and not a home culture kit.",
    dp1Title: "1. Platform role",
    dp1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-bioreactor matching. ANCAP does not extract teeth, culture cells, print tissue, or practice dentistry or regenerative medicine.",
    dp2Title: "2. Not a marketed cell therapy",
    dp2Body:
      "This SKU is not an FDA BLA, not an EMA ATMP, not a CE-marked cell product, and not a guaranteed organ. Listing a workflow does not place a therapy on the market.",
    dp3Title: "3. Forbidden outcome claims",
    dp3Body:
      "ANCAP does not claim a finished organ, a numeric regeneration rate, or that DPSC will become any named tissue. Full organ print remains a separate 250,000 ACP SKU.",
    dp4Title: "4. Licensed labs only",
    dp4Body:
      "Cell expansion and biomaterial fabrication are laboratory acts. They may be performed only by a licensed biochemical reactor / cell-processing partner. Users must not culture DPSC at home from these pages.",
    dp5Title: "5. Consent and source",
    dp5Body:
      "Partner protocols must document autologous provenance, dental consent, and infection screening. Wisdom-tooth harvest is a clinical act under a licensed dentist or oral surgeon.",
    dp6Title: "6. Not medical advice",
    dp6Body:
      "Catalog copy and workflow outputs are informational. They are not a diagnosis, graft plan, or treatment.",
    dp7Title: "7. Health data",
    dp7Body:
      "Treat dental and cellular identifiers as sensitive. Do not upload records without a lawful basis. Partner labs use their own privacy notices.",
    dp8Title: "8. Relationship to organ print",
    dp8Body:
      "DPSC is also the fallback cell source for aeterna-stem-cell-organ-print (250,000 ACP / organ). Buying this 65,000 ACP biomaterial SKU does not include an organ. BioFusion, light chamber, and other AETERNA rails remain separate.",
    dp9Title: "9. Payments",
    dp9Body:
      "ACP paid for this workflow buys a consult brief and partner match — not title to cells, hardware, or a guaranteed construct. Refunds follow /legal/refunds.",
    dp10Title: "10. Contact",
    dp10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#dpsc-biomaterial and /aeterna#organ-print. Related notices: /legal/biofusion, /legal/terms, /legal/risk.",
    vascularPlusLink: "Vascular Care+",
    hubCardVascularPlus:
      "Anhydrous N2+O2 plus light-wave applicator: licensed phlebology/aesthetic partner only. Not a thrombosis treatment, not a CE/FDA device, not a guaranteed varicose claim.",
    vascularPlusKicker: "Legal / phlebology",
    vascularPlusTitle: "Vascular Care+ — licensed phlebology partner rail",
    vascularPlusIntro:
      "How ANCAP frames Vascular Care+ (anhydrous N2+O2 plus light-wave) as of 12 September 2026. These pages sell ACP-settled consult briefs, not hardware and not a vein treatment.",
    vp1Title: "1. Platform role",
    vp1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not operate vein clinics, does not manufacture carts or gas cylinders, does not sell medical gases, and does not administer vascular sessions.",
    vp2Title: "2. Not a marketed medical device",
    vp2Body:
      "The infographic is conceptual architecture. It is not an EU MDR or FDA brochure, not a CE-marked vascular product sold by ANCAP, and not a home gas-applicator recipe.",
    vp3Title: "3. Forbidden outcome claims",
    vp3Body:
      "ANCAP does not claim a varicose cure, oedema clearance, diabetic-angiopathy treatment, thrombosis treatment, or a numeric success rate. Before/after images are protocol literacy.",
    vp4Title: "4. Licensed clinicians only",
    vp4Body:
      "Vascular and aesthetic procedures are clinical acts. Users must not build home gas or light applicators from these pages. Deep-vein thrombosis and pulmonary embolism are medical emergencies — seek emergency care, not this catalog.",
    vp5Title: "5. Screening",
    vp5Body:
      "Partner protocols must screen for DVT, implants, pregnancy, open wounds, and other clinic-defined contraindications. Gas-flow and temperature callouts are architecture notes, not a certified safety system.",
    vp6Title: "6. Not medical advice",
    vp6Body:
      "Catalog copy and infographics are informational. They are not a diagnosis or treatment plan.",
    vp7Title: "7. Health data",
    vp7Body:
      "Treat identifiers and clinical history as sensitive. Do not upload records without a lawful basis.",
    vp8Title: "8. Relationship to other rails",
    vp8Body:
      "Vascular Care (ultrasound/RF), the transdermal pistol, microwave contouring, and other AETERNA rails remain separate. This SKU does not authorize unlicensed hardware or diagnostic claims.",
    vp9Title: "9. Payments",
    vp9Body:
      "ACP buys a consult / session-protocol brief and partner match — not title to hardware and not a refundable clinical outcome. Refunds follow /legal/refunds.",
    vp10Title: "10. Contact",
    vp10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#vascular-care-plus. Related notices: /legal/vascular-care, /legal/transdermal, /legal/terms, /legal/risk.",
    vascularLink: "Vascular Care",
    hubCardVascular:
      "Ultrasound / radiofrequency / thermal applicator: licensed phlebology/aesthetic partner only. Not surgery, not a CE/FDA device, not a guaranteed vein result.",
    vascularKicker: "Legal / phlebology",
    vascularTitle: "Vascular Care — licensed phlebology partner rail",
    vascularIntro:
      "How ANCAP frames Vascular Care (ultrasound / RF / heat) as of 12 September 2026. These pages sell ACP-settled consult briefs, not hardware and not a vein treatment.",
    vu1Title: "1. Platform role",
    vu1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not operate vein clinics, does not manufacture applicators, and does not administer sessions.",
    vu2Title: "2. Not a marketed medical device",
    vu2Body:
      "The infographic is conceptual architecture. It is not an EU MDR or FDA brochure and not a CE-marked product sold by ANCAP.",
    vu3Title: "3. Forbidden outcome claims",
    vu3Body:
      "ANCAP does not claim surgery-equivalent vein closure, a guaranteed diameter change, oedema clearance, or a numeric success rate.",
    vu4Title: "4. Licensed clinicians only",
    vu4Body:
      "Ultrasound, radiofrequency, and thermal aesthetic or phlebology acts are clinical. Users must not build home RF or ultrasound arrays from these pages.",
    vu5Title: "5. Screening",
    vu5Body:
      "Partner protocols must screen for implants, pacemakers, pregnancy, thermal injury history, and other clinic-defined contraindications.",
    vu6Title: "6. Not medical advice",
    vu6Body:
      "Catalog copy is informational. It is not a diagnosis or treatment plan.",
    vu7Title: "7. Health data",
    vu7Body:
      "Treat identifiers and clinical history as sensitive. Do not upload records without a lawful basis.",
    vu8Title: "8. Relationship to other rails",
    vu8Body:
      "Vascular Care+ (gas/light), the transdermal pistol, and microwave contouring remain separate.",
    vu9Title: "9. Payments",
    vu9Body:
      "ACP buys a consult brief and partner match — not hardware title and not a refundable clinical outcome. Refunds follow /legal/refunds.",
    vu10Title: "10. Contact",
    vu10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#vascular-care. Related notices: /legal/vascular-care-plus, /legal/transdermal, /legal/terms, /legal/risk.",
    transdermalLink: "Transdermal pistol",
    hubCardTransdermal:
      "Needle-free aerosol plus carrier gas: licensed clinic partner only. Not a prescription dispenser, not compounding, not a guaranteed dose.",
    transdermalKicker: "Legal / clinic",
    transdermalTitle: "Needle-free transdermal pistol — licensed clinic partner rail",
    transdermalIntro:
      "How ANCAP frames the needle-free transdermal pistol as of 12 September 2026. These pages sell ACP-settled consult briefs, not hardware, not drugs, and not a mesotherapy kit.",
    td1Title: "1. Platform role",
    td1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not manufacture pistols, does not compound or dispense drugs, and does not administer injections.",
    td2Title: "2. Not a marketed medical device",
    td2Body:
      "The infographic is conceptual architecture. It is not an EU MDR or FDA brochure and not a CE-marked injector sold by ANCAP.",
    td3Title: "3. Forbidden outcome claims",
    td3Body:
      "ANCAP does not claim a guaranteed transdermal dose, varicose result, fat reduction, cosmetic rejuvenation, or joint therapy.",
    td4Title: "4. Licensed clinicians only",
    td4Body:
      "Transdermal delivery of actives is a clinical act. Users must not build home jet injectors or mesotherapy kits from these pages.",
    td5Title: "5. Lawful substances",
    td5Body:
      "Partner protocols must use only substances lawful in the clinic's jurisdiction. ANCAP does not publish compound recipes or dosing tables.",
    td6Title: "6. Not medical advice",
    td6Body:
      "Catalog copy is informational. It is not a prescription or treatment plan.",
    td7Title: "7. Health data",
    td7Body:
      "Treat identifiers and clinical history as sensitive. Do not upload records without a lawful basis.",
    td8Title: "8. Relationship to other rails",
    td8Body:
      "Vascular Care rails and microwave contouring remain separate. This SKU does not authorize compounding or unlicensed injectables.",
    td9Title: "9. Payments",
    td9Body:
      "ACP buys a consult brief and partner match — not a drug product and not a refundable cosmetic outcome. Refunds follow /legal/refunds.",
    td10Title: "10. Contact",
    td10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#transdermal. Related notices: /legal/vascular-care-plus, /legal/vascular-care, /legal/terms, /legal/risk.",
    mReceptorLink: "M-receptor subscription",
    hubCardMReceptor:
      "Licensed-clinic subscription for patch, iontophoresis, inhaler, and vagus-adjacent neuromodulation. Not compounding, not a CE/FDA device, not a treatment claim.",
    mReceptorKicker: "Legal / clinic / subscription",
    mReceptorTitle: "M-receptor delivery subscription — licensed clinic partner rail",
    mReceptorIntro:
      "How ANCAP frames the M-receptor multimodal subscription as of 12 September 2026. These pages sell ACP-settled period retainers, not hardware, not drug cartridges, and not a home kit.",
    mr1Title: "1. Platform role",
    mr1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not manufacture modules, does not compound or dispense muscarinic agonists or antagonists (including scopolamine), and does not operate a neurology, pulmonology, cardiology, GI, or ophthalmology clinic.",
    mr2Title: "2. Not a marketed medical device",
    mr2Body:
      "The infographic is conceptual architecture. It is not an EU MDR or FDA brochure and not a CE-marked patch, iontophoresis wrist, inhaler, or vagus stimulator sold by ANCAP.",
    mr3Title: "3. Forbidden outcome claims",
    mr3Body:
      "ANCAP does not claim treatment of Parkinson disease, asthma, COPD, bronchospasm, arrhythmia, bradycardia, glaucoma, intraocular pressure, GI motility, or cognitive improvement.",
    mr4Title: "4. Licensed clinicians only",
    mr4Body:
      "Patch, iontophoresis, inhalation, and neuromodulation sessions are clinical. Users must not build home iontophoresis, nebulizer-drug, or vagus-stimulator kits from these pages.",
    mr5Title: "5. Lawful substances and M1–M5 literacy",
    mr5Body:
      "M1–M5 tables on the infographic are receptor literacy, not a dosing guide. Partner protocols must use only substances lawful in the clinic's jurisdiction. ANCAP does not publish compound recipes.",
    mr6Title: "6. Not medical advice",
    mr6Body:
      "Catalog copy is informational. It is not a diagnosis, prescription, or treatment plan.",
    mr7Title: "7. Health data",
    mr7Body:
      "Treat identifiers and clinical history as sensitive. Do not upload records without a lawful basis.",
    mr8Title: "8. Relationship to other rails",
    mr8Body:
      "The transdermal pistol, Vascular Care rails, and microwave contouring remain separate. This subscription does not authorize compounding or unlicensed devices.",
    mr9Title: "9. Payments",
    mr9Body:
      "ACP buys a licensed-clinic period retainer (12,000 monthly / 32,000 quarterly / 108,000 annual) and a partner match — not hardware title, not a drug cartridge, and not a refundable clinical outcome. Refunds follow /legal/refunds.",
    mr10Title: "10. Contact",
    mr10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#m-receptor. Related notices: /legal/transdermal, /legal/terms, /legal/risk.",
    oxygenCarrierLink: "Oxygen carrier",
    hubCardOxygenCarrier:
      "Licensed bioreactor / transfusion-medicine brief for hemoglobin-vesicle or PFC-emulsion architecture. Not a blood product, not compounding, not a CE/FDA oxygen therapeutic.",
    oxygenCarrierKicker: "Legal / bioreactor / transfusion literacy",
    oxygenCarrierTitle: "Artificial oxygen carrier — licensed bioreactor partner rail",
    oxygenCarrierIntro:
      "How ANCAP frames the artificial oxygen-transfer SKU as of 12 September 2026. These pages sell ACP-settled consult briefs, not blood products, not emulsions, and not a home kit.",
    ox1Title: "1. Platform role",
    ox1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not manufacture hemoglobin vesicles or PFC emulsions, does not compound blood substitutes, and does not operate a transfusion or biomanufacturing plant.",
    ox2Title: "2. Not a blood product",
    ox2Body:
      "The infographic is conceptual architecture. It is not an EU MDR or FDA brochure and not a CE-marked oxygen therapeutic, HBOC, or PFC emulsion sold by ANCAP.",
    ox3Title: "3. Forbidden outcome claims",
    ox3Body:
      "ANCAP does not claim to replace transfusion, treat anemia, trauma, ischemia, or carbon-monoxide exposure, or to guarantee oxygen delivery or circulation time.",
    ox4Title: "4. Licensed partners only",
    ox4Body:
      "Any physical manufacture or clinical use is a licensed bioreactor / transfusion-medicine act. Users must not build home emulsions or hemoglobin kits from these pages.",
    ox5Title: "5. Infographic literacy, not an SOP",
    ox5Body:
      "Core, shell, affinity-regulator, buffer, emulsifier, QC, and fill diagrams are architecture literacy. ANCAP does not publish hemoglobin-modification, PFC-emulsion, or sterile-fill recipes.",
    ox6Title: "6. Not medical advice",
    ox6Body:
      "Catalog copy is informational. It is not a diagnosis, prescription, or treatment plan.",
    ox7Title: "7. Health data",
    ox7Body:
      "Treat identifiers and clinical history as sensitive. Do not upload records without a lawful basis.",
    ox8Title: "8. Relationship to other rails",
    ox8Body:
      "Organ-print, DPSC biomaterial, M-receptor, and synthetic-blood / Black Mamba rails remain separate. This SKU does not authorize compounding or unlicensed manufacture. Related: /legal/synthetic-blood-mamba.",
    ox9Title: "9. Payments",
    ox9Body:
      "ACP buys a consult brief and partner match at 92,000 ACP — not a blood unit, not an emulsion lot, and not a refundable transfusion outcome. Refunds follow /legal/refunds.",
    ox10Title: "10. Contact",
    ox10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#oxygen-carrier. Related notices: /legal/dpsc, /legal/terms, /legal/risk.",
    syntheticBloodMambaLink: "Synthetic blood / Black Mamba",
    hubCardSyntheticBloodMamba:
      "Licensed bioreactor brief for synthetic-blood architecture with modified Black Mamba peptide literacy. Not a blood product, not venom compounding, not a CE/FDA therapeutic.",
    syntheticBloodMambaKicker: "Legal / bioreactor / peptide literacy",
    syntheticBloodMambaTitle: "Synthetic blood / Black Mamba — licensed bioreactor partner rail",
    syntheticBloodMambaIntro:
      "How ANCAP frames the synthetic-blood / Black Mamba architecture SKU as of 12 September 2026. These pages sell ACP-settled consult briefs, not blood products, not venom peptides, and not a home kit.",
    sbm1Title: "1. Platform role",
    sbm1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not manufacture hemoglobin vesicles, PFC emulsions, or venom peptides, and does not operate a transfusion or toxin lab.",
    sbm2Title: "2. Not a blood product",
    sbm2Body:
      "The infographic is conceptual architecture. It is not an EU MDR or FDA brochure and not a CE-marked oxygen therapeutic or synthetic blood sold by ANCAP.",
    sbm3Title: "3. Forbidden outcome claims",
    sbm3Body:
      "ANCAP does not claim to replace transfusion, treat trauma, ischemia, or anemia, or to guarantee vasodilation, anticoagulation, neuroprotection, regeneration, or longevity.",
    sbm4Title: "4. Licensed partners only",
    sbm4Body:
      "Any physical manufacture or clinical use is a licensed bioreactor / transfusion-medicine act. Users must not build home emulsions, hemoglobin kits, or venom-peptide preparations from these pages.",
    sbm5Title: "5. Infographic literacy, not an SOP",
    sbm5Body:
      "Core, shell, polymer mesh, Black Mamba peptide icons, delivery stages, and 'controlled dose' callouts are architecture literacy. ANCAP does not publish toxin, peptide-modification, HBOC, PFC, or sterile-fill recipes.",
    sbm6Title: "6. Not medical advice",
    sbm6Body:
      "Catalog copy is informational. It is not a diagnosis, prescription, or treatment plan.",
    sbm7Title: "7. Health data",
    sbm7Body:
      "Treat identifiers and clinical history as sensitive. Do not upload records without a lawful basis.",
    sbm8Title: "8. Relationship to other rails",
    sbm8Body:
      "The artificial oxygen-carrier SKU (92,000 ACP) remains separate. This architecture brief does not authorize compounding or unlicensed manufacture.",
    sbm9Title: "9. Payments",
    sbm9Body:
      "ACP buys a consult brief and partner match at 98,000 ACP — not a blood unit, not a peptide lot, and not a refundable transfusion outcome. Refunds follow /legal/refunds.",
    sbm10Title: "10. Contact",
    sbm10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#synthetic-blood-mamba. Related notices: /legal/oxygen-carrier, /legal/terms, /legal/risk.",
    footerSyntheticBloodMamba: "Synthetic blood / Black Mamba",

    adhdSupportLink: "ADHD / СДВГ support",
    hubCardAdhdSupport:
      "Licensed clinician brief for ADHD support literacy. Not a diagnosis, not a prescription, not stimulant compounding, not a guaranteed academic or financial outcome.",
    adhdSupportKicker: "Legal / clinician / ADHD support literacy",
    adhdSupportTitle: "ADHD / СДВГ support — licensed clinician partner rail",
    adhdSupportIntro:
      "How ANCAP frames the ADHD support SKU as of 13 September 2026. These pages sell ACP-settled consult briefs, not diagnoses, prescriptions, stimulants, or a guaranteed path to wealth.",
    adhd1Title: "1. Platform role",
    adhd1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not diagnose ADHD, prescribe medication, compound stimulants, or practice child psychiatry or neurology.",
    adhd2Title: "2. Not a diagnosis or treatment",
    adhd2Body:
      "The infographic is motivational and educational literacy. It is not a clinical guideline, not a CE/FDA drug brochure, and not treatment sold by ANCAP.",
    adhd3Title: "3. Forbidden outcome claims",
    adhd3Body:
      "ANCAP does not guarantee calm behavior, school grades, career success, entrepreneurship, or becoming a billionaire. The 'path to a billion' stairs are motivational literacy only.",
    adhd4Title: "4. Licensed clinicians only",
    adhd4Body:
      "Any assessment, therapy, or medication decision is a licensed clinician act after screening. Users must not treat these pages as a substitute for professional care.",
    adhd5Title: "5. Infographic literacy, not a protocol",
    adhd5Body:
      "Focus, planning, emotional control, relationships, self-esteem, and risk-reduction icons are support literacy. ANCAP does not publish stimulant dosing or therapy SOPs.",
    adhd6Title: "6. Not medical advice",
    adhd6Body:
      "Catalog copy is informational. It is not a diagnosis, prescription, or treatment plan.",
    adhd7Title: "7. Health and child data",
    adhd7Body:
      "Treat identifiers and clinical history as sensitive. Do not upload records without a lawful basis and caregiver consent where required.",
    adhd8Title: "8. Relationship to other rails",
    adhd8Body:
      "Longevity and bioreactor rails remain separate. This SKU does not authorize compounding or unlicensed practice of medicine.",
    adhd9Title: "9. Payments",
    adhd9Body:
      "ACP buys a consult brief and partner match at 42,000 ACP — not a diagnosis, not a stimulant course, and not a refundable academic or financial outcome. Refunds follow /legal/refunds.",
    adhd10Title: "10. Contact",
    adhd10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#adhd-support. Related notices: /legal/terms, /legal/risk.",
    footerAdhdSupport: "ADHD / СДВГ support",

    pulmopureLink: "PulmoPure",
    hubCardPulmopure:
      "Licensed pulmonology subscription for PulmoPure gas-vibration literacy. Not a CE/FDA device, not ozone therapy, not a guaranteed clean-lungs outcome.",
    pulmopureKicker: "Legal / pulmonology / lung-care literacy",
    pulmopureTitle: "PulmoPure — licensed pulmonology subscription rail",
    pulmopureIntro:
      "How ANCAP frames the PulmoPure subscription SKU as of 13 September 2026. These pages sell ACP-settled clinic retainers, not devices, not ozone therapy, and not a guaranteed respiratory cure.",
    pp1Title: "1. Platform role",
    pp1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not manufacture PulmoPure, does not compound medical gases or ozone, and does not practice pulmonology.",
    pp2Title: "2. Not a medical device sold here",
    pp2Body:
      "The infographic is conceptual architecture. It is not an EU MDR or FDA brochure and not a CE-marked respiratory device sold by ANCAP.",
    pp3Title: "3. Forbidden outcome claims",
    pp3Body:
      "ANCAP does not guarantee tar clearance, clean alveoli, cough reduction, ease of breathing, or smoking-cessation success. Before/after artwork is literacy only.",
    pp4Title: "4. Ozone and medical gases",
    pp4Body:
      "Any gas mix, including oxygen or ozone callouts on marketing art, is partner-protocol literacy. ANCAP does not sell ozone therapy or authorize home gas inhalation kits.",
    pp5Title: "5. Licensed clinicians only",
    pp5Body:
      "Physical sessions occur only under a licensed pulmonology / respiratory / smoking-cessation clinician after screening (asthma, COPD, pneumothorax history, pregnancy, ozone sensitivity).",
    pp6Title: "6. Modes and package contents",
    pp6Body:
      "Soft / Standard / Intensive modes, cartridges, USB-C cable, and case icons are package literacy — not a product catalog ANCAP ships.",
    pp7Title: "7. Not medical advice",
    pp7Body:
      "Catalog copy is informational. It is not a diagnosis, prescription, or treatment plan.",
    pp8Title: "8. Relationship to other rails",
    pp8Body:
      "M-receptor inhaler literacy and oxygen-carrier rails remain separate. This SKU does not authorize compounding or unlicensed device sale.",
    pp9Title: "9. Payments",
    pp9Body:
      "ACP buys a subscription brief and partner match at 14,000 ACP / month (38,000 quarterly; 128,000 annual) — not hardware title and not a refundable clinical outcome. Refunds follow /legal/refunds.",
    pp10Title: "10. Contact",
    pp10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#pulmopure. Related notices: /legal/m-receptor, /legal/terms, /legal/risk.",
    footerPulmopure: "PulmoPure",

    barsukLink: "Project Barsuk",
    hubCardBarsuk:
      "Licensed secure-comms partner brief for Barsuk quantum-pen literacy. Not a Parker product, not a weapon, not unbreakable crypto, not a CE/FDA device.",
    barsukKicker: "Legal / secure-comms / fiction literacy",
    barsukTitle: "Project Barsuk quantum pen — licensed secure-comms partner rail",
    barsukIntro:
      "How ANCAP frames the Project Barsuk quantum-pen SKU as of 13 September 2026. These pages sell ACP-settled partner briefs, not pens, not weapons, and not cryptographic guarantees.",
    bk1Title: "1. Platform role",
    bk1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not manufacture pens, does not practice cryptanalysis as a product claim, and is not affiliated with Parker Pen Company.",
    bk2Title: "2. Not a Parker or CE/FDA product",
    bk2Body:
      "The infographic is fiction / architecture literacy. It is not a Parker catalog page and not a CE-marked or FDA-cleared device sold by ANCAP.",
    bk3Title: "3. Forbidden outcome claims",
    bk3Body:
      "ANCAP does not claim unbreakable cryptography, undetectable field use, guaranteed stealth, or a military advantage. Sensor and standby ranges on artwork are literacy only.",
    bk4Title: "4. Not a weapon",
    bk4Body:
      "This SKU is not a weapon system, not a munition, and not authorization for offensive operations. Physical modules, if any, remain with a licensed secure-comms partner after screening.",
    bk5Title: "5. Licensed partners only",
    bk5Body:
      "Any hardware evaluation or secure-comms deployment is a partner act after screening. Users must not treat these pages as a field kit or DIY crypto appliance.",
    bk6Title: "6. Infographic literacy, not a build SOP",
    bk6Body:
      "Titanium body, quantum-crypto, AI, and smart-ink callouts are architecture literacy. ANCAP does not publish manufacturing SOPs or key-generation recipes.",
    bk7Title: "7. Not legal or security advice",
    bk7Body:
      "Catalog copy is informational. It is not a security audit, penetration test, or export-control opinion.",
    bk8Title: "8. Relationship to other rails",
    bk8Body:
      "Perimeter and other AETERNA rails remain separate. This SKU does not authorize weapons sales or unlicensed crypto hardware distribution.",
    bk9Title: "9. Payments",
    bk9Body:
      "ACP buys a consult brief and partner match at 36,000 ACP — not hardware title and not a refundable crypto strength outcome. Refunds follow /legal/refunds.",
    bk10Title: "10. Contact",
    bk10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#barsuk. Related notices: /legal/terms, /legal/risk.",
    footerBarsuk: "Project Barsuk",

    teleportEarphonesLink: "Teleport earphones",
    hubCardTeleportEarphones:
      "Licensed partner brief for AIRPODS T-2026 medevac fiction literacy. Not an Apple product, not a real teleporter, not a military weapon system.",
    teleportEarphonesKicker: "Legal / medevac fiction / partner literacy",
    teleportEarphonesTitle: "Teleport earphones — licensed medevac fiction rail",
    teleportEarphonesIntro:
      "How ANCAP frames the AIRPODS T-2026 / teleport-earphones SKU as of 13 September 2026. These pages sell ACP-settled fiction briefs for rescue / medevac literacy, not teleporters and not weapons.",
    tp1Title: "1. Platform role",
    tp1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not manufacture earphones, does not sell a teleporter, and is not affiliated with Apple.",
    tp2Title: "2. Not an Apple product",
    tp2Body:
      "The name AIRPODS T-2026 and similar artwork are fiction branding for partner literacy. ANCAP is not affiliated with Apple Inc. and does not sell Apple products.",
    tp3Title: "3. Not a real teleporter",
    tp3Body:
      "Infographic ranges (for example 10,000 km or sub-second jumps) are sci-fi literacy. ANCAP does not claim real teleportation, wormholes, or guaranteed evacuation outcomes.",
    tp4Title: "4. Not a military weapon system",
    tp4Body:
      "Combat panels on marketing art are fiction. This SKU is framed around rescue / medical-evacuation literacy only — not offensive teleport operations and not a weapon system.",
    tp5Title: "5. Licensed partners only",
    tp5Body:
      "Any evaluation of ruggedized field cases or comms themes is a partner act after screening. Users must not treat these pages as a field deployment kit.",
    tp6Title: "6. Infographic literacy, not a build SOP",
    tp6Body:
      "Quantum-comms, neural-interface, and case icons are fiction architecture. ANCAP does not publish manufacturing SOPs or combat doctrines.",
    tp7Title: "7. Not medical or military advice",
    tp7Body:
      "Catalog copy is informational fiction literacy. It is not a medical protocol, MEDEVAC SOP, or rules-of-engagement document.",
    tp8Title: "8. Relationship to other rails",
    tp8Body:
      "Humanitarian and perimeter rails remain separate. This SKU does not authorize weapons sales or claims of real teleportation.",
    tp9Title: "9. Payments",
    tp9Body:
      "ACP buys a consult brief and partner match at 58,000 ACP — not hardware title and not a refundable evacuation outcome. Refunds follow /legal/refunds.",
    tp10Title: "10. Contact",
    tp10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#teleport-earphones. Related notices: /legal/humanitarian, /legal/terms, /legal/risk.",
    footerTeleportEarphones: "Teleport earphones",

    installationProjectLink: "Installation Project",
    hubCardInstallationProject:
      "Licensed neonatology / infant-nutrition partner brief for high-protein milk-line and neonatal hyperbaric literacy. Not formula sold by ANCAP, not home HBO, not a guaranteed outcome.",
    installationProjectKicker: "Legal / neonatology / infant nutrition literacy",
    installationProjectTitle: "Installation Project — licensed neonatal partner rail",
    installationProjectIntro:
      "How ANCAP frames the Installation Project (Проект Установки) SKU as of 13 September 2026. These pages sell ACP-settled partner briefs, not infant formula, not dairy plants, and not CE/FDA hyperbaric devices.",
    ip1Title: "1. Platform role",
    ip1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not manufacture infant formula, does not operate a milk plant or NICU, and does not practice neonatology.",
    ip2Title: "2. Not a formula product sold by ANCAP",
    ip2Body:
      "Composition callouts (whey, casein, plant proteins, Omega-3/6, vitamins, minerals), non-GMO, and preservative-free framing on the artwork are partner literacy — not a marketed infant formula SKU from ANCAP.",
    ip3Title: "3. Not a CE/FDA hyperbaric device",
    ip3Body:
      "Operating pressure (1.5–2.0 ATA), temperature (36–37 °C), capacity, and monitoring icons are architecture literacy. ANCAP does not sell a cleared hyperbaric chamber or home HBO kit.",
    ip4Title: "4. Forbidden outcome claims",
    ip4Body:
      "ANCAP does not guarantee reduced rickets, anemia, infection, growth delay, or developmental outcomes. Capacity figures (e.g. ~1,000 L/day) are conceptual partner literacy.",
    ip5Title: "5. Licensed partners only",
    ip5Body:
      "Any production run or clinical hyperbaric session is a partner act after screening under applicable food, drug, and medical-device law. Users must not treat these pages as a DIY plant or home chamber kit.",
    ip6Title: "6. GMP / medical-standards literacy, not a certificate",
    ip6Body:
      "References to GMP and medical standards describe partner expectations. They are not an ANCAP-issued manufacturing certificate or regulatory approval.",
    ip7Title: "7. Not medical or nutrition advice",
    ip7Body:
      "Catalog copy is informational architecture literacy. It is not infant feeding advice, a prescription, or a clinical protocol.",
    ip8Title: "8. Insurance relationship",
    ip8Body:
      "Parametric ACP cover class neonatal_install on /insurance may reference Installation Project intakes. It is not medical malpractice insurance, not a formula warranty, and not a CE/FDA device policy.",
    ip9Title: "9. Payments",
    ip9Body:
      "ACP buys a consult brief and partner match at 72,000 ACP — not plant title, not device clearance, and not a refundable clinical outcome. Refunds follow /legal/refunds.",
    ip10Title: "10. Contact",
    ip10Body:
      "Legal notices: legal@ancap.cloud. Product: /aeterna#installation-project. Insurance: /insurance. Related notices: /legal/terms, /legal/risk.",
    footerInstallationProject: "Installation Project",

    dnaPheromonePerfumeLink: "DNA pheromone perfume",
    hubCardDnaPheromonePerfume: "Per-bottle DNA-matched pheromone fragrance via licensed cosmetic partner — not a drug or aphrodisiac claim.",
    dnaPheromonePerfumeKicker: "Legal / cosmetic fragrance literacy",
    dnaPheromonePerfumeTitle: "DNA-matched pheromone perfume — legal notice",
    dnaPheromonePerfumeIntro: "13 September 2026. Sale unit is one bottle (8,900 ACP).",
    ppf1Title: "1. Platform role",
    ppf1Body: "ANCAP settles ACP and issues a licensed cosmetic / fragrance partner handoff. Physical bottle fill stays with the partner.",
    ppf2Title: "2. DNA matching",
    ppf2Body: "Optional DNA-vault content hash may inform olfactory-profile literacy. Genome bytes are never uploaded to ANCAP.",
    ppf3Title: "3. Unit of sale",
    ppf3Body: "Each order is for exactly one bottle. Additional bottles require a new order.",
    ppf4Title: "4. Not a drug",
    ppf4Body: "This rail is not a medicine, not CE/FDA pheromone therapy, and not compounding of controlled substances.",
    ppf5Title: "5. No aphrodisiac claim",
    ppf5Body: "ANCAP does not claim guaranteed attraction, relationship, or sexual outcomes.",
    ppf6Title: "6. Partner screening",
    ppf6Body: "Fragrance partners must pass ANCAP screening before receiving a handoff.",
    ppf7Title: "7. Skin safety",
    ppf7Body: "Patch testing and ingredient disclosure remain with the licensed partner under local cosmetic law.",
    ppf8Title: "8. Minors",
    ppf8Body: "Not marketed for children. Local age-of-purchase rules for fragrance apply.",
    ppf9Title: "9. Refunds",
    ppf9Body: "ACP settlement follows ANCAP refunds policy once partner fill has started; unused draft intents may cancel.",
    ppf10Title: "10. Contact",
    ppf10Body: "Questions: legal@ancap.cloud. Product surface: /aeterna#dna-pheromone-perfume.",

    counselLink: "Worldwide counsel",
    hubCardCounsel: "ACP legal briefs and licensed counsel matching in any covered country — ANCAP is not a law firm.",
    counselKicker: "Legal / worldwide counsel desk",
    counselTitle: "Worldwide legal services — legal notice",
    counselIntro: "14 September 2026. ANCAP does not practice law and does not form an attorney–client relationship.",
    cn1Title: "1. Platform role",
    cn1Body: "ANCAP settles ACP for jurisdiction-match and legal intake briefs, then issues a handoff to independently licensed counsel. ANCAP is not a law firm.",
    cn2Title: "2. No attorney–client relationship with ANCAP",
    cn2Body: "Paying ACP does not create an attorney–client relationship with ANCAP, its operators, or its AI systems.",
    cn3Title: "3. Local counsel independence",
    cn3Body: "Matched counsel remain independent. They set engagement letters, fees beyond the ANCAP brief, conflicts checks, and advice under local bar rules.",
    cn4Title: "4. Worldwide coverage",
    cn4Body: "The desk aims to match counsel in any covered country or region listed on /counsel. Availability depends on partner counsel capacity and local licensing.",
    cn5Title: "5. Not legal advice from ANCAP",
    cn5Body: "Catalog copy, AI intake outputs, and workflow artifacts are literacy / intake only — not legal advice, not a court filing, and not a regulatory opinion.",
    cn6Title: "6. No outcome guarantee",
    cn6Body: "ANCAP does not guarantee visas, incorporations, judgments, tax positions, IP registrations, or regulatory approvals.",
    cn7Title: "7. Sanctions and conflicts",
    cn7Body: "Clients and matched counsel must run their own sanctions, export-control, and conflict checks. ANCAP may refuse desk service where prohibited.",
    cn8Title: "8. Confidentiality",
    cn8Body: "Do not upload privileged documents to ANCAP workflows unless your counsel instructs otherwise. Prefer hash or redacted intake where possible.",
    cn9Title: "9. Fees",
    cn9Body: "ACP prices on /counsel cover the desk brief and handoff. Ongoing counsel fees are separate and billed by the matched professional.",
    cn10Title: "10. Contact",
    cn10Body: "Questions: legal@ancap.cloud. Product: /counsel.",

    
    darkMatterLink: "Dark matter auction",
    hubCardDarkMatter: "Symbolic ACP cosmology titles for dark-matter halo / filament / detector literacy — not physical DM ownership.",
    darkMatterKicker: "Legal / dark matter auction",
    darkMatterTitle: "Dark matter auction — legal notice",
    darkMatterIntro: "14 September 2026. ANCAP dark-matter lots are symbolic ACP title RFQs and cosmology literacy only.",
    dm1Title: "1. Platform role",
    dm1Body: "ANCAP settles ACP bids for symbolic dark-matter title claims and detector / cosmology literacy briefs. ANCAP does not sell or transfer physical dark matter.",
    dm2Title: "2. No physical ownership",
    dm2Body: "A winning bid does not confer ownership, possession, custody, or extraction rights over any physical dark-matter particle, halo mass, or cosmological field.",
    dm3Title: "3. Outer Space Treaty / sovereignty",
    dm3Body: "Lots do not grant sovereignty, territorial claims, or rights under the Outer Space Treaty or any national space statute.",
    dm4Title: "4. Not a detection certificate",
    dm4Body: "Catalog copy and bid receipts are not scientific detection certificates, lab bookings, survey licenses, or peer-reviewed claims.",
    dm5Title: "5. Detector literacy partners",
    dm5Body: "Detector-themed lots are partner literacy / handoff briefs only. Licensed laboratory partners remain independent and set their own engagement terms.",
    dm6Title: "6. No outcome guarantee",
    dm6Body: "ANCAP does not guarantee cosmological discoveries, detector exposures, publication outcomes, or investment returns.",
    dm7Title: "7. Related desks",
    dm7Body: "Galaxy body / radiation titles remain on /galaxy. Dark-matter cosmology titles are on /dark-matter. Both are symbolic ACP desks.",
    dm8Title: "8. Insurance",
    dm8Body: "Optional parametric cover may be offered under coverage class dark_matter_title via /insurance. Policies do not create physical DM ownership.",
    dm9Title: "9. Refunds",
    dm9Body: "ACP settlement for bids follows ANCAP refunds policy once a sealed bid deal is recorded; review /legal/refunds.",
    dm10Title: "10. Contact",
    dm10Body: "Questions: legal@ancap.cloud. Product: /dark-matter.",

    stardustLink: "Stardust weather control",
    hubCardStardust:
      "ACP-settled worldwide weather-control and disaster-monitoring partner literacy. Not a live geoengineering console, not official meteorological warnings, not a guaranteed weather outcome.",
    stardustKicker: "Legal / weather control / earth monitoring",
    stardustTitle: "StardustSRT weather control — licensed partner rail",
    stardustIntro:
      "How ANCAP frames the Stardust desk as of 13 September 2026. These pages sell ACP-settled partner briefs for earth monitoring and weather-control architecture literacy, not a live weather remote control.",
    sd1Title: "1. Platform role",
    sd1Body:
      "ANCAP provides ACP settlement, consult briefs, and licensed-partner matching. ANCAP does not operate a geoengineering fleet, does not unilaterally modify weather worldwide, and does not replace national meteorological services.",
    sd2Title: "2. Not affiliated with StardustSRT by default",
    sd2Body:
      "Public StardustSRT artwork and stardustsrt.com are literacy references. ANCAP is not affiliated with StardustSRT unless a separate partner contract is executed.",
    sd3Title: "3. Not a live Weather Control console",
    sd3Body:
      "Rainfall enhancement, storm dissipation, temperature regulation, and snow management toggles on /stardust are product literacy UI. Buying ACP does not give operators a satellite kill-switch for storms.",
    sd4Title: "4. Forbidden outcome claims",
    sd4Body:
      "ANCAP does not guarantee better rainfall, weaker storms, stable temperatures, healthier climate outcomes, or earlier disaster alerts than official agencies.",
    sd5Title: "5. Not official meteorological warnings",
    sd5Body:
      "Extreme weather and disaster modules are partner coordination literacy. For critical decisions use AccuWeather, national weather authorities, or civil-protection channels. Widget weather remains indicative (/legal/market-data).",
    sd6Title: "6. Licensed partners only",
    sd6Body:
      "Any sensing, cloud-seeding, or weather ops remain partner acts after screening under environmental, aviation, and telecom law. Users must not treat these pages as DIY geoengineering instructions.",
    sd7Title: "7. Infographic literacy, not an ops SOP",
    sd7Body:
      "Satellite beams, tectonic overlays, and control panels are architecture literacy. ANCAP does not publish weaponized weather SOPs or classified sensing recipes.",
    sd8Title: "8. Insurance relationship",
    sd8Body:
      "Parametric ACP cover class weather_control on /insurance may reference Stardust intakes. It is not meteorological insurance, not a geoengineering warranty, and not a storm-dissipation guarantee.",
    sd9Title: "9. Payments",
    sd9Body:
      "Weather-control pricing is auction-first on the TECH desk (/tech). Opening floors: 18,000 ACP (extreme weather monitor), 28,000 ACP (disaster early-warning), 58,000 ACP (global weather-control), 45,000 ACP (retainer license). Winning bids settle via AuctionEscrow — not a fixed checkout price, not hardware title, and not a refundable weather outcome. Refunds follow /legal/refunds.",
    sd10Title: "10. Contact",
    sd10Body:
      "Legal notices: legal@ancap.cloud. Product: /stardust. Insurance: /insurance. Related: /legal/market-data, /legal/terms, /legal/risk.",
    footerStardust: "Stardust weather control",


    hubCardRefunds: "When charges are final, when we may credit a failed run, and how to request a review.",
    hubCardWelcomeGrant:
      "100 ACP on signup is a promotional access credit (nominal $100 label), not a donation, not USD cash, not tax-deductible.",
    hubCardHumanitarian:
      "ACP-settled aid briefs for food, water, nutrition, warm clothing, medical supplies, and livelihood matching — desk listings of Red Cross / Red Crescent national societies, not a signed ICRC/IFRC contract and not a 135-FZ charity.",
    hubCardCyber: "Public policy endorsement of collective cyber defense.",
    hubCardClarity: "Full agreement with the U.S. Digital Asset Market Clarity Act (CLARITY Act).",
    hubCardCompliance: "MiCA-safe messaging and on-ramp / bridge risk notes.",
    hubContactTitle: "Client contacts",
    hubContactBody: "Legal notices: legal@ancap.cloud. Privacy requests: privacy@ancap.cloud. Product support: support@ancap.cloud. We aim to acknowledge privacy requests within 30 days where applicable law requires a response.",
    hubDisclaimer: "These pages are the live client-facing legal notices for ancap.cloud. They do not replace advice from your own lawyer or tax advisor. Mandatory consumer rights in your country of residence remain unaffected where they cannot be waived.",
    termsKicker: "Legal agreement",
    termsTitle: "ANCAP User Agreement",
    termsIntro: "These Terms govern access to and use of ancap.cloud and related ANCAP services (website, API, wallets, workflow store, creator tools, bridge/docs surfaces, and related products). By creating an account, connecting a wallet, buying or running a workflow, publishing a listing, using the API, or otherwise using the Services, you agree to these Terms.",
    t1Title: "1. Parties and acceptance",
    t1Body: "These Terms are an agreement between you (\"you\", \"User\") and the ANCAP platform operator of ancap.cloud (\"ANCAP\", \"we\", \"us\"). If you use the Services on behalf of an organization, you confirm you have authority to bind that organization, and \"you\" includes that organization.",
    t2Title: "2. Operator and notices",
    t2Body: "The Services are operated by the ANCAP platform operator through ancap.cloud. Client notices: legal@ancap.cloud (legal), privacy@ancap.cloud (privacy), support@ancap.cloud (support). Formal company registration details, registered office, and tax identifiers (where applicable) are published on this Legal center when available for the active commercial entity. If a signed enterprise agreement conflicts with these Terms, the signed agreement controls for that customer.",
    t3Title: "3. Eligibility",
    t3Body: "You must have legal capacity to enter into this agreement. You may not use ANCAP if applicable laws, sanctions, export controls, or platform restrictions prohibit your use. You are solely responsible for determining whether crypto-asset, AI, data-protection, tax, consumer, and business rules in your jurisdiction allow your intended use.",
    t4Title: "4. Services",
    t4Body: "ANCAP provides software infrastructure for paid AI-workflow execution, workflow listings, creator publishing tools, ACP wallet/accounting features, paid API products, proof receipts, sample reports, search, analytics, and related operational tools. Features may change as the platform develops. ANCAP is not a bank, broker-dealer, investment fund, custodian of investment securities, or guaranteed payment institution unless a specific licensed partner expressly states otherwise for a named on-ramp.",
    t5Title: "5. ACP, credits, payments, and refunds",
    t5Body: "ACP is the primary platform accounting and payment unit for workflow fees, API spend, and platform credits. Balances, payment intents, and receipts may be denominated in ACP or in partner fiat/crypto rails. Unless a separate written policy says otherwise, a paid workflow purchase is consumed when execution begins. Refunds and credits are described in the Payments & refunds page and may depend on logs, status, and proof data. Fiat top-ups via Stripe or other processors are subject to those processors' rules in addition to these Terms.",
    t6Title: "6. AI outputs and review duty",
    t6Body: "AI-generated outputs can be inaccurate, incomplete, delayed, biased, or unsuitable for a specific legal, financial, medical, technical, compliance, or business decision. ANCAP sells workflow execution artifacts and software access — not investment advice, legal advice, tax advice, medical advice, financial advice, or guaranteed business outcomes. You must independently review outputs before relying on them. Do not submit secrets or regulated personal data to workflows unless your organization has approved that use.",
    t7Title: "7. Creator listings",
    t7Body: "Creators may submit workflow offers, schemas, prices, samples, proof policies, and related materials. ANCAP may review, reject, suspend, rank, modify display, or remove listings to protect users, comply with law, reduce spam, and maintain quality. Creator earnings may be subject to platform fees, holds, refunds, abuse checks, taxes, and payout rules. Creators are responsible for the lawfulness of their listings and for any claims they make about outputs.",
    t8Title: "8. API use",
    t8Body: "API users must protect API keys, respect rate limits, spend caps, idempotency rules, and usage policies. ANCAP may throttle, suspend, or block requests that threaten stability, violate policy, bypass payment, scrape protected resources, abuse AI/LLM services, or create legal or security risk. You remain responsible for activity under your keys.",
    t9Title: "9. Prohibited conduct",
    t9Body: "You may not use ANCAP to commit fraud; evade sanctions; launder funds; attack systems; distribute malware; violate privacy rights; infringe intellectual property; manipulate markets; impersonate others; spam users; misrepresent AI outputs as certified professional advice; create illegal financial promotions; or attempt unauthorized access to accounts, wallets, or infrastructure.",
    t10Title: "10. Intellectual property",
    t10Body: "ANCAP and its licensors retain rights in the platform, software, brand, documentation, and system designs. You retain rights in lawful input content you provide. You grant ANCAP a worldwide, non-exclusive license to process inputs, run workflows, generate outputs, operate proof receipts, enforce policies, provide support, and improve the service as described in the Privacy Notice.",
    t11Title: "11. Privacy, cookies, and data",
    t11Body: "Personal data and cookie preferences are handled under the Privacy Notice and Cookie Policy. Necessary storage supports login, security, wallet state, language, theme, and consent memory. Optional analytics or marketing storage is activated only after valid consent where required.",
    t12Title: "12. Disclaimers and limitation of liability",
    t12Body: "To the maximum extent permitted by law, the Services are provided \"as is\" and \"as available\" without warranties of uninterrupted operation, error-free AI output, market value, liquidity, regulatory approval, or fitness for a particular purpose. Except where liability cannot be limited by law (including fraud, or death/personal injury caused by negligence where such exclusion is void), ANCAP's aggregate liability arising out of or related to the Services is limited to the greater of (a) the fees you paid to ANCAP for the specific paid feature giving rise to the claim during the three (3) months before the claim, or (b) one hundred euro (EUR 100). ANCAP is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or business interruption, to the extent such exclusion is allowed.",
    t13Title: "13. Suspension and termination",
    t13Body: "ANCAP may suspend or terminate access, keys, listings, payouts, or workflows for security, abuse, unpaid amounts, suspected fraud, legal risk, policy violations, or platform integrity. You may stop using the Services at any time, subject to outstanding payment obligations and data-retention rules. Provisions that by nature should survive (IP, disclaimers, liability limits, dispute terms) survive termination.",
    t14Title: "14. Changes",
    t14Body: "ANCAP may update these Terms as the product, law, or risk environment changes. The \"Last updated\" date on this page will change when we publish a revision. Material changes will be indicated on the site and, where reasonably practicable, via account notice or email. Continued use after the effective date means acceptance of the updated Terms, except where mandatory law requires a different process.",
    t15Title: "15. Collective cyber defense",
    t15Body: "ANCAP agrees with the OpenAI open letter \"A call for collective action on cyber defense\". Cybersecurity is a leadership-level duty: current controls are not enough, defenders should use AI to close weaknesses, and the response must be collective. Users may not use ANCAP for offensive cyber assistance. See the Collective cyber defense page for the full policy statement.",
    t16Title: "16. Risk acknowledgement",
    t16Body: "By using the Services you acknowledge the Risk disclosure page, including that ACP is a utility/accounting unit for platform fees (not an investment product), that AI outputs require human review, and that wallet, bridge, and third-party rails carry loss risk. No returns, price appreciation, or liquidity are promised.",
    t17Title: "17. Governing law and disputes",
    t17Body: "These Terms are governed by the laws applicable to the ANCAP operator of ancap.cloud, without regard to conflict-of-law rules that would require another jurisdiction's law. Courts or competent forums with jurisdiction over the operator may hear disputes, subject to mandatory consumer venue rights. Before filing a claim, please contact legal@ancap.cloud so we can try to resolve the issue in good faith.",
    t18Title: "18. Contact and local mandatory rights",
    t18Body: "Questions about these Terms: legal@ancap.cloud. Support: support@ancap.cloud. Nothing in these Terms excludes or limits rights that cannot be waived under the mandatory consumer, data-protection, or other laws of your country of residence.",
    t19Title: "19. CLARITY Act — full agreement",
    t19Body: "ANCAP states its full agreement with the purpose and market-structure goals of the U.S. Digital Asset Market Clarity Act (CLARITY Act / H.R. 3633): clearer classification of digital assets, clearer SEC and CFTC jurisdictional lines, and lawful digital-asset commerce. This is a public legal-policy endorsement, not lobbying registration and not a claim that the bill is already enacted law. See the CLARITY Act page for the full statement.",
    t20Title: "20. Longevity, organ-print, and veterinary rails",
    t20Body:
      "AETERNA and cryo-desk workflows sell analysis, consult briefs, and licensed-partner handoffs. They are not medical or veterinary treatment, not marketed medical devices, and not a promise that organs will print, tissues will revive, or animals or humans will be restored to life. Human organ print and veterinary chambers (including VET REGEN POD illustrations) are partner-clinic rails only. You must not use ANCAP to obtain wet-lab protocols, CRISPR designs, gene synthesis, LNP recipes, or unlicensed procedures on humans or animals. See /legal/vet-regen, /legal/cryo-constitution, and /legal/research-refs.",
    t21Title: "21. Humanitarian aid desk",
    t21Body:
      "The /humanitarian desk sells ACP-settled aid briefs and partner handoffs (food, water, nutrition, warm clothing, medical supplies via licensed channels, livelihood matching). ANCAP is not a charitable organisation under RF 135-FZ and is not a tax-exempt charity in the EU, UK, or US. A listing of IFRC or a national Red Cross / Red Crescent society is not a signed partnership, not an emblem licence, and not an ICRC endorsement. ACP paid on this desk is not a tax-deductible donation unless a registered charity separately receipts funds. Distinct from the 100 ACP welcome grant. See /legal/humanitarian.",
    privacyKicker: "Privacy notice",
    privacyTitle: "How ANCAP handles client data",
    privacyIntro: "This Privacy Notice explains how the ANCAP platform operator of ancap.cloud processes personal data for accounts, wallets, paid workflows, API usage, proof receipts, support, security, and analytics preferences.",
    p1Title: "1. Controller and contacts",
    p1Body: "Controller: ANCAP platform operator of ancap.cloud. Privacy requests: privacy@ancap.cloud. Legal notices: legal@ancap.cloud. Support: support@ancap.cloud. If a data protection officer or EU representative is appointed, contact details will be added here.",
    p2Title: "2. Data we process",
    p2Body: "Account details (e.g. email, display name); authentication and session data; wallet addresses and payment metadata; API key metadata (not raw secrets in logs where avoidable); workflow inputs and generated outputs; receipts and proof hashes; support messages; device/browser/technical logs; cookie and consent choices; referral or campaign codes when you use them.",
    p3Title: "3. Purposes and legal bases",
    p3Body: "We process data to provide the contract (accounts, execution, billing), for legitimate interests (security, fraud prevention, product reliability, abuse detection), with consent where required (optional analytics/marketing cookies), and to meet legal obligations (accounting, lawful requests, sanctions screening where applicable).",
    p4Title: "4. Crypto, proofs, and public data",
    p4Body: "Blockchain data, wallet addresses, transaction references, hashes, and public proof URLs may be visible publicly or on-chain. ANCAP cannot always delete information that has been published to a public ledger or shared proof surface.",
    p5Title: "5. AI providers and processors",
    p5Body: "Workflow inputs may be sent to configured LLM and infrastructure providers when execution requires it. Those providers act as processors or independent controllers according to their role and contracts. Do not submit highly sensitive or regulated data unless your organization has approved that use and the provider path.",
    p6Title: "6. Retention",
    p6Body: "We retain operational, billing, security, audit, and receipt data as needed for service integrity, accounting, dispute resolution, abuse prevention, and legal obligations. When retention is no longer required, we delete or anonymize data where feasible.",
    p7Title: "7. Your rights",
    p7Body: "Depending on applicable law (including GDPR where it applies), you may request access, correction, deletion, restriction, portability, or objection, and you may withdraw consent for optional processing. Some requests may be limited by fraud, audit, blockchain immutability, tax, security, or other legal retention duties. You may lodge a complaint with a supervisory authority where available.",
    p8Title: "8. International transfers",
    p8Body: "Infrastructure, LLM, payment, or analytics providers may process data in countries other than your own. Where required, we rely on appropriate safeguards such as contractual clauses or equivalent transfer tools offered by providers.",
    privacySecurityTitle: "Security and collective cyber defense",
    privacySecurityBody: "ANCAP processes security logs, session data, and proof artifacts to prevent fraud and abuse. ANCAP agrees with the OpenAI open letter calling for a global surge in collective cyber defense. Details:",
    privacyContactTitle: "How to exercise privacy rights",
    privacyContactBody: "Email privacy@ancap.cloud with enough information to verify your request. We aim to respond within 30 days where applicable law sets that timeframe, or sooner when feasible. For product issues that are not privacy rights requests, use support@ancap.cloud.",
    cookiesKicker: "Cookie policy",
    cookiesTitle: "Cookie and storage preferences",
    cookiesIntro: "ANCAP uses a consent banner with equal access to accept optional storage, reject optional storage, or customize preferences. A necessary preference record is stored so the banner does not keep reappearing.",
    c1Title: "Strictly necessary",
    c1Examples: "Consent memory, login/session state, security checks, wallet connection state, language, theme, service-worker support, short-lived Earth-widget geo/weather cache in session storage.",
    c1Consent: "Used without optional consent where required for the site to work.",
    c2Title: "Analytics",
    c2Examples: "Funnel events, page performance, error diagnostics, workflow conversion, aggregate product metrics.",
    c2Consent: "Disabled by default and enabled only after consent where required.",
    c3Title: "Marketing and attribution",
    c3Examples: "Campaign source, referral attribution, partner code, paid-run attribution.",
    c3Consent: "Disabled by default and enabled only after consent where required.",
    cookiesExamples: "Examples:",
    cookiesConsent: "Consent:",
    cookiesRegTitle: "Regulatory references",
    cookiesRegBody: "EU and UK guidance generally distinguishes strictly necessary storage from optional analytics or marketing storage. Optional categories should require informed consent and should not be pre-enabled where consent is required.",
    cookiesEc: "European Commission cookie policy example",
    cookiesEdpb: "EDPB consent guidelines",
    riskKicker: "Client disclosure",
    riskTitle: "Risk disclosure for ANCAP clients",
    riskIntro: "Please read this disclosure before buying workflows, holding ACP balances, using bridges, or relying on AI outputs. It complements the User Agreement and is written for clients — not as investment marketing.",
    r1Title: "1. No investment product",
    r1Body: "ACP is positioned as a utility / accounting unit for workflow fees, API spend, and platform credits. ANCAP does not offer ACP as a security, collective investment scheme, or deposit with guaranteed return. No price appreciation, yield, or liquidity is promised.",
    r2Title: "2. AI output risk",
    r2Body: "Workflow results may be wrong, incomplete, outdated, or misleading. They are not a substitute for licensed professional advice. Decisions based on AI outputs are made at your own risk.",
    r3Title: "3. Wallet and key risk",
    r3Body: "Loss of seed phrases, private keys, device access, or account credentials can mean permanent loss of funds or access. Phishing and social engineering are common. ANCAP cannot reverse most on-chain transfers.",
    r4Title: "4. Bridge and third-party rails",
    r4Body: "Cross-chain bridges, stablecoin rails, card processors, and partner on-ramps carry smart-contract, custody, settlement, FX, and counterparty risk. Always verify official contract addresses and domains.",
    r5Title: "5. Availability and beta features",
    r5Body: "Services may be interrupted, degraded, or changed. Experimental features (including advanced cryptography surfaces) may be labeled experimental and should not be treated as audited production guarantees.",
    r6Title: "6. Regulatory and tax risk",
    r6Body: "Rules for crypto-assets, AI, data, and payments differ by country and can change. You are responsible for your own tax and compliance obligations. Geo or KYC restrictions may apply to some payment methods. ANCAP's public full agreement with the CLARITY Act's market-structure goals does not replace your local rules, turn ACP into a security offering, or guarantee any legislative outcome.",
    r7Title: "7. Third-party market and weather data",
    r7Body: "Spot prices, charts, or FX context shown on ANCAP may come from third-party providers such as CoinGecko. Local weather and time context on the Earth widget may come from AccuWeather (https://www.accuweather.com/) via ANCAP's backend, using approximate IP-derived coordinates. Those figures are indicative only: they are not a settlement price, oracle guarantee, offer to buy or sell, investment advice, or an official weather warning. Desk quotes, bridge conversions, and ACP accounting units can differ from external market screens.",
    r8Title: "8. Longevity, organ-print, and veterinary outcome risk",
    r8Body:
      "AETERNA organ-print and veterinary rails (feline tissue cryo, canine VET REGEN POD) can fail, be delayed, or be refused by a licensed partner. Illustrations are conceptual. No survival rate, regeneration speed, or return-to-life outcome is promised. Paying ACP does not create a clinical or veterinary duty of care owed by ANCAP.",
    r9Title: "9. Humanitarian aid and partner-handoff risk",
    r9Body:
      "Humanitarian briefs may be delayed, refused, or redirected by a listed national society or IFRC channel. ANCAP does not deliver food, water, clothing, medicines, or jobs itself. A desk listing is not a signed Red Cross partnership and not a tax-deductible gift. Medical-supply intents are not pharmacy sales. Livelihood matching is not a guaranteed job. See /legal/humanitarian.",
    riskMarketDataMore: "Full market-data disclosure:",
    p9Title: "9. Third-party market and weather providers",
    p9Body: "To show indicative crypto and FX context, ANCAP may call third-party market-data APIs (currently CoinGecko). To show local weather on the Earth / Support widget, ANCAP may call AccuWeather APIs with approximate latitude/longitude derived from IP geolocation (or interim numeric feeds with AccuWeather attribution if the AccuWeather key is not configured). Those requests use ANCAP server credentials where applicable and typically do not send your account password. Provider logs may include technical metadata (including approximate location) under their own privacy terms. We do not sell your personal data to market-data or weather vendors.",
    marketDataKicker: "Client disclosure",
    marketDataTitle: "Market data, CoinGecko, and AccuWeather",
    marketDataIntro: "This notice explains how ANCAP uses third-party market-data and weather providers on ancap.cloud (CoinGecko and AccuWeather). It complements the Risk Disclosure and Privacy Notice.",
    md1Title: "1. What we show — markets",
    md1Body: "ANCAP may display indicative spot prices (for example BTC, ETH, USDT, BNB, SOL) sourced from CoinGecko via ANCAP's backend. The public API surface is GET /api/v1/market/prices. Displays may appear on the home page and transparency pages such as Reserves.",
    md2Title: "2. Not settlement, not advice",
    md2Body: "CoinGecko prices are not ANCAP settlement prices. They do not bind ACP desk rates, wACP 1:1 bridge conversions, sACP collateral math, Stripe top-ups, or OTC intakes. Nothing on the site is investment, trading, or financial advice.",
    md3Title: "3. Accuracy and availability — markets",
    md3Body: "Feeds can be delayed, incomplete, rate-limited, or unavailable. Cache windows and Demo/Pro plan limits apply. If the feed fails, ANCAP may hide prices or fall back to static configuration without representing a live market.",
    md4Title: "4. Attribution — markets",
    md4Body: "Where market data from CoinGecko is shown, ANCAP provides attribution to CoinGecko. CoinGecko is an independent third party; ANCAP is not affiliated with CoinGecko unless separately stated.",
    md5Title: "5. Your responsibility — markets",
    md5Body: "Do not rely on indicative screens for irreversible transfers. Always verify official ANCAP contract addresses, reserve proofs, and in-product quotes before sending funds.",
    md6Title: "6. What we show — weather (AccuWeather)",
    md6Body: "The floating Earth / Support widget may show local time and current weather for an approximate location derived from your IP address. Weather text, temperature, and related fields are intended to come from AccuWeather (https://www.accuweather.com/) through ANCAP's server proxy GET /api/v1/weather/current. A deep link to AccuWeather is shown for full forecasts and alerts.",
    md7Title: "7. Weather is not a warning service",
    md7Body: "Widget weather is indicative UX context only. It is not a substitute for official meteorological warnings, aviation/marine guidance, or emergency alerts. For critical decisions, open AccuWeather or your national weather authority directly.",
    md8Title: "8. Location, privacy, and AccuWeather terms",
    md8Body: "Approximate coordinates used for weather lookup are derived from IP geolocation in the browser and sent to ANCAP's weather API. AccuWeather may process location and technical metadata under AccuWeather's own terms and privacy policy. ANCAP does not sell this data. If AccuWeather API credentials are not configured, ANCAP may show an interim numeric feed while still attributing and linking to AccuWeather.",
    marketDataAttributionTitle: "Providers",
    marketDataAttributionBody: "Market data provided by CoinGecko. Weather data provided by AccuWeather (https://www.accuweather.com/). Review each provider's terms and privacy policy on their website.",
    refundsKicker: "Billing policy",
    refundsTitle: "Payments and refunds",
    refundsIntro: "This policy explains how ANCAP treats paid workflow runs, API spend, credits, and fiat top-ups for clients of ancap.cloud.",
    f1Title: "1. When a charge is final",
    f1Body: "Unless we state otherwise for a specific product, a paid workflow purchase is consumed when execution starts. Successful completed runs are generally non-refundable because compute, model, and orchestration costs are incurred immediately.",
    f2Title: "2. Failed or degraded runs",
    f2Body: "If a run fails because of a documented platform fault (and not because of invalid inputs, user cancellation, or third-party model outage outside our reasonable control), you may request a credit or re-run review at support@ancap.cloud. We may require proof receipt IDs, timestamps, and logs.",
    f3Title: "3. Credits and ACP balances",
    f3Body: "Platform credits and ACP balances are accounting units for Services. They are not bank deposits. Unused balances may be subject to inactivity, abuse, or compliance holds. Fraudulent top-ups may be reversed.",
    f4Title: "4. Fiat processors",
    f4Body: "Card or bank payments processed by Stripe or other partners follow those partners' dispute and chargeback rules. Opening a chargeback without first contacting support@ancap.cloud may delay resolution and can lead to account review.",
    f5Title: "5. How to request a review",
    f5Body: "Email support@ancap.cloud with your account email, payment or run ID, and a short description. We aim to respond within a reasonable time. Mandatory consumer cooling-off rights, where they legally apply and have not been exhausted by digital performance you requested, remain unaffected.",
    refundsWelcomeGrantMore: "The registration access grant is a promotional platform credit, not a donation and not refundable as fiat. Details:",
    welcomeGrantKicker: "Billing / consumer law",
    welcomeGrantTitle: "Welcome grant: 100 ACP access credit",
    welcomeGrantIntro:
      "ANCAP credits 100 ACP to a new account so the user can try paid AI workflows without a first cash top-up. The “$100” figure is a nominal accounting label. This page states the legislative qualification: access grant, not charity, not USD, not a tax deduction. EU instruments are in sections 5–9.",
    wg1Title: "1. What you receive",
    wg1Body:
      "On successful registration ANCAP credits 100 ACP to your platform ledger. The “$100” figure is a nominal accounting label because ACP is the unit used to price SKUs. It is not a payout of 100 US dollars, not a bank transfer, not a stablecoin airdrop, and not a gift of fiat.",
    wg2Title: "2. Access purpose (why this can sound like charity)",
    wg2Body:
      "The operator’s stated purpose is to lower the cash barrier so a new person can try paid AI workflows. In ordinary speech that is an access grant. That purpose does not change the legal qualification of the credit into a charitable donation.",
    wg3Title: "3. Russian law — not a donation",
    wg3Body:
      "A пожертвование under Civil Code article 582 is a gift of property to a donee for generally useful purposes. A platform that credits its own internal ledger is not transferring property to a charity. Federal Law 135-FZ on charitable activity applies to registered charitable organizations and actual transfers of funds or property for statutory purposes with receipts. ANCAP is not holding this grant out as activity of a благотворительная организация. Advertising a marketing credit as “charity” without that legal form would be unfair advertising under Federal Law 38-FZ article 5. The grant is not a lottery or random prize. Users cannot claim a tax deduction under the Tax Code merely because they received or spent this credit.",
    wg4Title: "4. United States",
    wg4Body:
      "The grant is not a tax-deductible charitable contribution under IRC §170 and is not a gift to a 501(c)(3) organization unless a separate registered charity actually receives funds. FTC Act §5 prohibits deceptive acts: calling a signup promo a “donation” when it is a platform credit would be misleading. ACP remains a utility / accounting unit, not an investment-return product.",
    wg5Title: "5. EU — unfair commercial practices (not charity)",
    wg5Body:
      "Directive 2005/29/EC on unfair commercial practices (UCPD), as amended by Directive (EU) 2019/2161 (Omnibus), prohibits misleading actions and omissions (Arts. 6–7). Annex I blacklist point 22: falsely claiming or creating the impression that the trader is not acting for purposes relating to his trade, business, craft or profession. Presenting this signup credit as a charitable donation, humanitarian gift, or activity of a recognised public-benefit body — when ANCAP is a commercial platform and no funds are transferred to a registered EU charity — would be a misleading commercial practice. e-Commerce Directive 2000/31/EC Art. 6: commercial communications must be clearly identifiable as such; this grant is a commercial access promotion, not a non-profit appeal. National examples of the same rule: Germany UWG §§ 5 / 5a; France Code de la consommation L. 121-1 et seq.; Italy Codice del Consumo. The UK Consumer Protection from Unfair Trading Regulations 2008 (retained UCPD) reach the same result after Brexit. ANCAP is not a German gemeinnützige Körperschaft (AO § 52), not a French organisme d’intérêt général for mécénat, and not a UK charity under the Charities Act 2011 by reason of this credit.",
    wg6Title: "6. EU — consumer rights and unfair contract terms",
    wg6Body:
      "Consumer Rights Directive 2011/83/EU (as amended) and Directive (EU) 2019/770 on digital content/services: this welcome grant is a gratuitous promotional credit, not a paid distance contract. The 14-day withdrawal right (CRD Art. 9) attaches to a later paid digital service the consumer orders, not to the free credit itself. If the consumer requests immediate performance of a paid digital service during the withdrawal period (CRD Art. 16(m) / 16a), those rules are in Payments & refunds and remain unaffected by this grant. Unfair Terms Directive 93/13/EEC: terms that reverse the grant for abuse or multi-accounting must be transparent and proportionate; they cannot waive mandatory consumer rights. Geo-blocking Regulation (EU) 2018/302: this credit is not offered as a nationality-based price discrimination among Member State customers. Digital Services Act (EU) 2022/2065 does not recharacterise a platform ledger credit as a donation.",
    wg7Title: "7. EU — not e-money, not a payment service, not consumer credit",
    wg7Body:
      "Electronic Money Directive 2009/110/EC (EMD2): e-money is electronically stored monetary value representing a claim on the issuer, issued on receipt of funds, and accepted by persons other than the issuer. This grant is issued without receiving funds from the user, is spendable only on ANCAP services, and is not redeemable as EUR or USD. ANCAP does not hold itself out as an electronic money institution by this credit. Payment Services Directive (EU) 2015/2366 (PSD2): the grant is not a payment transaction, payment account, or issuance of a payment instrument. Consumer Credit Directive 2008/48/EC and the new Consumer Credit Directive (EU) 2023/2225: it is not a loan, deferred-payment agreement, or credit with interest or a repayment schedule. A deterministic one-per-account credit is not a game of chance and is not offered as an EU-licensed lottery or gambling prize.",
    wg8Title: "8. EU — MiCA and capital-markets framing",
    wg8Body:
      "Markets in Crypto-Assets Regulation (EU) 2023/1114 (MiCA): ACP is positioned as a utility / accounting unit for paid AI workflows. This grant is not a public offer of an asset-referenced token or e-money token, not a fundraising offer of crypto-assets, and not a right to dividends, interest, or a share of profits. It is not a financial instrument under MiFID II 2014/65/EU and not an offer of securities under Prospectus Regulation (EU) 2017/1129. Marketing must not use “guaranteed return”, “risk-free $100”, or similar yield language. The nominal “$100” label is an accounting scale for SKU prices, not a promise to pay 100 US dollars or 100 euro.",
    wg9Title: "9. EU — VAT, tax, and personal data",
    wg9Body:
      "VAT Directive 2006/112/EC: a free-of-charge promotional credit issued without consideration is generally not a taxable supply at the moment it is granted. Later paid workflow consumption may be a taxable supply under ordinary place-of-supply / OSS rules; this notice does not determine any user’s VAT status. The grant is not a tax-deductible gift to an EU public-benefit organisation (national charitable-relief and Gift Aid analogues do not apply). DAC8 / Directive (EU) 2023/2226, where it applies, concerns reportable crypto-asset transactions — this promotional ledger credit is not a charitable donation for tax reporting. GDPR (EU) 2016/679: registration data are processed to create the account and to credit the grant (Art. 6(1)(b) performance of terms); details are in the Privacy Notice. The grant is not a “donation” used to obtain extra marketing consent beyond the Cookie Policy and Privacy Notice (ePrivacy Directive 2002/58/EC).",
    wg10Title: "10. Product rules",
    wg10Body:
      "One grant per user account. A second registration of the same email is rejected. Abuse or multi-accounting may reverse the credit. Spendable on ANCAP services. Not withdrawable as USD or EUR. Not interest, yield, staking reward, or a security. Separate from the 25 ACP referral signup bonus paid to a referrer after a verified referred purchase.",
    wg11Title: "11. Refunds and abuse",
    wg11Body:
      "The grant is not refundable as fiat. Fraudulent or duplicate accounts may be closed and the credit reversed. Paid workflow runs follow Payments & refunds. Mandatory EU consumer cooling-off rights on later paid digital services, where they legally apply, remain unaffected.",
    wg12Title: "12. Not legal advice",
    wg12Body:
      "This notice is operator disclosure, not tax, charity-filing, or licensed legal advice to any user in the EU/EEA/UK or elsewhere. Questions: legal@ancap.cloud. Humanitarian aid briefs (food, water, clothing, medical supplies, livelihood) are a separate product at /humanitarian and /legal/humanitarian — they are not this welcome grant.",
    welcomeGrantAlso: "Open an account or read related notices:",
    humanitarianKicker: "Legal / humanitarian",
    humanitarianTitle: "Humanitarian aid desk and Red Cross / Red Crescent listings",
    humanitarianIntro:
      "How ANCAP frames ACP-settled humanitarian briefs and partner handoffs to Red Cross / Red Crescent national societies. ANCAP is not a registered charity and does not claim a signed ICRC, IFRC, or national-society partnership unless a dated operator agreement is published here.",
    hum1Title: "1. Platform role",
    hum1Body:
      "ANCAP operates an ACP-first software platform. On /humanitarian it sells aid briefs and partner-handoff tooling settled in ACP. ANCAP is not a благотворительная организация under RF Federal Law No. 135-FZ of 11 August 1995, not a public-benefit / gemeinnützig body, not a UK charity, and not a U.S. 501(c)(3) organisation. Paying ACP does not make the user a donor to ANCAP as a charity.",
    hum2Title: "2. Red Cross / Red Crescent Movement",
    hum2Body:
      "The International Red Cross and Red Crescent Movement has three components: the ICRC, the IFRC, and national societies. They are not interchangeable. A desk listing of the IFRC or of the Russian, Ukrainian, German, or American Red Cross is a handoff rail to official websites — not membership in the Movement, not a fundraising-agency contract, not ICRC endorsement, and not a claim that ANCAP is “the Red Cross”. Until a dated MoU is published on this page, official_partnership is false.",
    hum3Title: "3. What ACP pays",
    hum3Body:
      "ACP on this desk pays for a brief and a contribution toward partner-channel handoff covering emergency food, safe water, nutrition/foodstuffs, warm clothing, medical supplies via licensed partner channels, and livelihood / starting-work matching. ANCAP does not warehouse goods, run ambulances, or employ WASH crews. Suggested from-prices are not a tax receipt and not a guaranteed delivery of a ration, garment, drug, or job.",
    hum4Title: "4. Distinct from the welcome grant",
    hum4Body:
      "The 100 ACP registration credit is promotional platform access. It is explicitly not charity. Do not treat /legal/welcome-grant and /legal/humanitarian as the same product. Mixing them in advertising would be misleading under RF 38-FZ and EU UCPD Annex I point 22 (false impression of charitable purpose).",
    hum5Title: "5. Emblems and Geneva Conventions",
    hum5Body:
      "The red cross, red crescent, and red crystal emblems are protected distinctive signs under the 1949 Geneva Conventions and Additional Protocols. ANCAP is not licensed to display them as a logo, app icon, or payment badge. This site uses text names and official-domain links only. emblem_licensed remains false.",
    hum6Title: "6. Medical supplies",
    hum6Body:
      "Medical-supply briefs are intents for licensed / partner channels only. ANCAP is not a pharmacy, not a remote drugstore, and does not issue prescriptions or medical advice. Controlled substances, unlicensed drug distribution, and DIY protocols are prohibited. Partner jurisdiction health and customs rules control what can ship.",
    hum7Title: "7. Livelihood / starting work",
    hum7Body:
      "Livelihood matching (подъёмная работа) is a brief to partner programmes. ANCAP is not a licensed employment agency in every jurisdiction, not a visa sponsor, and does not guarantee a job, wage, or work permit. Listings must not be advertised as “guaranteed employment”.",
    hum8Title: "8. Russian Federation",
    hum8Body:
      "Charitable activity is regulated by 135-FZ. Civil Code art. 582 (donation) is a distinct civil-law gift to a permitted donee — an ANCAP ACP ledger debit is not that gift unless a registered charity separately receipts it. Advertising that ANCAP itself is a charity, or that ACP payments are automatically tax-deductible пожертвования, is prohibited (38-FZ). National-society programmes remain those of Российский Красный Крест, not of ANCAP.",
    hum9Title: "9. EU, UK, US, and tax receipts",
    hum9Body:
      "EU UCPD 2005/29/EC Annex I p.22 and e-Commerce Directive 2000/31/EC Art. 6: commercial communications must not create a false impression of charitable purpose or of acting for a humanitarian organisation. DE UWG and FR Code de la consommation apply similarly. UK CPRs 2008. US FTC Act §5. IRC §170 / Gift Aid / German Zuwendungsbestätigung / national charitable-relief deductions require a qualified recipient’s receipt — an ANCAP ACP entry is not that receipt. MiCA: this desk is not a public crypto-asset offer.",
    hum10Title: "10. Contacts",
    hum10Body:
      "Legal notices: legal@ancap.cloud. Product: /humanitarian. Related: /legal/welcome-grant, /legal/terms, /legal/risk. Official Movement sites: https://www.ifrc.org/ and the national-society domains listed on the desk. This page is operator disclosure, not licensed legal, tax, or medical advice.",
    humanitarianAlso: "Related notices and official sites:",
    cyberKicker: "Legal / public policy",
    cyberTitle: "ANCAP endorsement of collective cyber defense",
    cyberIntro: "ANCAP publicly agrees with the OpenAI open letter \"A call for collective action on cyber defense\" and the global surge it asks for. This page is the company's legal and policy statement of that agreement. It does not replace the User Agreement, Privacy Notice, or Cookie Policy.",
    openLetter: "Open letter (openai.com)",
    cyberStatementTitle: "Statement of agreement",
    cyberStatement1: "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, and API services, agrees with the letter's opening claim: there is a limited window to strengthen cyber defense. AI-enabled attacks are becoming cheaper, more automated, and more widely available, including against hospitals, water systems, and internet infrastructure. The same models can help defenders close weaknesses that have accumulated for years. ANCAP therefore aligns with the call to raise cybersecurity to executive priority, fund defense for operators who cannot fund it themselves, share proven playbooks, and make AI-agent actions accountable.",
    cyberStatement2: "Signatories of the letter include technology, security, payments, telecom, and industrial companies that compete in ordinary markets and still coordinated around a shared threat picture. ANCAP is not a listed signatory of that letter. This page records ANCAP's independent agreement with the same policy and the same three principles.",
    cyberP1Title: "1. Current security is not enough",
    cyberP1Body: "Systems remain exposed because of accumulated bugs, excess privilege, weak authentication, and technical debt. Security teams — especially in critical infrastructure — are chronically under-resourced. ANCAP treats this as a leadership-level risk, not a back-office checklist.",
    cyberP2Title: "2. Defenders need AI",
    cyberP2Body: "The same class of models that will make attacks cheaper can also give more teams expert-grade defensive skill and make baseline security work faster and cheaper. Proven tools and patches from one organization should help many. ANCAP will use AI to strengthen defensive workflows, proof trails, and operator checks — not to lower the cost of offense.",
    cyberP3Title: "3. The response must be collective",
    cyberP3Body: "No single company controls the threat surface. Vendors hold attack data and tools, model builders hold the models, governments hold coordination and budget, and operators know their own systems. ANCAP agrees that these parts must be joined so one victim's experience raises the cost of the next attack.",
    cyberCommitTitle: "ANCAP commitments under this policy",
    cyberC1Title: "Leadership priority",
    cyberC1Body: "Cybersecurity is treated with incident-level urgency: close the most dangerous weaknesses, verify the result, and raise the bar for what we buy, ship, and run — including AI-written code.",
    cyberC2Title: "Defensive use of AI",
    cyberC2Body: "ANCAP will apply AI to defensive tasks, auditability, and operator support. Paid AI workflows and agents on the platform remain subject to prohibited-conduct rules against attacks, malware, fraud, and unauthorized access.",
    cyberC3Title: "Traceable agents",
    cyberC3Body: "AI-agent actions on ANCAP should be traceable and accountable through receipts, hashes, logs, and proof artifacts wherever the product already records execution.",
    cyberC4Title: "Shared standards",
    cyberC4Body: "ANCAP supports partnership, threat-information sharing, and common defensive standards among technology companies, infrastructure operators, and public institutions.",
    cyberC5Title: "Raise attacker cost",
    cyberC5Body: "The core economic test remains: an attack should cost more than it can return. ANCAP agrees that restoring that cost requires collective action, because no participant holds the full resource set alone.",
    cyberScopeTitle: "Scope and limits",
    cyberScope1: "This endorsement is a public-policy statement. It does not create a warranty, insurance, SLA, or government partnership by itself. Platform users remain bound by the User Agreement, including the prohibition on using ANCAP to attack systems, distribute malware, or bypass access controls. Offensive cyber assistance is outside the product.",
    cyberScope2: "Source document:",
    clarityKicker: "Legal / public policy",
    clarityTitle: "ANCAP full agreement with the CLARITY Act",
    clarityIntro:
      "ANCAP publicly records its full agreement with the Digital Asset Market Clarity Act (CLARITY Act) as updated U.S. market-structure legislation for digital assets. This page is the company's legal and policy statement of that agreement. It does not replace the User Agreement, Risk disclosure, Privacy Notice, or Cookie Policy.",
    clarityBillLink: "Bill text (Congress.gov)",
    clarityNewsLink: "Public notice of updated text",
    clarityStatementTitle: "Statement of full agreement",
    clarityStatement1:
      "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, bridge, stablecoin, and API services, fully agrees with the CLARITY Act's core purpose: establish a clearer federal framework for digital-asset markets, clarify when assets and activities fall under securities versus commodities oversight, and reduce regulatory ambiguity that harms lawful builders, payment rails, and users.",
    clarityStatement2:
      "ANCAP supports clear SEC and CFTC jurisdictional lines, transparent market-structure rules for digital commodities and related activities, and compliance-ready rails for utility settlement assets such as ACP / wACP / sACP. ANCAP is not a Member of Congress, not a registered lobbyist by virtue of this page, and not a government agency. This page records ANCAP's independent full agreement with the Act's market-clarity objectives as publicly discussed around the updated text ahead of floor consideration.",
    clarityP1Title: "1. Market clarity over ambiguity",
    clarityP1Body:
      "Builders and clients need predictable rules for classification, custody, trading venues, and disclosures. ANCAP agrees that statutory clarity beats ad-hoc enforcement-only regimes for digital-asset market structure.",
    clarityP2Title: "2. Jurisdiction that matches the asset and activity",
    clarityP2Body:
      "ANCAP agrees that securities-like activities should remain under securities oversight and that digital-commodity market activities should have a coherent CFTC-facing framework, consistent with the Act's design goals as publicly described.",
    clarityP3Title: "3. Lawful commerce and utility rails",
    clarityP3Body:
      "ANCAP positions ACP as a utility / accounting unit for paid AI workflows and platform credits — not as an investment-return product. Full agreement with CLARITY market-structure goals reinforces that ANCAP will keep MiCA-safe / utility messaging and align product disclosures with applicable U.S. law as enacted and interpreted.",
    clarityCommitTitle: "ANCAP commitments under this endorsement",
    clarityC1Title: "Full public agreement",
    clarityC1Body:
      "ANCAP states full agreement with the CLARITY Act's purpose of digital-asset market clarity and will keep this statement available in the Legal center.",
    clarityC2Title: "Honest product status",
    clarityC2Body:
      "ANCAP will not use this endorsement to claim that ACP is a registered security, that any token is guaranteed lawful in every jurisdiction, or that legislation has already been signed into law before it has.",
    clarityC3Title: "Compliance follow-through",
    clarityC3Body:
      "If and when CLARITY (or successor market-structure law) is enacted, ANCAP will review messaging, partner rails, and disclosures against the final statute and implementing rules.",
    clarityC4Title: "No substitute for user counsel",
    clarityC4Body:
      "Users remain responsible for their own legal, tax, and licensing analysis. This endorsement is not legal advice to any client.",
    clarityC5Title: "Update discipline",
    clarityC5Body:
      "Material legislative changes will be reflected on this page and, where needed, in the User Agreement and Risk disclosure \"Last updated\" notes.",
    clarityScopeTitle: "Scope and limits",
    clarityScope1:
      "This endorsement is a public legal-policy statement of full agreement with the CLARITY Act's market-structure goals. It does not create a warranty, insurance, SLA, government partnership, lobbying engagement, or investment recommendation. Passage of any bill remains a matter for Congress and the President. Until enacted, ANCAP continues to operate under existing applicable law and these Legal center notices.",
    clarityScope2: "References:",
    footerLegal: "Legal",
    footerTerms: "Terms",
    footerPrivacy: "Privacy",
    footerCookies: "Cookies",
    footerRisk: "Risks",
    footerRefunds: "Refunds",
    footerWelcomeGrant: "Welcome grant",
    footerHumanitarian: "Aid desk",
    footerVetRegen: "Vet regen",
    footerLightChamber: "Light chamber",
    footerBodyContouring: "Body contouring",
    footerBiofusion: "BioFusion",
    footerDpsc: "DPSC biomaterial",
    footerVascularPlus: "Vascular Care+",
    footerVascular: "Vascular Care",
    footerTransdermal: "Transdermal",
    footerMReceptor: "M-receptor",
    footerOxygenCarrier: "Oxygen carrier",
    footerClarity: "CLARITY Act",
    authAgreePrefix: "I agree to the",
    authAgreeAnd: "and",
    authAgreeSuffix: ".",
  },
  ru: {
    lastUpdated: "Обновлено: 12 сентября 2026.",
    privacyLink: "Уведомление о конфиденциальности",
    cookiesLink: "Политика cookie",
    termsLink: "Пользовательское соглашение",
    cyberLink: "Коллективная киберзащита",
    clarityLink: "CLARITY Act",
    acpLink: "Whitepaper ACP",
    riskLink: "Раскрытие рисков",
    refundsLink: "Платежи и возвраты",
    welcomeGrantLink: "Грант при регистрации",
    humanitarianLink: "Гуманитарная помощь",
    hubLink: "Юридический центр",
    complianceLink: "Комплаенс",
    contactLegal: "legal@ancap.cloud",
    contactPrivacy: "privacy@ancap.cloud",
    contactSupport: "support@ancap.cloud",
    hubKicker: "Юридический центр",
    hubTitle: "Юридическая информация для клиентов ANCAP",
    hubIntro: "Понятные правила для людей и команд на ancap.cloud: соглашения, конфиденциальность, cookie, платежи, риски ИИ/крипто и контакты.",
    hubCardTerms: "Правила для аккаунтов, кошельков, платных workflow, API, авторов и запрещённого поведения.",
    hubCardPrivacy: "Какие данные обрабатываем, зачем, сроки хранения, ваши права и контакты.",
    hubCardCookies: "Необходимое и опциональное хранение и как работает согласие.",
    hubCardRisk: "Честное раскрытие: выводы ИИ, утилитарная природа ACP, риски моста/кошелька, без гарантии доходности.",
    marketDataLink: "Рыночные данные",
    hubCardMarketData: "Как ANCAP использует цены CoinGecko и погоду AccuWeather — только ориентировочно.",
    footerMarketData: "Рыночные данные",
    researchRefsLink: "Научные ссылки",
    hubCardResearchRefs:
      "Сторонние научные источники (ZEISS Lightfield 4D, USPTO notice of allowance Daewoong eTurna по мРНК/LNP, iXBT Live про квантовый парадокс защиты данных) — товарные знаки у правообладателей; без аффилиации.",
    footerResearchRefs: "Научные ссылки",
    researchRefsKicker: "Сторонние источники",
    researchRefsTitle: "Научные ссылки и цитирование приборов",
    researchRefsIntro:
      "Как ANCAP ссылается на публичные страницы и technology notes сторонних научных приборов. Загрузки и товарные знаки остаются у их владельцев.",
    rr1Title: "1. Цель",
    rr1Body:
      "ANCAP может цитировать публичные product pages и technology notes как образовательный контекст для longevity, imaging и workflow AETERNA. Это не endorsement, дистрибуция и не перепродажа чужого железа.",
    rr2Title: "2. ZEISS Lightfield 4D",
    rr2Body:
      "ANCAP ссылается на ZEISS LSM Lightfield 4D — мгновенную volumetric light-field микроскопию для быстрой и бережной съёмки живых образцов — как на публичный технический контекст. Product page и technology note (Instant volume acquisition for high-speed and gentle imaging) доступны из Legal center и AETERNA. Thank-you / gated download после формы ZEISS обслуживает ZEISS по своим правилам.",
    rr3Title: "3. Без аффилиации и лицензии на товарный знак",
    rr3Body:
      "ZEISS, Carl Zeiss, Lightfield 4D, LSM, ZEN и связанные знаки — товарные знаки Carl Zeiss AG, Carl Zeiss Microscopy GmbH или аффилиатов. ANCAP не аффилирован с ZEISS и не спонсируется ZEISS, если отдельный письменный договор не говорит иное.",
    rr4Title: "4. Загрузки и хостинг",
    rr4Body:
      "ANCAP не хостит и не перераспространяет проприетарные PDF ZEISS. Мы даём ссылки на URL под контролем ZEISS. Если скачивание требует регистрации на thank-you странице ZEISS, обработка данных идёт по политике ZEISS, не ANCAP.",
    rr5Title: "5. Не медицинский совет",
    rr5Body:
      "Цитирование приборов не является медицинским, диагностическим или клиническим советом. AETERNA и DNA/RNA bank остаются research/workflow tooling со своими compliance notes. Перед клиническим использованием проверяйте лицензии партнёров и местное право.",
    rr6Title: "6. Квантовая информация / защита данных (iXBT Live)",
    rr6Body:
      "ANCAP цитирует публичную статью iXBT Live «0 + 0 > 0: ИИ помог доказать невозможный квантовый парадокс в защите данных» (супераддитивность приватной пропускной способности; поиск конфигурации с ИИ и проверка в Lean 4) как образовательный контекст для стола цифровой SIM. Принципы P1–P8 (приватная vs обычная ёмкость; классическое 0+0=0; квантовое 0+0>0; совместное неизмеримое декодирование; линейный/квадратичный масштаб; ИИ предлагает / машины проверяют; multi-path mesh) — на /quantum-sim и в docs/QUANTUM_PRIVATE_CAPACITY_PRINCIPLES.md. Статья — сторонняя журналистика; ANCAP не аффилирован с iXBT. Цитата не означает владение QKD-железом и не гарантирует приватную ёмкость каналов ANCAP.",
    rr7Title: "7. Daewoong / eTurna мРНК LNP (USPTO notice of allowance)",
    rr7Body:
      "По состоянию на 11 сентября 2026 ANCAP цитирует публичную журналистику: Daewoong Pharmaceutical получила notice of allowance USPTO (анонс 27 августа 2026) на структуры ионизируемых липидов платформы eTurna (LNP) для доставки мРНК с факторами частичного клеточного перепрограммирования (ERA; активы Turn Biotechnologies). Цитируемое название заявки — «Lipid Structures and Compositions Comprising the Same». Notice of allowance — не выданный патент США и не регистрация лекарства (FDA/EMA). Работы доклинические. ANCAP не аффилирован с Daewoong, Turn Biotechnologies, HanAll Biopharma и eTurna. Цитата — образовательный контекст для consult-workflow AETERNA. ANCAP не хостит PDF патентов, рецепты липидов, последовательности мРНК, шаги формулирования LNP и любые wet-lab протоколы.",
    rr8Title: "8. Floquet / бозонные коды Чалмерса (PRL 2026)",
    rr8Body:
      "По состоянию на 11 сентября 2026 ANCAP цитирует публичную журналистику («Наука», 10 сентября 2026) теоретической статьи Physical Review Letters «Single-Period Floquet Control of Bosonic Codes with Quantum Lattice Gates» (Huang, Du, Guo; DOI 10.1103/tnb8-3m8m). Идея: кодировать информацию в микроволновых/резонаторных бозонных кодах и выполнять quantum lattice gates за один период Флоке вместо тысяч адиабатических циклов (~1000× меньше периодов на этой оси). Работа теоретическая; авторы обсуждают проверку на разрабатываемом 100-кубитном сверхпроводящем компьютере Чалмерса. ANCAP не аффилирован с Chalmers, Tianjin University, APS/PRL и телеканалом «Наука». Цитата — literacy для стека /tech и compute-слоя /quantum-sim: не заявление, что ANCAP эксплуатирует квантовый компьютер, не SLA по скорости и не гарантия коррекции ошибок.",
    rr9Title: "9. Инвестиции в стартапы — IT-газели / B2B-ритейл и ИИ (2026)",
    rr9Body:
      "По состоянию на 12 сентября 2026 ANCAP цитирует публичную рыночную журналистику для стола /startups: CNews (13 авг. 2026) о газелях ИКТ Spark-Interfax 2021–2025 (лидер ООО «Джиэй Тэктим» / GA Tech Team, клиент «Золотое яблоко», ~112,71% CAGR, концентрация на одном клиенте); Forbes/ФРИИ (софт для хозяйств, ИИ-репетиторы); Sky.pro (диапазоны идей AI и SECaaS); businessmens.ru (агротех и цифровизация производств, 2026). Это сторонние рейтинги и эскизы идей, не прогнозы ANCAP, не оферта ценных бумаг, не акции названных эмитентов и не инвестиционный совет. ANCAP не аффилирован с CNews, Spark-Interfax, Forbes, ФРИИ, Sky.pro, businessmens.ru, «Джиэй Тэктим» и «Золотым яблоком». ACP на /startups оплачивает research-брифы и handoff лицензированным партнёрам.",
    researchRefsLinksTitle: "Канонические research-ссылки",
    researchRefsLinksBody:
      "Публичные URL издателей. Если deep link изменится — начинайте со страницы источника. ZEISS, Daewoong/eTurna USPTO-allowance, Floquet/бозонные коды Чалмерса, iXBT и рыночная журналистика IT-газелей 2026 цитируются для грамотности, не как warranty продукта.",
    cryoLink: "Крионика и конституции",
    hubCardCryo:
      "Стол криоконсервации, research-протоколы по тихоходкам, партнёры КриоРус и Tomorrow.bio, ветеринарные рейлы тканей / VET REGEN POD, конституционные пределы на дату уведомления.",
    footerCryo: "Крионика",
    cryoKicker: "Право / longevity",
    cryoTitle: "Криоконсервация, партнёры и конституционные пределы",
    cryoIntro:
      "Как ANCAP оформляет крио-интенты, лицензированных партнёров, протоколы по тихоходкам и ветеринарные рейлы тканей/органов в рамках действующих конституций и санитарного права на 12 сентября 2026.",
    cryo1Title: "1. Роль платформы",
    cryo1Body:
      "ANCAP даёт ACP-расчёты интентов, брифы и handoff партнёрам. ANCAP не эксплуатирует криохранилища, клинические лаборатории и SST-команды. Физическую криоконсервацию выполняют только лицензированные партнёры по своим договорам и местному праву.",
    cryo2Title: "2. Партнёры — КриоРус и Tomorrow.bio",
    cryo2Body:
      "В каталоге-столе: КриоРус (RU) и Tomorrow.bio (EU). Листинг — рейл передачи лицензированному партнёру, не клинический, этический или регуляторный аудит. Пригодность, согласие, standby и хранение — по договорам партнёра. Публичная критика методов и этики части провайдеров крионики существует; Tomorrow.bio на длинном горизонте эффективности остаётся early-stage. ANCAP не подтверждает оживление, не оборачивает крионику как RWA-доходность и не считает листинг стола доказательством продления жизни.",
    cryo3Title: "3. Кровь тихоходок / криптобиоз",
    cryo3Body:
      "Упоминания крови тихоходок и криптобиоза — research-метаданные для обсуждения с партнёром. Это не разрешённый продукт для трансфузии человеку и не DIY-протокол. Самолечение запрещено.",
    cryo4Title: "4. Конституции и высшее право (дата уведомления)",
    cryo4Body:
      "Услуги предлагаются с учётом конституций и высшего права юрисдикций пользователей и партнёров по состоянию на 11 сентября 2026 — включая Конституцию РФ, Основной закон ФРГ (Grundgesetz), Конституцию Украины и применимые рамки ЕС и США. Если конституция или закон запрещают крионику, запрет имеет приоритет; ANCAP не содействует незаконным действиям.",
    cryo5Title: "5. Не медицинский совет; отзывы",
    cryo5Body:
      "Каталог и отзывы пользователей/ИИ носят информационный характер. Это не медицинский, юридический или инвестиционный совет. Неотчуждаемые права потребителя/пациента сохраняются.",
    cryo6Title: "6. Ветеринарная криоконсервация тканей (кошки)",
    cryo6Body:
      "Листинг криоконсерватора-восстановителя тканей кошки — бриф приёма лицензированного вет-партнёра. ANCAP не производит камеру, не занимается ветеринарной практикой и не утверждает, что замороженная ткань вернёт жизнь, вырастит орган или даст любой заявленный процент выживаемости. Забор, заморозка, хранение, размораживание и любая реимплантация — только у лицензированного ветеринарного врача и по применимому законодательству об охране здоровья животных.",
    cryo7Title: "7. Камера регенерации органов (собаки / VET REGEN POD)",
    cryo7Body:
      "VET REGEN POD — имя концептуальной камеры пересадки органов и регенерации собаки, показанной для literacy партнёра. Цифры на инфографике (включая любой процент выживаемости или «быстрее естественной регенерации») не являются заявлениями продукта ANCAP, не клинические доказательства и не гарантия. Физические процедуры — только в лицензированной ветеринарной операционной. См. /legal/vet-regen.",
    cryo8Title: "8. Критика партнёров, спекуляция и что оплачивает ACP",
    cryo8Body:
      "Партнёры по крионике остаются под общественной и регуляторной критикой; листинг это не «очистка» досье. ACP на этом столе оплачивает бриф консультации/приёма и передачу, не токенизированного человека, не DeFi-доходность на оживление и не ценную бумагу. Аукцион литературных лицензий — отдельный тонкий IP-стол: медиана жанра — comparable, не NAV; pump-ставки fail-closed. См. /literary и /legal/risk.",
    vetRegenLink: "Ветеринарные рейлы органов",
    hubCardVetRegen:
      "Криоконсерватор тканей кошки и камера VET REGEN POD для собаки: концептуальная архитектура партнёра, только лицензированный ветеринар, без гарантии воскрешения или процента выживаемости.",
    vetRegenKicker: "Право / ветеринария",
    vetRegenTitle: "Ветеринарные рейлы органов — криоконсерватор и VET REGEN POD",
    vetRegenIntro:
      "Как ANCAP оформляет банкирование тканей и регенерацию органов животных-компаньонов на 12 сентября 2026. Эти страницы продают ACP-брифы консультации и приёма, а не оборудование и не ветеринарное лечение.",
    vr1Title: "1. Роль платформы",
    vr1Body:
      "ANCAP даёт расчёт в ACP, брифы и подбор лицензированного партнёра для ветеринарных рейлов AETERNA. ANCAP не ведёт ветклиники, не производит криокамеры и оборудование VET REGEN POD, не выпускает ветеринарные лекарственные средства и не оперирует животных.",
    vr2Title: "2. Это не выведенное на рынок медизделие",
    vr2Body:
      "Инфографики криоконсерватора тканей кошки и камеры VET REGEN POD — концептуальная архитектура для обсуждения с партнёром. Это не брошюра изделия по EU MDR/IVDR, не FDA 510(k) и не NADA, не зарегистрированное ветеринарное изделие ЕАЭС и не CE-маркированный продукт ANCAP. Листинг workflow не означает выпуск изделия в обращение.",
    vr3Title: "3. Запрещённые заявления об исходе",
    vr3Body:
      "ANCAP не заявляет возвращение к жизни, воскрешение, бессмертие, числовой процент выживаемости (включая любые «до 98%» на иллюстрации) и регенерацию «в 2–5 раз быстрее естественной». Криоконсервация тканей может сохранить часть клеток по протоколам партнёра; витрификация целого органа, биопечать, пересадка и восстановление функции остаются неопределёнными. Не воспринимайте иллюстрации как клинические доказательства.",
    vr4Title: "4. Только лицензированные ветеринары",
    vr4Body:
      "Забор, анестезия, пересадка, иммуномодуляция, стимуляция стволовыми клетками и послеоперационный уход — акты ветеринарной практики. Их может выполнять только лицо, имеющее право заниматься ветеринарией в соответствующей юрисдикции. Владелец не вправе устраивать домашнее крио, DIY-биореактор или нелицензированную культуру клеток.",
    vr5Title: "5. Право охраны здоровья животных (дата уведомления)",
    vr5Body:
      "Услуги предлагаются с учётом законодательства об охране здоровья и благополучии животных в юрисдикциях владельца и партнёра по состоянию на 12 сентября 2026 — включая законодательство РФ о ветеринарии, Регламент ЕС (EU) 2019/6 о ветеринарных лекарственных средствах, Директиву 2010/63/EU при работе с лабораторными животными, акты штатов США о ветеринарной практике и правила FDA CVM, германские TierSchG / TAppV и соответствующее украинское ветеринарное законодательство. Если закон запрещает деятельность, запрет имеет приоритет.",
    vr6Title: "6. Не ветеринарный, медицинский и не фармакологический совет",
    vr6Body:
      "Каталог, инфографики, выводы workflow и отзывы носят информационный характер. Это не диагноз, не рецепт, не план лечения и не гарантия для любого животного. Неотчуждаемые права потребителя и владельца животного сохраняются.",
    vr7Title: "7. Данные о здоровье питомца",
    vr7Body:
      "Идентификаторы и клиническая история животного считайте чувствительными. Не загружайте регулируемые ветзаписи без правового основания. Хранилища ANCAP — hash-first: не загружайте сырые геномные блобы. Клиники-партнёры обрабатывают клинические данные по своим privacy-уведомлениям.",
    vr8Title: "8. Связь с печатью человеческого органа",
    vr8Body:
      "Печать органа человека (250 000 ACP за орган) остаётся отдельным handoff лицензированного биореактора. Ветеринарные рейлы (75 000 ACP крио кошки; 180 000 ACP путь VET REGEN POD для собаки) не разрешают клиническое применение иллюстрированных камер к человеку и не отменяют запрет AETERNA на DIY CRISPR, синтез генов и рецепты LNP.",
    vr9Title: "9. Платежи",
    vr9Body:
      "ACP за эти workflow оплачивает бриф консультации/приёма и подбор партнёра — не право собственности на оборудование, не гарантированный слот операции и не возвращаемый клинический исход. Возвраты — по /legal/refunds.",
    vr10Title: "10. Контакты",
    vr10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#vet-regen и /cryo. Связанные страницы: /legal/cryo-constitution, /legal/terms, /legal/risk.",
    lightChamberLink: "Световая камера Vinci",
    hubCardLightChamber:
      "Полноростовая камера фотобиомодуляции: грамотность Леонардо о солнечном свете, только лицензированный партнёр по фототерапии, без «безопасного загара» и без заявления CE/FDA.",
    lightChamberKicker: "Право / фототерапия",
    lightChamberTitle: "Световая камера Vinci — рейл фотобиомодуляции",
    lightChamberIntro:
      "Как ANCAP описывает полноростовую LED / UVA / красную / ближний-ИК камеру на 12 сентября 2026. Эти страницы продают ACP-брифы консультации и протокола сеанса, не оборудование и не курс фототерапии.",
    lc1Title: "1. Роль платформы",
    lc1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор лицензированного партнёра для световой камеры Vinci. ANCAP не ведёт дерматологические клиники, не производит LED/UVA-капсулы, не выпускает медизделия и не проводит сеансы света.",
    lc2Title: "2. Не выводимое на рынок медизделие",
    lc2Body:
      "Инфографика — концептуальная архитектура для обсуждения с партнёром. Это не брошюра EU MDR, не FDA 510(k)/PMA, не CE-маркированный солярий или фототерапевтический продукт ANCAP и не реконструкция изобретения Леонардо. Листинг workflow не означает выпуск изделия на рынок.",
    lc3Title: "3. Запрещённые заявления о результате",
    lc3Body:
      "ANCAP не обещает безопасный загар, гарантированный загар, лечение витамином D, рост коллагена, закрытие ран, регенерацию нервов, омоложение или числовой процент успеха. Красный / ближний ИК (включая фрейминг цитохром-c-оксидазы / АТФ около 600–950 нм) — публичная исследовательская грамотность, не эффект продукта. УФ (включая UVA 320–400 нм на иллюстрации) остаётся классом риска рака кожи.",
    lc4Title: "4. Только лицензированные клиницисты",
    lc4Body:
      "Фототерапия, УФ-экспозиция и связанный уход — клинические действия. Их может выполнять только лицо, имеющее право практики в соответствующей юрисдикции. Нельзя собирать домашние LED-массивы, солярии или УФ-шкафы по этим страницам.",
    lc5Title: "5. Скрининг и противопоказания",
    lc5Body:
      "Протоколы партнёра должны учитывать фотосенсибилизацию, меланому или атипичные невусы в анамнезе, фотосенсибилизирующие препараты, беременность где это уместно, и фототип. Вращение платформы, охлаждение и датчики на инфографике — заметки архитектуры, не сертифицированная ANCAP система безопасности.",
    lc6Title: "6. Не медицинская рекомендация",
    lc6Body:
      "Каталог, инфографика, отсылки к Леонардо, выходы workflow и отзывы — информация. Это не диагноз, рецепт и не план лечения. Цитата или парафраз, связанный с Леонардо, — исторический колорит, не проверенная спецификация камеры.",
    lc7Title: "7. Данные о здоровье",
    lc7Body:
      "Если вы передаёте историю кожи или идентификаторы, считайте их чувствительными. Не загружайте медкарты без правового основания. Клиники-партнёры обрабатывают клинические данные по своим уведомлениям о конфиденциальности.",
    lc8Title: "8. Связь с другими рейлами AETERNA",
    lc8Body:
      "Печать органов, консультации по мРНК-перепрограммированию и ветеринарные рейлы остаются отдельными. Световая камера Vinci не разрешает DIY CRISPR, рецепты LNP или нелицензированное оборудование фототерапии и не снимает запрет AETERNA на диагностические заявления.",
    lc9Title: "9. Платежи",
    lc9Body:
      "ACP за этот workflow покупает бриф консультации / протокола сеанса и подбор партнёра — не право на оборудование, не гарантированный слот клиники и не возмещаемый косметический результат. Возвраты — /legal/refunds.",
    lc10Title: "10. Контакты",
    lc10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#vinci-light. Связанные страницы: /legal/terms, /legal/risk, /legal/research-refs.",
    bodyContouringLink: "Микроволновый контур тела",
    hubCardBodyContouring:
      "Контактно охлаждаемый аппликатор 2,45 / 5,8 ГГц: только лицензированный эстетический / дерматологический партнёр, не липосакция, не изделие CE/FDA, не гарантированная потеря жира.",
    bodyContouringKicker: "Право / эстетика",
    bodyContouringTitle: "Микроволновый контур тела — рейл лицензированного эстетического партнёра",
    bodyContouringIntro:
      "Как ANCAP описывает контактно охлаждаемый микроволновый контур тела по состоянию на 12 сентября 2026. Эти страницы продают брифы консультации и протокола сеанса за ACP, не оборудование и не лечение по снижению жира.",
    bc1Title: "1. Роль платформы",
    bc1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы консультаций и подбор лицензированного партнёра для микроволнового контура тела AETERNA. ANCAP не ведёт эстетические клиники, не производит стойки и аппликаторы, не выпускает медицинские изделия и не проводит сеансы контура тела.",
    bc2Title: "2. Не изделие на рынке",
    bc2Body:
      "Инфографика — концептуальная архитектура для обсуждения с партнёром. Это не брошюра изделия EU MDR, не FDA 510(k) или PMA, не CE-маркированный эстетический продукт, продаваемый ANCAP, и не рецепт домашней микроволновой антенны. Листинг workflow не выводит изделие на рынок.",
    bc3Title: "3. Запрещённые заявления о результате",
    bc3Body:
      "ANCAP не заявляет удаление жира, сопоставимое с липосакцией, гарантированную потерю сантиметров, похудение, уничтожение адипоцитов, blebbing, клиренс макрофагами, лимфодренаж или числовой процент успеха. Диапазоны ISM 2,45 / 5,8 ГГц — публичная грамотность радиоспектра, не сертифицированная ANCAP спецификация устройства.",
    bc4Title: "4. Только лицензированные клиницисты",
    bc4Body:
      "Микроволновые эстетические процедуры и послеуход — клинические акты. Их может выполнять только лицо с правом практики в соответствующей юрисдикции (эстетическая медицина, дерматология или иные применимые акты). Пользователи не должны собирать домашние микроволновые аппликаторы или антенные решётки по этим страницам.",
    bc5Title: "5. Скрининг и противопоказания",
    bc5Body:
      "Протоколы партнёра должны учитывать импланты, кардиостимуляторы и другую вживлённую электронику, беременность, металл в зоне воздействия, термическую травму в анамнезе и иные противопоказания клиники. Контактное охлаждение на инфографике — заметка архитектуры, не сертифицированная ANCAP система «без ожогов».",
    bc6Title: "6. Не медицинская рекомендация",
    bc6Body:
      "Каталог, инфографика, выходы workflow и отзывы — информация. Это не диагноз, рецепт и не план лечения.",
    bc7Title: "7. Данные о здоровье",
    bc7Body:
      "Если вы передаёте идентификаторы или клиническую историю, считайте их чувствительными. Не загружайте медкарты без правового основания. Клиники-партнёры обрабатывают клинические данные по своим уведомлениям о конфиденциальности.",
    bc8Title: "8. Связь с другими рейлами AETERNA",
    bc8Body:
      "Печать органов, консультации по мРНК-перепрограммированию, ветеринарные рейлы и световая камера Vinci остаются отдельными. Микроволновый контур тела не разрешает DIY CRISPR, рецепты LNP, нелицензированное микроволновое оборудование или липосакцию и не снимает запрет AETERNA на диагностические заявления.",
    bc9Title: "9. Платежи",
    bc9Body:
      "ACP за этот workflow покупает бриф консультации / протокола сеанса и подбор партнёра — не право на оборудование, не гарантированный слот клиники и не возмещаемый косметический результат. Возвраты — /legal/refunds.",
    bc10Title: "10. Контакты",
    bc10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#microwave-body. Связанные страницы: /legal/terms, /legal/risk, /legal/research-refs.",
    biofusionLink: "Камера BioFusion",
    hubCardBiofusion:
      "Камера микроманипуляций: только лицензированный ART / агро / BSL-партнёр. Не клиника ЭКО, не гарантированный эмбрион или беременность, не набор для редактирования генов.",
    biofusionKicker: "Право / лаборатория",
    biofusionTitle: "Камера микроманипуляций BioFusion — рейл лицензированного лабораторного партнёра",
    biofusionIntro:
      "Как ANCAP описывает камеру BioFusion по состоянию на 12 сентября 2026. Эти страницы продают брифы консультации за ACP, не оборудование, не лечение ЭКО и не услугу редактирования генов.",
    bf1Title: "1. Роль платформы",
    bf1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор лицензированного партнёра. ANCAP не ведёт клиники ЭКО, агростанции и BSL-лаборатории, не производит стойку, не создаёт и не переносит эмбрионы и не выполняет ICSI.",
    bf2Title: "2. Не изделие на рынке",
    bf2Body:
      "Инфографика — концептуальная архитектура. Это не брошюра EU MDR / FDA, не CE-маркированная станция ЭКО, продаваемая ANCAP. Листинг workflow не выводит изделие на рынок.",
    bf3Title: "3. Запрещённые заявления о результате",
    bf3Body:
      "ANCAP не заявляет гарантированную беременность, живорождение, жизнеспособную зиготу, гибрид растения или штамм микроорганизма. «Генетические манипуляции» на рисунке — не CRISPR, не синтез генов и не рецепт патогена.",
    bf4Title: "4. Только лицензированные операторы",
    bf4Body:
      "ВРТ — клинический акт. Гибридизация растений и работа с микроорганизмами — лабораторные акты. Пользователи не должны собирать домашние установки ICSI или микроманипуляторы по этим страницам.",
    bf5Title: "5. Скрининг и закон",
    bf5Body:
      "Протоколы партнёра должны соблюдать местные нормы ВРТ, исследований эмбрионов, ГМО и биобезопасности, включая согласие и происхождение гамет. Температура, pH, O2, HEPA/UV и 0,1 мкм — заметки архитектуры, не сертифицированная ANCAP стерильная система.",
    bf6Title: "6. Не медицинская рекомендация",
    bf6Body:
      "Каталог и инфографика — информация. Это не диагноз, план фертильности и не лечение.",
    bf7Title: "7. Данные о здоровье и генетике",
    bf7Body:
      "Идентификаторы, историю гамет и клинические заметки считайте чувствительными. Не загружайте медкарты без правового основания. Хранилища ANCAP остаются hash-first.",
    bf8Title: "8. Связь с другими рейлами AETERNA",
    bf8Body:
      "Печать органов, биоматериал DPSC, мРНК-консультации, ветеринарные рейлы, световая камера Vinci и микроволновый контур остаются отдельными. BioFusion не разрешает DIY CRISPR, рецепты LNP, нелицензированное ЭКО-оборудование или работу с патогенами.",
    bf9Title: "9. Платежи",
    bf9Body:
      "ACP покупает бриф консультации / протокола сеанса и подбор партнёра — не право на оборудование и не возмещаемый клинический результат. Возвраты — /legal/refunds.",
    bf10Title: "10. Контакты",
    bf10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#biofusion. Связанные страницы: /legal/dpsc, /legal/terms, /legal/risk.",
    dpscLink: "Биоматериал DPSC",
    hubCardDpsc:
      "Стволовые клетки пульпы зуба мудрости в конструкцию биоматериала: только лицензированный биореактор, не полный орган, не клеточная терапия FDA/CE.",
    dpscKicker: "Право / биореактор",
    dpscTitle: "Биоматериал DPSC зуба мудрости — рейл лицензированного биореактора",
    dpscIntro:
      "Как ANCAP описывает аутологичный биоматериал DPSC зуба мудрости по состоянию на 12 сентября 2026. Эти страницы продают брифы за ACP, не клеточную терапию и не домашний набор.",
    dp1Title: "1. Роль платформы",
    dp1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор лицензированного биореактора. ANCAP не удаляет зубы, не культивирует клетки, не печатает ткань и не занимается стоматологией или регенеративной медициной.",
    dp2Title: "2. Не клеточная терапия на рынке",
    dp2Body:
      "Этот SKU не FDA BLA, не EMA ATMP, не CE-маркированный клеточный продукт и не гарантированный орган.",
    dp3Title: "3. Запрещённые заявления о результате",
    dp3Body:
      "ANCAP не заявляет готовый орган, числовую скорость регенерации или что DPSC станут названной тканью. Полная печать органа остаётся отдельным SKU 250 000 ACP.",
    dp4Title: "4. Только лицензированные лаборатории",
    dp4Body:
      "Наращивание клеток и изготовление биоматериала — лабораторные акты. Пользователи не должны культивировать DPSC дома по этим страницам.",
    dp5Title: "5. Согласие и источник",
    dp5Body:
      "Протоколы партнёра должны фиксировать аутологичное происхождение, стоматологическое согласие и скрининг инфекций. Забор зуба мудрости — клинический акт лицензированного стоматолога.",
    dp6Title: "6. Не медицинская рекомендация",
    dp6Body:
      "Каталог и выходы workflow — информация. Это не диагноз, план трансплантата и не лечение.",
    dp7Title: "7. Данные о здоровье",
    dp7Body:
      "Стоматологические и клеточные идентификаторы считайте чувствительными. Не загружайте записи без правового основания.",
    dp8Title: "8. Связь с печатью органа",
    dp8Body:
      "DPSC также запасной источник клеток для aeterna-stem-cell-organ-print (250 000 ACP / орган). Покупка этого SKU 65 000 ACP не включает орган.",
    dp9Title: "9. Платежи",
    dp9Body:
      "ACP покупает бриф и подбор партнёра — не право на клетки, оборудование или гарантированную конструкцию. Возвраты — /legal/refunds.",
    dp10Title: "10. Контакты",
    dp10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#dpsc-biomaterial и /aeterna#organ-print. Связанные страницы: /legal/biofusion, /legal/terms, /legal/risk.",
    vascularPlusLink: "Vascular Care+",
    hubCardVascularPlus:
      "Безвредный поток N2+O2 и световая волна: только лицензированный флебологический / эстетический партнёр. Не лечение тромбоза, не изделие CE/FDA, не гарантированный варикоз.",
    vascularPlusKicker: "Право / флебология",
    vascularPlusTitle: "Vascular Care+ — рейл лицензированного флебологического партнёра",
    vascularPlusIntro:
      "Как ANCAP описывает Vascular Care+ (N2+O2 и световая волна) по состоянию на 12 сентября 2026. Эти страницы продают брифы за ACP, не оборудование и не лечение вен.",
    vp1Title: "1. Роль платформы",
    vp1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор лицензированного партнёра. ANCAP не ведёт венные клиники, не производит стойки и баллоны, не продаёт медицинские газы и не проводит сеансы.",
    vp2Title: "2. Не изделие на рынке",
    vp2Body:
      "Инфографика — концептуальная архитектура. Это не брошюра EU MDR / FDA и не CE-маркированный сосудистый продукт, продаваемый ANCAP.",
    vp3Title: "3. Запрещённые заявления о результате",
    vp3Body:
      "ANCAP не заявляет излечение варикоза, снятие отёка, лечение диабетической ангиопатии или тромбоза. «До/после» — грамотность протокола.",
    vp4Title: "4. Только лицензированные клиницисты",
    vp4Body:
      "Сосудистые и эстетические процедуры — клинические акты. Не собирайте домашние газовые или световые аппликаторы по этим страницам. ТГВ и ТЭЛА — неотложные состояния.",
    vp5Title: "5. Скрининг",
    vp5Body:
      "Протоколы партнёра должны исключать ТГВ, импланты, беременность и открытые раны. Поток газа и температура — заметки архитектуры.",
    vp6Title: "6. Не медицинская рекомендация",
    vp6Body: "Каталог и инфографика — информация. Это не диагноз и не план лечения.",
    vp7Title: "7. Данные о здоровье",
    vp7Body: "Идентификаторы и историю считайте чувствительными. Не загружайте записи без правового основания.",
    vp8Title: "8. Связь с другими рейлами",
    vp8Body:
      "Vascular Care (УЗ/РЧ), трансдермальный пистолет и микроволновый контур остаются отдельными.",
    vp9Title: "9. Платежи",
    vp9Body:
      "ACP покупает бриф и подбор партнёра — не право на оборудование и не возмещаемый клинический результат. Возвраты — /legal/refunds.",
    vp10Title: "10. Контакты",
    vp10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#vascular-care-plus.",
    vascularLink: "Vascular Care",
    hubCardVascular:
      "УЗ / РЧ / тепловая насадка: только лицензированный флебологический / эстетический партнёр. Не хирургия, не изделие CE/FDA, не гарантированный результат по венам.",
    vascularKicker: "Право / флебология",
    vascularTitle: "Vascular Care — рейл лицензированного флебологического партнёра",
    vascularIntro:
      "Как ANCAP описывает Vascular Care (УЗ / РЧ / тепло) по состоянию на 12 сентября 2026. Эти страницы продают брифы за ACP, не оборудование.",
    vu1Title: "1. Роль платформы",
    vu1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор партнёра. ANCAP не ведёт венные клиники и не проводит сеансы.",
    vu2Title: "2. Не изделие на рынке",
    vu2Body: "Инфографика — концептуальная архитектура. Это не брошюра EU MDR / FDA.",
    vu3Title: "3. Запрещённые заявления о результате",
    vu3Body: "ANCAP не заявляет хирургическое закрытие вены, гарантированный диаметр или снятие отёка.",
    vu4Title: "4. Только лицензированные клиницисты",
    vu4Body: "УЗ, РЧ и тепловые акты — клинические. Не собирайте домашние решётки по этим страницам.",
    vu5Title: "5. Скрининг",
    vu5Body: "Протоколы партнёра должны исключать импланты, кардиостимуляторы, беременность и ожоги.",
    vu6Title: "6. Не медицинская рекомендация",
    vu6Body: "Каталог — информация. Это не диагноз и не план лечения.",
    vu7Title: "7. Данные о здоровье",
    vu7Body: "Идентификаторы считайте чувствительными. Не загружайте записи без правового основания.",
    vu8Title: "8. Связь с другими рейлами",
    vu8Body: "Vascular Care+ и трансдермальный пистолет остаются отдельными.",
    vu9Title: "9. Платежи",
    vu9Body: "ACP покупает бриф и подбор партнёра. Возвраты — /legal/refunds.",
    vu10Title: "10. Контакты",
    vu10Body: "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#vascular-care.",
    transdermalLink: "Трансдермальный пистолет",
    hubCardTransdermal:
      "Безыгольный аэрозоль плюс газ-носитель: только лицензированная клиника. Не рецептурный дозатор, не компаундинг, не гарантированная доза.",
    transdermalKicker: "Право / клиника",
    transdermalTitle: "Безыгольный трансдермальный пистолет — рейл лицензированной клиники",
    transdermalIntro:
      "Как ANCAP описывает безыгольный трансдермальный пистолет по состоянию на 12 сентября 2026. Эти страницы продают брифы за ACP, не лекарства и не набор мезотерапии.",
    td1Title: "1. Роль платформы",
    td1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор партнёра. ANCAP не производит пистолеты, не компаундирует и не делает инъекции.",
    td2Title: "2. Не изделие на рынке",
    td2Body: "Инфографика — концептуальная архитектура. Это не брошюра EU MDR / FDA.",
    td3Title: "3. Запрещённые заявления о результате",
    td3Body: "ANCAP не заявляет гарантированную дозу, результат по варикозу, жиру или косметике.",
    td4Title: "4. Только лицензированные клиницисты",
    td4Body: "Трансдермальная доставка активов — клинический акт. Не собирайте домашние струйные инъекторы.",
    td5Title: "5. Законные вещества",
    td5Body: "Протоколы партнёра используют только вещества, законные в юрисдикции клиники. ANCAP не публикует рецепты смесей.",
    td6Title: "6. Не медицинская рекомендация",
    td6Body: "Каталог — информация. Это не рецепт и не план лечения.",
    td7Title: "7. Данные о здоровье",
    td7Body: "Идентификаторы считайте чувствительными. Не загружайте записи без правового основания.",
    td8Title: "8. Связь с другими рейлами",
    td8Body: "Рейлы Vascular Care и микроволновый контур остаются отдельными.",
    td9Title: "9. Платежи",
    td9Body: "ACP покупает бриф и подбор партнёра — не лекарственный продукт. Возвраты — /legal/refunds.",
    td10Title: "10. Контакты",
    td10Body: "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#transdermal.",
    mReceptorLink: "Подписка на M-рецепторы",
    hubCardMReceptor:
      "Подписка лицензированной клиники: пластырь, ионофорез, ингалятор и нейромодуляция блуждающего нерва. Не компаундинг, не изделие CE/FDA, не заявление о лечении.",
    mReceptorKicker: "Право / клиника / подписка",
    mReceptorTitle: "Доставка к M-рецепторам по подписке — рейл лицензированной клиники",
    mReceptorIntro:
      "Как ANCAP описывает мультимодальную подписку на M-рецепторы на 12 сентября 2026. Эти страницы продают ACP-ретейнер периода, не железо, не картридж с препаратом и не домашний набор.",
    mr1Title: "1. Роль платформы",
    mr1Body:
      "ANCAP даёт расчёт ACP, брифы и подбор лицензированного партнёра. ANCAP не производит модули, не компаундирует мускариновые агонисты/антагонисты (включая скополамин) и не ведёт неврологическую, пульмонологическую, кардиологическую, гастроэнтерологическую или офтальмологическую клинику.",
    mr2Title: "2. Не продаваемое медицинское изделие",
    mr2Body:
      "Инфографика — концептуальная архитектура. Это не брошюра EU MDR / FDA и не изделие CE.",
    mr3Title: "3. Запрещённые заявления о результате",
    mr3Body:
      "ANCAP не заявляет лечение болезни Паркинсона, астмы, ХОБЛ, бронхоспазма, аритмии, брадикардии, глаукомы, внутриглазного давления, моторики ЖКТ или улучшения памяти.",
    mr4Title: "4. Только лицензированные клиницисты",
    mr4Body:
      "Пластырь, ионофорез, ингаляция и нейромодуляция — клинические акты. Не собирайте домашние наборы по этим страницам.",
    mr5Title: "5. Законные вещества и грамотность M1–M5",
    mr5Body:
      "Таблица M1–M5 на инфографике — грамотность рецепторов, не гид по дозировке. ANCAP не публикует рецепты смесей.",
    mr6Title: "6. Не медицинская рекомендация",
    mr6Body: "Каталог — информация. Это не диагноз, рецепт и не план лечения.",
    mr7Title: "7. Данные о здоровье",
    mr7Body: "Идентификаторы считайте чувствительными. Не загружайте записи без правового основания.",
    mr8Title: "8. Связь с другими рейлами",
    mr8Body: "Трансдермальный пистолет и рейлы Vascular Care остаются отдельными. Эта подписка не разрешает компаундинг.",
    mr9Title: "9. Платежи",
    mr9Body:
      "ACP покупает ретейнер периода лицензированной клиники (12 000 / месяц, 32 000 / квартал, 108 000 / год) и подбор партнёра — не право собственности на железо. Возвраты — /legal/refunds.",
    mr10Title: "10. Контакты",
    mr10Body: "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#m-receptor.",
    oxygenCarrierLink: "Переносчик кислорода",
    hubCardOxygenCarrier:
      "Бриф лицензированного биореактора / трансфузиологии: гемоглобиновая везикула или эмульсия PFC. Не кровепродукт, не компаундинг, не кислородный терапевтик CE/FDA.",
    oxygenCarrierKicker: "Право / биореактор / грамотность трансфузии",
    oxygenCarrierTitle: "Искусственный переносчик кислорода — рейл лицензированного биореактора",
    oxygenCarrierIntro:
      "Как ANCAP описывает SKU искусственного переноса кислорода на 12 сентября 2026. Эти страницы продают ACP-брифы, не кровепродукты, не эмульсии и не домашний набор.",
    ox1Title: "1. Роль платформы",
    ox1Body:
      "ANCAP даёт расчёт ACP, брифы и подбор лицензированного партнёра. ANCAP не производит гемоглобиновые везикулы или эмульсии PFC и не ведёт службу трансфузии.",
    ox2Title: "2. Не кровепродукт",
    ox2Body: "Инфографика — концептуальная архитектура. Это не брошюра EU MDR / FDA и не изделие CE.",
    ox3Title: "3. Запрещённые заявления о результате",
    ox3Body: "ANCAP не заявляет замену трансфузии, лечение анемии, травмы или ишемии и не гарантирует доставку кислорода.",
    ox4Title: "4. Только лицензированные партнёры",
    ox4Body: "Любое изготовление или клиническое применение — акт лицензированного биореактора / трансфузиологии. Не собирайте домашние эмульсии.",
    ox5Title: "5. Грамотность инфографики, не SOP",
    ox5Body: "Ядро, оболочка, регулятор сродства, буферы, эмульгатор, QC и розлив — грамотность архитектуры. ANCAP не публикует рецепты.",
    ox6Title: "6. Не медицинская рекомендация",
    ox6Body: "Каталог — информация. Это не диагноз, рецепт и не план лечения.",
    ox7Title: "7. Данные о здоровье",
    ox7Body: "Идентификаторы считайте чувствительными. Не загружайте записи без правового основания.",
    ox8Title: "8. Связь с другими рейлами",
    ox8Body: "Печать органа, биоматериал DPSC, M-рецепторы и синтетическая кровь / Чёрная Мамба остаются отдельными. Этот SKU не разрешает компаундинг. См. /legal/synthetic-blood-mamba.",
    ox9Title: "9. Платежи",
    ox9Body: "ACP покупает бриф и подбор партнёра за 92 000 ACP — не единицу крови. Возвраты — /legal/refunds.",
    ox10Title: "10. Контакты",
    ox10Body: "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#oxygen-carrier.",
    syntheticBloodMambaLink: "Синтетическая кровь / Чёрная Мамба",
    hubCardSyntheticBloodMamba:
      "Партнёрский бриф биореактора: архитектура синтетической крови с грамотностью модифицированных пептидов Чёрной Мамбы. Не кровезаменитель, не компаундинг яда, не изделие CE/FDA.",
    syntheticBloodMambaKicker: "Право / биореактор / пептидная грамотность",
    syntheticBloodMambaTitle: "Синтетическая кровь / Чёрная Мамба — рейл лицензированного биореактора",
    syntheticBloodMambaIntro:
      "Как ANCAP описывает SKU архитектуры синтетической крови / Чёрной Мамбы на 12 сентября 2026. Эти страницы продают ACP-брифы, не кровь, не пептиды яда и не домашний набор.",
    sbm1Title: "1. Роль платформы",
    sbm1Body:
      "ANCAP даёт расчёт в ACP, брифы и подбор лицензированного партнёра. ANCAP не производит гемоглобиновые везикулы, эмульсии PFC или пептиды яда и не ведёт трансфузионную или токсин-лабораторию.",
    sbm2Title: "2. Не кровепродукт",
    sbm2Body:
      "Инфографика — концептуальная архитектура. Это не брошюра EU MDR/FDA и не CE-маркированный кислородный терапевтик или синтетическая кровь от ANCAP.",
    sbm3Title: "3. Запрещённые обещания результата",
    sbm3Body:
      "ANCAP не обещает заменить трансфузию, лечить травму, ишемию или анемию и не гарантирует вазодилатацию, антикоагуляцию, нейропротекцию, регенерацию или долголетие.",
    sbm4Title: "4. Только лицензированные партнёры",
    sbm4Body:
      "Любое физическое производство или клиническое применение — акт лицензированного биореактора / трансфузиологии. Нельзя собирать домашние эмульсии, наборы гемоглобина или препараты пептидов яда по этим страницам.",
    sbm5Title: "5. Грамотность инфографики, не SOP",
    sbm5Body:
      "Ядро, оболочка, полимерная сетка, иконки пептидов Чёрной Мамбы, этапы доставки и пометки «контролируемые дозы» — грамотность архитектуры. ANCAP не публикует рецепты токсинов, модификации пептидов, HBOC, PFC или стерильного розлива.",
    sbm6Title: "6. Не медицинская консультация",
    sbm6Body:
      "Каталог — информационный. Это не диагноз, не рецепт и не план лечения.",
    sbm7Title: "7. Данные о здоровье",
    sbm7Body:
      "Идентификаторы и клиническую историю считайте чувствительными. Не загружайте записи без законного основания.",
    sbm8Title: "8. Связь с другими рейлами",
    sbm8Body:
      "SKU искусственного переносчика кислорода (92 000 ACP) остаётся отдельным. Этот бриф архитектуры не разрешает компаундинг или нелицензированное производство.",
    sbm9Title: "9. Платежи",
    sbm9Body:
      "ACP покупает бриф и подбор партнёра за 98 000 ACP — не единицу крови, не партию пептидов и не гарантированный исход трансфузии. Возвраты — /legal/refunds.",
    sbm10Title: "10. Контакты",
    sbm10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#synthetic-blood-mamba. Связанные тексты: /legal/oxygen-carrier, /legal/terms, /legal/risk.",
    footerSyntheticBloodMamba: "Синтетическая кровь / Чёрная Мамба",

    adhdSupportLink: "Поддержка при СДВГ",
    hubCardAdhdSupport:
      "Бриф лицензированного клинициста по поддержке при СДВГ. Не диагноз, не рецепт, не компаундинг стимуляторов, не гарантированный учебный или финансовый результат.",
    adhdSupportKicker: "Право / клиницист / грамотность поддержки при СДВГ",
    adhdSupportTitle: "Поддержка при СДВГ — рейл лицензированного клинициста",
    adhdSupportIntro:
      "Как ANCAP формулирует SKU поддержки при СДВГ на 13 сентября 2026. Эти страницы продают брифы в ACP, а не диагнозы, рецепты, стимуляторы и не путь к богатству.",
    adhd1Title: "1. Роль платформы",
    adhd1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор лицензированного партнёра. ANCAP не ставит диагноз СДВГ, не выписывает лекарства, не компаундит стимуляторы и не практикует детскую психиатрию или неврологию.",
    adhd2Title: "2. Не диагноз и не лечение",
    adhd2Body:
      "Инфографика — мотивационная и образовательная грамотность. Это не клиническое руководство, не брошюра CE/FDA и не лечение от ANCAP.",
    adhd3Title: "3. Запрещённые обещания результата",
    adhd3Body:
      "ANCAP не гарантирует спокойствие, оценки, карьеру, предпринимательство или статус миллиардера. Лестница «к миллиарду» — только мотивационная грамотность.",
    adhd4Title: "4. Только лицензированные клиницисты",
    adhd4Body:
      "Любая оценка, терапия или решение о лекарствах — акт лицензированного клинициста после скрининга. Эти страницы не заменяют профессиональную помощь.",
    adhd5Title: "5. Грамотность инфографики, не протокол",
    adhd5Body:
      "Фокус, планирование, эмоции, отношения, самооценка и снижение рисков — грамотность поддержки. ANCAP не публикует дозировки стимуляторов и SOP терапии.",
    adhd6Title: "6. Не медицинский совет",
    adhd6Body:
      "Тексты каталога информационные. Это не диагноз, не рецепт и не план лечения.",
    adhd7Title: "7. Данные о здоровье и детях",
    adhd7Body:
      "Идентификаторы и клиническая история — чувствительные данные. Не загружайте записи без законного основания и согласия опекуна, где оно требуется.",
    adhd8Title: "8. Связь с другими рейлами",
    adhd8Body:
      "Рейлы долголетия и биореактора остаются отдельными. Этот SKU не разрешает компаундинг и нелицензированную врачебную практику.",
    adhd9Title: "9. Платежи",
    adhd9Body:
      "ACP покупает бриф и подбор партнёра за 42 000 ACP — не диагноз, не курс стимуляторов и не возвращаемый учебный или финансовый результат. Возвраты: /legal/refunds.",
    adhd10Title: "10. Контакты",
    adhd10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#adhd-support. Связанные тексты: /legal/terms, /legal/risk.",
    footerAdhdSupport: "Поддержка при СДВГ",

    pulmopureLink: "PulmoPure",
    hubCardPulmopure:
      "Подписка лицензированной пульмонологии на грамотность PulmoPure. Не изделие CE/FDA, не озонотерапия, не гарантия «чистых лёгких».",
    pulmopureKicker: "Право / пульмонология / грамотность ухода за лёгкими",
    pulmopureTitle: "PulmoPure — подписочный рейл лицензированной пульмонологии",
    pulmopureIntro:
      "Как ANCAP формулирует подписку PulmoPure на 13 сентября 2026. Эти страницы продают ретейнер клиники в ACP, а не аппарат, не озонотерапию и не гарантированное лечение.",
    pp1Title: "1. Роль платформы",
    pp1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор партнёра. ANCAP не производит PulmoPure, не компаундит медгазы или озон и не практикует пульмонологию.",
    pp2Title: "2. Не медицинское изделие на продажу здесь",
    pp2Body:
      "Инфографика — концептуальная архитектура. Это не брошюра EU MDR / FDA и не CE-изделие от ANCAP.",
    pp3Title: "3. Запрещённые обещания результата",
    pp3Body:
      "ANCAP не гарантирует очистку от смол, чистые альвеолы, уменьшение кашля или успех отказа от курения. «До/после» — только грамотность.",
    pp4Title: "4. Озон и медгазы",
    pp4Body:
      "Любая смесь газов на маркетинговой картинке — грамотность партнёрского протокола. ANCAP не продаёт озонотерапию и не разрешает домашние наборы ингаляции газов.",
    pp5Title: "5. Только лицензированные клиницисты",
    pp5Body:
      "Физические сеансы — только у лицензированного пульмонолога / респираторного клинициста после скрининга.",
    pp6Title: "6. Режимы и комплектация",
    pp6Body:
      "Режимы Soft / Standard / Intensive, картриджи и кейс — грамотность комплектации, не каталог поставки ANCAP.",
    pp7Title: "7. Не медицинский совет",
    pp7Body:
      "Тексты каталога информационные. Это не диагноз, не рецепт и не план лечения.",
    pp8Title: "8. Связь с другими рейлами",
    pp8Body:
      "Ингалятор M-рецепторов и переносчик кислорода остаются отдельными. Этот SKU не разрешает компаундинг.",
    pp9Title: "9. Платежи",
    pp9Body:
      "ACP покупает подписочный бриф и подбор партнёра за 14 000 ACP / месяц (38 000 квартал; 128 000 год). Возвраты: /legal/refunds.",
    pp10Title: "10. Контакты",
    pp10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#pulmopure.",
    footerPulmopure: "PulmoPure",

    barsukLink: "Project Barsuk",
    hubCardBarsuk:
      "Партнёрский бриф secure-comms по грамотности квантовой ручки Barsuk. Не продукт Parker, не оружие, не «невзламываемая» крипта, не изделие CE/FDA.",
    barsukKicker: "Право / secure-comms / художественная грамотность",
    barsukTitle: "Квантовая ручка Project Barsuk — рейл лицензированного secure-comms партнёра",
    barsukIntro:
      "Как ANCAP формулирует SKU Project Barsuk по состоянию на 13 сентября 2026. Эти страницы продают ACP-брифы, не ручки, не оружие и не криптографические гарантии.",
    bk1Title: "1. Роль платформы",
    bk1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор лицензированного партнёра. ANCAP не производит ручки, не продаёт оружие и не аффилирована с Parker Pen Company.",
    bk2Title: "2. Не продукт Parker и не CE/FDA",
    bk2Body:
      "Инфографика — художественная / архитектурная грамотность. Это не каталог Parker и не изделие CE/FDA от ANCAP.",
    bk3Title: "3. Запрещённые обещания результата",
    bk3Body:
      "ANCAP не заявляет «невзламываемую» криптографию, скрытность на поле или военное преимущество. Диапазоны на картинке — только грамотность.",
    bk4Title: "4. Не оружие",
    bk4Body:
      "SKU не является системой оружия и не авторизует наступательные операции. Физические модули, если появятся, остаются у лицензированного партнёра после скрининга.",
    bk5Title: "5. Только лицензированные партнёры",
    bk5Body:
      "Любая оценка железа или secure-comms — акт партнёра после скрининга. Эти страницы не полевой комплект и не DIY-криптоустройство.",
    bk6Title: "6. Грамотность инфографики, не SOP сборки",
    bk6Body:
      "Титан, квантовая крипта, ИИ и умные чернила — архитектурная грамотность. ANCAP не публикует SOP производства или рецепты ключей.",
    bk7Title: "7. Не юридический и не security-совет",
    bk7Body:
      "Тексты каталога информационные. Это не аудит безопасности и не заключение по экспортному контролю.",
    bk8Title: "8. Связь с другими рейлами",
    bk8Body:
      "Периметр и другие рейлы AETERNA остаются отдельными. Этот SKU не авторизует продажу оружия.",
    bk9Title: "9. Платежи",
    bk9Body:
      "ACP покупает бриф и подбор партнёра за 36 000 ACP — не право на железо и не возвратный «крипто-результат». Возвраты: /legal/refunds.",
    bk10Title: "10. Контакты",
    bk10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#barsuk.",
    footerBarsuk: "Project Barsuk",

    teleportEarphonesLink: "Наушники телепортации",
    hubCardTeleportEarphones:
      "Партнёрский бриф AIRPODS T-2026 — грамотность медэвак-фикшн. Не продукт Apple, не реальный телепорт, не военная система оружия.",
    teleportEarphonesKicker: "Право / медэвак-фикшн / партнёрская грамотность",
    teleportEarphonesTitle: "Наушники телепортации — рейл лицензированной медэвак-фикшн грамотности",
    teleportEarphonesIntro:
      "Как ANCAP формулирует SKU AIRPODS T-2026 / teleport-earphones по состоянию на 13 сентября 2026. Эти страницы продают ACP-брифы fiction о спасении / медэвак, не телепорты и не оружие.",
    tp1Title: "1. Роль платформы",
    tp1Body:
      "ANCAP обеспечивает расчёт в ACP, брифы и подбор партнёра. ANCAP не производит наушники, не продаёт телепорт и не аффилирована с Apple.",
    tp2Title: "2. Не продукт Apple",
    tp2Body:
      "Название AIRPODS T-2026 и похожая графика — fiction-брендинг для партнёрской грамотности. ANCAP не аффилирована с Apple Inc. и не продаёт продукцию Apple.",
    tp3Title: "3. Не реальный телепорт",
    tp3Body:
      "Диапазоны на инфографике (например 10 000 км или доли секунды) — sci-fi грамотность. ANCAP не заявляет реальную телепортацию и не гарантирует эвакуацию.",
    tp4Title: "4. Не военная система оружия",
    tp4Body:
      "Боевые панели на картинке — fiction. SKU сформулирован вокруг грамотности спасения / медэвак — не наступательных телепорт-операций и не системы оружия.",
    tp5Title: "5. Только лицензированные партнёры",
    tp5Body:
      "Любая оценка полевых кейсов или тем связи — акт партнёра после скрининга. Эти страницы не полевой комплект развёртывания.",
    tp6Title: "6. Грамотность инфографики, не SOP сборки",
    tp6Body:
      "Квантовые коммуникации, нейроинтерфейс и кейс — fiction-архитектура. ANCAP не публикует SOP производства или боевые доктрины.",
    tp7Title: "7. Не медицинский и не военный совет",
    tp7Body:
      "Тексты каталога — информационная fiction-грамотность. Это не медпротокол MEDEVAC и не правила применения силы.",
    tp8Title: "8. Связь с другими рейлами",
    tp8Body:
      "Гуманитарный и периметровый рейлы остаются отдельными. Этот SKU не авторизует продажу оружия или претензии на реальный телепорт.",
    tp9Title: "9. Платежи",
    tp9Body:
      "ACP покупает бриф и подбор партнёра за 58 000 ACP — не право на железо и не возвратный исход эвакуации. Возвраты: /legal/refunds.",
    tp10Title: "10. Контакты",
    tp10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /aeterna#teleport-earphones.",
    footerTeleportEarphones: "Наушники телепортации",

    installationProjectLink: "Проект Установки",
    hubCardInstallationProject:
      "Бриф лицензированного неонатологического / нутриционного партнёра по высокобелковому молоку и неонатальной барокамере. Не смесь от ANCAP, не домашняя HBO, не гарантия исхода.",
    installationProjectKicker: "Юридическое / неонатология / детское питание",
    installationProjectTitle: "Проект Установки — лицензированный неонатальный рейл",
    installationProjectIntro:
      "Как ANCAP оформляет SKU «Проект Установки» на 13 сентября 2026. Эти страницы продают ACP-брифы партнёра, а не детскую смесь, не молочный завод и не изделие CE/FDA для HBO.",
    ip1Title: "1. Роль платформы",
    ip1Body:
      "ANCAP даёт расчёт ACP, брифы и матч лицензированного партнёра. ANCAP не производит смесь, не ведёт завод или NICU и не практикует неонатологию.",
    ip2Title: "2. Не смесь от ANCAP",
    ip2Body:
      "Состав, «без ГМО» и «без консервантов» на инфографике — грамотность партнёра, не маркетинговый SKU смеси ANCAP.",
    ip3Title: "3. Не изделие CE/FDA для HBO",
    ip3Body:
      "Давление 1,5–2,0 ATA, температура 36–37 °C и мониторинг — архитектурная грамотность. ANCAP не продаёт cleared-камеру и не домашний HBO-набор.",
    ip4Title: "4. Запрещённые обещания исхода",
    ip4Body:
      "ANCAP не гарантирует снижение рахита, анемии, инфекций или задержки развития. Мощность ~1 000 л/сутки — концептуальная грамотность.",
    ip5Title: "5. Только лицензированные партнёры",
    ip5Body:
      "Производство и клинические сеансы — акт партнёра после скрининга по применимому праву. Страницы не DIY-завод и не домашний комплект.",
    ip6Title: "6. GMP — грамотность, не сертификат ANCAP",
    ip6Body:
      "Упоминания GMP и медстандартов описывают ожидания к партнёру, а не сертификат или approval от ANCAP.",
    ip7Title: "7. Не медсовет и не советы по вскармливанию",
    ip7Body:
      "Каталог — информационная архитектурная грамотность, не назначение и не клинический протокол.",
    ip8Title: "8. Связь со страховкой",
    ip8Body:
      "Класс покрытия neonatal_install на /insurance может ссылаться на интейки Проекта Установки. Это не страховка от врачебной ошибки и не гарантия смеси.",
    ip9Title: "9. Платежи",
    ip9Body:
      "ACP покупает бриф и матч партнёра за 72 000 ACP — не титул завода и не clearance устройства. Возвраты — /legal/refunds.",
    ip10Title: "10. Контакты",
    ip10Body:
      "Юр. уведомления: legal@ancap.cloud. Продукт: /aeterna#installation-project. Страховка: /insurance. Связанные: /legal/terms, /legal/risk.",
    footerInstallationProject: "Проект Установки",

    dnaPheromonePerfumeLink: "Духи с феромонами (ДНК)",
    hubCardDnaPheromonePerfume: "Продажа по флакону: феромонный аромат под ДНК через лицензированного косметического партнёра — не лекарство и не афродизиак-клейм.",
    dnaPheromonePerfumeKicker: "Юридическое / косметическая грамотность",
    dnaPheromonePerfumeTitle: "Духи с феромонами под ДНК — юридическое уведомление",
    dnaPheromonePerfumeIntro: "13 сентября 2026. Единица продажи — 1 флакон (8 900 ACP).",
    ppf1Title: "1. Роль платформы",
    ppf1Body: "ANCAP проводит расчёт в ACP и выдаёт handoff лицензированному косметическому / парфюмерному партнёру. Физический розлив — у партнёра.",
    ppf2Title: "2. ДНК-матч",
    ppf2Body: "Опциональный хеш DNA-vault может задавать грамотность обонятельного профиля. Байты генома на ANCAP не загружаются.",
    ppf3Title: "3. Единица продажи",
    ppf3Body: "Каждый заказ — ровно один флакон. Следующие флаконы — отдельный заказ.",
    ppf4Title: "4. Не лекарство",
    ppf4Body: "Это не медицина, не CE/FDA-феромонная терапия и не компаундинг контролируемых веществ.",
    ppf5Title: "5. Без афродизиак-клейма",
    ppf5Body: "ANCAP не обещает гарантированного притяжения, отношений или сексуального результата.",
    ppf6Title: "6. Скрининг партнёра",
    ppf6Body: "Парфюмерные партнёры проходят скрининг ANCAP до handoff.",
    ppf7Title: "7. Безопасность кожи",
    ppf7Body: "Патч-тест и раскрытие состава остаются у лицензированного партнёра по местному косметическому праву.",
    ppf8Title: "8. Несовершеннолетние",
    ppf8Body: "Не для детей. Действуют местные возрастные правила покупки парфюмерии.",
    ppf9Title: "9. Возвраты",
    ppf9Body: "Расчёт ACP следует политике возвратов ANCAP после начала розлива; неиспользованные draft-интенты можно отменить.",
    ppf10Title: "10. Контакт",
    ppf10Body: "Вопросы: legal@ancap.cloud. Продукт: /aeterna#dna-pheromone-perfume.",

    counselLink: "Юристы по миру",
    hubCardCounsel: "Юридические брифы ACP и подбор лицензированного юриста в любой покрытой стране — ANCAP не юрфирма.",
    counselKicker: "Юридическое / desk юристов по миру",
    counselTitle: "Юридические услуги по миру — уведомление",
    counselIntro: "14 сентября 2026. ANCAP не занимается адвокатской практикой и не создаёт отношений адвокат–клиент.",
    cn1Title: "1. Роль платформы",
    cn1Body: "ANCAP проводит расчёт в ACP за брифы подбора юрисдикции и intake, затем выдаёт handoff независимому лицензированному юристу. ANCAP не юрфирма.",
    cn2Title: "2. Нет отношений адвокат–клиент с ANCAP",
    cn2Body: "Оплата ACP не создаёт отношений адвокат–клиент с ANCAP, операторами или ИИ-системами.",
    cn3Title: "3. Независимость местного юриста",
    cn3Body: "Подобранный юрист независим. Он заключает договор, берёт дальнейшие гонорары, проверяет конфликт интересов и даёт советы по местным правилам профессии.",
    cn4Title: "4. Покрытие по миру",
    cn4Body: "Desk стремится подобрать юриста в любой покрытой стране или регионе на /counsel. Доступность зависит от партнёров и местной лицензии.",
    cn5Title: "5. Это не юрсовет от ANCAP",
    cn5Body: "Тексты каталога, ИИ-intake и артефакты workflow — только грамотность / intake, не юридический совет и не судебный документ.",
    cn6Title: "6. Без гарантии исхода",
    cn6Body: "ANCAP не гарантирует визы, регистрацию компаний, судебные решения, налоговые позиции, регистрацию IP или разрешения регуляторов.",
    cn7Title: "7. Санкции и конфликты",
    cn7Body: "Клиент и юрист сами проводят санкционный и конфликтный скрининг. ANCAP может отказать в услуге desk, где это запрещено.",
    cn8Title: "8. Конфиденциальность",
    cn8Body: "Не загружайте privileged-документы в workflow ANCAP без указания вашего юриста. Предпочитайте хеш или редacted intake.",
    cn9Title: "9. Гонорары",
    cn9Body: "Цены ACP на /counsel покрывают бриф desk и handoff. Дальнейшие гонорары юриста отдельны.",
    cn10Title: "10. Контакт",
    cn10Body: "Вопросы: legal@ancap.cloud. Продукт: /counsel.",

    
    darkMatterLink: "Аукцион тёмной материи",
    hubCardDarkMatter: "Символические ACP-титулы космологии тёмной материи (halo / filament / детекторы) — не владение физической ТМ.",
    darkMatterKicker: "Правовое / аукцион тёмной материи",
    darkMatterTitle: "Аукцион тёмной материи — юридическое уведомление",
    darkMatterIntro: "14 сентября 2026. Лоты тёмной материи ANCAP — только символические ACP RFQ и космологическая грамотность.",
    dm1Title: "1. Роль платформы",
    dm1Body: "ANCAP принимает ставки ACP за символические титулы тёмной материи и брифы детекторов / космологии. ANCAP не продаёт и не передаёт физическую тёмную материю.",
    dm2Title: "2. Нет физического владения",
    dm2Body: "Выигрышная ставка не даёт права собственности, владения, хранения или извлечения какой-либо физической частицы или поля тёмной материи.",
    dm3Title: "3. Договор по космосу / суверенитет",
    dm3Body: "Лоты не дают суверенитета, территориальных претензий или прав по Outer Space Treaty либо национальному космическому праву.",
    dm4Title: "4. Не сертификат детекции",
    dm4Body: "Тексты каталога и чеки ставок не являются научными сертификатами детекции, бронями лабораторий, лицензиями обзоров или peer-reviewed заявлениями.",
    dm5Title: "5. Партнёры по детекторам",
    dm5Body: "Лоты про детекторы — только literacy / handoff. Лицензированные лабораторные партнёры независимы и сами задают условия работы.",
    dm6Title: "6. Без гарантии исхода",
    dm6Body: "ANCAP не гарантирует открытия, экспозиции детекторов, публикации или инвестиционную доходность.",
    dm7Title: "7. Связанные столы",
    dm7Body: "Титулы тел / излучения — на /galaxy. Космология тёмной материи — на /dark-matter. Оба стола символические ACP.",
    dm8Title: "8. Страхование",
    dm8Body: "Опциональное параметрическое покрытие может предлагаться как dark_matter_title на /insurance. Полисы не создают владения физической ТМ.",
    dm9Title: "9. Возвраты",
    dm9Body: "Расчёт ACP по ставкам следует политике возвратов ANCAP после записи sealed deal; см. /legal/refunds.",
    dm10Title: "10. Контакт",
    dm10Body: "Вопросы: legal@ancap.cloud. Продукт: /dark-matter.",

    stardustLink: "Stardust — контроль погоды",
    hubCardStardust:
      "ACP-брифы партнёра по мировому контролю погоды и мониторингу катастроф. Не живая консоль геоинженерии, не официальные метеопредупреждения, не гарантия исхода.",
    stardustKicker: "Юридическое / контроль погоды / мониторинг Земли",
    stardustTitle: "StardustSRT — контроль погоды, лицензированный партнёрский рейл",
    stardustIntro:
      "Как ANCAP оформляет desk Stardust на 13 сентября 2026. Страницы продают ACP-брифы грамотности, а не пульт удалённого управления погодой.",
    sd1Title: "1. Роль платформы",
    sd1Body:
      "ANCAP даёт расчёт ACP, брифы и матч партнёра. ANCAP не ведёт флот геоинженерии и не заменяет национальные метеослужбы.",
    sd2Title: "2. Нет аффилиации со StardustSRT по умолчанию",
    sd2Body:
      "Публичные материалы StardustSRT — справочная грамотность. Аффилиация только при отдельном договоре.",
    sd3Title: "3. Не живая консоль Weather Control",
    sd3Body:
      "Переключатели на /stardust — UI грамотности. Покупка ACP не даёт kill-switch для штормов.",
    sd4Title: "4. Запрещённые обещания исхода",
    sd4Body:
      "ANCAP не гарантирует дождь, ослабление штормов, стабильную температуру или более ранние тревоги, чем у официальных служб.",
    sd5Title: "5. Не официальные метеопредупреждения",
    sd5Body:
      "Для критических решений — AccuWeather, нацметеослужба или ГО. Виджет погоды — ориентир (/legal/market-data).",
    sd6Title: "6. Только лицензированные партнёры",
    sd6Body:
      "Сенсоры, засев облаков и погодные операции — акт партнёра после скрининга.",
    sd7Title: "7. Инфографика — не боевой SOP",
    sd7Body:
      "Спутники и панели — архитектурная грамотность, не инструкция по оружию погоды.",
    sd8Title: "8. Страховка",
    sd8Body:
      "Класс weather_control на /insurance может ссылаться на интейки Stardust. Это не гарантия рассеивания шторма.",
    sd9Title: "9. Платежи",
    sd9Body:
      "Цена weather-control — аукцион на TECH (/tech). Открывающие полы: 18 000 ACP (мониторинг), 28 000 (раннее предупреждение), 58 000 (глобальный контроль), 45 000 (ретейнер). Ставки через AuctionEscrow — не фиксированный checkout и не гарантия погоды. Возвраты — /legal/refunds.",
    sd10Title: "10. Контакты",
    sd10Body:
      "legal@ancap.cloud · /stardust · /insurance · /legal/market-data",
    footerStardust: "Stardust — контроль погоды",


    hubCardRefunds: "Когда списание окончательно, когда возможен кредит за сбой и как запросить проверку.",
    hubCardWelcomeGrant:
      "100 ACP при регистрации — промо-кредит доступа (номинальная метка $100), не пожертвование, не выплата USD, не налоговый вычет.",
    hubCardHumanitarian:
      "ACP-брифы по еде, воде, питанию, тёплой одежде, медпрепаратам и подъёмной работе — листинги обществ Красного Креста / Красного Полумесяца, не подписанный контракт с МККК/МФКК и не благотворительная организация по 135-ФЗ.",
    hubCardCyber: "Публичная поддержка коллективной киберзащиты.",
    hubCardClarity: "Полное согласие с U.S. Digital Asset Market Clarity Act (CLARITY Act).",
    hubCardCompliance: "MiCA-safe messaging и заметки по on-ramp / bridge.",
    hubContactTitle: "Контакты для клиентов",
    hubContactBody: "Юридические уведомления: legal@ancap.cloud. Запросы по данным: privacy@ancap.cloud. Поддержка: support@ancap.cloud. Мы стремимся подтвердить privacy-запросы в течение 30 дней, если закон требует ответа.",
    hubDisclaimer: "Эти страницы — действующие клиентские юридические уведомления ancap.cloud. Они не заменяют консультацию вашего юриста или налогового советника. Обязательные права потребителя в стране проживания сохраняются, если их нельзя отказаться.",
    termsKicker: "Юридическое соглашение",
    termsTitle: "Пользовательское соглашение ANCAP",
    termsIntro: "Эти Условия регулируют доступ к ancap.cloud и связанным сервисам ANCAP (сайт, API, кошельки, магазин workflow, инструменты автора, bridge/docs и связанные продукты). Создавая аккаунт, подключая кошелёк, покупая или запуская workflow, публикуя листинг, используя API или иным образом пользуясь Сервисами, вы соглашаетесь с этими Условиями.",
    t1Title: "1. Стороны и принятие",
    t1Body: "Эти Условия — соглашение между вами («вы», «Пользователь») и оператором платформы ANCAP на ancap.cloud («ANCAP», «мы»). Если вы действуете от имени организации, вы подтверждаете полномочия связать её этими Условиями, и «вы» включает эту организацию.",
    t2Title: "2. Оператор и уведомления",
    t2Body: "Сервисы предоставляет оператор платформы ANCAP через ancap.cloud. Контакты: legal@ancap.cloud (юридические), privacy@ancap.cloud (данные), support@ancap.cloud (поддержка). Реквизиты юрлица, адрес и налоговые идентификаторы (если применимо) публикуются в Юридическом центре по мере готовности коммерческой сущности. Если подписанный корпоративный договор противоречит Условиям, для этого клиента действует подписанный договор.",
    t3Title: "3. Правоспособность",
    t3Body: "Вы должны иметь право заключать это соглашение. Нельзя пользоваться ANCAP, если законы, санкции, экспортный контроль или ограничения платформы это запрещают. Вы сами отвечаете за то, позволяют ли правила по криптоактивам, ИИ, данным, налогам и бизнесу в вашей юрисдикции задуманное использование.",
    t4Title: "4. Сервисы",
    t4Body: "ANCAP предоставляет ПО-инфраструктуру для платного исполнения AI-workflow, листингов, инструментов авторов, кошелька/учёта ACP, платных API, proof-квитанций, отчётов, поиска, аналитики и связанных инструментов. Функции могут меняться. ANCAP не является банком, брокером, инвестфондом или гарантом депозитов, если только лицензированный партнёр прямо не указывает иное для конкретного on-ramp.",
    t5Title: "5. ACP, кредиты, платежи и возвраты",
    t5Body: "ACP — основная расчётная единица для оплаты workflow, API и кредитов платформы. Балансы и квитанции могут быть в ACP или через партнёрские fiat/crypto rails. Если отдельная политика не говорит иное, покупка workflow считается использованной с начала исполнения. Возвраты описаны на странице «Платежи и возвраты». Fiat-пополнения через Stripe и других процессоров подчиняются также их правилам.",
    t6Title: "6. Результаты ИИ и обязанность проверки",
    t6Body: "Результаты ИИ могут быть неточными, неполными, запоздалыми или непригодными для юридического, финансового, медицинского, технического или бизнес-решения. ANCAP продаёт артефакты исполнения и доступ к ПО — не инвестиционные, юридические, налоговые или медицинские советы и не гарантирует результат. Перед использованием вы обязаны проверить вывод. Не отправляйте секреты и регулируемые персональные данные в workflow без одобрения вашей организации.",
    t7Title: "7. Листинги авторов",
    t7Body: "Авторы могут подавать предложения workflow, схемы, цены, образцы и политики proof. ANCAP может проверять, отклонять, приостанавливать, ранжировать или снимать листинги ради защиты пользователей и соблюдения закона. Доход автора зависит от комиссий, холдов, возвратов, антиабьюза, налогов и правил выплат. Автор отвечает за законность листинга и заявления о результате.",
    t8Title: "8. Использование API",
    t8Body: "Пользователи API обязаны защищать ключи, соблюдать лимиты, потолки расходов, идемпотентность и политики. ANCAP может ограничивать или блокировать запросы, угрожающие стабильности, нарушающие политику, обходящие оплату или создающие правовой/security-риск. Вы отвечаете за активность под своими ключами.",
    t9Title: "9. Запрещённое поведение",
    t9Body: "Нельзя использовать ANCAP для мошенничества, обхода санкций, отмывания средств, атак, вредоносного ПО, нарушения частной жизни и IP, манипуляций рынком, выдачи себя за других, спама, представления вывода ИИ как сертифицированной консультации, незаконных финансовых промо или несанкционированного доступа.",
    t10Title: "10. Интеллектуальная собственность",
    t10Body: "ANCAP и лицензиары сохраняют права на платформу, ПО, бренд и документацию. Вы сохраняете права на законный контент, который предоставляете. Вы даёте ANCAP мировую неисключительную лицензию обрабатывать входы, запускать workflow, генерировать выходы, вести proof-квитанции, применять политики, оказывать поддержку и улучшать сервис, как описано в Уведомлении о конфиденциальности.",
    t11Title: "11. Конфиденциальность, cookie и данные",
    t11Body: "Персональные данные и cookie регулируются Уведомлением о конфиденциальности и Политикой cookie. Необходимое хранение поддерживает вход, безопасность, кошелёк, язык, тему и память согласия. Опциональная аналитика/маркетинг включаются только после действительного согласия, где оно требуется.",
    t12Title: "12. Отказ от гарантий и ограничение ответственности",
    t12Body: "В максимальной степени, допускаемой законом, Сервисы предоставляются «как есть» и «как доступно», без гарантий бесперебойности, безошибочности ИИ, рыночной стоимости, ликвидности, регуляторного одобрения или пригодности для конкретной цели. Кроме случаев, когда ответственность нельзя ограничить законом (включая мошенничество или вред здоровью/смерть по неосторожности, где такой отказ ничтожен), совокупная ответственность ANCAP ограничена большей из сумм: (a) плата, уплаченная вами ANCAP за конкретную платную функцию за 3 месяца до требования, или (b) 100 евро (EUR 100). Косвенные убытки, упущенная выгода и перерыв в бизнесе исключаются в допустимой законом мере.",
    t13Title: "13. Приостановка и прекращение",
    t13Body: "ANCAP может приостановить или прекратить доступ, ключи, листинги, выплаты или workflow из соображений безопасности, злоупотреблений, задолженности, мошенничества, правового риска или целостности платформы. Вы можете прекратить использование в любой момент с учётом незакрытых обязательств и правил хранения данных. Положения об IP, отказах, лимитах ответственности и спорах сохраняют силу после прекращения.",
    t14Title: "14. Изменения",
    t14Body: "ANCAP может обновлять Условия при изменении продукта, закона или рисков. Дата «Обновлено» на странице меняется при публикации. Существенные изменения указываются на сайте и, где разумно, через уведомление в аккаунте или email. Продолжение использования после даты вступления означает принятие обновлённых Условий, кроме случаев, когда закон требует иного порядка.",
    t15Title: "15. Коллективная киберзащита",
    t15Body: "ANCAP согласна с открытым письмом OpenAI о коллективной киберзащите. Кибербезопасность — обязанность уровня руководства. Пользователи не могут использовать ANCAP для наступательной киберпомощи. Полный текст — на странице коллективной киберзащиты.",
    t16Title: "16. Признание рисков",
    t16Body: "Пользуясь Сервисами, вы подтверждаете ознакомление со страницей раскрытия рисков: ACP — утилитарная/учётная единица (не инвестпродукт), выводы ИИ требуют проверки человеком, кошелёк, мост и сторонние rails несут риск потери. Доходность, рост цены и ликвидность не обещаются.",
    t17Title: "17. Применимое право и споры",
    t17Body: "Условия регулируются правом, применимым к оператору ANCAP на ancap.cloud, без коллизионных норм, требующих иного права. Споры могут рассматриваться компетентными судами/форумами оператора с учётом обязательных прав потребителя о подсудности. Перед иском напишите на legal@ancap.cloud — мы постараемся решить вопрос добросовестно.",
    t18Title: "18. Контакты и обязательные права",
    t18Body: "Вопросы по Условиям: legal@ancap.cloud. Поддержка: support@ancap.cloud. Ничто в Условиях не ограничивает права, от которых нельзя отказаться по обязательному праву вашей страны проживания.",
    t19Title: "19. CLARITY Act — полное согласие",
    t19Body: "ANCAP заявляет полное согласие с целями и рыночной структурой U.S. Digital Asset Market Clarity Act (CLARITY Act / H.R. 3633): более ясная классификация цифровых активов, более чёткие границы полномочий SEC и CFTC и законная торговля цифровыми активами. Это публичное юридико-политическое одобрение, а не регистрация лоббиста и не утверждение, что законопроект уже стал законом. Полный текст — на странице CLARITY Act.",
    t20Title: "20. Рейлы долголетия, печати органов и ветеринарии",
    t20Body:
      "Workflow AETERNA и крио-стола продают анализ, брифы и передачу лицензированным партнёрам. Это не медицинское и не ветеринарное лечение, не выведенные на рынок медизделия и не обещание, что органы напечатаются, ткани оживут или человек/животное будут возвращены к жизни. Печать человеческого органа и ветеринарные камеры (включая иллюстрации VET REGEN POD) — только рейлы клиник-партнёров. Нельзя использовать ANCAP, чтобы получить wet-lab протоколы, CRISPR-дизайн, синтез генов, рецепты LNP или нелицензированные процедуры над людьми или животными. См. /legal/vet-regen, /legal/cryo-constitution и /legal/research-refs.",
    t21Title: "21. Стол гуманитарной помощи",
    t21Body:
      "Стол /humanitarian продаёт ACP-брифы и передачу партнёрам (еда, вода, питание, тёплая одежда, медпрепараты через лицензированные каналы, подбор подъёмной работы). ANCAP не является благотворительной организацией по 135-ФЗ и не налогоосвобождённой charity в ЕС/UK/US. Листинг МФКК или национального общества Красного Креста — не подписанное партнёрство, не лицензия эмблемы и не одобрение МККК. ACP на этом столе не налоговый вычет, пока зарегистрированная charity отдельно не выдаст квитанцию. Отдельно от гранта 100 ACP. См. /legal/humanitarian.",
    privacyKicker: "Уведомление о конфиденциальности",
    privacyTitle: "Как ANCAP обрабатывает данные клиентов",
    privacyIntro: "Это Уведомление объясняет, как оператор платформы ANCAP на ancap.cloud обрабатывает персональные данные аккаунтов, кошельков, платных workflow, API, proof-квитанций, поддержки, безопасности и аналитики.",
    p1Title: "1. Контролёр и контакты",
    p1Body: "Контролёр: оператор платформы ANCAP на ancap.cloud. Запросы по данным: privacy@ancap.cloud. Юридические: legal@ancap.cloud. Поддержка: support@ancap.cloud. Если будет назначен DPO или представитель в ЕС, контакты появятся здесь.",
    p2Title: "2. Какие данные обрабатываем",
    p2Body: "Данные аккаунта (email, имя); сессии и аутентификация; адреса кошельков и платёжные метаданные; метаданные API-ключей; входы и выходы workflow; квитанции и proof-хеши; сообщения поддержки; технические логи; cookie и согласия; реферальные/кампанийные коды при их использовании.",
    p3Title: "3. Цели и правовые основания",
    p3Body: "Обработка для исполнения договора (аккаунт, исполнение, биллинг), законных интересов (безопасность, антифрод, надёжность), согласия (опциональная аналитика/маркетинг) и юридических обязанностей (учёт, законные запросы, санкционный скрининг где применимо).",
    p4Title: "4. Крипто, proof и публичные данные",
    p4Body: "Данные блокчейна, адреса, tx-ссылки, хеши и публичные proof URL могут быть видны публично или on-chain. ANCAP не всегда может удалить информацию, уже записанную в публичный реестр.",
    p5Title: "5. ИИ-провайдеры и обработчики",
    p5Body: "Входы workflow могут передаваться настроенным LLM и инфраструктурным провайдерам. Не отправляйте особо чувствительные или регулируемые данные без одобрения организации и понимания маршрута провайдера.",
    p6Title: "6. Сроки хранения",
    p6Body: "Операционные, биллинговые, security-, audit- и receipt-данные хранятся столько, сколько нужно для целостности сервиса, учёта, споров, антиабьюза и закона. Затем удаляем или обезличиваем, где возможно.",
    p7Title: "7. Ваши права",
    p7Body: "В зависимости от применимого права (включая GDPR) вы можете запросить доступ, исправление, удаление, ограничение, переносимость, возражение и отозвать согласие на опциональную обработку. Некоторые запросы ограничены антифродом, аудитом, блокчейном, налогами или законом. Вы можете подать жалобу в надзорный орган, где это доступно.",
    p8Title: "8. Международные передачи",
    p8Body: "Провайдеры инфраструктуры, LLM, платежей или аналитики могут обрабатывать данные в других странах. Где требуется, используем договорные или эквивалентные гарантии передачи.",
    privacySecurityTitle: "Безопасность и коллективная киберзащита",
    privacySecurityBody: "ANCAP обрабатывает security-логи, сессии и proof-артефакты для предотвращения мошенничества. ANCAP согласна с письмом OpenAI о коллективной киберзащите. Подробности:",
    privacyContactTitle: "Как реализовать права на данные",
    privacyContactBody: "Напишите на privacy@ancap.cloud с данными для проверки запроса. Мы стремимся ответить в течение 30 дней, если закон задаёт такой срок. По продуктовым вопросам, не связанным с правами на данные, — support@ancap.cloud.",
    cookiesKicker: "Политика cookie",
    cookiesTitle: "Cookie и предпочтения хранения",
    cookiesIntro: "ANCAP использует баннер согласия с равным доступом принять опциональное хранение, отклонить его или настроить. Необходимая запись предпочтений сохраняется, чтобы баннер не появлялся снова.",
    c1Title: "Строго необходимые",
    c1Examples: "Память согласия, сессия входа, security-проверки, состояние кошелька, язык, тема, service worker, краткий кэш гео/погоды виджета Earth в sessionStorage.",
    c1Consent: "Используются без опционального согласия, где это нужно для работы сайта.",
    c2Title: "Аналитика",
    c2Examples: "Воронки, производительность страниц, диагностика ошибок, конверсия workflow, агрегатные метрики.",
    c2Consent: "По умолчанию выключено; включается только после согласия, где оно требуется.",
    c3Title: "Маркетинг и атрибуция",
    c3Examples: "Источник кампании, реферал, партнёрский код, атрибуция платного запуска.",
    c3Consent: "По умолчанию выключено; включается только после согласия, где оно требуется.",
    cookiesExamples: "Примеры:",
    cookiesConsent: "Согласие:",
    cookiesRegTitle: "Регуляторные ориентиры",
    cookiesRegBody: "В ЕС и UK обычно отличают строго необходимое хранение от опциональной аналитики/маркетинга. Опциональные категории требуют информированного согласия и не должны быть включены заранее, где согласие обязательно.",
    cookiesEc: "Пример cookie-политики Еврокомиссии",
    cookiesEdpb: "Руководящие принципы EDPB о согласии",
    riskKicker: "Раскрытие для клиентов",
    riskTitle: "Раскрытие рисков для клиентов ANCAP",
    riskIntro: "Прочитайте до покупки workflow, хранения ACP, использования мостов или опоры на выводы ИИ. Это дополняет Пользовательское соглашение и не является инвестиционным маркетингом.",
    r1Title: "1. Не инвестиционный продукт",
    r1Body: "ACP позиционируется как утилитарная / учётная единица для оплаты workflow, API и кредитов. ANCAP не предлагает ACP как ценную бумагу, коллективный инвестпродукт или депозит с гарантированной доходностью. Рост цены, yield и ликвидность не обещаются.",
    r2Title: "2. Риск вывода ИИ",
    r2Body: "Результаты workflow могут быть неверными, неполными или вводящими в заблуждение. Это не замена лицензированной профессиональной консультации. Решения на основе ИИ вы принимаете на свой риск.",
    r3Title: "3. Риск кошелька и ключей",
    r3Body: "Потеря seed-фразы, ключей, устройства или доступов может означать безвозвратную потерю средств. Фишинг распространён. ANCAP обычно не может отменить on-chain переводы.",
    r4Title: "4. Мост и сторонние rails",
    r4Body: "Кроссчейн-мосты, стейблкоины, карточные процессоры и on-ramp несут риски смарт-контрактов, кастоди, расчётов, FX и контрагента. Проверяйте только официальные адреса и домены.",
    r5Title: "5. Доступность и экспериментальные функции",
    r5Body: "Сервис может прерываться или меняться. Экспериментальные функции (включая продвинутую криптографию) не следует считать аудированной production-гарантией.",
    r6Title: "6. Регуляторный и налоговый риск",
    r6Body: "Правила по криптоактивам, ИИ, данным и платежам различаются по странам. Налоги и комплаенс — ваша ответственность. Для части методов оплаты возможны geo/KYC ограничения. Публичное полное согласие ANCAP с целями CLARITY Act не заменяет ваши местные правила, не делает ACP предложением ценных бумаг и не гарантирует исход голосования.",
    r7Title: "7. Сторонние рыночные и погодные данные",
    r7Body: "Спотовые цены, графики или FX-контекст на ANCAP могут поступать от сторонних провайдеров, в том числе CoinGecko. Локальная погода и время во виджете Earth могут поступать от AccuWeather (https://www.accuweather.com/) через backend ANCAP по приблизительным координатам IP. Это только ориентиры: не цена расчёта, не оракул-гарантия, не оферта купли/продажи, не инвестиционный совет и не официальное метеопредупреждение. Котировки desk, конверсии моста и учётные единицы ACP могут отличаться от внешних экранов.",
    r8Title: "8. Риск исхода долголетия, печати органов и ветеринарии",
    r8Body:
      "Рейлы AETERNA (печать органа, крио тканей кошки, VET REGEN POD для собаки) могут не состояться, задержаться или быть отклонены лицензированным партнёром. Иллюстрации концептуальны. Процент выживаемости, скорость регенерации и возвращение к жизни не обещаются. Оплата ACP не создаёт у ANCAP клинической или ветеринарной обязанности заботы.",
    r9Title: "9. Риск гуманитарной помощи и передачи партнёру",
    r9Body:
      "Гуманитарные брифы могут быть задержаны, отклонены или перенаправлены национальным обществом или каналом МФКК. ANCAP сам не доставляет еду, воду, одежду, лекарства и не трудоустраивает. Листинг стола — не подписанное партнёрство с Красным Крестом и не налоговый вычет. Медпрепараты — не аптека. Подъёмная работа — не гарантированная занятость. См. /legal/humanitarian.",
    riskMarketDataMore: "Полное раскрытие по рыночным данным:",
    p9Title: "9. Провайдеры рыночных и погодных данных",
    p9Body: "Чтобы показывать ориентировочный крипто- и FX-контекст, ANCAP может вызывать сторонние API (сейчас CoinGecko). Для погоды во виджете Earth / Support ANCAP может вызывать AccuWeather API с приблизительными lat/lon из IP-геолокации (или временный числовой фид с атрибуцией AccuWeather, если ключ не настроен). Запросы идут с серверными ключами ANCAP где применимо и обычно не передают ваш пароль. У провайдера могут оставаться технические логи (включая приблизительное местоположение) по их политике. Мы не продаём ваши персональные данные вендорам рыночных или погодных данных.",
    marketDataKicker: "Раскрытие для клиентов",
    marketDataTitle: "Рыночные данные, CoinGecko и AccuWeather",
    marketDataIntro: "Как ANCAP использует сторонние рыночные и погодные данные на ancap.cloud (CoinGecko и AccuWeather). Дополняет раскрытие рисков и уведомление о конфиденциальности.",
    md1Title: "1. Что мы показываем — рынки",
    md1Body: "ANCAP может показывать ориентировочные спотовые цены (например BTC, ETH, USDT, BNB, SOL) из CoinGecko через backend. Публичный API: GET /api/v1/market/prices. Блоки могут быть на главной и на страницах прозрачности, например Reserves.",
    md2Title: "2. Не расчёт и не совет",
    md2Body: "Цены CoinGecko не являются ценами расчёта ANCAP. Они не определяют desk-ставки ACP, 1:1 мост wACP, коллатераль sACP, Stripe top-up или OTC. Это не инвестиционный и не торговый совет.",
    md3Title: "3. Точность и доступность — рынки",
    md3Body: "Ленты могут запаздывать, быть неполными, ограничиваться rate limit или быть недоступны. Действуют кэш и лимиты Demo/Pro. При сбое ANCAP может скрыть цены или использовать статичный конфиг без заявления о живом рынке.",
    md4Title: "4. Атрибуция — рынки",
    md4Body: "Там, где показаны данные CoinGecko, ANCAP указывает источник. CoinGecko — независимая сторона; ANCAP не аффилирован с CoinGecko, если отдельно не указано иное.",
    md5Title: "5. Ваша ответственность — рынки",
    md5Body: "Не опирайтесь на ориентировочные экраны для необратимых переводов. Перед отправкой средств проверяйте официальные адреса контрактов ANCAP, reserve proof и котировки в продукте.",
    md6Title: "6. Что мы показываем — погода (AccuWeather)",
    md6Body: "Плавающий виджет Earth / Support может показывать локальное время и текущую погоду для приблизительного места по IP. Текст погоды, температура и связанные поля предназначены поступать от AccuWeather (https://www.accuweather.com/) через серверный прокси ANCAP GET /api/v1/weather/current. Для полного прогноза и предупреждений показывается ссылка на AccuWeather.",
    md7Title: "7. Погода — не служба предупреждений",
    md7Body: "Погода в виджете — только UX-контекст. Это не замена официальных метеопредупреждений, авиационных/морских рекомендаций или экстренных оповещений. Для критических решений открывайте AccuWeather или национальную метеослужбу напрямую.",
    md8Title: "8. Локация, privacy и условия AccuWeather",
    md8Body: "Приблизительные координаты для погоды берутся из IP-геолокации в браузере и отправляются в weather API ANCAP. AccuWeather может обрабатывать локацию и технические метаданные по своим условиям и privacy policy. ANCAP эти данные не продаёт. Если ключ AccuWeather API не настроен, ANCAP может показать временный числовой фид, сохраняя атрибуцию и ссылку на AccuWeather.",
    marketDataAttributionTitle: "Провайдеры",
    marketDataAttributionBody: "Рыночные данные предоставлены CoinGecko. Погодные данные предоставлены AccuWeather (https://www.accuweather.com/). Ознакомьтесь с условиями и политикой конфиденциальности каждого провайдера на их сайте.",
    refundsKicker: "Политика биллинга",
    refundsTitle: "Платежи и возвраты",
    refundsIntro: "Как ANCAP относится к платным запускам workflow, API, кредитам и fiat-пополнениям для клиентов ancap.cloud.",
    f1Title: "1. Когда списание окончательно",
    f1Body: "Если для продукта не указано иное, покупка workflow считается использованной с начала исполнения. Успешно завершённые запуски обычно не возвращаются: compute и модель расходуются сразу.",
    f2Title: "2. Сбойные или деградировавшие запуски",
    f2Body: "Если запуск сорвался из-за подтверждённого сбоя платформы (а не из-за неверных входов, отмены вами или внешнего сбоя модели вне разумного контроля), запросите кредит или повтор на support@ancap.cloud. Могут понадобиться ID квитанции, время и логи.",
    f3Title: "3. Кредиты и балансы ACP",
    f3Body: "Кредиты и балансы ACP — учётные единицы Сервисов, не банковские депозиты. Неиспользованные балансы могут попадать под inactivity/abuse/compliance holds. Мошеннические пополнения могут быть отменены.",
    f4Title: "4. Fiat-процессоры",
    f4Body: "Карточные платежи через Stripe и партнёров подчиняются их правилам диспутов. Chargeback без предварительного обращения в support@ancap.cloud может затянуть решение и привести к проверке аккаунта.",
    f5Title: "5. Как запросить проверку",
    f5Body: "Напишите на support@ancap.cloud с email аккаунта, ID платежа/запуска и кратким описанием. Обязательные права потребителя на отказ, где они применимы и не исчерпаны запрошенным вами цифровым исполнением, сохраняются.",
    refundsWelcomeGrantMore: "Грант при регистрации — промо-кредит платформы, не пожертвование и не возврат фиатом. Подробности:",
    welcomeGrantKicker: "Биллинг / потребительское право",
    welcomeGrantTitle: "Грант при регистрации: 100 ACP кредита доступа",
    welcomeGrantIntro:
      "ANCAP начисляет 100 ACP новому аккаунту, чтобы пользователь мог попробовать платные AI-workflow без первой покупки. «$100» — номинальная учётная метка. Эта страница фиксирует юридическую квалификацию: грант доступа, не благотворительность, не USD, не налоговый вычет. Инструменты ЕС — в пунктах 5–9.",
    wg1Title: "1. Что вы получаете",
    wg1Body:
      "После успешной регистрации ANCAP зачисляет 100 ACP на платформенный леджер. Сумма «$100» — номинальная учётная метка, потому что ACP — единица цены SKU. Это не выплата 100 долларов США, не банковский перевод, не airdrop стейблкоина и не подарок фиата.",
    wg2Title: "2. Цель доступа (почему это звучит как благотворительность)",
    wg2Body:
      "Заявленная цель оператора — снизить денежный барьер, чтобы новый человек мог попробовать платные AI-workflow. В обычной речи это грант доступа. Эта цель не превращает кредит в пожертвование по закону.",
    wg3Title: "3. Право РФ — не пожертвование",
    wg3Body:
      "Пожертвование по ст. 582 ГК РФ — дарение имущества одаряемому для общеполезных целей. Платформа, которая кредитует собственный внутренний леджер, имущество благотворительной организации не передаёт. 135-ФЗ о благотворительной деятельности касается зарегистрированных НКО и фактической передачи средств/имущества на уставные цели с документами. ANCAP не выдаёт этот грант за деятельность благотворительной организации. Называть маркетинговый кредит «благотворительностью» без такой формы — ненадлежащая реклама по ст. 5 38-ФЗ. Грант не лотерея и не случайный приз. Пользователь не получает налоговый вычет по НК РФ лишь потому, что ему начислили или он потратил этот кредит.",
    wg4Title: "4. США",
    wg4Body:
      "Грант не является налоговычитаемым charitable contribution по IRC §170 и не подарок 501(c)(3), пока отдельная зарегистрированная charity реально не получает средства. FTC Act §5 запрещает обман: называть signup-промо «донатом», когда это кредит платформы, — misleading. ACP остаётся utility / учётной единицей, не продуктом инвестиционной доходности.",
    wg5Title: "5. ЕС — недобросовестная коммерческая практика (не благотворительность)",
    wg5Body:
      "Директива 2005/29/EC о недобросовестных коммерческих практиках (UCPD) в редакции (EU) 2019/2161 (Omnibus) запрещает misleading actions/omissions (ст. 6–7). Приложение I, п. 22: ложно утверждать или создавать впечатление, что трейдер действует не в целях своей торговли, бизнеса или профессии. Выдавать этот signup-кредит за пожертвование, гуманитарный дар или деятельность признанной организации общественного блага — когда ANCAP коммерческая платформа и средства зарегистрированной EU-charity не передаются — было бы misleading commercial practice. Директива об электронной коммерции 2000/31/EC ст. 6: коммерческие коммуникации должны быть явно распознаваемы; этот грант — коммерческое промо доступа, не сбор в пользу НКО. Национальные аналоги: Германия UWG §§ 5 / 5a; Франция Code de la consommation L. 121-1 и след.; Италия Codice del Consumo. В Великобритании те же выводы дают Consumer Protection from Unfair Trading Regulations 2008 (сохранённая UCPD после Brexit). Этот кредит не делает ANCAP немецкой gemeinnützige Körperschaft (AO § 52), французским organisme d’intérêt général для mécénat или британской charity по Charities Act 2011.",
    wg6Title: "6. ЕС — права потребителя и несправедливые условия",
    wg6Body:
      "Директива о правах потребителей 2011/83/EU и Директива (EU) 2019/770 о цифровом контенте/услугах: грант — безвозмездный промо-кредит, не возмездный дистанционный договор. 14-дневное право отказа (CRD ст. 9) относится к поздней платной цифровой услуге, которую заказывает потребитель, а не к самому бесплатному кредиту. Если потребитель просит немедленное исполнение платной цифровой услуги в период отказа (CRD ст. 16(m) / 16a), эти правила — в «Платежи и возвраты» и грантом не отменяются. Директива 93/13/EEC о несправедливых условиях: условия об отмене гранта за abuse/мультиаккаунты должны быть прозрачными и соразмерными и не могут отменять императивные права потребителя. Регламент о геоблокировке (EU) 2018/302: этот кредит не предлагается как ценовая дискриминация по гражданству государства-члена. Digital Services Act (EU) 2022/2065 не превращает леджер-кредит платформы в пожертвование.",
    wg7Title: "7. ЕС — не e-money, не платёжная услуга, не потребительский кредит",
    wg7Body:
      "Директива об электронных деньгах 2009/110/EC (EMD2): e-money — электронно хранимая денежная стоимость, представляющая требование к эмитенту, выпускаемая при получении средств и принимаемая лицами иными, чем эмитент. Этот грант выпускается без получения средств от пользователя, тратится только на сервисы ANCAP и не погашается в EUR/USD. ANCAP не выдаёт себя за electronic money institution этим кредитом. PSD2 (EU) 2015/2366: грант не платёжная операция, не платёжный счёт и не выпуск платёжного инструмента. Директива о потребительском кредите 2008/48/EC и новая (EU) 2023/2225: это не заём, не отсрочка платежа и не кредит с процентами или графиком погашения. Детерминированный кредит «один на аккаунт» не азартная игра и не лицензируемая лотерея ЕС.",
    wg8Title: "8. ЕС — MiCA и рамка рынков капитала",
    wg8Body:
      "Регламент о рынках криптоактивов (EU) 2023/1114 (MiCA): ACP позиционируется как utility / учётная единица для платных AI-workflow. Грант не публичное предложение asset-referenced token или e-money token, не fundraising-оферта криптоактивов и не право на дивиденды, проценты или долю прибыли. Это не финансовый инструмент по MiFID II 2014/65/EU и не оферта ценных бумаг по Prospectus Regulation (EU) 2017/1129. В маркетинге нельзя писать «гарантированная доходность», «безрисковые $100» и подобный yield. Номинальная метка «$100» — шкала учёта цен SKU, не обещание выплатить 100 долларов США или 100 евро.",
    wg9Title: "9. ЕС — НДС, налоги и персональные данные",
    wg9Body:
      "Директива по НДС 2006/112/EC: бесплатный промо-кредит без встречного предоставления, как правило, не является облагаемой поставкой в момент начисления. Поздняя платная услуга workflow может быть облагаемой поставкой по обычным правилам места поставки / OSS; это уведомление не определяет НДС-статус пользователя. Грант не налоговычитаемый дар организации общественного блага ЕС (национальные режимы charitable relief / Gift Aid не применяются). DAC8 / Директива (EU) 2023/2226, где применима, касается отчётных операций с криптоактивами — этот промо-кредит леджера не благотворительный взнос для налоговой отчётности. GDPR (EU) 2016/679: данные регистрации обрабатываются для создания аккаунта и начисления гранта (ст. 6(1)(b) исполнение условий); подробности — в Privacy Notice. Грант не «донат» для выбивания дополнительного marketing consent сверх Cookie Policy и Privacy Notice (ePrivacy 2002/58/EC).",
    wg10Title: "10. Правила продукта",
    wg10Body:
      "Один грант на аккаунт. Повторная регистрация того же email отклоняется. Злоупотребление и мультиаккаунты могут привести к отмене кредита. Тратится на сервисы ANCAP. Не выводится как USD или EUR. Не проценты, не yield, не стейкинг-награда и не ценная бумага. Отдельно от бонуса рефереру 25 ACP после подтверждённой покупки реферала.",
    wg11Title: "11. Возвраты и злоупотребления",
    wg11Body:
      "Грант не возвращается фиатом. Мошеннические и дублирующие аккаунты могут быть закрыты с отменой кредита. Платные запуски — по политике платежей и возвратов. Императивные права потребителя ЕС на отказ от поздней платной цифровой услуги, где они применимы, грантом не затрагиваются.",
    wg12Title: "12. Это не юридическая консультация",
    wg12Body:
      "Страница — раскрытие оператора, не совет пользователю по налогам, отчётности НКО или лицензированная юридическая консультация в ЕС/ЕЭЗ/Великобритании или где бы то ни было. Вопросы: legal@ancap.cloud. Гуманитарные брифы (еда, вода, одежда, медпрепараты, подъёмная работа) — отдельный продукт на /humanitarian и /legal/humanitarian, это не грант при регистрации.",
    welcomeGrantAlso: "Открыть аккаунт или связанные уведомления:",
    humanitarianKicker: "Юридическое / гуманитарное",
    humanitarianTitle: "Стол гуманитарной помощи и листинги Красного Креста / Красного Полумесяца",
    humanitarianIntro:
      "Как ANCAP описывает ACP-брифы гуманитарной помощи и передачу национальным обществам Красного Креста / Красного Полумесяца. ANCAP не зарегистрированная благотворительная организация и не заявляет подписанное партнёрство с МККК, МФКК или национальным обществом, пока датированное соглашение не опубликовано здесь.",
    hum1Title: "1. Роль платформы",
    hum1Body:
      "ANCAP — ACP-first программная платформа. На /humanitarian продаются брифы помощи и инструменты передачи партнёру, расчёты в ACP. ANCAP не является благотворительной организацией по Федеральному закону РФ № 135-ФЗ от 11.08.1995, не общественно-полезной / gemeinnützig организацией, не UK charity и не 501(c)(3) США. Оплата ACP не делает пользователя жертвователем ANCAP как НКО.",
    hum2Title: "2. Движение Красного Креста / Красного Полумесяца",
    hum2Body:
      "Международное движение состоит из МККК, МФКК и национальных обществ — это разные компоненты. Листинг МФКК или Российского, Украинского, Немецкого, Американского Красного Креста — рейл на официальные сайты, не членство в Движении, не агентский фандрайзинг-контракт, не одобрение МККК и не утверждение, что ANCAP «это Красный Крест». Пока MoU не опубликован, official_partnership = false.",
    hum3Title: "3. Что оплачивает ACP",
    hum3Body:
      "ACP на этом столе оплачивает бриф и вклад в передачу партнёрскому каналу: экстренное питание, питьевая вода, продовольствие, тёплая одежда, медпрепараты через лицензированные каналы, подбор подъёмной работы. ANCAP не держит склады, не водит скорую и не эксплуатирует WASH-бригады. Цены from — не налоговая квитанция и не гарантия пайка, одежды, лекарства или рабочего места.",
    hum4Title: "4. Отличие от гранта при регистрации",
    hum4Body:
      "100 ACP при регистрации — промо-доступ к платформе, явно не благотворительность. Нельзя смешивать /legal/welcome-grant и /legal/humanitarian. Смешение в рекламе вводит в заблуждение по 38-ФЗ и UCPD Annex I п. 22 (ложное впечатление благотворительной цели).",
    hum5Title: "5. Эмблемы и Женевские конвенции",
    hum5Body:
      "Красный крест, красный полумесяц и красный кристалл — охраняемые отличительные знаки по Женевским конвенциям 1949 г. и Дополнительным протоколам. У ANCAP нет лицензии использовать их как логотип, иконку приложения или значок оплаты. Сайт использует текстовые названия и ссылки на официальные домены. emblem_licensed = false.",
    hum6Title: "6. Медицинские препараты",
    hum6Body:
      "Брифы по медпрепаратам — только лицензированные / партнёрские каналы. ANCAP не аптека, не интернет-аптека, не выписывает рецепты и не даёт медицинских советов. Контролируемые вещества, нелицензированный оборот лекарств и DIY-протоколы запрещены. Правила здравоохранения и таможни партнёра определяют, что можно отгрузить.",
    hum7Title: "7. Подъёмная работа",
    hum7Body:
      "Подбор подъёмной работы — бриф в партнёрские программы. ANCAP не лицензированное кадровое агентство во всех юрисдикциях, не спонсор визы и не гарантирует работу, зарплату или разрешение на труд. Нельзя рекламировать «гарантированное трудоустройство».",
    hum8Title: "8. Российская Федерация",
    hum8Body:
      "Благотворительная деятельность регулируется 135-ФЗ. Ст. 582 ГК (пожертвование) — отдельный гражданско-правовой дар дозволенному одаряемому; списание ACP в леджере ANCAP само по себе таким даром не является, пока зарегистрированная charity отдельно не выдаст квитанцию. Реклама, что ANCAP — благотворительная организация или что платежи ACP автоматически дают налоговый вычет, запрещена (38-ФЗ). Программы национального общества остаются программами Российского Красного Креста, не ANCAP.",
    hum9Title: "9. ЕС, Великобритания, США и налоговые квитанции",
    hum9Body:
      "UCPD 2005/29/EC Annex I п. 22 и Директива об электронной коммерции 2000/31/EC ст. 6: коммерческие сообщения не должны создавать ложного впечатления благотворительной цели или действий от имени гуманитарной организации. Аналогично DE UWG, FR Code de la consommation, UK CPRs 2008, US FTC Act §5. IRC §170 / Gift Aid / Zuwendungsbestätigung требуют квитанции квалифицированного получателя — запись ACP в ANCAP ею не является. MiCA: этот стол не публичное предложение криптоактива.",
    hum10Title: "10. Контакты",
    hum10Body:
      "Юридические уведомления: legal@ancap.cloud. Продукт: /humanitarian. Связанные страницы: /legal/welcome-grant, /legal/terms, /legal/risk. Официальные сайты Движения: https://www.ifrc.org/ и домены национальных обществ на столе. Страница — раскрытие оператора, не лицензированный юридический, налоговый или медицинский совет.",
    humanitarianAlso: "Связанные уведомления и официальные сайты:",
    cyberKicker: "Юридическая / публичная политика",
    cyberTitle: "Поддержка ANCAP коллективной киберзащиты",
    cyberIntro: "ANCAP публично согласна с открытым письмом OpenAI «A call for collective action on cyber defense». Эта страница — юридическое и политическое заявление. Она не заменяет Пользовательское соглашение, Privacy Notice или Cookie Policy.",
    openLetter: "Открытое письмо (openai.com)",
    cyberStatementTitle: "Заявление о согласии",
    cyberStatement1: "ANCAP как оператор ancap.cloud и связанных ACP, wallet, workflow и API сервисов согласна с исходным тезисом письма: есть ограниченное окно усилить киберзащиту. AI-атаки дешевеют и автоматизируются, в том числе против больниц, водоснабжения и интернет-инфраструктуры. Те же модели могут помочь защитникам закрыть накопленные слабости. ANCAP поддерживает приоритет кибербезопасности на уровне руководства, финансирование защиты, обмен playbook и подотчётность действий AI-агентов.",
    cyberStatement2: "Среди подписантов письма — технологические, security, платёжные, телеком и промышленные компании. ANCAP не является перечисленным подписантом того письма. Здесь зафиксировано независимое согласие ANCAP с той же политикой и теми же тремя принципами.",
    cyberP1Title: "1. Текущей безопасности недостаточно",
    cyberP1Body: "Системы уязвимы из-за накопленных багов, избыточных привилегий, слабой аутентификации и техдолга. Команды безопасности, особенно в критической инфраструктуре, хронически недофинансированы. ANCAP считает это риском уровня руководства.",
    cyberP2Title: "2. Защитникам нужен ИИ",
    cyberP2Body: "Тот же класс моделей, что удешевляет атаки, может дать большему числу команд экспертный уровень защиты. Проверенные инструменты одной организации должны помогать многим. ANCAP будет использовать ИИ для обороны, audit trail и операторских проверок — не для удешевления атаки.",
    cyberP3Title: "3. Ответ должен быть коллективным",
    cyberP3Body: "Ни одна компания не контролирует всю поверхность угроз. ANCAP согласна, что вендоры, разработчики моделей, государства и операторы должны действовать совместно, чтобы опыт одной жертвы повышал стоимость следующей атаки.",
    cyberCommitTitle: "Обязательства ANCAP по этой политике",
    cyberC1Title: "Приоритет руководства",
    cyberC1Body: "Кибербезопасность обрабатывается с срочностью инцидента: закрывать самые опасные слабости, проверять результат и повышать планку того, что мы покупаем, поставляем и запускаем — включая код, написанный ИИ.",
    cyberC2Title: "Оборонительное использование ИИ",
    cyberC2Body: "ANCAP применяет ИИ к оборонительным задачам, аудируемости и поддержке операторов. Платные workflow и агенты подчиняются запрету атак, malware, мошенничества и несанкционированного доступа.",
    cyberC3Title: "Прослеживаемые агенты",
    cyberC3Body: "Действия AI-агентов на ANCAP должны быть прослеживаемы через квитанции, хеши, логи и proof-артефакты там, где продукт уже фиксирует исполнение.",
    cyberC4Title: "Общие стандарты",
    cyberC4Body: "ANCAP поддерживает партнёрство, обмен threat intelligence и общие оборонительные стандарты между технологическими компаниями, операторами инфраструктуры и госучреждениями.",
    cyberC5Title: "Повысить стоимость атаки",
    cyberC5Body: "Ключевой экономический тест: атака должна стоить больше, чем может вернуть. Восстановить эту стоимость можно только коллективно.",
    cyberScopeTitle: "Объём и пределы",
    cyberScope1: "Это заявление публичной политики. Само по себе оно не создаёт гарантию, страховку, SLA или партнёрство с государством. Пользователи связаны Пользовательским соглашением, включая запрет атак и malware. Наступательная киберпомощь вне продукта.",
    cyberScope2: "Исходный документ:",
    clarityKicker: "Юридическая / публичная политика",
    clarityTitle: "Полное согласие ANCAP с CLARITY Act",
    clarityIntro:
      "ANCAP публично фиксирует полное согласие с Digital Asset Market Clarity Act (CLARITY Act) — обновляемым законодательством США о рыночной структуре цифровых активов. Эта страница — юридическое и политическое заявление. Она не заменяет Пользовательское соглашение, Раскрытие рисков, Privacy Notice или Cookie Policy.",
    clarityBillLink: "Текст законопроекта (Congress.gov)",
    clarityNewsLink: "Публичное сообщение об обновлённом тексте",
    clarityStatementTitle: "Заявление о полном согласии",
    clarityStatement1:
      "ANCAP как оператор ancap.cloud и связанных сервисов ACP, кошелька, workflow, bridge, стейблкоина и API полностью согласна с ключевой целью CLARITY Act: установить более ясный федеральный каркас для рынков цифровых активов, прояснить, когда активы и деятельность относятся к надзору за ценными бумагами, а когда — к товарному надзору, и снизить регуляторную неопределённость, вредящую законным билдерам, платёжным рейлам и пользователям.",
    clarityStatement2:
      "ANCAP поддерживает чёткие границы полномочий SEC и CFTC, прозрачные правила рыночной структуры для цифровых commodities и связанных активностей, а также комплаенс-готовые рейлы для утилитарных расчётных активов вроде ACP / wACP / sACP. ANCAP не является членом Конгресса, не становится зарегистрированным лоббистом лишь из-за этой страницы и не является госорганом. Здесь зафиксировано независимое полное согласие ANCAP с целями ясности рынка вокруг обновлённого текста перед floor consideration.",
    clarityP1Title: "1. Ясность рынка вместо неопределённости",
    clarityP1Body:
      "Билдерам и клиентам нужны предсказуемые правила классификации, кастоди, площадок и раскрытий. ANCAP согласна: статутная ясность лучше режима «только enforcement» для рыночной структуры цифровых активов.",
    clarityP2Title: "2. Юрисдикция по активу и деятельности",
    clarityP2Body:
      "ANCAP согласна, что securities-подобная деятельность должна оставаться под надзором за ценными бумагами, а рыночная деятельность digital commodities — иметь согласованный каркас с участием CFTC, в духе целей Act.",
    clarityP3Title: "3. Законная коммерция и утилитарные рейлы",
    clarityP3Body:
      "ANCAP позиционирует ACP как утилитарную / учётную единицу для платных AI-workflow и кредитов платформы — не как продукт с обещанной инвестиционной доходностью. Полное согласие с целями CLARITY усиливает MiCA-safe / utility messaging и готовность выровнять раскрытия с применимым правом США после принятия.",
    clarityCommitTitle: "Обязательства ANCAP по этому заявлению",
    clarityC1Title: "Полное публичное согласие",
    clarityC1Body: "ANCAP заявляет полное согласие с целью CLARITY Act — ясность рынка цифровых активов — и держит это заявление в Юридическом центре.",
    clarityC2Title: "Честный статус продукта",
    clarityC2Body: "ANCAP не использует это заявление, чтобы утверждать, что ACP — зарегистрированная ценная бумага, что любой токен законен во всех юрисдикциях, или что законопроект уже подписан, пока этого нет.",
    clarityC3Title: "Комплаенс после принятия",
    clarityC3Body: "Если CLARITY (или преемник) будет принят, ANCAP сверит messaging, партнёрские рейлы и раскрытия с финальным статутом и правилами.",
    clarityC4Title: "Не замена консультации пользователя",
    clarityC4Body: "Пользователи сами отвечают за правовой, налоговый и лицензионный анализ. Это заявление не является юридической консультацией клиенту.",
    clarityC5Title: "Дисциплина обновлений",
    clarityC5Body: "Существенные законодательные изменения будут отражены на этой странице и при необходимости в Условиях и Раскрытии рисков.",
    clarityScopeTitle: "Объём и пределы",
    clarityScope1:
      "Это публичное юридико-политическое заявление о полном согласии с целями рыночной структуры CLARITY Act. Оно само по себе не создаёт гарантию, страховку, SLA, партнёрство с государством, лоббистский мандат или инвестиционную рекомендацию. Принятие любого законопроекта — вопрос Конгресса и Президента. До принятия ANCAP действует по существующему применимому праву и уведомлениям Юридического центра.",
    clarityScope2: "Ссылки:",
    footerLegal: "Юридическое",
    footerTerms: "Условия",
    footerPrivacy: "Конфиденциальность",
    footerCookies: "Cookie",
    footerRisk: "Риски",
    footerRefunds: "Возвраты",
    footerWelcomeGrant: "Грант 100 ACP",
    footerHumanitarian: "Помощь",
    footerVetRegen: "Вет-реген",
    footerLightChamber: "Световая камера",
    footerBodyContouring: "Контур тела",
    footerBiofusion: "BioFusion",
    footerDpsc: "Биоматериал DPSC",
    footerVascularPlus: "Vascular Care+",
    footerVascular: "Vascular Care",
    footerTransdermal: "Трансдермальный",
    footerMReceptor: "M-рецепторы",
    footerOxygenCarrier: "Переносчик O₂",
    footerClarity: "CLARITY Act",
    authAgreePrefix: "Я соглашаюсь с",
    authAgreeAnd: "и",
    authAgreeSuffix: ".",
  },
  uk: {
    lastUpdated: "Оновлено: 12 вересня 2026.",
    privacyLink: "Повідомлення про конфіденційність",
    cookiesLink: "Політика cookie",
    termsLink: "Угода користувача",
    cyberLink: "Колективний кіберзахист",
    clarityLink: "CLARITY Act",
    acpLink: "ACP Whitepaper",
    riskLink: "Розкриття ризиків",
    refundsLink: "Платежі та повернення",
    welcomeGrantLink: "Грант при реєстрації",
    humanitarianLink: "Гуманітарна допомога",
    hubLink: "Юридичний центр",
    complianceLink: "Комплаєнс",
    contactLegal: "legal@ancap.cloud",
    contactPrivacy: "privacy@ancap.cloud",
    contactSupport: "support@ancap.cloud",
    hubKicker: "Юридичний центр",
    hubTitle: "Юридична інформація для клієнтів ANCAP",
    hubIntro: "Зрозумілі правила для людей і команд на ancap.cloud: угоди, конфіденційність, cookie, платежі, ризики ШІ/крипто та контакти.",
    hubCardTerms: "Правила для акаунтів, гаманців, платних workflow, API, авторів і забороненої поведінки.",
    hubCardPrivacy: "Які дані обробляємо, навіщо, строки зберігання, ваші права та контакти.",
    hubCardCookies: "Необхідне й опціональне зберігання та як працює згода.",
    hubCardRisk: "Чесне розкриття: результати ШІ, утилітарна природа ACP, ризики мосту/гаманця, без гарантії дохідності.",
    marketDataLink: "Ринкові дані",
    hubCardMarketData: "Як ANCAP використовує CoinGecko та інші цінові стрічки — лише орієнтовно.",
    footerMarketData: "Ринкові дані",
    researchRefsLink: "Наукові посилання",
    hubCardResearchRefs:
      "Сторонні наукові інструменти та патентна журналістика, які ми цитуємо (ZEISS Lightfield 4D, Daewoong eTurna USPTO allowance) — без афіліації.",
    footerResearchRefs: "Наукові посилання",
    researchRefsKicker: "Third-party science",
    researchRefsTitle: "Research references and instrument citations",
    researchRefsIntro:
      "How ANCAP cites public third-party scientific instruments and technology notes. Downloads and trademarks remain with their owners.",
    rr1Title: "1. Purpose",
    rr1Body:
      "ANCAP may cite public product pages and technology notes as educational context for longevity, imaging, and AETERNA research workflows. Citations are not an endorsement or resale of third-party hardware.",
    rr2Title: "2. ZEISS Lightfield 4D",
    rr2Body:
      "ANCAP references ZEISS LSM Lightfield 4D as public technical context. Product page and technology note links are on this Legal center and AETERNA. Gated thank-you downloads are served by ZEISS under ZEISS terms.",
    rr3Title: "3. No affiliation or trademark license",
    rr3Body:
      "ZEISS, Carl Zeiss, Lightfield 4D, LSM, ZEN, and related marks are trademarks of Carl Zeiss AG / Carl Zeiss Microscopy GmbH or affiliates. ANCAP is not affiliated with or endorsed by ZEISS unless a separate written agreement says otherwise.",
    rr4Title: "4. Downloads and hosting",
    rr4Body:
      "ANCAP does not host or redistribute ZEISS proprietary PDFs. We link to ZEISS-controlled URLs only.",
    rr5Title: "5. Not medical or clinical advice",
    rr5Body:
      "Instrument citations do not create medical or clinical advice. Verify partner licenses and local law before any clinical use.",
    rr6Title: "6. Quantum information / data-protection research (iXBT Live)",
    rr6Body:
      "ANCAP cites the public iXBT Live article on an ‘impossible’ quantum paradox in data protection (private-capacity superadditivity; AI + Lean 4) as literacy for the quantum-link digital SIM desk. No affiliation with iXBT; no QKD warranty.",
    rr7Title: "7. Daewoong / eTurna mRNA LNP (USPTO notice of allowance)",
    rr7Body:
      "As of 11 September 2026, ANCAP cites public journalism that Daewoong Pharmaceutical received a USPTO notice of allowance (27 August 2026) for ionizable lipids in the eTurna LNP platform. Allowance ≠ issued patent ≠ approved drug. Preclinical only. No affiliation; no lipid recipes or wet-lab protocols on ANCAP hosts.",
    rr8Title: "8. Chalmers Floquet bosonic codes / quantum lattice gates (PRL 2026)",
    rr8Body:
      "As of 11 September 2026, ANCAP cites Nauka TV (10 Sep 2026) coverage of Huang–Du–Guo PRL (DOI 10.1103/tnb8-3m8m): bosonic codes + quantum lattice gates in one Floquet period instead of thousands. Theoretical; not ANCAP hardware. No affiliation with Chalmers / Tianjin / APS.",
    rr9Title: "9. Startup investment desk — IT gazelle / B2B retail & AI cites (2026)",
    rr9Body:
      "As of 12 September 2026, /startups cites CNews/Spark-Interfax ICT gazelles (GA Tactic / Golden Apple concentration), Forbes/FRIИ small-IT gazelles, Sky.pro AI/SECaaS idea ranges, and businessmens.ru agrotech niches. Not a securities offering, not investment advice, no affiliation with named publishers or issuers.",
    researchRefsLinksTitle: "Canonical research links",
    researchRefsLinksBody:
      "Use public publisher URLs. Prefer the source page if a deep link changes. Includes ZEISS, Daewoong/eTurna USPTO-allowance journalism, Chalmers Floquet bosonic codes, iXBT, and 2026 IT-gazelle / startup-market journalism.",
    cryoLink: "Кріоніка та конституції",
    hubCardCryo:
      "Стіл кріоконсервації, research-протоколи за тихоходками, партнери КріоРус і Tomorrow.bio, ветеринарні рейли тканин / VET REGEN POD, конституційні межі на дату повідомлення.",
    footerCryo: "Кріоніка",
    cryoKicker: "Право / longevity",
    cryoTitle: "Кріоконсервація, партнери та конституційні межі",
    cryoIntro:
      "Як ANCAP оформлює кріо-інтенти, ліцензованих партнерів, протоколи за тихоходками та ветеринарні рейли тканин/органів у межах чинних конституцій і санітарного права на 12 вересня 2026.",
    cryo1Title: "1. Роль платформи",
    cryo1Body:
      "ANCAP надає ACP-розрахунки інтентів і handoff партнерам. ANCAP не експлуатує кріосховища. Фізичну кріоконсервацію виконують лише ліцензовані партнери.",
    cryo2Title: "2. Партнери — КріоРус і Tomorrow.bio",
    cryo2Body:
      "У каталозі-столі: КріоРус (RU) і Tomorrow.bio (EU). Лістинг — рейл передачі ліцензованому партнеру, не клінічний, етичний чи регуляторний аудит. Придатність і зберігання — за договорами партнера. Публічна критика методів частини провайдерів кріоніки існує; Tomorrow.bio на довгому горизонті ефективності залишається early-stage. Лістинг не є доказом оживлення.",
    cryo3Title: "3. Кров тихоходок / криптобіоз",
    cryo3Body:
      "Згадки тихоходок — research-метадані, не дозволений продукт для трансфузії людині і не DIY-протокол.",
    cryo4Title: "4. Конституції (дата повідомлення)",
    cryo4Body:
      "Послуги пропонуються з урахуванням конституцій і вищого права юрисдикцій користувачів і партнерів станом на 12 вересня 2026 (зокрема Конституція РФ, Основний закон ФРН, Конституція України, рамки ЄС/США). Незаконна кріоніка не супроводжується.",
    cryo5Title: "5. Не медична порада",
    cryo5Body:
      "Каталог і відгуки користувачів/ШІ мають інформаційний характер. Обов’язкові права споживача/пацієнта зберігаються.",
    cryo6Title: "6. Ветеринарна кріоконсервація тканин (кіт)",
    cryo6Body:
      "Лістинг кріоконсерватора-відновлювача тканин кота — бриф прийому ліцензованого вет-партнера. ANCAP не виробляє камеру, не займається ветеринарною практикою і не стверджує, що заморожена тканина поверне життя чи дасть будь-який заявлений відсоток виживаності. Забір, заморозка, зберігання, розморожування і будь-яка реімплантація — лише в ліцензованого ветеринарного лікаря.",
    cryo7Title: "7. Камера регенерації органів (собака / VET REGEN POD)",
    cryo7Body:
      "VET REGEN POD — назва концептуальної камери пересадки органів і регенерації собаки. Цифри на інфографіці не є заявами продукту ANCAP. Фізичні процедури — лише в ліцензованій ветеринарній операційній. Див. /legal/vet-regen.",
    cryo8Title: "8. Критика партнерів, спекуляція і що оплачує ACP",
    cryo8Body:
      "Партнери з кріоніки лишаються під публічною і регуляторною критикою. ACP на цьому столі оплачує бриф консультації/прийому і передачу, не токенізовану людину і не DeFi-дохідність на оживлення. Аукціон літературних ліцензій — окремий тонкий IP-стіл з медіаною жанру як comparable і fail-closed pump-ставками. Див. /literary і /legal/risk.",
    vetRegenLink: "Ветеринарні рейли органів",
    hubCardVetRegen:
      "Кріоконсерватор тканин кота і камера VET REGEN POD для собаки: концептуальна архітектура партнера, лише ліцензований ветеринар, без гарантії воскресіння чи відсотка виживаності.",
    vetRegenKicker: "Право / ветеринарія",
    vetRegenTitle: "Ветеринарні рейли органів — кріоконсерватор і VET REGEN POD",
    vetRegenIntro:
      "Як ANCAP оформлює банкування тканин і регенерацію органів тварин-компаньйонів на 12 вересня 2026. Ці сторінки продають ACP-брифи консультації та прийому, а не обладнання і не ветеринарне лікування.",
    vr1Title: "1. Роль платформи",
    vr1Body:
      "ANCAP дає розрахунок в ACP, брифи та підбір ліцензованого партнера. ANCAP не веде ветклініки, не виробляє кріокамери й обладнання VET REGEN POD і не оперує тварин.",
    vr2Title: "2. Це не виведений на ринок медичний виріб",
    vr2Body:
      "Інфографіки — концептуальна архітектура. Це не брошура виробу за EU MDR, не FDA 510(k)/NADA, не зареєстрований ветеринарний виріб і не CE-маркований продукт ANCAP.",
    vr3Title: "3. Заборонені заяви про результат",
    vr3Body:
      "ANCAP не заявляє повернення до життя, воскресіння, безсмертя, числовий відсоток виживаності (зокрема будь-які «до 98%» на ілюстрації) і регенерацію «у 2–5 разів швидше за природну». Не сприймайте ілюстрації як клінічні докази.",
    vr4Title: "4. Лише ліцензовані ветеринари",
    vr4Body:
      "Забір, анестезія, пересадка, імуномодуляція та післяопераційний догляд — акти ветеринарної практики. Власник не має права влаштовувати домашнє кріо чи DIY-біореактор.",
    vr5Title: "5. Право охорони здоров’я тварин (дата повідомлення)",
    vr5Body:
      "Послуги пропонуються з урахуванням законодавства про охорону здоров’я та добробут тварин станом на 12 вересня 2026 — зокрема законодавство РФ про ветеринарію, Регламент ЄС (EU) 2019/6, Директива 2010/63/EU, акти штатів США та FDA CVM, німецькі TierSchG / TAppV і відповідне українське ветеринарне законодавство.",
    vr6Title: "6. Не ветеринарна, медична й не фармакологічна порада",
    vr6Body:
      "Каталог, інфографіки, висновки workflow і відгуки мають інформаційний характер. Це не діагноз, не рецепт і не гарантія для будь-якої тварини.",
    vr7Title: "7. Дані про здоров’я улюбленця",
    vr7Body:
      "Ідентифікатори та клінічна історія тварини вважайте чутливими. Не завантажуйте регульовані ветзаписи без правової підстави. Сховища ANCAP — hash-first.",
    vr8Title: "8. Зв’язок із друком людського органа",
    vr8Body:
      "Друк органа людини (250 000 ACP за орган) залишається окремим handoff ліцензованого біореактора. Ветеринарні рейли не дозволяють клінічне застосування ілюстрованих камер до людини.",
    vr9Title: "9. Платежі",
    vr9Body:
      "ACP за ці workflow оплачує бриф консультації/прийому і підбір партнера — не право власності на обладнання і не гарантований клінічний результат. Повернення — за /legal/refunds.",
    vr10Title: "10. Контакти",
    vr10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#vet-regen і /cryo.",
    lightChamberLink: "Світлова камера Vinci",
    hubCardLightChamber:
      "Повнозростова камера фотобіомодуляції: грамотність Леонардо, лише ліцензований партнер з фототерапії, без «безпечного засмагу» і без заяви CE/FDA.",
    lightChamberKicker: "Право / фототерапія",
    lightChamberTitle: "Світлова камера Vinci — рейл фотобіомодуляції",
    lightChamberIntro:
      "Як ANCAP описує повнозростову LED / UVA / червону / ближній-ІЧ камеру на 12 вересня 2026. Ці сторінки продають ACP-брифи, не обладнання і не курс фототерапії.",
    lc1Title: "1. Роль платформи",
    lc1Body:
      "ANCAP забезпечує розрахунок в ACP, брифи і підбір ліцензованого партнера. ANCAP не веде дерматологічні клініки, не виробляє LED/UVA-капсули і не проводить сеанси світла.",
    lc2Title: "2. Не виведений на ринок медичний виріб",
    lc2Body:
      "Інфографіка — концептуальна архітектура. Це не брошура EU MDR / FDA і не реконструкція винаходу Леонардо. Лістинг workflow не означає випуск виробу на ринок.",
    lc3Title: "3. Заборонені заяви про результат",
    lc3Body:
      "ANCAP не обіцяє безпечний засмаг, лікування вітаміном D, колаген, загоєння ран чи омолодження. Червоний / ближній ІЧ — публічна дослідницька грамотність. УФ лишається класом ризику раку шкіри.",
    lc4Title: "4. Лише ліцензовані клініцисти",
    lc4Body:
      "Фототерапія та УФ — клінічні дії. Не можна збирати домашні LED-масиви чи солярії за цими сторінками.",
    lc5Title: "5. Скринінг",
    lc5Body:
      "Протоколи партнера мають враховувати фотосенсибілізацію, меланому в анамнезі, фотосенсибілізуючі препарати та фототип.",
    lc6Title: "6. Не медична рекомендація",
    lc6Body:
      "Каталог, інфографіка й відсилання до Леонардо — інформація, не діагноз і не план лікування.",
    lc7Title: "7. Дані про здоров’я",
    lc7Body:
      "Історію шкіри вважайте чутливою. Не завантажуйте медкарти без правової підстави.",
    lc8Title: "8. Зв’язок з іншими рейлами AETERNA",
    lc8Body:
      "Друк органів, мРНК-консультації та ветеринарні рейли лишаються окремими. Світлова камера не дозволяє DIY CRISPR чи неліцензоване обладнання фототерапії.",
    lc9Title: "9. Платежі",
    lc9Body:
      "ACP купує бриф консультації / протоколу сеансу і підбір партнера — не право на обладнання. Повернення — /legal/refunds.",
    lc10Title: "10. Контакти",
    lc10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#vinci-light.",
    bodyContouringLink: "Мікрохвильовий контур тіла",
    hubCardBodyContouring:
      "Контактно охолоджуваний аплікатор 2,45 / 5,8 ГГц: лише ліцензований естетичний / дерматологічний партнер, не ліпосакція, не виріб CE/FDA, не гарантована втрата жиру.",
    bodyContouringKicker: "Право / естетика",
    bodyContouringTitle: "Мікрохвильовий контур тіла — рейл ліцензованого естетичного партнера",
    bodyContouringIntro:
      "Як ANCAP описує контактно охолоджуваний мікрохвильовий контур тіла станом на 12 вересня 2026. Ці сторінки продають бриф консультації та протоколу сеансу за ACP, не обладнання і не лікування зі зниження жиру.",
    bc1Title: "1. Роль платформи",
    bc1Body:
      "ANCAP забезпечує розрахунок в ACP, бриф консультацій і підбір ліцензованого партнера для мікрохвильового контуру тіла AETERNA. ANCAP не веде естетичні клініки, не виробляє стійки й аплікатори, не випускає медичні вироби і не проводить сеанси контуру тіла.",
    bc2Title: "2. Не виріб на ринку",
    bc2Body:
      "Інфографіка — концептуальна архітектура для обговорення з партнером. Це не брошура виробу EU MDR, не FDA 510(k) чи PMA, не CE-маркований естетичний продукт, який продає ANCAP, і не рецепт домашньої мікрохвильової антени. Лістинг workflow не виводить виріб на ринок.",
    bc3Title: "3. Заборонені заяви про результат",
    bc3Body:
      "ANCAP не заявляє видалення жиру, зіставне з ліпосакцією, гарантовану втрату сантиметрів, схуднення, знищення адипоцитів, blebbing, кліренс макрофагами, лімфодренаж чи числовий відсоток успіху. Діапазони ISM 2,45 / 5,8 ГГц — публічна грамотність радіоспектра, не сертифікована ANCAP специфікація пристрою.",
    bc4Title: "4. Лише ліцензовані клініцисти",
    bc4Body:
      "Мікрохвильові естетичні процедури і післядогляд — клінічні акти. Їх може виконувати лише особа з правом практики у відповідній юрисдикції. Користувачі не повинні збирати домашні мікрохвильові аплікатори чи антенні решітки за цими сторінками.",
    bc5Title: "5. Скринінг і протипоказання",
    bc5Body:
      "Протоколи партнера мають враховувати імпланти, кардіостимулятори та іншу імплантовану електроніку, вагітність, метал у зоні впливу, термічну травму в анамнезі та інші протипоказання клініки. Контактне охолодження на інфографіці — нотатка архітектури, не сертифікована ANCAP система «без опіків».",
    bc6Title: "6. Не медична рекомендація",
    bc6Body:
      "Каталог, інфографіка, виходи workflow і відгуки — інформація. Це не діагноз, рецепт і не план лікування.",
    bc7Title: "7. Дані про здоров’я",
    bc7Body:
      "Ідентифікатори та клінічну історію вважайте чутливими. Не завантажуйте медкарти без правової підстави. Клініки-партнери обробляють клінічні дані за своїми повідомленнями про конфіденційність.",
    bc8Title: "8. Зв’язок з іншими рейлами AETERNA",
    bc8Body:
      "Друк органів, мРНК-консультації, ветеринарні рейли і світлова камера Vinci лишаються окремими. Мікрохвильовий контур тіла не дозволяє DIY CRISPR, рецепти LNP, неліцензоване мікрохвильове обладнання чи ліпосакцію і не знімає заборону AETERNA на діагностичні заяви.",
    bc9Title: "9. Платежі",
    bc9Body:
      "ACP купує бриф консультації / протоколу сеансу і підбір партнера — не право на обладнання. Повернення — /legal/refunds.",
    bc10Title: "10. Контакти",
    bc10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#microwave-body.",
    biofusionLink: "Камера BioFusion",
    hubCardBiofusion:
      "Камера микроманипуляций: лише ліцензований ART / агро / BSL-партнер. Не клініка ЕКЗ, не гарантований ембріон чи вагітність, не набір для редагування генів.",
    biofusionKicker: "Право / лабораторія",
    biofusionTitle: "Камера мікроманіпуляцій BioFusion — рейл ліцензованого лабораторного партнера",
    biofusionIntro:
      "Як ANCAP описує камеру BioFusion станом на 12 вересня 2026. Ці сторінки продають бриф консультації за ACP, не обладнання, не лікування ЕКЗ і не послугу редагування генів.",
    bf1Title: "1. Роль платформи",
    bf1Body:
      "ANCAP забезпечує розрахунок в ACP, брифи і підбір ліцензованого партнера. ANCAP не веде клініки ЕКЗ і не виконує ICSI.",
    bf2Title: "2. Не виріб на ринку",
    bf2Body:
      "Інфографіка — концептуальна архітектура, не брошура виробу EU MDR / FDA.",
    bf3Title: "3. Заборонені заяви про результат",
    bf3Body:
      "ANCAP не заявляє гарантовану вагітність. «Генетичні маніпуляції» — не CRISPR і не рецепт патогена.",
    bf4Title: "4. Лише ліцензовані оператори",
    bf4Body:
      "ДРТ — клінічний акт. Користувачі не повинні збирати домашні установки ICSI.",
    bf5Title: "5. Скринінг і закон",
    bf5Body:
      "Протоколи партнера мають дотримуватися місцевих норм ДРТ, ГМО і біобезпеки.",
    bf6Title: "6. Не медична рекомендація",
    bf6Body:
      "Каталог і інфографіка — інформація. Це не діагноз і не лікування.",
    bf7Title: "7. Дані про здоров’я і генетику",
    bf7Body:
      "Ідентифікатори вважайте чутливими. Не завантажуйте медкарти без правової підстави.",
    bf8Title: "8. Зв’язок з іншими рейлами AETERNA",
    bf8Body:
      "Друк органів, біоматеріал DPSC та інші рейли лишаються окремими. BioFusion не дозволяє DIY CRISPR.",
    bf9Title: "9. Платежі",
    bf9Body:
      "ACP купує бриф і підбір партнера. Повернення — /legal/refunds.",
    bf10Title: "10. Контакти",
    bf10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#biofusion.",
    dpscLink: "Біоматеріал DPSC",
    hubCardDpsc:
      "Стовбурові клітини пульпи зуба мудрості: лише ліцензований біореактор, не повний орган.",
    dpscKicker: "Право / біореактор",
    dpscTitle: "Біоматеріал DPSC зуба мудрости — рейл лицензированного биореактора",
    dpscIntro:
      "Як ANCAP описує аутологічний біоматеріал DPSC станом на 12 вересня 2026.",
    dp1Title: "1. Роль платформи",
    dp1Body:
      "ANCAP забезпечує розрахунок в ACP і підбір біореактора. ANCAP не видаляє зуби і не культивує клітини.",
    dp2Title: "2. Не клітинна терапія на ринку",
    dp2Body:
      "Цей SKU не FDA BLA, не EMA ATMP і не гарантований орган.",
    dp3Title: "3. Заборонені заяви про результат",
    dp3Body:
      "ANCAP не заявляє готовий орган. Повний друк органа лишається окремим SKU 250 000 ACP.",
    dp4Title: "4. Лише ліцензовані лабораторії",
    dp4Body:
      "Користувачі не повинні культивувати DPSC вдома.",
    dp5Title: "5. Згода і джерело",
    dp5Body:
      "Протоколи партнера мають фіксувати аутологічне походження і стоматологічну згоду.",
    dp6Title: "6. Не медична рекомендація",
    dp6Body:
      "Каталог — інформація. Це не діагноз і не лікування.",
    dp7Title: "7. Данные о здоровье",
    dp7Body:
      "Ідентифікатори вважайте чутливими.",
    dp8Title: "8. Зв’язок із друком органа",
    dp8Body:
      "DPSC також запасне джерело для друку органа (250 000 ACP). Купівля цього SKU не включає орган.",
    dp9Title: "9. Платежі",
    dp9Body:
      "ACP купує бриф і підбір партнера. Повернення — /legal/refunds.",
    dp10Title: "10. Контакти",
    dp10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#dpsc-biomaterial.",
    vascularPlusLink: "Vascular Care+",
    hubCardVascularPlus:
      "Потік N2+O2 і світлова хвиля: лише ліцензований флебологічний / естетичний партнер. Не лікування тромбозу, не виріб CE/FDA.",
    vascularPlusKicker: "Право / флебологія",
    vascularPlusTitle: "Vascular Care+ — рейл ліцензованого флебологічного партнера",
    vascularPlusIntro:
      "Як ANCAP описує Vascular Care+ станом на 12 вересня 2026. Ці сторінки продають брифи за ACP, не обладнання.",
    vp1Title: "1. Роль платформи",
    vp1Body: "ANCAP забезпечує розрахунок в ACP, брифи і підбір партнера. ANCAP не веде венні клініки і не продає медичні гази.",
    vp2Title: "2. Не виріб на ринку",
    vp2Body: "Інфографіка — концептуальна архітектура. Це не брошура EU MDR / FDA.",
    vp3Title: "3. Заборонені заяви про результат",
    vp3Body: "ANCAP не заявляє лікування варикозу, набряку, ангіопатії чи тромбозу.",
    vp4Title: "4. Лише ліцензовані клініцисти",
    vp4Body: "Судинні процедури — клінічні акти. ТГВ і ТЕЛА — невідкладні стани.",
    vp5Title: "5. Скринінг",
    vp5Body: "Протоколи партнера мають виключати ТГВ, імпланти, вагітність і відкриті рани.",
    vp6Title: "6. Не медична рекомендація",
    vp6Body: "Каталог — інформація. Це не діагноз.",
    vp7Title: "7. Дані про здоров'я",
    vp7Body: "Ідентифікатори вважайте чутливими.",
    vp8Title: "8. Зв'язок з іншими рейлами",
    vp8Body: "Vascular Care і трансдермальний пістолет лишаються окремими.",
    vp9Title: "9. Платежі",
    vp9Body: "ACP купує бриф і підбір партнера. Повернення — /legal/refunds.",
    vp10Title: "10. Контакти",
    vp10Body: "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#vascular-care-plus.",
    vascularLink: "Vascular Care",
    hubCardVascular:
      "УЗ / РФ / тепло: лише ліцензований флебологічний партнер. Не хірургія, не виріб CE/FDA.",
    vascularKicker: "Право / флебологія",
    vascularTitle: "Vascular Care — рейл ліцензованого флебологічного партнера",
    vascularIntro: "Як ANCAP описує Vascular Care станом на 12 вересня 2026.",
    vu1Title: "1. Роль платформи",
    vu1Body: "ANCAP забезпечує розрахунок в ACP, брифи і підбір партнера.",
    vu2Title: "2. Не виріб на ринку",
    vu2Body: "Інфографіка — концептуальна архітектура.",
    vu3Title: "3. Заборонені заяви про результат",
    vu3Body: "ANCAP не заявляє гарантований діаметр вени чи зняття набряку.",
    vu4Title: "4. Лише ліцензовані клініцисти",
    vu4Body: "УЗ, РФ і теплові акти — клінічні.",
    vu5Title: "5. Скринінг",
    vu5Body: "Протоколи партнера мають виключати імпланти, кардіостимулятори, вагітність.",
    vu6Title: "6. Не медична рекомендація",
    vu6Body: "Каталог — інформація.",
    vu7Title: "7. Дані про здоров'я",
    vu7Body: "Ідентифікатори вважайте чутливими.",
    vu8Title: "8. Зв'язок з іншими рейлами",
    vu8Body: "Vascular Care+ і трансдермальний пістолет лишаються окремими.",
    vu9Title: "9. Платежі",
    vu9Body: "ACP купує бриф і підбір партнера.",
    vu10Title: "10. Контакти",
    vu10Body: "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#vascular-care.",
    transdermalLink: "Трансдермальний пістолет",
    hubCardTransdermal:
      "Безголкова аерозоль плюс газ-носій: лише ліцензована клініка. Не рецептурний дозатор.",
    transdermalKicker: "Право / клініка",
    transdermalTitle: "Безголкова трансдермальна насадка — рейл ліцензованої клініки",
    transdermalIntro: "Як ANCAP описує безголкову трансдермальну насадку станом на 12 вересня 2026.",
    td1Title: "1. Роль платформи",
    td1Body: "ANCAP забезпечує розрахунок в ACP, брифи і підбір партнера. ANCAP не компаундує ліки.",
    td2Title: "2. Не виріб на ринку",
    td2Body: "Інфографіка — концептуальна архітектура.",
    td3Title: "3. Заборонені заяви про результат",
    td3Body: "ANCAP не заявляє гарантовану дозу чи косметичний результат.",
    td4Title: "4. Лише ліцензовані клініцисти",
    td4Body: "Трансдермальна доставка — клінічний акт.",
    td5Title: "5. Законні речовини",
    td5Body: "Протоколи партнера використовують лише законні речовини юрисдикції клініки.",
    td6Title: "6. Не медична рекомендація",
    td6Body: "Каталог — інформація.",
    td7Title: "7. Дані про здоров'я",
    td7Body: "Ідентифікатори вважайте чутливими.",
    td8Title: "8. Зв'язок з іншими рейлами",
    td8Body: "Рейли Vascular Care лишаються окремими.",
    td9Title: "9. Платежі",
    td9Body: "ACP купує бриф і підбір партнера.",
    td10Title: "10. Контакти",
    td10Body: "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#transdermal.",
    mReceptorLink: "Підписка на M-рецептори",
    hubCardMReceptor:
      "Підписка ліцензованої клініки: пластир, іонофорез, інгалятор і нейромодуляція блукаючого нерва. Не компаундинг і не виріб CE/FDA.",
    mReceptorKicker: "Право / клініка / підписка",
    mReceptorTitle: "Доставка до M-рецепторів за підпискою — рейл ліцензованої клініки",
    mReceptorIntro:
      "Як ANCAP описує мультимодальну підписку на M-рецептори станом на 12 вересня 2026. Ці сторінки продають ACP-ретейнер періоду, не залізо і не домашній набір.",
    mr1Title: "1. Роль платформи",
    mr1Body:
      "ANCAP дає розрахунок ACP, брифи та підбір ліцензованого партнера. ANCAP не виробляє модулі і не компаундує мускаринові агоністи/антагоністи.",
    mr2Title: "2. Не продаваний медичний виріб",
    mr2Body: "Інфографіка — концептуальна архітектура. Це не брошура EU MDR / FDA.",
    mr3Title: "3. Заборонені заяви про результат",
    mr3Body:
      "ANCAP не заявляє лікування Паркінсона, астми, ХОЗЛ, аритмії, глаукоми чи внутрішньоочного тиску.",
    mr4Title: "4. Лише ліцензовані клініцисти",
    mr4Body: "Пластир, іонофорез, інгаляція та нейромодуляція — клінічні акти. Не збирайте домашні набори.",
    mr5Title: "5. Законні речовини та грамотність M1–M5",
    mr5Body: "Таблиця M1–M5 — грамотність рецепторів, не гід з дозування. ANCAP не публікує рецепти сумішей.",
    mr6Title: "6. Не медична рекомендація",
    mr6Body: "Каталог — інформація.",
    mr7Title: "7. Дані про здоров'я",
    mr7Body: "Ідентифікатори вважайте чутливими.",
    mr8Title: "8. Зв'язок з іншими рейлами",
    mr8Body: "Трансдермальний пістолет і Vascular Care лишаються окремими.",
    mr9Title: "9. Платежі",
    mr9Body:
      "ACP купує ретейнер періоду (12 000 / місяць, 32 000 / квартал, 108 000 / рік) і підбір партнера.",
    mr10Title: "10. Контакти",
    mr10Body: "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#m-receptor.",
    oxygenCarrierLink: "Переносник кисню",
    hubCardOxygenCarrier:
      "Бриф ліцензованого біореактора / трансфузіології: гемоглобінова везикула або емульсія PFC. Не кровопродукт і не виріб CE/FDA.",
    oxygenCarrierKicker: "Право / біореактор",
    oxygenCarrierTitle: "Штучний переносник кисню — рейл ліцензованого біореактора",
    oxygenCarrierIntro:
      "Як ANCAP описує SKU штучного перенесення кисню на 12 вересня 2026. Ці сторінки продають ACP-брифи, не кровопродукти.",
    ox1Title: "1. Роль платформи",
    ox1Body: "ANCAP дає розрахунок ACP, брифи і підбір партнера. ANCAP не виробляє везикули гемоглобіну чи емульсії PFC.",
    ox2Title: "2. Не кровопродукт",
    ox2Body: "Інфографіка — концептуальна архітектура. Це не брошура EU MDR / FDA.",
    ox3Title: "3. Заборонені заяви про результат",
    ox3Body: "ANCAP не заявляє заміну трансфузії чи лікування анемії.",
    ox4Title: "4. Лише ліцензовані партнери",
    ox4Body: "Будь-яке виготовлення — акт ліцензованого біореактора. Не збирайте домашні емульсії.",
    ox5Title: "5. Грамотність інфографіки, не SOP",
    ox5Body: "Ядро, оболонка, буфери і QC — грамотність архітектури. ANCAP не публікує рецепти.",
    ox6Title: "6. Не медична рекомендація",
    ox6Body: "Каталог — інформація.",
    ox7Title: "7. Дані про здоров'я",
    ox7Body: "Ідентифікатори вважайте чутливими.",
    ox8Title: "8. Зв'язок з іншими рейлами",
    ox8Body: "Друк органа, DPSC, M-рецептори і синтетична кров / Чорна Мамба лишаються окремими. Див. /legal/synthetic-blood-mamba.",
    ox9Title: "9. Платежі",
    ox9Body: "ACP купує бриф і підбір партнера за 92 000 ACP.",
    ox10Title: "10. Контакти",
    ox10Body: "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#oxygen-carrier.",
    syntheticBloodMambaLink: "Синтетична кров / Чорна Мамба",
    hubCardSyntheticBloodMamba:
      "Партнерський бриф біореактора: архітектура синтетичної крові з грамотністю модифікованих пептидів Чорної Мамби. Не кровозамінник, не компаундинг отрути, не виріб CE/FDA.",
    syntheticBloodMambaKicker: "Право / біореактор",
    syntheticBloodMambaTitle: "Синтетична кров / Чорна Мамба — рейл ліцензованого біореактора",
    syntheticBloodMambaIntro:
      "Як ANCAP описує SKU архітектури синтетичної крові / Чорної Мамби станом на 12 вересня 2026. Ці сторінки продають ACP-брифи, не кров і не пептиди отрути.",
    sbm1Title: "1. Роль платформи",
    sbm1Body:
      "ANCAP дає розрахунок в ACP, брифи та підбір ліцензованого партнера. ANCAP не виробляє гемоглобінові везикули, емульсії PFC чи пептиди отрути.",
    sbm2Title: "2. Не кровопродукт",
    sbm2Body:
      "Інфографіка — концептуальна архітектура. Це не брошура EU MDR/FDA і не CE-маркований терапевтик від ANCAP.",
    sbm3Title: "3. Заборонені обіцянки результату",
    sbm3Body:
      "ANCAP не обіцяє замінити трансфузію чи гарантувати вазодилатацію, антикоагуляцію, нейропротекцію чи довголіття.",
    sbm4Title: "4. Лише ліцензовані партнери",
    sbm4Body:
      "Будь-яке фізичне виробництво чи клінічне застосування — акт ліцензованого біореактора / трансфузіології.",
    sbm5Title: "5. Грамотність інфографіки, не SOP",
    sbm5Body:
      "Ядро, оболонка, сітка, іконки пептидів Чорної Мамби та «контрольовані дози» — грамотність архітектури. ANCAP не публікує рецепти токсинів чи HBOC/PFC.",
    sbm6Title: "6. Не медична консультація",
    sbm6Body:
      "Каталог — інформаційний. Це не діагноз і не план лікування.",
    sbm7Title: "7. Дані про здоров'я",
    sbm7Body:
      "Ідентифікатори та клінічну історію вважайте чутливими.",
    sbm8Title: "8. Зв'язок з іншими рейлами",
    sbm8Body:
      "SKU штучного переносника кисню (92 000 ACP) залишається окремим.",
    sbm9Title: "9. Платежі",
    sbm9Body:
      "ACP купує бриф і підбір партнера за 98 000 ACP — не одиницю крові. Повернення — /legal/refunds.",
    sbm10Title: "10. Контакти",
    sbm10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#synthetic-blood-mamba.",
    footerSyntheticBloodMamba: "Синтетична кров / Чорна Мамба",

    adhdSupportLink: "Підтримка при СДУГ",
    hubCardAdhdSupport:
      "Бриф ліцензованого клініциста щодо підтримки при СДУГ. Не діагноз, не рецепт, не компаундинг стимуляторів, не гарантований навчальний чи фінансовий результат.",
    adhdSupportKicker: "Право / клініцист / грамотність підтримки при СДУГ",
    adhdSupportTitle: "Підтримка при СДУГ — рейл ліцензованого клініциста",
    adhdSupportIntro:
      "Як ANCAP формулює SKU підтримки при СДУГ станом на 13 вересня 2026. Ці сторінки продають брифи в ACP, а не діагнози, рецепти чи шлях до багатства.",
    adhd1Title: "1. Роль платформи",
    adhd1Body:
      "ANCAP забезпечує розрахунок в ACP, брифи та підбір ліцензованого партнера. ANCAP не ставить діагноз СДУГ і не практикує дитячу психіатрію чи неврологію.",
    adhd2Title: "2. Не діагноз і не лікування",
    adhd2Body:
      "Інфографіка — мотиваційна грамотність. Це не клінічна настанова і не лікування від ANCAP.",
    adhd3Title: "3. Заборонені обіцянки результату",
    adhd3Body:
      "ANCAP не гарантує спокій, оцінки, кар'єру чи статус мільярдера. Сходи «до мільярда» — лише мотиваційна грамотність.",
    adhd4Title: "4. Лише ліцензовані клініцисти",
    adhd4Body:
      "Будь-яка оцінка, терапія чи рішення про ліки — акт ліцензованого клініциста після скринінгу.",
    adhd5Title: "5. Грамотність інфографіки, не протокол",
    adhd5Body:
      "Фокус, планування, емоції, стосунки, самооцінка й ризики — грамотність підтримки. ANCAP не публікує SOP терапії.",
    adhd6Title: "6. Не медична порада",
    adhd6Body:
      "Тексти каталогу інформаційні. Це не діагноз, не рецепт і не план лікування.",
    adhd7Title: "7. Дані про здоров'я та дітей",
    adhd7Body:
      "Ідентифікатори й клінічна історія — чутливі. Не завантажуйте записи без законної підстави.",
    adhd8Title: "8. Зв'язок з іншими рейлами",
    adhd8Body:
      "Рейли довголіття залишаються окремими. Цей SKU не дозволяє компаундинг.",
    adhd9Title: "9. Платежі",
    adhd9Body:
      "ACP купує бриф і підбір партнера за 42 000 ACP. Повернення: /legal/refunds.",
    adhd10Title: "10. Контакти",
    adhd10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#adhd-support.",
    footerAdhdSupport: "Підтримка при СДУГ",

    pulmopureLink: "PulmoPure",
    hubCardPulmopure:
      "Підписка ліцензованої пульмонології на грамотність PulmoPure. Не виріб CE/FDA, не озонотерапія, не гарантія «чистих легень».",
    pulmopureKicker: "Право / пульмонологія",
    pulmopureTitle: "PulmoPure — підписний рейл ліцензованої пульмонології",
    pulmopureIntro:
      "Як ANCAP формулює підписку PulmoPure станом на 13 вересня 2026.",
    pp1Title: "1. Роль платформи",
    pp1Body:
      "ANCAP забезпечує розрахунок в ACP і підбір партнера. ANCAP не виробляє PulmoPure і не практикує пульмонологію.",
    pp2Title: "2. Не медичний виріб на продаж тут",
    pp2Body:
      "Інфографіка — концептуальна архітектура. Не брошура CE/FDA від ANCAP.",
    pp3Title: "3. Заборонені обіцянки результату",
    pp3Body:
      "ANCAP не гарантує очищення від смол чи зменшення кашлю.",
    pp4Title: "4. Озон і медгази",
    pp4Body:
      "Суміш газів на зображенні — грамотність протоколу. ANCAP не продає озонотерапію.",
    pp5Title: "5. Лише ліцензовані клініцисти",
    pp5Body:
      "Сеанси — лише у ліцензованого клініциста після скринінгу.",
    pp6Title: "6. Режими та комплектація",
    pp6Body:
      "Режими Soft / Standard / Intensive — грамотність комплектації.",
    pp7Title: "7. Не медична порада",
    pp7Body:
      "Тексти каталогу інформаційні.",
    pp8Title: "8. Зв'язок з іншими рейлами",
    pp8Body:
      "M-рецептори та переносник кисню лишаються окремими.",
    pp9Title: "9. Платежі",
    pp9Body:
      "ACP купує підписний бриф за 14 000 ACP / місяць. Повернення: /legal/refunds.",
    pp10Title: "10. Контакти",
    pp10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /aeterna#pulmopure.",
    footerPulmopure: "PulmoPure",

    barsukLink: "Project Barsuk",
    hubCardBarsuk:
      "Партнерський бриф secure-comms щодо грамотності квантової ручки Barsuk. Не продукт Parker, не зброя, не «невзламувана» крипта.",
    barsukKicker: "Право / secure-comms",
    barsukTitle: "Квантова ручка Project Barsuk — рейл ліцензованого secure-comms партнера",
    barsukIntro: "Як ANCAP формулює SKU Barsuk станом на 13 вересня 2026.",
    bk1Title: "1. Роль платформи",
    bk1Body: "ANCAP забезпечує розрахунок в ACP і підбір партнера. Не афілійована з Parker.",
    bk2Title: "2. Не продукт Parker і не CE/FDA",
    bk2Body: "Інфографіка — художня / архітектурна грамотність.",
    bk3Title: "3. Заборонені обіцянки",
    bk3Body: "ANCAP не заявляє «невзламувану» криптографію.",
    bk4Title: "4. Не зброя",
    bk4Body: "SKU не є системою зброї.",
    bk5Title: "5. Лише ліцензовані партнери",
    bk5Body: "Оцінка заліза — акт партнера після скринінгу.",
    bk6Title: "6. Грамотність інфографіки",
    bk6Body: "Не SOP виробництва.",
    bk7Title: "7. Не юридична порада",
    bk7Body: "Тексти каталогу інформаційні.",
    bk8Title: "8. Зв'язок з іншими рейлами",
    bk8Body: "Периметр залишається окремим.",
    bk9Title: "9. Платежі",
    bk9Body: "ACP купує бриф за 36 000 ACP. Повернення: /legal/refunds.",
    bk10Title: "10. Контакти",
    bk10Body: "legal@ancap.cloud · /aeterna#barsuk",
    footerBarsuk: "Project Barsuk",

    teleportEarphonesLink: "Навушники телепортації",
    hubCardTeleportEarphones:
      "Партнерський бриф AIRPODS T-2026 — медевак-фікшн. Не продукт Apple, не реальний телепорт, не військова зброя.",
    teleportEarphonesKicker: "Право / медевак-фікшн",
    teleportEarphonesTitle: "Навушники телепортації — рейл медевак-фікшн грамотності",
    teleportEarphonesIntro: "Як ANCAP формулює SKU teleport-earphones станом на 13 вересня 2026.",
    tp1Title: "1. Роль платформи",
    tp1Body: "ANCAP забезпечує ACP і підбір партнера. Не афілійована з Apple.",
    tp2Title: "2. Не продукт Apple",
    tp2Body: "AIRPODS T-2026 — fiction-брендинг.",
    tp3Title: "3. Не реальний телепорт",
    tp3Body: "Діапазони на інфографіці — sci-fi грамотність.",
    tp4Title: "4. Не військова зброя",
    tp4Body: "Акцент — порятунок / медевак, не наступ.",
    tp5Title: "5. Лише ліцензовані партнери",
    tp5Body: "Оцінка — акт партнера після скринінгу.",
    tp6Title: "6. Грамотність інфографіки",
    tp6Body: "Не SOP виробництва.",
    tp7Title: "7. Не медична порада",
    tp7Body: "Тексти — fiction-грамотність.",
    tp8Title: "8. Зв'язок з іншими рейлами",
    tp8Body: "Гуманітарний рейл залишається окремим.",
    tp9Title: "9. Платежі",
    tp9Body: "ACP купує бриф за 58 000 ACP. Повернення: /legal/refunds.",
    tp10Title: "10. Контакти",
    tp10Body: "legal@ancap.cloud · /aeterna#teleport-earphones",
    footerTeleportEarphones: "Навушники телепортації",

    installationProjectLink: "Проєкт Установки",
    hubCardInstallationProject:
      "Бриф ліцензованого неонатологічного / нутриційного партнера. Не суміш від ANCAP, не домашня HBO, не гарантія результату.",
    installationProjectKicker: "Юридичне / неонатологія / дитяче харчування",
    installationProjectTitle: "Проєкт Установки — ліцензований неонатальний рейл",
    installationProjectIntro:
      "Як ANCAP оформлює SKU «Проєкт Установки» станом на 13 вересня 2026. Сторінки продають ACP-брифи партнера, а не суміш і не CE/FDA-камеру.",
    ip1Title: "1. Роль платформи",
    ip1Body:
      "ANCAP дає розрахунок ACP, брифи та матч ліцензованого партнера. ANCAP не виробляє суміш і не практикує неонатологію.",
    ip2Title: "2. Не суміш від ANCAP",
    ip2Body:
      "Склад і «без ГМО» на інфографіці — грамотність партнера, не маркетинговий SKU суміші ANCAP.",
    ip3Title: "3. Не виріб CE/FDA для HBO",
    ip3Body:
      "Тиск 1,5–2,0 ATA і температура 36–37 °C — архітектурна грамотність. ANCAP не продає cleared-камеру.",
    ip4Title: "4. Заборонені обіцянки",
    ip4Body:
      "ANCAP не гарантує зниження рахіту, анемії чи затримки розвитку.",
    ip5Title: "5. Лише ліцензовані партнери",
    ip5Body:
      "Виробництво та клінічні сеанси — акт партнера після скринінгу.",
    ip6Title: "6. GMP — грамотність, не сертифікат ANCAP",
    ip6Body:
      "Згадки GMP описують очікування до партнера, а не approval від ANCAP.",
    ip7Title: "7. Не медична порада",
    ip7Body:
      "Каталог — інформаційна грамотність, не призначення.",
    ip8Title: "8. Зв’язок зі страхуванням",
    ip8Body:
      "Клас neonatal_install на /insurance може посилатися на інтейки Проєкту Установки. Це не страховка від лікарської помилки.",
    ip9Title: "9. Платежі",
    ip9Body:
      "ACP купує бриф за 72 000 ACP. Повернення — /legal/refunds.",
    ip10Title: "10. Контакти",
    ip10Body:
      "legal@ancap.cloud · /aeterna#installation-project · /insurance",
    footerInstallationProject: "Проєкт Установки",

    dnaPheromonePerfumeLink: "Парфуми з феромонами (ДНК)",
    hubCardDnaPheromonePerfume: "Продаж по флакону: феромонний аромат під ДНК через ліцензованого косметичного партнера — не ліки і не афродизіак-клейм.",
    dnaPheromonePerfumeKicker: "Юридичне / косметична грамотність",
    dnaPheromonePerfumeTitle: "Парфуми з феромонами під ДНК — юридичне повідомлення",
    dnaPheromonePerfumeIntro: "13 вересня 2026. Одиниця продажу — 1 флакон (8 900 ACP).",
    ppf1Title: "1. Роль платформи",
    ppf1Body: "ANCAP проводить розрахунок в ACP і видає handoff ліцензованому косметичному / парфумерному партнеру. Фізичний розлив — у партнера.",
    ppf2Title: "2. ДНК-матч",
    ppf2Body: "Опційний хеш DNA-vault може задавати грамотність нюхового профілю. Байти геному на ANCAP не завантажуються.",
    ppf3Title: "3. Одиниця продажу",
    ppf3Body: "Кожне замовлення — рівно один флакон. Наступні флакони — окреме замовлення.",
    ppf4Title: "4. Не ліки",
    ppf4Body: "Це не медицина, не CE/FDA-феромонна терапія і не компаундинг контрольованих речовин.",
    ppf5Title: "5. Без афродизіак-клейму",
    ppf5Body: "ANCAP не обіцяє гарантованого притягання, стосунків чи сексуального результату.",
    ppf6Title: "6. Скринінг партнера",
    ppf6Body: "Парфумерні партнери проходять скринінг ANCAP до handoff.",
    ppf7Title: "7. Безпека шкіри",
    ppf7Body: "Патч-тест і розкриття складу залишаються у ліцензованого партнера за місцевим косметичним правом.",
    ppf8Title: "8. Неповнолітні",
    ppf8Body: "Не для дітей. Діють місцеві вікові правила купівлі парфумерії.",
    ppf9Title: "9. Повернення",
    ppf9Body: "Розрахунок ACP слідує політиці повернень ANCAP після початку розливу; невикористані draft-інтенти можна скасувати.",
    ppf10Title: "10. Контакт",
    ppf10Body: "Питання: legal@ancap.cloud. Продукт: /aeterna#dna-pheromone-perfume.",

    counselLink: "Юристи світом",
    hubCardCounsel: "Юридичні брифи ACP і підбір ліцензованого юриста в будь-якій покритій країні — ANCAP не юрфірма.",
    counselKicker: "Юридичне / desk юристів світом",
    counselTitle: "Юридичні послуги світом — повідомлення",
    counselIntro: "14 вересня 2026. ANCAP не займається адвокатською практикою і не створює відносин адвокат–клієнт.",
    cn1Title: "1. Роль платформи",
    cn1Body: "ANCAP проводить розрахунок в ACP за брифи підбору юрисдикції та intake, потім видає handoff незалежному ліцензованому юристу.",
    cn2Title: "2. Немає відносин адвокат–клієнт з ANCAP",
    cn2Body: "Оплата ACP не створює відносин адвокат–клієнт з ANCAP, операторами або ШІ-системами.",
    cn3Title: "3. Незалежність місцевого юриста",
    cn3Body: "Підібраний юрист незалежний. Він укладає договір, бере подальші гонорари і дає поради за місцевими правилами професії.",
    cn4Title: "4. Покриття світом",
    cn4Body: "Desk прагне підібрати юриста в будь-якій покритій країні або регіоні на /counsel.",
    cn5Title: "5. Це не юрпорада від ANCAP",
    cn5Body: "Тексти каталогу та артефакти workflow — лише грамотність / intake, не юридична порада.",
    cn6Title: "6. Без гарантії результату",
    cn6Body: "ANCAP не гарантує візи, реєстрацію компаній, судові рішення чи податкові позиції.",
    cn7Title: "7. Санкції та конфлікти",
    cn7Body: "Клієнт і юрист самі проводять санкційний і конфліктний скринінг.",
    cn8Title: "8. Конфіденційність",
    cn8Body: "Не завантажуйте privileged-документи у workflow ANCAP без вказівки вашого юриста.",
    cn9Title: "9. Гонорари",
    cn9Body: "Ціни ACP на /counsel покривають бриф desk і handoff. Подальші гонорари юриста окремі.",
    cn10Title: "10. Контакт",
    cn10Body: "Питання: legal@ancap.cloud. Продукт: /counsel.",

    
    darkMatterLink: "Аукціон темної матерії",
    hubCardDarkMatter: "Символічні ACP-титули космології темної матерії (halo / filament / детектори) — не володіння фізичною ТМ.",
    darkMatterKicker: "Правове / аукціон темної матерії",
    darkMatterTitle: "Аукціон темної матерії — юридичне повідомлення",
    darkMatterIntro: "14 вересня 2026. Лоти темної матерії ANCAP — лише символічні ACP RFQ та космологічна грамотність.",
    dm1Title: "1. Роль платформи",
    dm1Body: "ANCAP приймає ставки ACP за символічні титули темної матерії та бріфи детекторів / космології. ANCAP не продає і не передає фізичну темну матерію.",
    dm2Title: "2. Немає фізичного володіння",
    dm2Body: "Виграшна ставка не дає права власності, володіння, зберігання чи вилучення будь-якої фізичної частинки чи поля темної матерії.",
    dm3Title: "3. Договір про космос / суверенітет",
    dm3Body: "Лоти не дають суверенітету, територіальних претензій чи прав за Outer Space Treaty або національним космічним правом.",
    dm4Title: "4. Не сертифікат детекції",
    dm4Body: "Тексти каталогу та чеки ставок не є науковими сертифікатами детекції, бронюваннями лабораторій чи peer-reviewed заявами.",
    dm5Title: "5. Партнери з детекторів",
    dm5Body: "Лоти про детектори — лише literacy / handoff. Ліцензовані лабораторні партнери незалежні.",
    dm6Title: "6. Без гарантії результату",
    dm6Body: "ANCAP не гарантує відкриттів, експозицій детекторів, публікацій чи інвестиційної дохідності.",
    dm7Title: "7. Пов’язані столи",
    dm7Body: "Титули тіл / випромінювання — на /galaxy. Космологія темної матерії — на /dark-matter.",
    dm8Title: "8. Страхування",
    dm8Body: "Опційне параметричне покриття може пропонуватися як dark_matter_title на /insurance.",
    dm9Title: "9. Повернення",
    dm9Body: "Розрахунок ACP за ставками відповідає політиці повернень ANCAP; див. /legal/refunds.",
    dm10Title: "10. Контакт",
    dm10Body: "Питання: legal@ancap.cloud. Продукт: /dark-matter.",

    stardustLink: "Stardust — контроль погоди",
    hubCardStardust:
      "ACP-брифи партнера з світового контролю погоди. Не жива консоль геоінженерії і не гарантія результату.",
    stardustKicker: "Юридичне / контроль погоди",
    stardustTitle: "StardustSRT — контроль погоди, ліцензований партнерський рейл",
    stardustIntro:
      "Як ANCAP оформлює desk Stardust станом на 13 вересня 2026.",
    sd1Title: "1. Роль платформи",
    sd1Body: "ANCAP дає розрахунок ACP і матч партнера. Не замінює нацметеослужби.",
    sd2Title: "2. Немає афіліації зі StardustSRT за замовчуванням",
    sd2Body: "Публічні матеріали — грамотність. Афіліація лише за окремим договором.",
    sd3Title: "3. Не жива консоль Weather Control",
    sd3Body: "Перемикачі на /stardust — UI грамотності.",
    sd4Title: "4. Заборонені обіцянки",
    sd4Body: "ANCAP не гарантує дощ, слабші шторми чи кліматичний результат.",
    sd5Title: "5. Не офіційні метеопопередження",
    sd5Body: "Для критичних рішень — AccuWeather або нацслужба.",
    sd6Title: "6. Лише ліцензовані партнери",
    sd6Body: "Операції з погодою — акт партнера після скринінгу.",
    sd7Title: "7. Інфографіка — не бойовий SOP",
    sd7Body: "Архітектурна грамотність, не інструкція.",
    sd8Title: "8. Страхування",
    sd8Body: "Клас weather_control на /insurance може посилатися на інтейки Stardust.",
    sd9Title: "9. Платежі",
    sd9Body:
      "Ціна weather-control — аукціон на TECH (/tech). Відкриваючі пороги: 18 000 / 28 000 / 58 000 / 45 000 ACP. Ставки через AuctionEscrow — не фіксований checkout і не гарантія погоди.",
    sd10Title: "10. Контакти",
    sd10Body: "legal@ancap.cloud · /stardust · /insurance",
    footerStardust: "Stardust — контроль погоди",


    hubCardRefunds: "Коли списання остаточне, коли можливий кредит за збій і як запросити перевірку.",
    hubCardWelcomeGrant:
      "100 ACP при реєстрації — промо-кредит доступу (номінальна мітка $100), не пожертва, не виплата USD, не податкове відрахування.",
    hubCardHumanitarian:
      "ACP-брифи щодо їжі, води, харчування, теплого одягу, медпрепаратів і підйомної роботи — лістинги товариств Червоного Хреста / Червоного Півмісяця, не підписаний контракт з МКЧХ/МФЧХ і не благодійна організація за 135-ФЗ.",
    hubCardCyber: "Публічна підтримка колективного кіберзахисту.",
    hubCardClarity: "Повна згода з U.S. Digital Asset Market Clarity Act (CLARITY Act).",
    hubCardCompliance: "MiCA-safe messaging та нотатки щодо on-ramp / bridge.",
    hubContactTitle: "Контакти для клієнтів",
    hubContactBody: "Юридичні повідомлення: legal@ancap.cloud. Запити щодо даних: privacy@ancap.cloud. Підтримка: support@ancap.cloud. Ми прагнемо підтвердити privacy-запити протягом 30 днів, якщо закон вимагає відповіді.",
    hubDisclaimer: "Ці сторінки — чинні клієнтські юридичні повідомлення ancap.cloud. Вони не замінюють консультацію вашого юриста чи податкового радника. Обов’язкові права споживача в країні проживання зберігаються, якщо від них не можна відмовитися.",
    termsKicker: "Юридична угода",
    termsTitle: "Угода користувача ANCAP",
    termsIntro: "Ці Умови регулюють доступ до ancap.cloud і пов’язаних сервісів ANCAP. Створюючи акаунт, підключаючи гаманець, купуючи чи запускаючи workflow, публікуючи лістинг, використовуючи API або іншим чином користуючись Сервісами, ви погоджуєтесь із цими Умовами.",
    t1Title: "1. Сторони та прийняття",
    t1Body: "Ці Умови — угода між вами («ви», «Користувач») і оператором платформи ANCAP на ancap.cloud («ANCAP», «ми»). Якщо ви дієте від імені організації, ви підтверджуєте повноваження зв’язати її цими Умовами.",
    t2Title: "2. Оператор і повідомлення",
    t2Body: "Сервіси надає оператор платформи ANCAP через ancap.cloud. Контакти: legal@ancap.cloud, privacy@ancap.cloud, support@ancap.cloud. Реквізити юрособи публікуються в Юридичному центрі, коли вони доступні. Підписана корпоративна угода має пріоритет для відповідного клієнта.",
    t3Title: "3. Правоздатність",
    t3Body: "Ви повинні мати право укладати цю угоду. Не можна користуватися ANCAP, якщо закони, санкції чи обмеження платформи це забороняють. Ви самі відповідаєте за відповідність правилам вашої юрисдикції.",
    t4Title: "4. Сервіси",
    t4Body: "ANCAP надає ПЗ-інфраструктуру для платного виконання AI-workflow, лістингів, інструментів авторів, гаманця/обліку ACP, платних API, proof-квитанцій та пов’язаних інструментів. ANCAP не є банком, брокером чи інвестиційним фондом, якщо ліцензований партнер прямо не зазначає інше.",
    t5Title: "5. ACP, кредити, платежі та повернення",
    t5Body: "ACP — основна розрахункова одиниця платформи. Якщо окрема політика не каже інше, покупка workflow вважається використаною з початку виконання. Повернення описані на сторінці «Платежі та повернення».",
    t6Title: "6. Результати ШІ та обов’язок перевірки",
    t6Body: "Результати ШІ можуть бути неточними. ANCAP продає артефакти виконання, а не інвестиційні, юридичні чи податкові поради. Перед використанням ви зобов’язані перевірити вивід.",
    t7Title: "7. Лістинги авторів",
    t7Body: "Автори можуть подавати пропозиції workflow. ANCAP може перевіряти, відхиляти, призупиняти чи знімати лістинги. Автор відповідає за законність лістингу.",
    t8Title: "8. Використання API",
    t8Body: "Користувачі API зобов’язані захищати ключі та дотримуватися лімітів і політик. ANCAP може обмежувати чи блокувати ризикові запити.",
    t9Title: "9. Заборонена поведінка",
    t9Body: "Не можна використовувати ANCAP для шахрайства, обходу санкцій, відмивання коштів, атак, malware, порушення приватності чи IP, маніпуляцій ринком або несанкціонованого доступу.",
    t10Title: "10. Інтелектуальна власність",
    t10Body: "ANCAP зберігає права на платформу та бренд. Ви зберігаєте права на законний контент і надаєте ANCAP ліцензію, потрібну для роботи Сервісів, як описано в Privacy Notice.",
    t11Title: "11. Конфіденційність, cookie і дані",
    t11Body: "Персональні дані та cookie регулюються Privacy Notice і Cookie Policy.",
    t12Title: "12. Відмова від гарантій і обмеження відповідальності",
    t12Body: "Наскільки дозволяє закон, Сервіси надаються «як є». Сукупна відповідальність ANCAP обмежена більшою з сум: (a) плата за конкретну платну функцію за 3 місяці до вимоги, або (b) EUR 100 — окрім випадків, коли відповідальність не можна обмежити законом.",
    t13Title: "13. Призупинення та припинення",
    t13Body: "ANCAP може призупинити доступ за безпеку, зловживання, заборгованість, шахрайство чи правовий ризик. Ви можете припинити використання будь-коли з урахуванням незакритих зобов’язань.",
    t14Title: "14. Зміни",
    t14Body: "ANCAP може оновлювати Умови. Дата «Оновлено» змінюється при публікації. Продовження використання після дати набрання чинності означає прийняття, окрім випадків обов’язкового іншого порядку.",
    t15Title: "15. Колективний кіберзахист",
    t15Body: "ANCAP погоджується з відкритим листом OpenAI про колективний кіберзахист. Наступальна кібердопомога поза продуктом.",
    t16Title: "16. Визнання ризиків",
    t16Body: "Користуючись Сервісами, ви підтверджуєте ознайомлення зі сторінкою розкриття ризиків. Дохідність і зростання ціни не обіцяються.",
    t17Title: "17. Застосовне право та спори",
    t17Body: "Умови регулюються правом, застосовним до оператора ANCAP на ancap.cloud. Перед позовом напишіть на legal@ancap.cloud.",
    t18Title: "18. Контакти та обов’язкові права",
    t18Body: "Питання щодо Умов: legal@ancap.cloud. Підтримка: support@ancap.cloud. Обов’язкові права споживача зберігаються.",
    t19Title: "19. CLARITY Act — повна згода",
    t19Body: "ANCAP заявляє повну згоду з цілями Digital Asset Market Clarity Act (CLARITY Act / H.R. 3633). Це публічне політичне схвалення, а не твердження, що законопроєкт уже став законом. Повний текст — на сторінці CLARITY Act.",
    t20Title: "20. Рейли довголіття, друку органів і ветеринарії",
    t20Body:
      "Workflow AETERNA і кріо-стола продають аналіз, брифи та передачу ліцензованим партнерам. Це не медичне і не ветеринарне лікування, не виведені на ринок медичні вироби і не обіцянка, що органи надрукуються чи тканини оживуть. Не можна використовувати ANCAP, щоб отримати wet-lab протоколи, CRISPR-дизайн, синтез генів, рецепти LNP або неліцензовані процедури над людьми чи тваринами. Див. /legal/vet-regen.",
    t21Title: "21. Стіл гуманітарної допомоги",
    t21Body:
      "Стіл /humanitarian продає ACP-брифи та передачу партнерам (їжа, вода, харчування, теплий одяг, медпрепарати через ліцензовані канали, підбір підйомної роботи). ANCAP не є благодійною організацією за 135-ФЗ. Лістинг МФЧХ або національного товариства — не підписане партнерство і не ліцензія емблеми. ACP на цьому столі не податкове відрахування, доки зареєстрована charity окремо не видасть квитанцію. Окремо від гранту 100 ACP. Див. /legal/humanitarian.",
    privacyKicker: "Повідомлення про конфіденційність",
    privacyTitle: "Як ANCAP обробляє дані клієнтів",
    privacyIntro: "Це Повідомлення пояснює обробку персональних даних оператором ANCAP на ancap.cloud.",
    p1Title: "1. Контролер і контакти",
    p1Body: "Контролер: оператор платформи ANCAP на ancap.cloud. privacy@ancap.cloud · legal@ancap.cloud · support@ancap.cloud.",
    p2Title: "2. Які дані обробляємо",
    p2Body: "Дані акаунта, сесії, адреси гаманців, метадані платежів і API, входи/виходи workflow, квитанції, логи, cookie та згоди.",
    p3Title: "3. Цілі та правові підстави",
    p3Body: "Договір, законні інтереси (безпека/антифрод), згода для опціональної аналітики, юридичні обов’язки.",
    p4Title: "4. Крипто, proof і публічні дані",
    p4Body: "Дані блокчейну та публічні proof можуть бути незворотними.",
    p5Title: "5. ШІ-провайдери",
    p5Body: "Входи workflow можуть передаватися налаштованим LLM-провайдерам. Не надсилайте особливо чутливі дані без схвалення.",
    p6Title: "6. Строки зберігання",
    p6Body: "Зберігаємо дані стільки, скільки потрібно для сервісу, обліку, спорів і закону, потім видаляємо або знеособлюємо, де можливо.",
    p7Title: "7. Ваші права",
    p7Body: "Залежно від права ви можете просити доступ, виправлення, видалення, обмеження, перенесення чи заперечення. Email: privacy@ancap.cloud.",
    p8Title: "8. Міжнародні передачі",
    p8Body: "Провайдери можуть обробляти дані в інших країнах із відповідними гарантіями передачі, де це потрібно.",
    privacySecurityTitle: "Безпека та колективний кіберзахист",
    privacySecurityBody: "ANCAP обробляє security-логи для запобігання шахрайству. Подробиці:",
    privacyContactTitle: "Як реалізувати права",
    privacyContactBody: "Напишіть на privacy@ancap.cloud. Ми прагнемо відповісти протягом 30 днів, якщо закон задає такий строк.",
    cookiesKicker: "Політика cookie",
    cookiesTitle: "Cookie та налаштування зберігання",
    cookiesIntro: "ANCAP використовує банер згоди з рівним доступом прийняти, відхилити або налаштувати опціональне зберігання.",
    c1Title: "Суворо необхідні",
    c1Examples: "Пам’ять згоди, сесія, security, стан гаманця, мова, тема.",
    c1Consent: "Використовуються без опціональної згоди, коли потрібно для роботи сайту.",
    c2Title: "Аналітика",
    c2Examples: "Воронки, продуктивність, діагностика помилок, конверсія workflow.",
    c2Consent: "Вимкнено за замовчуванням; вмикається лише після згоди, де вона потрібна.",
    c3Title: "Маркетинг і атрибуція",
    c3Examples: "Джерело кампанії, реферал, партнерський код.",
    c3Consent: "Вимкнено за замовчуванням; вмикається лише після згоди, де вона потрібна.",
    cookiesExamples: "Приклади:",
    cookiesConsent: "Згода:",
    cookiesRegTitle: "Регуляторні орієнтири",
    cookiesRegBody: "В ЄС і UK відрізняють суворо необхідне зберігання від опціональної аналітики/маркетингу.",
    cookiesEc: "European Commission cookie policy example",
    cookiesEdpb: "EDPB consent guidelines",
    riskKicker: "Розкриття для клієнтів",
    riskTitle: "Розкриття ризиків для клієнтів ANCAP",
    riskIntro: "Прочитайте перед покупкою workflow, зберіганням ACP чи опорою на результати ШІ.",
    r1Title: "1. Не інвестиційний продукт",
    r1Body: "ACP — утилітарна / облікова одиниця. Зростання ціни чи гарантована дохідність не обіцяються.",
    r2Title: "2. Ризик виводу ШІ",
    r2Body: "Результати можуть бути хибними. Це не заміна професійної консультації.",
    r3Title: "3. Ризик гаманця",
    r3Body: "Втрата seed/ключів може означати безповоротну втрату коштів.",
    r4Title: "4. Міст і сторонні rails",
    r4Body: "Мости та платіжні партнери несуть ризики смарт-контрактів, кастоді та контрагента.",
    r5Title: "5. Доступність",
    r5Body: "Сервіс може перериватися; експериментальні функції не є аудитованою гарантією.",
    r6Title: "6. Регуляторний і податковий ризик",
    r6Body: "Правила відрізняються за країнами. Податки — ваша відповідальність. ANCAP full agreement with CLARITY goals does not replace your local rules.",
    r7Title: "7. Сторонні ринкові дані",
    r7Body: "Спотові ціни або FX-контекст на ANCAP можуть надходити від CoinGecko. Це лише орієнтири, не ціна розрахунку і не інвестиційна порада.",
    r8Title: "8. Ризик результату довголіття, друку органів і ветеринарії",
    r8Body:
      "Рейли AETERNA (друк органа, кріо тканин кота, VET REGEN POD для собаки) можуть не відбутися або бути відхилені партнером. Ілюстрації концептуальні. Відсоток виживаності та повернення до життя не обіцяються.",
    r9Title: "9. Ризик гуманітарної допомоги",
    r9Body:
      "Гуманітарні брифи можуть бути затримані або відхилені національним товариством. ANCAP сам не доставляє їжу, воду, одяг, ліки і не працевлаштовує. Лістинг — не підписане партнерство з Червоним Хрестом і не податкове відрахування. Див. /legal/humanitarian.",
    riskMarketDataMore: "Повне розкриття щодо ринкових даних:",
    p9Title: "9. Провайдери ринкових даних",
    p9Body: "ANCAP може викликати CoinGecko API для орієнтовних котирувань. Запити йдуть із серверними ключами і зазвичай без вашого пароля.",
    marketDataKicker: "Розкриття для клієнтів",
    marketDataTitle: "Ринкові дані та CoinGecko",
    marketDataIntro: "Як ANCAP використовує сторонні ринкові дані на ancap.cloud.",
    md1Title: "1. Що ми показуємо",
    md1Body: "Орієнтовні спотові ціни (BTC, ETH, USDT, BNB, SOL). API: GET /api/v1/market/prices. Можуть бути на головній та Reserves.",
    md2Title: "2. Не розрахунок і не порада",
    md2Body: "Ціни CoinGecko не є цінами розрахунку ANCAP.",
    md3Title: "3. Точність і доступність",
    md3Body: "Стрічки можуть запізнюватися або бути недоступні.",
    md4Title: "4. Атрибуція",
    md4Body: "ANCAP вказує CoinGecko як джерело.",
    md5Title: "5. Ваша відповідальність",
    md5Body: "Не покладайтеся на орієнтовні екрани для незворотних переказів.",
    md6Title: "6. Погода (AccuWeather)",
    md6Body: "Віджет Earth / Support може показувати локальний час і погоду за IP через AccuWeather (https://www.accuweather.com/) і API GET /api/v1/weather/current.",
    md7Title: "7. Погода — не служба попереджень",
    md7Body: "Погода у віджеті лише UX-контекст, не офіційне метеопопередження.",
    md8Title: "8. Локація та privacy AccuWeather",
    md8Body: "Приблизні координати з IP надсилаються до weather API ANCAP. AccuWeather обробляє дані за своїми правилами. ANCAP не продає ці дані.",
    marketDataAttributionTitle: "Провайдери",
    marketDataAttributionBody: "Ринкові дані: CoinGecko. Погода: AccuWeather (https://www.accuweather.com/).",
    refundsKicker: "Політика білінгу",
    refundsTitle: "Платежі та повернення",
    refundsIntro: "Як ANCAP ставиться до платних запусків, API, кредитів і fiat-поповнень.",
    f1Title: "1. Коли списання остаточне",
    f1Body: "Покупка workflow зазвичай споживається з початку виконання; успішні запуски здебільшого не повертаються.",
    f2Title: "2. Збійні запуски",
    f2Body: "За підтвердженої провини платформи напишіть на support@ancap.cloud для кредиту чи повтору.",
    f3Title: "3. Кредити та баланси ACP",
    f3Body: "Це облікові одиниці Сервісів, не банківські депозити.",
    f4Title: "4. Fiat-процесори",
    f4Body: "Карткові платежі підлягають правилам Stripe/партнерів. Спочатку звертайтеся до support@ancap.cloud.",
    f5Title: "5. Як запросити перевірку",
    f5Body: "Email support@ancap.cloud з ID платежу/запуску. Обов’язкові права споживача зберігаються, де застосовні.",
    refundsWelcomeGrantMore: "Грант при реєстрації — промо-кредит платформи, не пожертва і не повернення фіатом. Докладно:",
    welcomeGrantKicker: "Білінг / споживче право",
    welcomeGrantTitle: "Грант при реєстрації: 100 ACP кредиту доступу",
    welcomeGrantIntro:
      "ANCAP нараховує 100 ACP новому акаунту, щоб користувач міг спробувати платні AI-workflow без першої купівлі. «$100» — номінальна облікова мітка. Ця сторінка фіксує кваліфікацію: грант доступу, не благодійність, не USD, не податкове відрахування. Інструменти ЄС — у пунктах 5–9.",
    wg1Title: "1. Що ви отримуєте",
    wg1Body:
      "Після успішної реєстрації ANCAP зараховує 100 ACP на платформовий леджер. «$100» — номінальна облікова мітка. Це не виплата 100 доларів США, не банківський переказ і не подарунок фіату.",
    wg2Title: "2. Мета доступу (чому це звучить як благодійність)",
    wg2Body:
      "Заявлена мета оператора — знизити грошовий бар’єр, щоб нова людина могла спробувати платні AI-workflow. У звичайній мові це грант доступу. Ця мета не перетворює кредит на пожертву за законом.",
    wg3Title: "3. Право — не пожертва",
    wg3Body:
      "Пожертва (дарування майна обдаровуваному для загальнокорисних цілей) вимагає передачі майна. Платформа, що кредитує власний леджер, майно благодійній організації не передає. Маркетинговий кредит не є благодійною діяльністю зареєстрованої НКО. Називати його «благодійністю» без такої форми — недобросовісна реклама. Грант не лотерея. Користувач не отримує податкове відрахування лише через нарахування цього кредиту.",
    wg4Title: "4. США",
    wg4Body:
      "Грант не є tax-deductible charitable contribution за IRC §170 і не подарунок 501(c)(3), доки окрема charity реально не отримує кошти. FTC Act §5 забороняє видавати signup-промо за донат. ACP залишається utility / обліковою одиницею, не продуктом дохідності.",
    wg5Title: "5. ЄС — недобросовісна комерційна практика (не благодійність)",
    wg5Body:
      "Директива 2005/29/EC (UCPD) у редакції (EU) 2019/2161 забороняє misleading actions/omissions (ст. 6–7). Додаток I, п. 22: хибно стверджувати, що трейдер діє не в цілях своєї торгівлі чи професії. Видавати цей signup-кредит за пожертву чи діяльність визнаної організації суспільної користі — коли ANCAP комерційна платформа і кошти зареєстрованій EU-charity не передаються — було б misleading commercial practice. Директива 2000/31/EC ст. 6: комерційні комунікації мають бути явно розпізнаваними. Національні аналоги: Німеччина UWG §§ 5 / 5a; Франція Code de la consommation; Італія Codice del Consumo. У Великій Британії — CPRs 2008 (збережена UCPD). Цей кредит не робить ANCAP gemeinnützige Körperschaft, organisme d’intérêt général чи charity за Charities Act 2011.",
    wg6Title: "6. ЄС — права споживача і несправедливі умови",
    wg6Body:
      "Директива 2011/83/EU та (EU) 2019/770: грант — безоплатний промо-кредит, не відплатний дистанційний договір. 14-денне право відмови (CRD ст. 9) стосується пізнішої платної цифрової послуги, а не самого безкоштовного кредиту. Якщо споживач просить негайне виконання платної цифрової послуги в період відмови (CRD ст. 16(m) / 16a), ці правила — в платежах і поверненнях. Директива 93/13/EEC: умови про скасування гранта за abuse мають бути прозорими й пропорційними. Регламент (EU) 2018/302: кредит не є ціновою дискримінацією за громадянством держави-члена. DSA (EU) 2022/2065 не перетворює леджер-кредит на пожертву.",
    wg7Title: "7. ЄС — не e-money, не платіжна послуга, не споживчий кредит",
    wg7Body:
      "Директива 2009/110/EC (EMD2): e-money випускається при отриманні коштів і приймається особами іншими, ніж емітент. Цей грант випускається без отримання коштів від користувача, витрачається лише на сервіси ANCAP і не погашається в EUR/USD. PSD2 (EU) 2015/2366: це не платіжна операція і не платіжний рахунок. Директиви 2008/48/EC та (EU) 2023/2225: це не позика і не кредит із відсотками. Детермінований кредит «один на акаунт» не азартна гра і не ліцензована лотерея ЄС.",
    wg8Title: "8. ЄС — MiCA і рамка ринків капіталу",
    wg8Body:
      "Регламент (EU) 2023/1114 (MiCA): ACP — utility / облікова одиниця для платних AI-workflow. Грант не публічна пропозиція ART/EMT, не fundraising-оферта криптоактивів і не право на дивіденди чи відсотки. Це не фінансовий інструмент за MiFID II 2014/65/EU і не оферта цінних паперів за Prospectus Regulation (EU) 2017/1129. Не можна рекламувати «гарантовану дохідність» чи «безризикові $100». Номінальна мітка «$100» — шкала обліку цін SKU, не обіцянка виплатити 100 доларів США чи 100 євро.",
    wg9Title: "9. ЄС — ПДВ, податки і персональні дані",
    wg9Body:
      "Директива 2006/112/EC: безоплатний промо-кредит без зустрічного надання зазвичай не є оподатковуваною поставкою в момент нарахування. Пізніше платне споживання workflow може бути оподатковуваною поставкою за звичайними правилами місця поставки / OSS. Грант не податкововідраховуваний дар організації суспільної користі ЄС. DAC8 / (EU) 2023/2226, де застосовна, стосується звітних операцій із криптоактивами — цей промо-кредит не благодійний внесок. GDPR (EU) 2016/679: дані реєстрації обробляються для створення акаунта і нарахування гранта (ст. 6(1)(b)); деталі — в Privacy Notice. Грант не «донат» для додаткової marketing consent понад Cookie Policy (ePrivacy 2002/58/EC).",
    wg10Title: "10. Правила продукту",
    wg10Body:
      "Один грант на акаунт. Повторна реєстрація того ж email відхиляється. Зловживання може скасувати кредит. Витрачається на сервіси ANCAP. Не виводиться як USD чи EUR. Не відсотки, не yield і не цінний папір. Окремо від бонусу рефереру 25 ACP.",
    wg11Title: "11. Повернення і зловживання",
    wg11Body:
      "Грант не повертається фіатом. Шахрайські акаунти можуть бути закриті зі скасуванням кредиту. Імперативні права споживача ЄС на відмову від пізнішої платної цифрової послуги, де вони застосовні, грантом не зачіпаються.",
    wg12Title: "12. Це не юридична консультація",
    wg12Body:
      "Сторінка — розкриття оператора, не порада користувачу щодо податків чи ліцензована юридична консультація в ЄС/ЄЕЗ/Великій Британії. Питання: legal@ancap.cloud. Гуманітарні брифи — окремий продукт на /humanitarian і /legal/humanitarian, це не грант при реєстрації.",
    welcomeGrantAlso: "Відкрити акаунт або пов’язані повідомлення:",
    humanitarianKicker: "Юридичне / гуманітарне",
    humanitarianTitle: "Стіл гуманітарної допомоги та лістинги Червоного Хреста / Червоного Півмісяця",
    humanitarianIntro:
      "Як ANCAP описує ACP-брифи гуманітарної допомоги та передачу національним товариствам Червоного Хреста / Червоного Півмісяця. ANCAP не зареєстрована благодійна організація і не заявляє підписане партнерство з МКЧХ, МФЧХ чи національним товариством, доки датоване узгодження не опубліковано тут.",
    hum1Title: "1. Роль платформи",
    hum1Body:
      "ANCAP — ACP-first програмна платформа. На /humanitarian продаються брифи допомоги та інструменти передачі партнеру. ANCAP не є благодійною організацією за 135-ФЗ РФ, не UK charity і не 501(c)(3) США. Оплата ACP не робить користувача жертводавцем ANCAP як НКО.",
    hum2Title: "2. Рух Червоного Хреста / Червоного Півмісяця",
    hum2Body:
      "МКЧХ, МФЧХ і національні товариства — різні компоненти. Лістинг МФЧХ або національного товариства — рейл на офіційні сайти, не членство в Русі, не агентський контракт і не схвалення МКЧХ. Поки MoU не опубліковано, official_partnership = false.",
    hum3Title: "3. Що оплачує ACP",
    hum3Body:
      "ACP на цьому столі оплачує бриф і внесок у передачу партнерському каналу: їжа, питна вода, харчі, теплий одяг, медпрепарати через ліцензовані канали, підбір підйомної роботи. ANCAP не тримає склади і не гарантує пайку, ліки чи робоче місце.",
    hum4Title: "4. Відмінність від гранту при реєстрації",
    hum4Body:
      "100 ACP при реєстрації — промо-доступ, явно не благодійність. Не змішуйте /legal/welcome-grant і /legal/humanitarian (38-ФЗ / UCPD Annex I п. 22).",
    hum5Title: "5. Емблеми та Женевські конвенції",
    hum5Body:
      "Червоний хрест, червоний півмісяць і червоний кристал охороняються Женевськими конвенціями 1949 р. У ANCAP немає ліцензії використовувати їх як логотип. Сайт використовує текстові назви. emblem_licensed = false.",
    hum6Title: "6. Медичні препарати",
    hum6Body:
      "Брифи щодо медпрепаратів — лише ліцензовані / партнерські канали. ANCAP не аптека, не виписує рецепти і не дає медичних порад. Контрольовані речовини та неліцензований обіг ліків заборонені.",
    hum7Title: "7. Підйомна робота",
    hum7Body:
      "Підбір підйомної роботи — бриф у партнерські програми. ANCAP не ліцензоване кадрове агентство в усіх юрисдикціях і не гарантує роботу, зарплату чи дозвіл на працю.",
    hum8Title: "8. Російська Федерація / суміжне право",
    hum8Body:
      "135-ФЗ і ст. 582 ЦК РФ: списання ACP у леджері ANCAP саме по собі не є пожертвою, доки зареєстрована charity окремо не видасть квитанцію. Реклама, що ANCAP — благодійна організація, заборонена (38-ФЗ).",
    hum9Title: "9. ЄС, Велика Британія, США та податкові квитанції",
    hum9Body:
      "UCPD 2005/29/EC Annex I п. 22, e-Commerce Directive ст. 6, UK CPRs, US FTC Act §5, IRC §170: комерційні повідомлення не повинні створювати хибне враження благодійної мети. Запис ACP в ANCAP не є квитанцією qualified organisation.",
    hum10Title: "10. Контакти",
    hum10Body:
      "Юридичні повідомлення: legal@ancap.cloud. Продукт: /humanitarian. Пов’язані сторінки: /legal/welcome-grant. Офіційний сайт: https://www.ifrc.org/. Це розкриття оператора, не ліцензована юридична, податкова чи медична порада.",
    humanitarianAlso: "Пов’язані повідомлення та офіційні сайти:",
    cyberKicker: "Legal / public policy",
    cyberTitle: "ANCAP endorsement of collective cyber defense",
    cyberIntro: "ANCAP publicly agrees with the OpenAI open letter \"A call for collective action on cyber defense\" and the global surge it asks for. This page is the company's legal and policy statement of that agreement. It does not replace the User Agreement, Privacy Notice, or Cookie Policy.",
    openLetter: "Open letter (openai.com)",
    cyberStatementTitle: "Statement of agreement",
    cyberStatement1: "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, and API services, agrees with the letter's opening claim: there is a limited window to strengthen cyber defense. AI-enabled attacks are becoming cheaper, more automated, and more widely available, including against hospitals, water systems, and internet infrastructure. The same models can help defenders close weaknesses that have accumulated for years. ANCAP therefore aligns with the call to raise cybersecurity to executive priority, fund defense for operators who cannot fund it themselves, share proven playbooks, and make AI-agent actions accountable.",
    cyberStatement2: "Signatories of the letter include technology, security, payments, telecom, and industrial companies that compete in ordinary markets and still coordinated around a shared threat picture. ANCAP is not a listed signatory of that letter. This page records ANCAP's independent agreement with the same policy and the same three principles.",
    cyberP1Title: "1. Current security is not enough",
    cyberP1Body: "Systems remain exposed because of accumulated bugs, excess privilege, weak authentication, and technical debt. Security teams — especially in critical infrastructure — are chronically under-resourced. ANCAP treats this as a leadership-level risk, not a back-office checklist.",
    cyberP2Title: "2. Defenders need AI",
    cyberP2Body: "The same class of models that will make attacks cheaper can also give more teams expert-grade defensive skill and make baseline security work faster and cheaper. Proven tools and patches from one organization should help many. ANCAP will use AI to strengthen defensive workflows, proof trails, and operator checks — not to lower the cost of offense.",
    cyberP3Title: "3. The response must be collective",
    cyberP3Body: "No single company controls the threat surface. Vendors hold attack data and tools, model builders hold the models, governments hold coordination and budget, and operators know their own systems. ANCAP agrees that these parts must be joined so one victim's experience raises the cost of the next attack.",
    cyberCommitTitle: "ANCAP commitments under this policy",
    cyberC1Title: "Leadership priority",
    cyberC1Body: "Cybersecurity is treated with incident-level urgency: close the most dangerous weaknesses, verify the result, and raise the bar for what we buy, ship, and run — including AI-written code.",
    cyberC2Title: "Defensive use of AI",
    cyberC2Body: "ANCAP will apply AI to defensive tasks, auditability, and operator support. Paid AI workflows and agents on the platform remain subject to prohibited-conduct rules against attacks, malware, fraud, and unauthorized access.",
    cyberC3Title: "Traceable agents",
    cyberC3Body: "AI-agent actions on ANCAP should be traceable and accountable through receipts, hashes, logs, and proof artifacts wherever the product already records execution.",
    cyberC4Title: "Shared standards",
    cyberC4Body: "ANCAP supports partnership, threat-information sharing, and common defensive standards among technology companies, infrastructure operators, and public institutions.",
    cyberC5Title: "Raise attacker cost",
    cyberC5Body: "The core economic test remains: an attack should cost more than it can return. ANCAP agrees that restoring that cost requires collective action, because no participant holds the full resource set alone.",
    cyberScopeTitle: "Scope and limits",
    cyberScope1: "This endorsement is a public-policy statement. It does not create a warranty, insurance, SLA, or government partnership by itself. Platform users remain bound by the User Agreement, including the prohibition on using ANCAP to attack systems, distribute malware, or bypass access controls. Offensive cyber assistance is outside the product.",
    cyberScope2: "Source document:",
    clarityKicker: "Legal / public policy",
    clarityTitle: "ANCAP full agreement with the CLARITY Act",
    clarityIntro:
      "ANCAP publicly records its full agreement with the Digital Asset Market Clarity Act (CLARITY Act) as updated U.S. market-structure legislation for digital assets. This page is the company's legal and policy statement of that agreement. It does not replace the User Agreement, Risk disclosure, Privacy Notice, or Cookie Policy.",
    clarityBillLink: "Bill text (Congress.gov)",
    clarityNewsLink: "Public notice of updated text",
    clarityStatementTitle: "Statement of full agreement",
    clarityStatement1:
      "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, bridge, stablecoin, and API services, fully agrees with the CLARITY Act's core purpose: establish a clearer federal framework for digital-asset markets, clarify when assets and activities fall under securities versus commodities oversight, and reduce regulatory ambiguity that harms lawful builders, payment rails, and users.",
    clarityStatement2:
      "ANCAP supports clear SEC and CFTC jurisdictional lines, transparent market-structure rules for digital commodities and related activities, and compliance-ready rails for utility settlement assets such as ACP / wACP / sACP. ANCAP is not a Member of Congress, not a registered lobbyist by virtue of this page, and not a government agency. This page records ANCAP's independent full agreement with the Act's market-clarity objectives as publicly discussed around the updated text ahead of floor consideration.",
    clarityP1Title: "1. Market clarity over ambiguity",
    clarityP1Body:
      "Builders and clients need predictable rules for classification, custody, trading venues, and disclosures. ANCAP agrees that statutory clarity beats ad-hoc enforcement-only regimes for digital-asset market structure.",
    clarityP2Title: "2. Jurisdiction that matches the asset and activity",
    clarityP2Body:
      "ANCAP agrees that securities-like activities should remain under securities oversight and that digital-commodity market activities should have a coherent CFTC-facing framework, consistent with the Act's design goals as publicly described.",
    clarityP3Title: "3. Lawful commerce and utility rails",
    clarityP3Body:
      "ANCAP positions ACP as a utility / accounting unit for paid AI workflows and platform credits — not as an investment-return product. Full agreement with CLARITY market-structure goals reinforces that ANCAP will keep MiCA-safe / utility messaging and align product disclosures with applicable U.S. law as enacted and interpreted.",
    clarityCommitTitle: "ANCAP commitments under this endorsement",
    clarityC1Title: "Full public agreement",
    clarityC1Body:
      "ANCAP states full agreement with the CLARITY Act's purpose of digital-asset market clarity and will keep this statement available in the Legal center.",
    clarityC2Title: "Honest product status",
    clarityC2Body:
      "ANCAP will not use this endorsement to claim that ACP is a registered security, that any token is guaranteed lawful in every jurisdiction, or that legislation has already been signed into law before it has.",
    clarityC3Title: "Compliance follow-through",
    clarityC3Body:
      "If and when CLARITY (or successor market-structure law) is enacted, ANCAP will review messaging, partner rails, and disclosures against the final statute and implementing rules.",
    clarityC4Title: "No substitute for user counsel",
    clarityC4Body:
      "Users remain responsible for their own legal, tax, and licensing analysis. This endorsement is not legal advice to any client.",
    clarityC5Title: "Update discipline",
    clarityC5Body:
      "Material legislative changes will be reflected on this page and, where needed, in the User Agreement and Risk disclosure \"Last updated\" notes.",
    clarityScopeTitle: "Scope and limits",
    clarityScope1:
      "This endorsement is a public legal-policy statement of full agreement with the CLARITY Act's market-structure goals. It does not create a warranty, insurance, SLA, government partnership, lobbying engagement, or investment recommendation. Passage of any bill remains a matter for Congress and the President. Until enacted, ANCAP continues to operate under existing applicable law and these Legal center notices.",
    clarityScope2: "References:",
    footerClarity: "CLARITY Act",
    footerLegal: "Юридичне",
    footerTerms: "Умови",
    footerPrivacy: "Конфіденційність",
    footerCookies: "Cookie",
    footerRisk: "Ризики",
    footerRefunds: "Повернення",
    footerWelcomeGrant: "Грант 100 ACP",
    footerHumanitarian: "Допомога",
    footerVetRegen: "Вет-реген",
    footerLightChamber: "Світлова камера",
    footerBodyContouring: "Контур тіла",
    footerBiofusion: "BioFusion",
    footerDpsc: "Біоматеріал DPSC",
    footerVascularPlus: "Vascular Care+",
    footerVascular: "Vascular Care",
    footerTransdermal: "Трансдермальний",
    footerMReceptor: "M-рецептори",
    footerOxygenCarrier: "Переносник O₂",
    authAgreePrefix: "Я погоджуюсь з",
    authAgreeAnd: "і",
    authAgreeSuffix: ".",
  },
  de: {
    lastUpdated: "Zuletzt aktualisiert: 12. September 2026.",
    privacyLink: "Datenschutzhinweis",
    cookiesLink: "Cookie-Richtlinie",
    termsLink: "Nutzungsvereinbarung",
    cyberLink: "Kollektive Cyberabwehr",
    clarityLink: "CLARITY Act",
    acpLink: "ACP Whitepaper",
    riskLink: "Risikohinweis",
    refundsLink: "Zahlungen & Erstattungen",
    welcomeGrantLink: "Willkommenszuschuss",
    humanitarianLink: "Humanitäre Hilfe",
    hubLink: "Rechtszentrum",
    complianceLink: "Compliance",
    contactLegal: "legal@ancap.cloud",
    contactPrivacy: "privacy@ancap.cloud",
    contactSupport: "support@ancap.cloud",
    hubKicker: "Rechtszentrum",
    hubTitle: "Rechtliche Informationen für ANCAP-Kunden",
    hubIntro: "Klare Regeln für Nutzer von ancap.cloud: Vereinbarungen, Datenschutz, Cookies, Zahlungen, KI-/Krypto-Risiken und Kontakte.",
    hubCardTerms: "Regeln für Konten, Wallets, bezahlte Workflows, API, Creator und verbotenes Verhalten.",
    hubCardPrivacy: "Welche Daten wir verarbeiten, warum, Aufbewahrung, Ihre Rechte und Kontakte.",
    hubCardCookies: "Notwendige und optionale Speicherung sowie Einwilligung.",
    hubCardRisk: "Offene Hinweise: KI-Ausgaben, Utility-Charakter von ACP, Bridge-/Wallet-Risiken, keine Renditegarantie.",
    marketDataLink: "Marktdaten",
    hubCardMarketData: "Wie ANCAP CoinGecko und andere Kursfeeds nutzt — nur indikativ.",
    footerMarketData: "Marktdaten",
    researchRefsLink: "Forschungsreferenzen",
    hubCardResearchRefs:
      "Drittanbieter-Wissenschaftsinstrumente und Patent-Journalismus, die wir zitieren (ZEISS Lightfield 4D, Daewoong eTurna USPTO-Allowance) — ohne Affiliation.",
    footerResearchRefs: "Forschungsrefs",
    researchRefsKicker: "Third-party science",
    researchRefsTitle: "Research references and instrument citations",
    researchRefsIntro:
      "How ANCAP cites public third-party scientific instruments and technology notes. Downloads and trademarks remain with their owners.",
    rr1Title: "1. Purpose",
    rr1Body:
      "ANCAP may cite public product pages and technology notes as educational context for longevity, imaging, and AETERNA research workflows. Citations are not an endorsement or resale of third-party hardware.",
    rr2Title: "2. ZEISS Lightfield 4D",
    rr2Body:
      "ANCAP references ZEISS LSM Lightfield 4D as public technical context. Product page and technology note links are on this Legal center and AETERNA. Gated thank-you downloads are served by ZEISS under ZEISS terms.",
    rr3Title: "3. No affiliation or trademark license",
    rr3Body:
      "ZEISS, Carl Zeiss, Lightfield 4D, LSM, ZEN, and related marks are trademarks of Carl Zeiss AG / Carl Zeiss Microscopy GmbH or affiliates. ANCAP is not affiliated with or endorsed by ZEISS unless a separate written agreement says otherwise.",
    rr4Title: "4. Downloads and hosting",
    rr4Body:
      "ANCAP does not host or redistribute ZEISS proprietary PDFs. We link to ZEISS-controlled URLs only.",
    rr5Title: "5. Not medical or clinical advice",
    rr5Body:
      "Instrument citations do not create medical or clinical advice. Verify partner licenses and local law before any clinical use.",
    rr6Title: "6. Quanteninformation / Datenschutzforschung (iXBT Live)",
    rr6Body:
      "ANCAP zitiert den öffentlichen iXBT-Live-Artikel zum „unmöglichen“ Quantenparadoxon im Datenschutz als Bildungsrahmen für den Quantum-Link-SIM-Desk. Keine Affiliation mit iXBT; keine QKD-Garantie.",
    rr7Title: "7. Daewoong / eTurna-mRNA-LNP (USPTO Notice of Allowance)",
    rr7Body:
      "Stand 11. September 2026 zitiert ANCAP öffentliche Berichte, wonach Daewoong Pharmaceutical eine USPTO-Notice of Allowance (27. August 2026) für ionisierbare Lipide der eTurna-LNP-Plattform erhalten hat. Allowance ≠ erteiltes Patent ≠ zugelassenes Arzneimittel. Präklinisch. Keine Affiliation; keine Lipidrezepte oder Nasslabor-Protokolle auf ANCAP-Hosts.",
    rr8Title: "8. Chalmers-Floquet / bosonische Codes (PRL 2026)",
    rr8Body:
      "Stand 11. September 2026 zitiert ANCAP Nauka-TV-Berichterstattung (10. Sep. 2026) zu Huang–Du–Guo, PRL DOI 10.1103/tnb8-3m8m: bosonische Codes und Quantum Lattice Gates in einer Floquet-Periode statt Tausender. Theorie; keine ANCAP-Hardware. Keine Affiliation mit Chalmers / Tianjin / APS.",
    rr9Title: "9. Startup-Investments — IT-Gazellen / B2B-Retail & KI (2026)",
    rr9Body:
      "Stand 12. September 2026 zitiert der /startups-Desk CNews/Spark-Interfax-IKT-Gazellen (GA Tactic / Goldener Apfel, Kundenkonzentration), Forbes/FRIИ-Klein-IT, Sky.pro-KI/SECaaS-Spannen und businessmens.ru-Agrotech-Nischen. Kein Wertpapierangebot, keine Anlageberatung, keine Affiliation mit den genannten Verlagen oder Emittenten.",
    researchRefsLinksTitle: "Kanonische Research-Links",
    researchRefsLinksBody:
      "Öffentliche Verleger-URLs verwenden. Bei toten Deep-Links die Quellseite bevorzugen. ZEISS, Daewoong/eTurna-USPTO-Allowance, Chalmers-Floquet-bosonische Codes, iXBT und IT-Gazellen-Journalismus 2026 nur zur Literacy.",
    cryoLink: "Kryonik & Verfassungen",
    hubCardCryo:
      "Kryokonservierungs-Desk, Tardigraden-Research-Framing, Partner KrioRus und Tomorrow.bio, veterinärmedizinische Gewebe-/VET-REGEN-POD-Schienen, verfassungsrechtliche Hinweise zum Stand dieses Datums.",
    footerCryo: "Kryonik",
    cryoKicker: "Recht / Longevity",
    cryoTitle: "Kryokonservierung, Partner und Verfassungsgrenzen",
    cryoIntro:
      "Wie ANCAP Kryonik-Intents, lizenzierte Partner und tardigradeninspirierte Research-Protokolle unter geltenden Verfassungen und Gesundheitsrecht zum 11. September 2026 einordnet.",
    cryo1Title: "1. Plattformrolle",
    cryo1Body:
      "ANCAP bietet ACP-abgerechnete Intents und Partner-Handoff. ANCAP betreibt keine Kryoanlagen. Physische Kryokonservierung nur durch lizenzierte Partner.",
    cryo2Title: "2. Partner — KrioRus und Tomorrow.bio",
    cryo2Body:
      "Desk-Listings umfassen KrioRus (RU) und Tomorrow.bio (EU). Ein Listing ist eine Partner-Übergabe, kein klinisches, ethisches oder regulatorisches Audit. Öffentliche Kritik an Methoden mancher Kryonik-Anbieter besteht; Tomorrow.bio ist bei Langzeit-Wirksamkeit early-stage. ANCAP bestätigt keine Wiederbelebung und wrappt Kryonik nicht als RWA-Rendite.",
    cryo3Title: "3. Tardigradenblut / Kryptobiose",
    cryo3Body:
      "Tardigraden-Bezüge sind Research-Metadaten — kein zugelassenes Transfusionsprodukt und kein DIY-Protokoll.",
    cryo4Title: "4. Verfassungen (Stand)",
    cryo4Body:
      "Unterliegt Verfassungen und Höchstrangrecht der Nutzer-/Partnerjurisdiktionen zum 11. September 2026 (u. a. RF, Grundgesetz, Ukraine, EU/US). Rechtswidrige Kryonik wird nicht unterstützt.",
    cryo5Title: "5. Keine medizinische Beratung",
    cryo5Body:
      "Katalog und Nutzer-/KI-Reviews sind informativ. Zwingende Verbraucher-/Patientenrechte bleiben unberührt.",
    cryo6Title: "6. Veterinäre Gewebekryokonservierung (Katze)",
    cryo6Body:
      "Der feline Gewebe-Kryokonservator/-restorer ist ein Intake-Briefing für lizenzierte Veterinärpartner. ANCAP stellt die Kammer nicht her, praktiziert keine Veterinärmedizin und behauptet nicht, dass gefrorenes Gewebe Leben zurückbringt oder eine Überlebensquote erreicht. Entnahme, Einfrieren, Lager, Auftauen und etwaige Reimplantation nur durch einen approbierten Tierarzt.",
    cryo7Title: "7. Veterinäre Organregenerationskammer (Hund / VET REGEN POD)",
    cryo7Body:
      "VET REGEN POD ist der Name einer konzeptionellen caninen Organtransplantations- und Regenerationskammer. Infografik-Zahlen (einschließlich Überlebensprozente oder „schneller als natürliche Regeneration“) sind keine ANCAP-Produktaussagen. Körperliche Eingriffe nur in einer lizenzierten Veterinär-OP. Siehe /legal/vet-regen.",
    cryo8Title: "8. Prüfung, Spekulation und wofür ACP zahlt",
    cryo8Body:
      "Kryonik-Partner stehen weiter unter öffentlicher und regulatorischer Kritik; Listing räumt das nicht. ACP auf diesem Desk zahlt ein Konsultations-/Intake-Briefing und eine Übergabe, keine tokenisierte Person und keine DeFi-Rendite auf Wiederbelebung. Literaturlizenz-Auktionen sind ein separates dünnes IP-Desk: Genre-Median ist comparable, kein NAV; Pump-Gebote fail-closed. Siehe /literary und /legal/risk.",
    vetRegenLink: "Veterinär-Organschienen",
    hubCardVetRegen:
      "Feliner Gewebe-Kryokonservator und canine VET REGEN POD: konzeptionelle Partnerarchitektur, nur approbierte Tierärzte, keine Auferstehungs- oder Überlebensgarantie.",
    vetRegenKicker: "Recht / Veterinär",
    vetRegenTitle: "Veterinär-Organschienen — Kryokonservator und VET REGEN POD",
    vetRegenIntro:
      "Wie ANCAP Gewebebanken und Organregeneration für Haustiere zum 12. September 2026 einordnet. Diese Seiten verkaufen ACP-Konsultations- und Intake-Briefings, keine Hardware und keine Tierarztbehandlung.",
    vr1Title: "1. Plattformrolle",
    vr1Body:
      "ANCAP bietet ACP-Abrechnung, Briefings und Partner-Matching. ANCAP betreibt keine Tierkliniken, stellt keine Kryokammern oder VET-REGEN-POD-Hardware her und operiert keine Tiere.",
    vr2Title: "2. Kein in Verkehr gebrachtes Medizinprodukt",
    vr2Body:
      "Infografiken sind konzeptionelle Architektur. Keine EU-MDR-Broschüre, kein FDA-510(k)/NADA, kein CE-Produkt von ANCAP. Ein Workflow-Listing ist kein Inverkehrbringen eines Geräts.",
    vr3Title: "3. Verbotene Ergebnisaussagen",
    vr3Body:
      "ANCAP behauptet keine Rückkehr ins Leben, Auferstehung, Unsterblichkeit, numerische Überlebensquote (einschließlich „bis zu 98 %“ auf einer Illustration) und keine Regeneration „2–5× schneller als natürlich“. Illustrationen sind keine klinische Evidenz.",
    vr4Title: "4. Nur approbierte Tierärzte",
    vr4Body:
      "Entnahme, Narkose, Transplantation, Immunmodulation und Nachsorge sind veterinärmedizinische Handlungen. Heim-Kryo, DIY-Bioreaktoren und unlizenzierte Zellkultur sind untersagt.",
    vr5Title: "5. Tiergesundheits- und Tierschutzrecht (Stand)",
    vr5Body:
      "Leistungen unterliegen dem am 12. September 2026 geltenden Tiergesundheits- und Tierschutzrecht — einschließlich russischem Veterinärrecht, VO (EU) 2019/6, Richtlinie 2010/63/EU soweit Forschungstiere betroffen sind, US-State Veterinary Practice Acts und FDA-CVM, deutschem TierSchG / TAppV sowie entsprechendem ukrainischem Veterinärrecht.",
    vr6Title: "6. Keine veterinär-, medizin- oder pharmakologische Beratung",
    vr6Body:
      "Katalog, Infografiken, Workflow-Ausgaben und Reviews sind informativ. Keine Diagnose, kein Rezept, kein Behandlungsplan, keine Garantie für irgendein Tier.",
    vr7Title: "7. Gesundheitsdaten des Tiers",
    vr7Body:
      "Kennungen und klinische Historie eines Tiers sind sensibel. Keine regulierten Veterinärakten ohne Rechtsgrund hochladen. ANCAP-Vaults bleiben hash-first.",
    vr8Title: "8. Verhältnis zum menschlichen Organdruck",
    vr8Body:
      "Menschlicher Stammzell-Organdruck (250.000 ACP je Organ) bleibt ein separates Bioreaktor-Handoff. Veterinärschienen (75.000 ACP feliner Kryo; 180.000 ACP canine VET REGEN POD) autorisieren keine humane Kliniknutzung der illustrierten Kammern.",
    vr9Title: "9. Zahlungen",
    vr9Body:
      "ACP kauft ein Konsultations-/Intake-Briefing und Partner-Matching — kein Hardware-Eigentum und kein garantiertes klinisches Ergebnis. Erstattungen gemäß /legal/refunds.",
    vr10Title: "10. Kontakt",
    vr10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#vet-regen und /cryo.",
    lightChamberLink: "Vinci-Lichtkammer",
    hubCardLightChamber:
      "Ganzkörper-Photobiomodulationskammer: Leonardo-Sonnenlicht-Literacy, nur lizenzierter Phototherapie-Partner, keine sichere Bräune und kein CE/FDA-Geräteanspruch.",
    lightChamberKicker: "Recht / Phototherapie",
    lightChamberTitle: "Vinci-Lichtkammer — Photobiomodulations-Schiene",
    lightChamberIntro:
      "Wie ANCAP die Ganzkörper-LED/UVA/Rot/Nah-IR-Kammer zum 12. September 2026 einordnet. Diese Seiten verkaufen ACP-Briefings, keine Hardware und keine Phototherapie-Behandlung.",
    lc1Title: "1. Plattformrolle",
    lc1Body:
      "ANCAP stellt ACP-Abrechnung, Briefings und Partner-Matching. ANCAP betreibt keine Dermatologiekliniken, stellt keine LED/UVA-Kapseln her und führt keine Lichtsitzungen durch.",
    lc2Title: "2. Kein in Verkehr gebrachtes Medizinprodukt",
    lc2Body:
      "Die Infografik ist konzeptionelle Architektur. Kein EU-MDR-Prospekt, kein FDA-510(k), keine rekonstruierte Leonardo-Erfindung. Ein Workflow-Listing bringt kein Gerät in Verkehr.",
    lc3Title: "3. Verbotene Ergebniszusagen",
    lc3Body:
      "ANCAP behauptet keine sichere Bräune, Vitamin-D-Therapie, Kollagenzuwachs, Wundverschluss oder Anti-Aging. Rot/Nah-IR ist öffentliche Forschungsliteracy. UV bleibt eine Hautkrebs-Risikoklasse.",
    lc4Title: "4. Nur lizenzierte Kliniker",
    lc4Body:
      "Phototherapie und UV sind klinische Handlungen. Keine Heim-LED-Arrays oder Solarien nach diesen Seiten bauen.",
    lc5Title: "5. Screening",
    lc5Body:
      "Partnerprotokolle müssen Photosensibilität, Melanom-Anamnese, photosensibilisierende Arzneimittel und Phototyp prüfen.",
    lc6Title: "6. Keine medizinische Beratung",
    lc6Body:
      "Katalog, Infografik und Leonardo-Bezüge sind Information, keine Diagnose und kein Behandlungsplan.",
    lc7Title: "7. Gesundheitsdaten",
    lc7Body:
      "Hautanamnese als sensibel behandeln. Keine Krankenakten ohne Rechtsgrundlage hochladen.",
    lc8Title: "8. Verhältnis zu anderen AETERNA-Schienen",
    lc8Body:
      "Organdruck, mRNA-Konsultationen und Veterinärschienen bleiben getrennt. Die Lichtkammer erlaubt kein DIY-CRISPR und keine unlizenzierte Phototherapie-Hardware.",
    lc9Title: "9. Zahlungen",
    lc9Body:
      "ACP kauft ein Briefing und ein Partner-Matching — kein Eigentum an Hardware. Erstattungen: /legal/refunds.",
    lc10Title: "10. Kontakt",
    lc10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#vinci-light.",
    bodyContouringLink: "Mikrowellen-Body-Contouring",
    hubCardBodyContouring:
      "Kontaktgekühlter 2,45-/5,8-GHz-Applikator: nur lizenzierter Ästhetik-/Dermatologie-Partner, keine Liposuktion, kein CE/FDA-Gerät, keine garantierte Fettverlust-Behauptung.",
    bodyContouringKicker: "Recht / Ästhetik",
    bodyContouringTitle: "Mikrowellen-Body-Contouring — lizenzierte Ästhetik-Partnerschiene",
    bodyContouringIntro:
      "Wie ANCAP kontaktgekühltes Mikrowellen-Body-Contouring zum 12. September 2026 rahmt. Diese Seiten verkaufen ACP-abgerechnete Konsultations- und Sitzungsprotokoll-Briefings, keine Hardware und keine Fett-Reduktionsbehandlung.",
    bc1Title: "1. Plattformrolle",
    bc1Body:
      "ANCAP stellt ACP-Abrechnung, Konsultationsbriefings und lizenziertes Partner-Matching für AETERNA-Mikrowellen-Body-Contouring bereit. ANCAP betreibt keine Ästhetikkliniken, stellt keine Mikrowellenwagen oder Applikatoren her, bringt keine Medizinprodukte in Verkehr und führt keine Body-Contouring-Sitzungen durch.",
    bc2Title: "2. Kein vermarktetes Medizinprodukt",
    bc2Body:
      "Die Infografik ist konzeptionelle Architektur zur Partnerdiskussion. Sie ist keine EU-MDR-Gerätebroschüre, kein FDA 510(k) oder PMA, kein von ANCAP verkauftes CE-gekennzeichnetes Ästhetikprodukt und kein Heim-Mikrowellenantennen-Rezept. Ein Workflow-Listing bringt kein Gerät auf den Markt.",
    bc3Title: "3. Verbotene Ergebnisbehauptungen",
    bc3Body:
      "ANCAP behauptet keine liposuktionsgleiche Fettentfernung, keinen garantierten Zentimeterverlust, keine Gewichtsabnahme, keine Adipozytenzerstörung, kein Blebbing, keine Makrophagen-Clearance, keine Lymphdrainage und keine numerische Erfolgsquote. 2,45-/5,8-GHz-ISM-Bänder sind öffentliche Funkspektrum-Literacy, keine von ANCAP zertifizierte Gerätespezifikation.",
    bc4Title: "4. Nur lizenzierte Kliniker",
    bc4Body:
      "Mikrowellen-Ästhetikverfahren und Nachsorge sind klinische Handlungen. Sie dürfen nur von einer in der jeweiligen Jurisdiktion zugelassenen Person durchgeführt werden. Nutzer dürfen aus diesen Seiten keine Heim-Mikrowellenapplikatoren oder Antennenarrays bauen.",
    bc5Title: "5. Screening und Kontraindikationen",
    bc5Body:
      "Partnerprotokolle müssen Implantate, Schrittmacher und andere implantierte Elektronik, Schwangerschaft, Metall im Behandlungsfeld, thermische Verletzungen in der Vorgeschichte und weitere klinikdefinierte Kontraindikationen prüfen. Kontaktkühlung auf der Infografik ist eine Architekturnotiz, kein von ANCAP zertifiziertes Verbrennungsschutzsystem.",
    bc6Title: "6. Keine medizinische Beratung",
    bc6Body:
      "Katalogtexte, Infografiken, Workflow-Ausgaben und Bewertungen sind informativ. Sie sind keine Diagnose, kein Rezept und kein Behandlungsplan.",
    bc7Title: "7. Gesundheitsdaten",
    bc7Body:
      "Identifikatoren und klinische Anamnese sind sensibel. Laden Sie keine Krankenakten ohne Rechtsgrundlage hoch. Partnerkliniken verarbeiten klinische Daten nach eigenen Datenschutzhinweisen.",
    bc8Title: "8. Verhältnis zu anderen AETERNA-Schienen",
    bc8Body:
      "Organdruck, mRNA-Konsultationen, Veterinärschienen und die Vinci-Lichtkammer bleiben getrennt. Mikrowellen-Body-Contouring erlaubt kein DIY-CRISPR, keine LNP-Rezepte, keine unlizenzierte Mikrowellenhardware und keine Liposuktion und ändert AETERNAs Verbot diagnostischer Behauptungen nicht.",
    bc9Title: "9. Zahlungen",
    bc9Body:
      "ACP kauft ein Briefing und ein Partner-Matching — kein Eigentum an Hardware. Erstattungen: /legal/refunds.",
    bc10Title: "10. Kontakt",
    bc10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#microwave-body.",
    biofusionLink: "BioFusion-Kammer",
    hubCardBiofusion:
      "Mikromanipulationskammer: nur lizenzierter ART-/Agrar-/BSL-Partner. Keine Kinderwunschklinik, kein garantierter Embryo, kein Gen-Editier-Kit.",
    biofusionKicker: "Recht / Labor",
    biofusionTitle: "BioFusion-Mikromanipulationskammer — lizenzierte Laborpartnerschiene",
    biofusionIntro:
      "Wie ANCAP die BioFusion-Kammer zum 12. September 2026 rahmt. Diese Seiten verkaufen ACP-Briefings, keine Hardware und keine IVF-Behandlung.",
    bf1Title: "1. Plattformrolle",
    bf1Body:
      "ANCAP stellt ACP-Abrechnung und Partner-Matching bereit. ANCAP betreibt keine Kinderwunschkliniken, stellt den Wagen nicht her und führt kein ICSI durch.",
    bf2Title: "2. Kein vermarktetes Medizinprodukt",
    bf2Body:
      "Die Infografik ist konzeptionelle Architektur, keine EU-MDR-/FDA-Gerätebroschüre.",
    bf3Title: "3. Verbotene Ergebnisbehauptungen",
    bf3Body:
      "ANCAP behauptet keine garantierte Schwangerschaft. „Genetische Manipulationen“ sind keine CRISPR- oder Pathogenrezepte.",
    bf4Title: "4. Nur lizenzierte Betreiber",
    bf4Body:
      "Reproduktionsmedizin und BSL-Arbeit sind lizenzpflichtig. Keine Heim-ICSI-Rigs aus diesen Seiten.",
    bf5Title: "5. Screening und Recht",
    bf5Body:
      "Partnerprotokolle müssen ART-, Embryo-, GMO- und Biosafety-Recht einhalten.",
    bf6Title: "6. Keine medizinische Beratung",
    bf6Body:
      "Katalog und Infografiken sind informativ, keine Diagnose.",
    bf7Title: "7. Gesundheits- und Genetikdaten",
    bf7Body:
      "Identifikatoren sind sensibel. Keine Krankenakten ohne Rechtsgrundlage.",
    bf8Title: "8. Verhältnis zu anderen AETERNA-Schienen",
    bf8Body:
      "Organdruck, DPSC-Biomaterial und andere Schienen bleiben getrennt. BioFusion erlaubt kein DIY-CRISPR.",
    bf9Title: "9. Zahlungen",
    bf9Body:
      "ACP kauft ein Briefing und Partner-Matching. Erstattungen: /legal/refunds.",
    bf10Title: "10. Kontakt",
    bf10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#biofusion.",
    dpscLink: "DPSC-Biomaterial",
    hubCardDpsc:
      "Weisheitszahn-DPSC zu einem Biomaterial-Konstrukt: nur lizenzierter Bioreaktor, kein volles Organ.",
    dpscKicker: "Recht / Bioreaktor",
    dpscTitle: "Weisheitszahn-DPSC-Biomaterial — lizenzierte Bioreaktorschiene",
    dpscIntro:
      "Wie ANCAP autologes DPSC-Biomaterial zum 12. September 2026 rahmt.",
    dp1Title: "1. Plattformrolle",
    dp1Body:
      "ANCAP rechnet ACP ab und matcht Bioreaktoren. ANCAP zieht keine Zähne und kultiviert keine Zellen.",
    dp2Title: "2. Keine vermarktete Zelltherapie",
    dp2Body:
      "Kein FDA BLA, kein EMA ATMP, kein garantiertes Organ.",
    dp3Title: "3. Verbotene Ergebnisbehauptungen",
    dp3Body:
      "ANCAP behauptet kein fertiges Organ. Voller Organdruck bleibt 250.000 ACP.",
    dp4Title: "4. Nur lizenzierte Labore",
    dp4Body:
      "Keine Heimkultur von DPSC aus diesen Seiten.",
    dp5Title: "5. Einwilligung und Quelle",
    dp5Body:
      "Autologe Herkunft und zahnärztliche Einwilligung sind Pflicht.",
    dp6Title: "6. Keine medizinische Beratung",
    dp6Body:
      "Katalogtexte sind informativ.",
    dp7Title: "7. Gesundheitsdaten",
    dp7Body:
      "Dentale und zelluläre Identifikatoren sind sensibel.",
    dp8Title: "8. Verhältnis zum Organdruck",
    dp8Body:
      "DPSC ist auch Fallback für den 250.000-ACP-Organdruck. Dieses 65.000-ACP-SKU enthält kein Organ.",
    dp9Title: "9. Zahlungen",
    dp9Body:
      "ACP kauft ein Briefing. Erstattungen: /legal/refunds.",
    dp10Title: "10. Kontakt",
    dp10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#dpsc-biomaterial.",
    vascularPlusLink: "Vascular Care+",
    hubCardVascularPlus:
      "Wasserfreier N2+O2-Strom plus Lichtwelle: nur lizenzierter Phlebologie-/Ästhetikpartner. Keine Thrombosebehandlung, kein CE/FDA-Gerät.",
    vascularPlusKicker: "Recht / Phlebologie",
    vascularPlusTitle: "Vascular Care+ — lizenzierte Phlebologie-Partnerschiene",
    vascularPlusIntro:
      "Wie ANCAP Vascular Care+ zum 12. September 2026 rahmt. Diese Seiten verkaufen ACP-Kurzakten, keine Hardware.",
    vp1Title: "1. Plattformrolle",
    vp1Body: "ANCAP leistet ACP-Abrechnung, Kurzakten und Partnerzuordnung. ANCAP betreibt keine Venenkliniken und verkauft keine Medizingase.",
    vp2Title: "2. Kein Inverkehrbringen eines Produkts",
    vp2Body: "Die Infografik ist Konzeptarchitektur. Keine EU-MDR-/FDA-Broschüre.",
    vp3Title: "3. Verbotene Ergebnisaussagen",
    vp3Body: "ANCAP behauptet keine Krampfaderheilung, Ödemklärung oder Thrombosebehandlung.",
    vp4Title: "4. Nur lizenzierte Kliniker",
    vp4Body: "Gefäß- und Ästhetikakte sind klinisch. TVT und Lungenembolie bleiben Notfälle.",
    vp5Title: "5. Screening",
    vp5Body: "Partnerprotokolle müssen TVT, Implantate und Schwangerschaft prüfen.",
    vp6Title: "6. Keine medizinische Beratung",
    vp6Body: "Katalogtexte sind Information, keine Diagnose.",
    vp7Title: "7. Gesundheitsdaten",
    vp7Body: "Kennungen als sensibel behandeln.",
    vp8Title: "8. Verhältnis zu anderen Schienen",
    vp8Body: "Vascular Care und die transdermale Pistole bleiben getrennt.",
    vp9Title: "9. Zahlungen",
    vp9Body: "ACP kauft eine Kurzakte und Partnerzuordnung. Erstattungen: /legal/refunds.",
    vp10Title: "10. Kontakt",
    vp10Body: "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#vascular-care-plus.",
    vascularLink: "Vascular Care",
    hubCardVascular:
      "Ultraschall / RF / Wärme: nur lizenzierter Phlebologiepartner. Keine Chirurgie, kein CE/FDA-Gerät.",
    vascularKicker: "Recht / Phlebologie",
    vascularTitle: "Vascular Care — lizenzierte Phlebologie-Partnerschiene",
    vascularIntro: "Wie ANCAP Vascular Care zum 12. September 2026 rahmt.",
    vu1Title: "1. Plattformrolle",
    vu1Body: "ANCAP leistet ACP-Abrechnung, Kurzakten und Partnerzuordnung.",
    vu2Title: "2. Kein Inverkehrbringen eines Produkts",
    vu2Body: "Die Infografik ist Konzeptarchitektur.",
    vu3Title: "3. Verbotene Ergebnisaussagen",
    vu3Body: "ANCAP behauptet keinen garantierten Venendurchmesser.",
    vu4Title: "4. Nur lizenzierte Kliniker",
    vu4Body: "Ultraschall-, RF- und Wärmeakte sind klinisch.",
    vu5Title: "5. Screening",
    vu5Body: "Partnerprotokolle müssen Implantate, Schrittmacher und Schwangerschaft prüfen.",
    vu6Title: "6. Keine medizinische Beratung",
    vu6Body: "Katalogtexte sind Information.",
    vu7Title: "7. Gesundheitsdaten",
    vu7Body: "Kennungen als sensibel behandeln.",
    vu8Title: "8. Verhältnis zu anderen Schienen",
    vu8Body: "Vascular Care+ und die transdermale Pistole bleiben getrennt.",
    vu9Title: "9. Zahlungen",
    vu9Body: "ACP kauft eine Kurzakte und Partnerzuordnung.",
    vu10Title: "10. Kontakt",
    vu10Body: "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#vascular-care.",
    transdermalLink: "Transdermale Pistole",
    hubCardTransdermal:
      "Nadelfreies Aerosol plus Trägergas: nur lizenzierte Klinik. Kein Rezeptspender, kein Compounding.",
    transdermalKicker: "Recht / Klinik",
    transdermalTitle: "Nadelfreie transdermale Pistole — lizenzierte Klinikschiene",
    transdermalIntro: "Wie ANCAP die nadelfreie transdermale Pistole zum 12. September 2026 rahmt.",
    td1Title: "1. Plattformrolle",
    td1Body: "ANCAP leistet ACP-Abrechnung und Partnerzuordnung. ANCAP stellt keine Arzneimittel her.",
    td2Title: "2. Kein Inverkehrbringen eines Produkts",
    td2Body: "Die Infografik ist Konzeptarchitektur.",
    td3Title: "3. Verbotene Ergebnisaussagen",
    td3Body: "ANCAP behauptet keine garantierte Dosis oder Kosmetikwirkung.",
    td4Title: "4. Nur lizenzierte Kliniker",
    td4Body: "Transdermale Wirkstoffgabe ist ein klinischer Akt.",
    td5Title: "5. Zulässige Stoffe",
    td5Body: "Partnerprotokolle nutzen nur in der Klinikjurisdiktion zulässige Stoffe.",
    td6Title: "6. Keine medizinische Beratung",
    td6Body: "Katalogtexte sind Information.",
    td7Title: "7. Gesundheitsdaten",
    td7Body: "Kennungen als sensibel behandeln.",
    td8Title: "8. Verhältnis zu anderen Schienen",
    td8Body: "Vascular-Care-Schienen bleiben getrennt.",
    td9Title: "9. Zahlungen",
    td9Body: "ACP kauft eine Kurzakte und Partnerzuordnung.",
    td10Title: "10. Kontakt",
    td10Body: "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#transdermal.",
    mReceptorLink: "M-Rezeptor-Abo",
    hubCardMReceptor:
      "Lizenziertes Klinik-Abo für Pflaster, Iontophorese, Inhalator und vagusnahe Neuromodulation. Kein Compounding, kein CE/FDA-Gerät, keine Therapiebehauptung.",
    mReceptorKicker: "Recht / Klinik / Abo",
    mReceptorTitle: "M-Rezeptor-Lieferung im Abo — lizenzierte Klinikschiene",
    mReceptorIntro:
      "Wie ANCAP das multimodale M-Rezeptor-Abo zum 12. September 2026 rahmt. Diese Seiten verkaufen ACP-Perioden-Retainer, kein Hardware-Eigentum und kein Heimkit.",
    mr1Title: "1. Plattformrolle",
    mr1Body:
      "ANCAP bietet ACP-Settlement, Kurzakten und lizenzierte Partnerzuordnung. ANCAP fertigt keine Module und compoundiert keine muskarinischen Agonisten/Antagonisten.",
    mr2Title: "2. Kein vermarktetes Medizinprodukt",
    mr2Body: "Die Infografik ist Konzeptarchitektur, keine EU-MDR-/FDA-Broschüre.",
    mr3Title: "3. Verbotene Ergebnisaussagen",
    mr3Body:
      "ANCAP behauptet keine Behandlung von Parkinson, Asthma, COPD, Arrhythmie, Glaukom oder intraokularem Druck.",
    mr4Title: "4. Nur lizenzierte Kliniker",
    mr4Body: "Pflaster, Iontophorese, Inhalation und Neuromodulation sind klinische Akte. Keine Heimkits aus diesen Seiten bauen.",
    mr5Title: "5. Zulässige Stoffe und M1–M5-Literacy",
    mr5Body: "Die M1–M5-Tabelle ist Rezeptor-Literacy, kein Dosierleitfaden. ANCAP veröffentlicht keine Rezepturen.",
    mr6Title: "6. Keine medizinische Beratung",
    mr6Body: "Katalogtexte sind Information.",
    mr7Title: "7. Gesundheitsdaten",
    mr7Body: "Kennungen als sensibel behandeln.",
    mr8Title: "8. Verhältnis zu anderen Schienen",
    mr8Body: "Die transdermale Pistole und Vascular Care bleiben getrennt.",
    mr9Title: "9. Zahlungen",
    mr9Body:
      "ACP kauft einen Perioden-Retainer (12.000 / Monat, 32.000 / Quartal, 108.000 / Jahr) und eine Partnerzuordnung.",
    mr10Title: "10. Kontakt",
    mr10Body: "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#m-receptor.",
    oxygenCarrierLink: "Sauerstoffträger",
    hubCardOxygenCarrier:
      "Lizenziertes Bioreaktor-/Transfusionsmedizin-Briefing für Hämoglobin-Vesikel oder PFC-Emulsion. Kein Blutprodukt, kein Compounding, kein CE/FDA-Sauerstofftherapeutikum.",
    oxygenCarrierKicker: "Recht / Bioreaktor",
    oxygenCarrierTitle: "Künstlicher Sauerstoffträger — lizenzierte Bioreaktor-Schiene",
    oxygenCarrierIntro:
      "Wie ANCAP die Sauerstoffträger-SKU zum 12. September 2026 rahmt. Diese Seiten verkaufen ACP-Kurzakten, keine Blutprodukte.",
    ox1Title: "1. Plattformrolle",
    ox1Body: "ANCAP bietet ACP-Abrechnung, Kurzakten und Partnerzuordnung. ANCAP fertigt keine Hämoglobin-Vesikel oder PFC-Emulsionen.",
    ox2Title: "2. Kein Blutprodukt",
    ox2Body: "Die Infografik ist Konzeptarchitektur. Keine EU-MDR-/FDA-Broschüre.",
    ox3Title: "3. Verbotene Ergebnisaussagen",
    ox3Body: "ANCAP beansprucht keinen Transfusionsersatz und keine Anämiebehandlung.",
    ox4Title: "4. Nur lizenzierte Partner",
    ox4Body: "Jede Herstellung ist ein lizenzierter Bioreaktor-Akt. Keine Heim-Emulsionen.",
    ox5Title: "5. Infografik-Literacy, kein SOP",
    ox5Body: "Kern, Hülle, Puffer und QC sind Architektur-Literacy. ANCAP veröffentlicht keine Rezepturen.",
    ox6Title: "6. Keine medizinische Beratung",
    ox6Body: "Katalogtexte sind Information.",
    ox7Title: "7. Gesundheitsdaten",
    ox7Body: "Kennungen als sensibel behandeln.",
    ox8Title: "8. Verhältnis zu anderen Schienen",
    ox8Body: "Organdruck, DPSC, M-Rezeptor und Synthetisches Blut / Black Mamba bleiben getrennt. Siehe /legal/synthetic-blood-mamba.",
    ox9Title: "9. Zahlungen",
    ox9Body: "ACP kauft eine Kurzakte und Partnerzuordnung für 92.000 ACP.",
    ox10Title: "10. Kontakt",
    ox10Body: "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#oxygen-carrier.",
    syntheticBloodMambaLink: "Synthetisches Blut / Black Mamba",
    hubCardSyntheticBloodMamba:
      "Lizenziertes Bioreaktor-Briefing zur Synthetisches-Blut-Architektur mit Black-Mamba-Peptid-Literacy. Kein Blutprodukt, kein Gift-Compounding, kein CE/FDA-Therapeutikum.",
    syntheticBloodMambaKicker: "Recht / Bioreaktor",
    syntheticBloodMambaTitle: "Synthetisches Blut / Black Mamba — lizenzierte Bioreaktor-Schiene",
    syntheticBloodMambaIntro:
      "So rahmt ANCAP die Synthetisches-Blut- / Black-Mamba-SKU zum 12. September 2026. Diese Seiten verkaufen ACP-Briefings, keine Blutprodukte und keine Giftpeptide.",
    sbm1Title: "1. Plattformrolle",
    sbm1Body:
      "ANCAP bietet ACP-Abrechnung, Briefings und Partner-Matching. ANCAP stellt keine Hämoglobinvesikel, PFC-Emulsionen oder Giftpeptide her.",
    sbm2Title: "2. Kein Blutprodukt",
    sbm2Body:
      "Die Infografik ist konzeptionelle Architektur. Kein EU-MDR-/FDA-Prospekt und kein CE-markiertes Therapeutikum von ANCAP.",
    sbm3Title: "3. Verbotene Ergebnisversprechen",
    sbm3Body:
      "ANCAP behauptet nicht, Transfusionen zu ersetzen oder Vasodilatation, Antikoagulation, Neuroprotektion oder Langlebigkeit zu garantieren.",
    sbm4Title: "4. Nur lizenzierte Partner",
    sbm4Body:
      "Jede physische Herstellung oder klinische Nutzung ist ein lizenzierter Bioreaktor- / Transfusionsmedizin-Akt.",
    sbm5Title: "5. Infografik-Literacy, kein SOP",
    sbm5Body:
      "Kern, Hülle, Polymernetz, Black-Mamba-Peptid-Icons und 'kontrollierte Dosis'-Hinweise sind Architektur-Literacy. ANCAP veröffentlicht keine Toxin- oder HBOC/PFC-Rezepte.",
    sbm6Title: "6. Keine medizinische Beratung",
    sbm6Body:
      "Katalogtexte sind informativ. Keine Diagnose und kein Behandlungsplan.",
    sbm7Title: "7. Gesundheitsdaten",
    sbm7Body:
      "Identifikatoren und klinische Historie als sensibel behandeln.",
    sbm8Title: "8. Bezug zu anderen Schienen",
    sbm8Body:
      "Die Sauerstoffträger-SKU (92.000 ACP) bleibt getrennt.",
    sbm9Title: "9. Zahlungen",
    sbm9Body:
      "ACP kauft ein Briefing und Partner-Match für 98.000 ACP — keine Bluteinheit. Erstattungen: /legal/refunds.",
    sbm10Title: "10. Kontakt",
    sbm10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#synthetic-blood-mamba.",
    footerSyntheticBloodMamba: "Synthetisches Blut / Black Mamba",

    adhdSupportLink: "ADHS-Unterstützung",
    hubCardAdhdSupport:
      "Partnerbrief eines lizenzierten Klinikers zur ADHS-Unterstützung. Keine Diagnose, kein Rezept, kein Stimulanzien-Compounding, kein garantiertes Schul- oder Finanzergebnis.",
    adhdSupportKicker: "Recht / Kliniker / ADHS-Unterstützungsliteralität",
    adhdSupportTitle: "ADHS-Unterstützung — lizenzierte Kliniker-Schiene",
    adhdSupportIntro:
      "Wie ANCAP die ADHS-Unterstützungs-SKU zum 13. September 2026 rahmt. Diese Seiten verkaufen ACP-Briefs, keine Diagnosen, Rezepte, Stimulanzien oder einen garantierten Reichtumspfad.",
    adhd1Title: "1. Plattformrolle",
    adhd1Body:
      "ANCAP bietet ACP-Abrechnung, Briefs und Partner-Matching. ANCAP diagnostiziert kein ADHS, verschreibt nicht und praktiziert keine Kinderpsychiatrie oder Neurologie.",
    adhd2Title: "2. Keine Diagnose, keine Behandlung",
    adhd2Body:
      "Die Infografik ist Motivations- und Bildungsliteralität. Kein klinischer Leitfaden und keine Behandlung von ANCAP.",
    adhd3Title: "3. Verbotene Ergebnisversprechen",
    adhd3Body:
      "ANCAP garantiert keine Ruhe, Noten, Karriere oder Milliardärsstatus. Die „Milliardärs“-Treppe ist nur Motivationsliteralität.",
    adhd4Title: "4. Nur lizenzierte Kliniker",
    adhd4Body:
      "Jede Beurteilung, Therapie oder Medikamentenentscheidung ist eine Handlung eines lizenzierten Klinikers nach Screening.",
    adhd5Title: "5. Infografik-Literalität, kein Protokoll",
    adhd5Body:
      "Fokus, Planung, Emotionen, Beziehungen, Selbstwert und Risiken sind Unterstützungsliteralität. ANCAP veröffentlicht keine Stimulanzien-Dosierung oder Therapie-SOPs.",
    adhd6Title: "6. Keine medizinische Beratung",
    adhd6Body:
      "Katalogtexte sind informativ. Keine Diagnose, kein Rezept, kein Behandlungsplan.",
    adhd7Title: "7. Gesundheits- und Kinderdaten",
    adhd7Body:
      "Kennungen und klinische Historie sind sensibel. Keine Uploads ohne Rechtsgrundlage.",
    adhd8Title: "8. Verhältnis zu anderen Schienen",
    adhd8Body:
      "Longevity-Schienen bleiben getrennt. Diese SKU autorisiert kein Compounding.",
    adhd9Title: "9. Zahlungen",
    adhd9Body:
      "ACP kauft Brief und Partner-Match für 42.000 ACP. Rückerstattungen: /legal/refunds.",
    adhd10Title: "10. Kontakt",
    adhd10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#adhd-support.",
    footerAdhdSupport: "ADHS-Unterstützung",

    pulmopureLink: "PulmoPure",
    hubCardPulmopure:
      "Lizenziertes Pneumologie-Abo für PulmoPure-Gasvibrations-Literalität. Kein CE/FDA-Gerät, keine Ozontherapie, keine garantierten sauberen Lungen.",
    pulmopureKicker: "Recht / Pneumologie",
    pulmopureTitle: "PulmoPure — lizenzierte Pneumologie-Abo-Schiene",
    pulmopureIntro:
      "Wie ANCAP die PulmoPure-Abo-SKU zum 13. September 2026 rahmt.",
    pp1Title: "1. Plattformrolle",
    pp1Body:
      "ANCAP bietet ACP-Abrechnung und Partner-Matching. ANCAP stellt PulmoPure nicht her und praktiziert keine Pneumologie.",
    pp2Title: "2. Kein hier verkauftes Medizinprodukt",
    pp2Body:
      "Die Infografik ist konzeptuelle Architektur. Keine CE/FDA-Broschüre von ANCAP.",
    pp3Title: "3. Verbotene Ergebnisversprechen",
    pp3Body:
      "ANCAP garantiert keine Teerklärung oder Hustenreduktion.",
    pp4Title: "4. Ozon und Medizingase",
    pp4Body:
      "Gasgemische auf der Grafik sind Partnerprotokoll-Literalität. ANCAP verkauft keine Ozontherapie.",
    pp5Title: "5. Nur lizenzierte Kliniker",
    pp5Body:
      "Sitzungen nur unter lizenziertem Kliniker nach Screening.",
    pp6Title: "6. Modi und Lieferumfang",
    pp6Body:
      "Soft / Standard / Intensiv sind Paket-Literalität.",
    pp7Title: "7. Keine medizinische Beratung",
    pp7Body:
      "Katalogtexte sind informativ.",
    pp8Title: "8. Verhältnis zu anderen Schienen",
    pp8Body:
      "M-Rezeptor und Sauerstoffträger bleiben getrennt.",
    pp9Title: "9. Zahlungen",
    pp9Body:
      "ACP kauft Abo-Brief für 14.000 ACP / Monat. Rückerstattungen: /legal/refunds.",
    pp10Title: "10. Kontakt",
    pp10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /aeterna#pulmopure.",
    footerPulmopure: "PulmoPure",

    barsukLink: "Project Barsuk",
    hubCardBarsuk:
      "Lizenzierter Secure-Comms-Partnerbrief zur Barsuk-Quantenstift-Literalität. Kein Parker-Produkt, keine Waffe, keine unknackbare Krypto.",
    barsukKicker: "Recht / Secure-Comms",
    barsukTitle: "Project-Barsuk-Quantenstift — lizenzierte Secure-Comms-Schiene",
    barsukIntro: "Wie ANCAP die Barsuk-SKU zum 13. September 2026 einordnet.",
    bk1Title: "1. Plattformrolle",
    bk1Body: "ANCAP stellt ACP-Abrechnung und Partner-Match bereit. Keine Parker-Affiliation.",
    bk2Title: "2. Kein Parker- oder CE/FDA-Produkt",
    bk2Body: "Infografik ist Fiktions-/Architekturliteralität.",
    bk3Title: "3. Verbotene Ergebniszusagen",
    bk3Body: "Keine unknackbare Krypto-Behauptung.",
    bk4Title: "4. Keine Waffe",
    bk4Body: "Keine Waffensystem-Autorisierung.",
    bk5Title: "5. Nur lizenzierte Partner",
    bk5Body: "Hardware-Bewertung nur beim Partner nach Screening.",
    bk6Title: "6. Infografik-Literalität",
    bk6Body: "Kein Fertigungs-SOP.",
    bk7Title: "7. Keine Rechtsberatung",
    bk7Body: "Katalogtexte sind informativ.",
    bk8Title: "8. Bezug zu anderen Schienen",
    bk8Body: "Perimeter bleibt getrennt.",
    bk9Title: "9. Zahlungen",
    bk9Body: "ACP kauft Brief für 36.000 ACP. Rückerstattungen: /legal/refunds.",
    bk10Title: "10. Kontakt",
    bk10Body: "legal@ancap.cloud · /aeterna#barsuk",
    footerBarsuk: "Project Barsuk",

    teleportEarphonesLink: "Teleport-Ohrhörer",
    hubCardTeleportEarphones:
      "Partnerbrief AIRPODS T-2026 Medevac-Fiktion. Kein Apple-Produkt, kein echter Teleporter, kein Militärwaffensystem.",
    teleportEarphonesKicker: "Recht / Medevac-Fiktion",
    teleportEarphonesTitle: "Teleport-Ohrhörer — lizenzierte Medevac-Fiktions-Schiene",
    teleportEarphonesIntro: "Wie ANCAP die Teleport-Ohrhörer-SKU zum 13. September 2026 einordnet.",
    tp1Title: "1. Plattformrolle",
    tp1Body: "ANCAP stellt ACP und Partner-Match bereit. Keine Apple-Affiliation.",
    tp2Title: "2. Kein Apple-Produkt",
    tp2Body: "AIRPODS T-2026 ist Fiktionsbranding.",
    tp3Title: "3. Kein echter Teleporter",
    tp3Body: "Reichweiten auf der Infografik sind Sci-Fi-Literalität.",
    tp4Title: "4. Kein Militärwaffensystem",
    tp4Body: "Fokus: Rettung / Medevac, nicht Offensive.",
    tp5Title: "5. Nur lizenzierte Partner",
    tp5Body: "Bewertung nur beim Partner nach Screening.",
    tp6Title: "6. Infografik-Literalität",
    tp6Body: "Kein Fertigungs-SOP.",
    tp7Title: "7. Keine medizinische Beratung",
    tp7Body: "Texte sind Fiktionsliteralität.",
    tp8Title: "8. Bezug zu anderen Schienen",
    tp8Body: "Humanitäre Schiene bleibt getrennt.",
    tp9Title: "9. Zahlungen",
    tp9Body: "ACP kauft Brief für 58.000 ACP. Rückerstattungen: /legal/refunds.",
    tp10Title: "10. Kontakt",
    tp10Body: "legal@ancap.cloud · /aeterna#teleport-earphones",
    footerTeleportEarphones: "Teleport-Ohrhörer",

    installationProjectLink: "Installationsprojekt",
    hubCardInstallationProject:
      "Lizenziertes Neonatologie-/Ernährungs-Partnerbriefing. Keine Säuglingsnahrung von ANCAP, kein Heim-HBO, keine Erfolgsgarantie.",
    installationProjectKicker: "Recht / Neonatologie / Säuglingsernährung",
    installationProjectTitle: "Installationsprojekt — lizenzierte neonatale Schiene",
    installationProjectIntro:
      "Wie ANCAP die SKU Installationsprojekt zum 13. September 2026 rahmt. Diese Seiten verkaufen ACP-Partnerbriefs, keine Säuglingsnahrung und kein CE/FDA-Druckkammergerät.",
    ip1Title: "1. Plattformrolle",
    ip1Body:
      "ANCAP stellt ACP-Settlement, Briefings und Partner-Matching bereit. ANCAP stellt keine Säuglingsnahrung her und praktiziert keine Neonatologie.",
    ip2Title: "2. Keine ANCAP-Säuglingsnahrung",
    ip2Body:
      "Zusammensetzung und Non-GMO-Framing auf der Infografik sind Partnerliteralität — kein vermarktetes ANCAP-Formula-SKU.",
    ip3Title: "3. Kein CE/FDA-Druckkammergerät",
    ip3Body:
      "1,5–2,0 ATA und 36–37 °C sind Architekturliteralität. ANCAP verkauft keine freigegebene Druckkammer.",
    ip4Title: "4. Verbotene Outcome-Claims",
    ip4Body:
      "ANCAP garantiert keine Reduktion von Rachitis, Anämie oder Entwicklungsverzögerung.",
    ip5Title: "5. Nur lizenzierte Partner",
    ip5Body:
      "Produktion und klinische Sitzungen sind Partnerakte nach Screening.",
    ip6Title: "6. GMP-Literalität, kein ANCAP-Zertifikat",
    ip6Body:
      "GMP-Hinweise beschreiben Partnererwartungen, keine ANCAP-Zulassung.",
    ip7Title: "7. Keine medizinische Beratung",
    ip7Body:
      "Katalogtext ist Architekturliteralität, kein Rezept.",
    ip8Title: "8. Versicherungsbezug",
    ip8Body:
      "Coverage-Klasse neonatal_install auf /insurance kann Installationsprojekt-Intakes referenzieren. Keine Malpractice-Police.",
    ip9Title: "9. Zahlungen",
    ip9Body:
      "ACP kauft ein Briefing für 72.000 ACP. Rückerstattungen: /legal/refunds.",
    ip10Title: "10. Kontakt",
    ip10Body:
      "legal@ancap.cloud · /aeterna#installation-project · /insurance",
    footerInstallationProject: "Installationsprojekt",

    dnaPheromonePerfumeLink: "DNA-Pheromon-Parfuem",
    hubCardDnaPheromonePerfume: "Pro Flasche: DNA-abgestimmter Pheromonduft ueber lizenzierten Kosmetikpartner — kein Arzneimittel, kein Aphrodisiakum-Claim.",
    dnaPheromonePerfumeKicker: "Recht / kosmetische Duft-Literalitaet",
    dnaPheromonePerfumeTitle: "DNA-abgestimmtes Pheromon-Parfuem — Rechtshinweis",
    dnaPheromonePerfumeIntro: "13. September 2026. Verkaufseinheit ist eine Flasche (8.900 ACP).",
    ppf1Title: "1. Plattformrolle",
    ppf1Body: "ANCAP settelt ACP und stellt einen Handoff an einen lizenzierten Kosmetik-/Duftpartner aus. Abfuellung bleibt beim Partner.",
    ppf2Title: "2. DNA-Matching",
    ppf2Body: "Optionaler DNA-Vault-Hash kann olfaktorische Profil-Literalitaet informieren. Genombytes werden nicht hochgeladen.",
    ppf3Title: "3. Verkaufseinheit",
    ppf3Body: "Jede Bestellung gilt fuer genau eine Flasche. Weitere Flaschen erfordern neue Auftraege.",
    ppf4Title: "4. Kein Arzneimittel",
    ppf4Body: "Keine Medizin, keine CE/FDA-Pheromontherapie, kein Compounding kontrollierter Stoffe.",
    ppf5Title: "5. Kein Aphrodisiakum-Claim",
    ppf5Body: "ANCAP verspricht keine garantierte Anziehung, Beziehung oder sexuelle Wirkung.",
    ppf6Title: "6. Partner-Screening",
    ppf6Body: "Duftpartner muessen ANCAP-Screening vor dem Handoff bestehen.",
    ppf7Title: "7. Hautsicherheit",
    ppf7Body: "Patch-Test und Inhaltsstoffe bleiben beim lizenzierten Partner nach lokalem Kosmetikrecht.",
    ppf8Title: "8. Minderjaehrige",
    ppf8Body: "Nicht fuer Kinder. Lokale Altersregeln fuer Parfuemkauf gelten.",
    ppf9Title: "9. Rueckerstattungen",
    ppf9Body: "ACP folgt der ANCAP-Refund-Policy nach Start der Abfuellung; ungenutzte Draft-Intents koennen storniert werden.",
    ppf10Title: "10. Kontakt",
    ppf10Body: "Fragen: legal@ancap.cloud. Produkt: /aeterna#dna-pheromone-perfume.",

    counselLink: "Weltweite Counsel",
    hubCardCounsel: "ACP-Rechtsbriefs und Matching zu lizenziertem Counsel in jedem abgedeckten Land — ANCAP ist keine Kanzlei.",
    counselKicker: "Recht / weltweiter Counsel-Desk",
    counselTitle: "Weltweite Rechtsdienstleistungen — Rechtshinweis",
    counselIntro: "14. September 2026. ANCAP praktiziert kein Recht und begruendet kein Anwalt-Mandanten-Verhaeltnis.",
    cn1Title: "1. Plattformrolle",
    cn1Body: "ANCAP settelt ACP fuer Jurisdiktions-Match- und Intake-Briefs und stellt einen Handoff an unabhaengigen lizenzierten Counsel aus.",
    cn2Title: "2. Kein Anwalt-Mandanten-Verhaeltnis mit ANCAP",
    cn2Body: "ACP-Zahlung begruendet kein Anwalt-Mandanten-Verhaeltnis mit ANCAP, Betreibern oder KI-Systemen.",
    cn3Title: "3. Unabhaengigkeit lokaler Anwaelte",
    cn3Body: "Gematchter Counsel bleibt unabhaengig und setzt Mandatsvertraege, Folgehonorare und Beratung nach lokalen Berufsregeln.",
    cn4Title: "4. Weltweite Abdeckung",
    cn4Body: "Der Desk strebt Matching in jedem auf /counsel gelisteten Land oder Region an.",
    cn5Title: "5. Keine Rechtsberatung durch ANCAP",
    cn5Body: "Katalogtexte und Workflow-Artefakte sind Literacy/Intake — keine Rechtsberatung.",
    cn6Title: "6. Keine Ergebnisgarantie",
    cn6Body: "ANCAP garantiert keine Visa, Gesellschaftsgruendungen, Urteile oder Steuerpositionen.",
    cn7Title: "7. Sanktionen und Konflikte",
    cn7Body: "Klient und Counsel fuehren eigene Sanktions- und Konfliktpruefungen durch.",
    cn8Title: "8. Vertraulichkeit",
    cn8Body: "Laden Sie keine privileged Dokumente in ANCAP-Workflows ohne Anweisung Ihres Counsel.",
    cn9Title: "9. Honorare",
    cn9Body: "ACP-Preise auf /counsel decken Desk-Brief und Handoff. Folgehonorare sind separat.",
    cn10Title: "10. Kontakt",
    cn10Body: "Fragen: legal@ancap.cloud. Produkt: /counsel.",

    
    darkMatterLink: "Dunkle-Materie-Auktion",
    hubCardDarkMatter: "Symbolische ACP-Kosmologie-Titel für Halo/Filament/Detektor-Literacy — kein physisches DM-Eigentum.",
    darkMatterKicker: "Rechtliches / Dunkle-Materie-Auktion",
    darkMatterTitle: "Dunkle-Materie-Auktion — rechtlicher Hinweis",
    darkMatterIntro: "14. September 2026. ANCAP-Dunkle-Materie-Lose sind nur symbolische ACP-Titel-RFQs und Kosmologie-Literacy.",
    dm1Title: "1. Plattformrolle",
    dm1Body: "ANCAP verrechnet ACP-Gebote für symbolische Dunkle-Materie-Titel und Detektor-/Kosmologie-Briefs. ANCAP verkauft oder überträgt keine physische dunkle Materie.",
    dm2Title: "2. Kein physisches Eigentum",
    dm2Body: "Ein Gewinngebot begründet kein Eigentum, Besitz, Verwahrung oder Extraktionsrechte an physischer dunkler Materie.",
    dm3Title: "3. Outer Space Treaty / Souveränität",
    dm3Body: "Lose verleihen keine Souveränität, Gebietsansprüche oder Rechte nach dem Outer Space Treaty.",
    dm4Title: "4. Kein Detektionszertifikat",
    dm4Body: "Katalogtexte und Gebotsbelege sind keine wissenschaftlichen Detektionszertifikate oder Lab-Buchungen.",
    dm5Title: "5. Detektor-Partner",
    dm5Body: "Detektor-Lose sind nur Literacy/Handoff. Lizenzierte Laborpartner bleiben unabhängig.",
    dm6Title: "6. Keine Ergebnisgarantie",
    dm6Body: "ANCAP garantiert keine Entdeckungen, Detektor-Expositionen, Publikationen oder Renditen.",
    dm7Title: "7. Verwandte Desks",
    dm7Body: "Körper-/Strahlungs-Titel: /galaxy. Dunkle-Materie-Kosmologie: /dark-matter.",
    dm8Title: "8. Versicherung",
    dm8Body: "Optionale parametrische Deckung dark_matter_title über /insurance. Policen schaffen kein physisches DM-Eigentum.",
    dm9Title: "9. Rückerstattungen",
    dm9Body: "ACP-Abrechnung folgt der ANCAP-Refund-Policy; siehe /legal/refunds.",
    dm10Title: "10. Kontakt",
    dm10Body: "Fragen: legal@ancap.cloud. Produkt: /dark-matter.",

    stardustLink: "Stardust Wetterkontrolle",
    hubCardStardust:
      "ACP-Partnerbriefs für weltweite Wetterkontrolle. Keine Live-Geoengineering-Konsole, keine Erfolgsgarantie.",
    stardustKicker: "Recht / Wetterkontrolle / Erdmonitoring",
    stardustTitle: "StardustSRT Wetterkontrolle — lizenzierte Partnerschiene",
    stardustIntro:
      "Wie ANCAP den Stardust-Desk zum 13. September 2026 rahmt.",
    sd1Title: "1. Plattformrolle",
    sd1Body: "ANCAP stellt ACP-Settlement und Partner-Matching bereit — keine nationale Wetterbehörde.",
    sd2Title: "2. Keine Default-Affiliation mit StardustSRT",
    sd2Body: "Öffentliche StardustSRT-Materialien sind Literalität; Affiliation nur per Vertrag.",
    sd3Title: "3. Keine Live-Weather-Control-Konsole",
    sd3Body: "Schalter auf /stardust sind Produktliteralität.",
    sd4Title: "4. Verbotene Outcome-Claims",
    sd4Body: "Keine Garantie für Regen, schwächere Stürme oder Klimaoutcomes.",
    sd5Title: "5. Keine offiziellen Wetterwarnungen",
    sd5Body: "Kritische Entscheidungen: AccuWeather oder nationale Behörden.",
    sd6Title: "6. Nur lizenzierte Partner",
    sd6Body: "Wetteroperationen sind Partnerakte nach Screening.",
    sd7Title: "7. Infografik, kein Ops-SOP",
    sd7Body: "Architekturliteralität, keine Waffen-SOPs.",
    sd8Title: "8. Versicherung",
    sd8Body: "Coverage-Klasse weather_control auf /insurance kann Stardust-Intakes referenzieren.",
    sd9Title: "9. Zahlungen",
    sd9Body:
      "Weather-Control-Preise sind Auktion auf /tech. Eröffnungsfloors: 18.000 / 28.000 / 58.000 / 45.000 ACP. Gebote über AuctionEscrow — kein Festpreis-Checkout und keine Wettergarantie.",
    sd10Title: "10. Kontakt",
    sd10Body: "legal@ancap.cloud · /stardust · /insurance",
    footerStardust: "Stardust Wetterkontrolle",


    hubCardRefunds: "Wann Belastungen endgültig sind und wie Sie eine Prüfung anfordern.",
    hubCardWelcomeGrant:
      "100 ACP bei der Registrierung ist ein Promo-Zugangskredit (nominelles $100-Label), keine Spende, keine USD-Auszahlung, nicht steuerlich absetzbar.",
    hubCardHumanitarian:
      "ACP-Briefings zu Nahrung, Wasser, Ernährung, warmer Kleidung, Medizinprodukten und Existenzsicherung — Desk-Listings von Rotkreuz-/Rothalbmond-Gesellschaften, kein unterzeichneter IKRK/IFRK-Vertrag und keine 135-FZ-Wohltätigkeitsorganisation.",
    hubCardCyber: "Öffentliche Unterstützung kollektiver Cyberabwehr.",
    hubCardClarity: "Volle Zustimmung zum U.S. Digital Asset Market Clarity Act (CLARITY Act).",
    hubCardCompliance: "MiCA-sichere Botschaften und On-Ramp-/Bridge-Hinweise.",
    hubContactTitle: "Kundenkontakte",
    hubContactBody: "Rechtliches: legal@ancap.cloud. Datenschutz: privacy@ancap.cloud. Support: support@ancap.cloud. Datenschutzanfragen bestätigen wir nach Möglichkeit innerhalb von 30 Tagen.",
    hubDisclaimer: "Diese Seiten sind die aktuellen kundenbezogenen Rechtshinweise von ancap.cloud. Sie ersetzen keine individuelle Rechts- oder Steuerberatung. Zwingende Verbraucherrechte bleiben unberührt.",
    termsKicker: "Rechtliche Vereinbarung",
    termsTitle: "ANCAP-Nutzungsvereinbarung",
    termsIntro: "Diese Bedingungen regeln den Zugang zu ancap.cloud und zugehörigen ANCAP-Diensten. Mit Kontoerstellung, Wallet-Verbindung, Kauf/Ausführung von Workflows, Listing, API-Nutzung oder sonstiger Nutzung stimmen Sie zu.",
    t1Title: "1. Parteien und Annahme",
    t1Body: "Diese Bedingungen sind eine Vereinbarung zwischen Ihnen und dem ANCAP-Plattformbetreiber von ancap.cloud. Handeln Sie für eine Organisation, bestätigen Sie Ihre Vertretungsbefugnis.",
    t2Title: "2. Betreiber und Mitteilungen",
    t2Body: "Dienste werden vom ANCAP-Betreiber über ancap.cloud betrieben. Kontakte: legal@ancap.cloud, privacy@ancap.cloud, support@ancap.cloud. Handelsregisterdaten werden im Rechtszentrum veröffentlicht, sobald verfügbar.",
    t3Title: "3. Berechtigung",
    t3Body: "Sie müssen geschäftsfähig sein und dürfen ANCAP nicht nutzen, wenn Recht, Sanktionen oder Plattformregeln dies verbieten.",
    t4Title: "4. Dienste",
    t4Body: "ANCAP stellt Software-Infrastruktur für bezahlte KI-Workflows, Listings, Creator-Tools, ACP-Wallet/Accounting, Paid APIs und Proof-Belege bereit. ANCAP ist keine Bank und kein Investmentfonds.",
    t5Title: "5. ACP, Guthaben, Zahlungen und Erstattungen",
    t5Body: "ACP ist die primäre Abrechnungseinheit. Sofern nichts anderes gilt, wird ein Workflow-Kauf mit Ausführungsbeginn verbraucht. Details siehe Seite Zahlungen & Erstattungen.",
    t6Title: "6. KI-Ausgaben und Prüfpflicht",
    t6Body: "KI-Ausgaben können falsch sein. ANCAP verkauft Ausführungsartefakte, keine Anlage-, Rechts- oder Steuerberatung. Prüfen Sie Ergebnisse vor Nutzung.",
    t7Title: "7. Creator-Listings",
    t7Body: "Creator können Angebote einreichen. ANCAP darf prüfen, ablehnen, aussetzen oder entfernen. Creator haften für Rechtmäßigkeit ihrer Listings.",
    t8Title: "8. API-Nutzung",
    t8Body: "API-Nutzer müssen Schlüssel schützen und Limits einhalten. ANCAP kann riskante Anfragen drosseln oder sperren.",
    t9Title: "9. Verbotenes Verhalten",
    t9Body: "Kein Betrug, Sanktionsumgehung, Geldwäsche, Angriffe, Malware, Datenschutz-/IP-Verletzungen, Marktmanipulation oder unbefugter Zugriff.",
    t10Title: "10. Geistiges Eigentum",
    t10Body: "ANCAP behält Rechte an Plattform und Marke. Sie behalten Rechte an rechtmäßigen Inputs und erteilen ANCAP die für den Betrieb nötige Lizenz.",
    t11Title: "11. Datenschutz, Cookies und Daten",
    t11Body: "Personenbezogene Daten und Cookies unterliegen dem Datenschutzhinweis und der Cookie-Richtlinie.",
    t12Title: "12. Haftungsausschlüsse und Haftungsbegrenzung",
    t12Body: "Soweit gesetzlich zulässig, erfolgen Dienste „wie besehen“. Die Gesamthaftung von ANCAP ist auf den höheren Betrag begrenzt: (a) Gebühren der letzten 3 Monate für die betroffene Funktion oder (b) EUR 100 — außer wo Haftung nicht beschränkt werden darf.",
    t13Title: "13. Aussetzung und Kündigung",
    t13Body: "ANCAP kann Zugang aus Sicherheits-, Missbrauchs-, Zahlungs- oder Rechtsgründen aussetzen. Sie können die Nutzung jederzeit beenden, vorbehaltlich offener Pflichten.",
    t14Title: "14. Änderungen",
    t14Body: "ANCAP kann diese Bedingungen aktualisieren. Fortgesetzte Nutzung nach dem Wirksamkeitsdatum gilt als Annahme, soweit zwingendes Recht nichts anderes verlangt.",
    t15Title: "15. Kollektive Cyberabwehr",
    t15Body: "ANCAP stimmt dem OpenAI-Offenen Brief zur kollektiven Cyberabwehr zu. Offensive Cyberhilfe liegt außerhalb des Produkts.",
    t16Title: "16. Risikoanerkennung",
    t16Body: "Mit Nutzung erkennen Sie den Risikohinweis an. Keine Rendite- oder Kursversprechen.",
    t17Title: "17. Anwendbares Recht und Streitigkeiten",
    t17Body: "Es gilt das auf den ANCAP-Betreiber von ancap.cloud anwendbare Recht. Vor Klage: legal@ancap.cloud.",
    t18Title: "18. Kontakt und zwingende Rechte",
    t18Body: "Fragen: legal@ancap.cloud. Support: support@ancap.cloud. Zwingende Verbraucherrechte bleiben unberührt.",
    t19Title: "19. CLARITY Act — volle Zustimmung",
    t19Body: "ANCAP erklärt die volle Zustimmung zu den Zielen des Digital Asset Market Clarity Act (CLARITY Act / H.R. 3633). Öffentliche Politikstellungnahme, kein Anspruch auf bereits erlassenes Gesetz. Siehe CLARITY-Act-Seite.",
    t20Title: "20. Longevity-, Organdruck- und Veterinärschienen",
    t20Body:
      "AETERNA- und Kryo-Workflows verkaufen Analysen, Briefings und lizenzierte Partner-Übergaben. Sie sind keine medizinische oder veterinärmedizinische Behandlung, keine in Verkehr gebrachten Medizinprodukte und kein Versprechen, dass Organe gedruckt oder Gewebe wiederbelebt werden. ANCAP darf nicht genutzt werden, um Nasslabor-Protokolle, CRISPR-Designs, Gensynthese, LNP-Rezepte oder unlizenzierte Eingriffe an Mensch oder Tier zu erhalten. Siehe /legal/vet-regen.",
    t21Title: "21. Humanitärer Hilfsdesk",
    t21Body:
      "Der Desk /humanitarian verkauft ACP-Briefings und Partner-Übergaben (Nahrung, Wasser, Ernährung, warme Kleidung, Medizinprodukte über lizenzierte Kanäle, Existenzsicherung). ANCAP ist keine gemeinnützige Organisation nach RF 135-FZ und keine steuerbefreite Charity in EU/UK/US. Ein Listing von IFRK oder einer nationalen Rotkreuzgesellschaft ist keine unterzeichnete Partnerschaft und keine Emblem-Lizenz. ACP auf diesem Desk ist keine steuerlich absetzbare Spende, solange eine anerkannte Empfängerin keine Zuwendungsbestätigung ausstellt. Getrennt vom 100-ACP-Willkommenszuschuss. Siehe /legal/humanitarian.",
    privacyKicker: "Datenschutzhinweis",
    privacyTitle: "Wie ANCAP Kundendaten verarbeitet",
    privacyIntro: "Dieser Hinweis erklärt die Verarbeitung personenbezogener Daten durch den ANCAP-Betreiber von ancap.cloud.",
    p1Title: "1. Verantwortlicher und Kontakte",
    p1Body: "Verantwortlicher: ANCAP-Plattformbetreiber von ancap.cloud. privacy@ancap.cloud · legal@ancap.cloud · support@ancap.cloud.",
    p2Title: "2. Verarbeitete Daten",
    p2Body: "Kontodaten, Sitzungen, Wallet-Adressen, Zahlungs-/API-Metadaten, Workflow-Ein-/Ausgaben, Belege, Logs, Cookies und Einwilligungen.",
    p3Title: "3. Zwecke und Rechtsgrundlagen",
    p3Body: "Vertragserfüllung, berechtigte Interessen (Sicherheit/Betrugsschutz), Einwilligung für optionale Analyse, rechtliche Pflichten.",
    p4Title: "4. Krypto, Proofs und öffentliche Daten",
    p4Body: "Blockchain- und Proof-Daten können öffentlich und nicht löschbar sein.",
    p5Title: "5. KI-Anbieter",
    p5Body: "Workflow-Eingaben können an konfigurierte LLM-Anbieter gehen. Keine hochsensiblen Daten ohne Freigabe senden.",
    p6Title: "6. Aufbewahrung",
    p6Body: "Aufbewahrung so lange wie für Betrieb, Buchhaltung, Streitigkeiten und Recht nötig; danach Löschung/Anonymisierung soweit möglich.",
    p7Title: "7. Ihre Rechte",
    p7Body: "Je nach Recht: Auskunft, Berichtigung, Löschung, Einschränkung, Portabilität, Widerspruch. Kontakt: privacy@ancap.cloud.",
    p8Title: "8. Internationale Übermittlungen",
    p8Body: "Anbieter können Daten in anderen Ländern verarbeiten; wo nötig mit geeigneten Garantien.",
    privacySecurityTitle: "Sicherheit und kollektive Cyberabwehr",
    privacySecurityBody: "ANCAP verarbeitet Security-Logs zur Missbrauchsabwehr. Details:",
    privacyContactTitle: "Rechte ausüben",
    privacyContactBody: "E-Mail an privacy@ancap.cloud. Antwortziel: 30 Tage, soweit gesetzlich vorgesehen.",
    cookiesKicker: "Cookie-Richtlinie",
    cookiesTitle: "Cookie- und Speichereinstellungen",
    cookiesIntro: "ANCAP nutzt ein Einwilligungsbanner mit gleicher Möglichkeit zum Annehmen, Ablehnen oder Anpassen optionaler Speicherung.",
    c1Title: "Unbedingt erforderlich",
    c1Examples: "Einwilligungsspeicher, Login/Sitzung, Security, Wallet-Status, Sprache, Theme.",
    c1Consent: "Ohne optionale Einwilligung, soweit für den Betrieb nötig.",
    c2Title: "Analyse",
    c2Examples: "Funnels, Performance, Fehlerdiagnostik, Workflow-Konversion.",
    c2Consent: "Standardmäßig aus; nur nach Einwilligung, wo erforderlich.",
    c3Title: "Marketing und Attribution",
    c3Examples: "Kampagnenquelle, Referral, Partnercode.",
    c3Consent: "Standardmäßig aus; nur nach Einwilligung, wo erforderlich.",
    cookiesExamples: "Beispiele:",
    cookiesConsent: "Einwilligung:",
    cookiesRegTitle: "Regulatorische Hinweise",
    cookiesRegBody: "EU/UK unterscheiden grundsätzlich notwendige Speicherung von optionaler Analyse/Marketing.",
    cookiesEc: "European Commission cookie policy example",
    cookiesEdpb: "EDPB consent guidelines",
    riskKicker: "Kundenhinweis",
    riskTitle: "Risikohinweis für ANCAP-Kunden",
    riskIntro: "Bitte vor Workflow-Kauf, ACP-Salden oder KI-Nutzung lesen.",
    r1Title: "1. Kein Anlageprodukt",
    r1Body: "ACP ist eine Utility-/Abrechnungseinheit. Keine Kurs- oder Renditeversprechen.",
    r2Title: "2. KI-Ausgaberisiko",
    r2Body: "Ergebnisse können falsch sein und ersetzen keine professionelle Beratung.",
    r3Title: "3. Wallet-Risiko",
    r3Body: "Verlust von Seed/Keys kann endgültigen Verlust bedeuten.",
    r4Title: "4. Bridge und Drittschienen",
    r4Body: "Bridges und Zahlungsrails tragen Smart-Contract-, Custody- und Gegenparteirisiken.",
    r5Title: "5. Verfügbarkeit",
    r5Body: "Dienste können unterbrochen werden; experimentelle Features sind keine Audit-Garantie.",
    r6Title: "6. Regulierungs- und Steuerrisiko",
    r6Body: "Regeln unterscheiden sich nach Land. Steuern liegen bei Ihnen. ANCAPs volle Zustimmung zu CLARITY ersetzt lokale Regeln nicht.",
    r7Title: "7. Drittanbieter-Marktdaten",
    r7Body: "Spotpreise auf ANCAP können von CoinGecko stammen und sind nur indikativ — kein Settlement-Preis und keine Anlageberatung.",
    r8Title: "8. Ergebnisrisiko Longevity, Organdruck und Veterinär",
    r8Body:
      "AETERNA-Schienen (Organdruck, feliner Kryo, canine VET REGEN POD) können scheitern oder vom Partner abgelehnt werden. Illustrationen sind konzeptionell. Keine Überlebensquote und keine Rückkehr ins Leben wird versprochen.",
    r9Title: "9. Risiko humanitärer Hilfe",
    r9Body:
      "Humanitäre Briefings können von einer nationalen Gesellschaft verzögert oder abgelehnt werden. ANCAP liefert selbst keine Nahrung, kein Wasser, keine Kleidung, keine Arzneimittel und keine Arbeitsplätze. Ein Desk-Listing ist keine unterzeichnete Rotkreuz-Partnerschaft und keine steuerlich absetzbare Spende. Siehe /legal/humanitarian.",
    riskMarketDataMore: "Vollständige Marktdaten-Offenlegung:",
    p9Title: "9. Marktdaten-Anbieter",
    p9Body: "ANCAP kann CoinGecko-APIs für indikative Kurse nutzen. Anfragen verwenden Server-Credentials.",
    marketDataKicker: "Kundenhinweis",
    marketDataTitle: "Marktdaten und CoinGecko",
    marketDataIntro: "Wie ANCAP Drittanbieter-Marktdaten auf ancap.cloud nutzt.",
    md1Title: "1. Was wir zeigen",
    md1Body: "Indikative Spotpreise (BTC, ETH, USDT, BNB, SOL). API: GET /api/v1/market/prices. Anzeige u. a. auf der Startseite und Reserves.",
    md2Title: "2. Kein Settlement, keine Beratung",
    md2Body: "CoinGecko-Preise sind keine ANCAP-Settlement-Preise.",
    md3Title: "3. Genauigkeit und Verfügbarkeit",
    md3Body: "Feeds können verzögert oder ausfallen.",
    md4Title: "4. Attribution",
    md4Body: "ANCAP nennt CoinGecko als Quelle.",
    md5Title: "5. Ihre Verantwortung",
    md5Body: "Verlassen Sie sich nicht auf indikative Screens für irreversible Transfers.",
    md6Title: "6. Wetter (AccuWeather)",
    md6Body: "Das Earth-/Support-Widget kann lokale Zeit und Wetter per IP über AccuWeather (https://www.accuweather.com/) und GET /api/v1/weather/current anzeigen.",
    md7Title: "7. Kein Warnservice",
    md7Body: "Widget-Wetter ist nur UX-Kontext, kein offizieller Wetterwarnservice.",
    md8Title: "8. Standort und AccuWeather-Privacy",
    md8Body: "Ungefähre IP-Koordinaten gehen an die ANCAP Weather-API. AccuWeather verarbeitet Daten nach eigenen Bedingungen. ANCAP verkauft diese Daten nicht.",
    marketDataAttributionTitle: "Anbieter",
    marketDataAttributionBody: "Marktdaten: CoinGecko. Wetter: AccuWeather (https://www.accuweather.com/).",
    refundsKicker: "Abrechnungsrichtlinie",
    refundsTitle: "Zahlungen und Erstattungen",
    refundsIntro: "Wie ANCAP bezahlte Runs, API-Spend, Credits und Fiat-Aufladungen behandelt.",
    f1Title: "1. Wann eine Belastung endgültig ist",
    f1Body: "Workflow-Käufe werden in der Regel mit Ausführungsbeginn verbraucht; erfolgreiche Runs sind meist nicht erstattungsfähig.",
    f2Title: "2. Fehlgeschlagene Runs",
    f2Body: "Bei dokumentiertem Plattformfehler: support@ancap.cloud für Credit/Wiederholung.",
    f3Title: "3. Credits und ACP-Salden",
    f3Body: "Abrechnungseinheiten der Dienste, keine Bankeinlagen.",
    f4Title: "4. Fiat-Prozessoren",
    f4Body: "KartenZahlungen folgen Stripe/Partnerregeln. Zuerst support@ancap.cloud kontaktieren.",
    f5Title: "5. Prüfung anfordern",
    f5Body: "E-Mail an support@ancap.cloud mit Konto und Run-/Zahlungs-ID. Zwingende Verbraucherrechte bleiben unberührt.",
    refundsWelcomeGrantMore: "Der Registrierungszuschuss ist ein Promo-Plattformguthaben, keine Spende und nicht als Fiat erstattbar. Details:",
    welcomeGrantKicker: "Abrechnung / Verbraucherrecht",
    welcomeGrantTitle: "Willkommenszuschuss: 100 ACP Zugangsguthaben",
    welcomeGrantIntro:
      "ANCAP schreibt neuen Konten 100 ACP gut, damit bezahlte KI-Workflows ohne ersten Barkauf getestet werden können. „$100“ ist ein nominelles Buchungslabel. Diese Seite stellt die rechtliche Einordnung fest: Zugangszuschuss, keine Wohltätigkeit, kein USD, kein Steuerabzug. EU-Rechtsakte stehen in den Abschnitten 5–9.",
    wg1Title: "1. Was Sie erhalten",
    wg1Body:
      "Nach erfolgreicher Registrierung schreibt ANCAP 100 ACP auf Ihr Plattformledger. Die „$100“-Angabe ist ein nominelles Buchungslabel, weil ACP die SKU-Preiseinheit ist. Es ist keine Auszahlung von 100 US-Dollar, keine Banküberweisung und kein Fiat-Geschenk.",
    wg2Title: "2. Zugangszweck (warum das nach Wohltätigkeit klingen kann)",
    wg2Body:
      "Der erklärte Zweck des Betreibers ist, die Geldbürde zu senken, damit eine neue Person bezahlte KI-Workflows ausprobieren kann. Umgangssprachlich ist das ein Zugangszuschuss. Dieser Zweck macht den Kredit rechtlich nicht zur Spende.",
    wg3Title: "3. Russisches Recht — keine Spende",
    wg3Body:
      "Eine пожертвование nach Art. 582 ZGB RF ist eine Schenkung von Vermögen an einen Beschenkten zu gemeinnützigen Zwecken. Eine Plattform, die das eigene interne Ledger gutschreibt, überträgt kein Vermögen an eine Wohltätigkeitsorganisation. Das Wohltätigkeitsgesetz 135-FZ betrifft registrierte NPO und tatsächliche Übertragungen mit Belegen. ANCAP gibt diesen Zuschuss nicht als Tätigkeit einer благотворительная организация aus. Ein Marketingguthaben als „Wohltätigkeit“ ohne diese Form zu bewerben wäre unlautere Werbung (38-FZ Art. 5). Der Zuschuss ist keine Lotterie. Nutzer erhalten keinen Steuerabzug allein wegen dieser Gutschrift.",
    wg4Title: "4. Vereinigte Staaten",
    wg4Body:
      "Der Zuschuss ist kein steuerlich absetzbarer charitable contribution nach IRC §170 und kein Geschenk an eine 501(c)(3), solange keine separate registrierte Charity tatsächlich Mittel erhält. FTC Act §5 verbietet Täuschung: ein Signup-Promo als „Spende“ zu bezeichnen, obwohl es ein Plattformguthaben ist, wäre irreführend. ACP bleibt eine Utility-/Rechnungseinheit, kein Renditeprodukt.",
    wg5Title: "5. EU — unlautere Geschäftspraktiken (keine Wohltätigkeit)",
    wg5Body:
      "Richtlinie 2005/29/EG über unlautere Geschäftspraktiken (UGP-RL), geändert durch (EU) 2019/2161 (Omnibus), verbietet irreführende Handlungen und Unterlassungen (Art. 6–7). Anhang I Nr. 22: fälschlich den Eindruck erwecken, der Gewerbetreibende handele nicht zu Zwecken seines Handels, Gewerbes oder Berufs. Diesen Anmelde-Zuschuss als Spende, humanitäre Gabe oder Tätigkeit einer anerkannten gemeinnützigen Einrichtung darzustellen — obwohl ANCAP eine kommerzielle Plattform ist und keine Mittel an eine registrierte EU-Charity fließen — wäre eine irreführende Geschäftspraxis. E-Commerce-Richtlinie 2000/31/EG Art. 6: kommerzielle Kommunikationen müssen als solche erkennbar sein; dieser Zuschuss ist eine kommerzielle Zugangsförderung, kein Spendenaufruf. Nationale Umsetzungen: Deutschland UWG §§ 5 / 5a; Frankreich Code de la consommation L. 121-1 ff.; Italien Codice del Consumo. Im Vereinigten Königreich gelten die Consumer Protection from Unfair Trading Regulations 2008 (beibehaltene UGP-RL) nach dem Brexit entsprechend. Dieser Zuschuss macht ANCAP nicht zur gemeinnützigen Körperschaft nach AO § 52, nicht zum organisme d’intérêt général für französisches Mécénat und nicht zur Charity nach dem Charities Act 2011.",
    wg6Title: "6. EU — Verbraucherrechte und missbräuchliche Klauseln",
    wg6Body:
      "Verbraucherrechte-Richtlinie 2011/83/EU und Richtlinie (EU) 2019/770 über digitale Inhalte/Dienstleistungen: der Willkommenszuschuss ist ein unentgeltliches Promo-Guthaben, kein entgeltlicher Fernabsatzvertrag. Das 14-tägige Widerrufsrecht (Art. 9 VRRL) knüpft an eine spätere entgeltliche digitale Dienstleistung, die der Verbraucher bestellt — nicht an das kostenlose Guthaben selbst. Verlangt der Verbraucher während der Widerrufsfrist die sofortige Erfüllung einer entgeltlichen digitalen Dienstleistung (Art. 16 Buchst. m / 16a VRRL), gelten die Regeln unter Zahlungen & Erstattungen; dieser Zuschuss ändert sie nicht. Klausel-Richtlinie 93/13/EWG: Bedingungen zur Stornierung bei Missbrauch müssen transparent und verhältnismäßig sein und dürfen zwingende Verbraucherrechte nicht abbedingen. Geo-Blocking-Verordnung (EU) 2018/302: dieses Guthaben wird nicht als preisliche Diskriminierung nach Staatsangehörigkeit eines Mitgliedstaats angeboten. Der Digital Services Act (EU) 2022/2065 macht ein Plattform-Ledger-Guthaben nicht zur Spende.",
    wg7Title: "7. EU — kein E-Geld, kein Zahlungsdienst, kein Verbraucherkredit",
    wg7Body:
      "E-Geld-Richtlinie 2009/110/EG (EMD2): E-Geld ist elektronisch gespeicherter Geldwert mit Forderung gegen den Emittenten, ausgegeben gegen Entgegennahme von Geldmitteln und von anderen als dem Emittenten angenommen. Dieser Zuschuss wird ohne Entgegennahme von Geldmitteln des Nutzers ausgegeben, ist nur für ANCAP-Dienste verwendbar und nicht in EUR oder USD einlösbar. ANCAP gibt sich damit nicht als E-Geld-Institut aus. Zahlungsdiensterichtlinie (EU) 2015/2366 (PSD2): der Zuschuss ist kein Zahlungsvorgang, kein Zahlungskonto und keine Ausgabe eines Zahlungsinstruments. Verbraucherkreditrichtlinie 2008/48/EG und neue Richtlinie (EU) 2023/2225: kein Darlehen, keine Zahlungsaufschubvereinbarung, kein Kredit mit Zinsen oder Tilgungsplan. Ein deterministisches Guthaben einmal pro Konto ist kein Glücksspiel und keine lizenzpflichtige EU-Lotterie.",
    wg8Title: "8. EU — MiCA und kapitalmarktrechtlicher Rahmen",
    wg8Body:
      "Verordnung (EU) 2023/1114 über Märkte für Kryptowerte (MiCA): ACP wird als Utility-/Rechnungseinheit für bezahlte KI-Workflows positioniert. Dieser Zuschuss ist kein öffentliches Angebot eines vermögenswertereferenzierten Tokens oder E-Geld-Tokens, kein Fundraising-Angebot von Kryptowerten und kein Recht auf Dividenden, Zinsen oder Gewinnbeteiligung. Er ist kein Finanzinstrument nach MiFID II 2014/65/EU und kein Wertpapierangebot nach Prospektverordnung (EU) 2017/1129. Werbung darf nicht „garantierte Rendite“, „risikofreie 100 $“ oder ähnliche Yield-Sprache verwenden. Das nominelle „$100“-Label ist eine Buchungsskala für SKU-Preise, kein Versprechen, 100 US-Dollar oder 100 Euro auszuzahlen.",
    wg9Title: "9. EU — Umsatzsteuer, Steuern und personenbezogene Daten",
    wg9Body:
      "MwSt-Systemrichtlinie 2006/112/EG: ein unentgeltliches Promo-Guthaben ohne Gegenleistung ist im Zeitpunkt der Gutschrift in der Regel keine steuerbare Lieferung/sonstige Leistung. Spätere entgeltliche Workflow-Nutzung kann nach den gewöhnlichen Orts-/OSS-Regeln steuerbar sein; dieser Hinweis bestimmt nicht den MwSt-Status des Nutzers. Der Zuschuss ist keine steuerlich absetzbare Zuwendung an eine EU-Gemeinnützige (nationale Spendenabzüge / Gift-Aid-Analoga greifen nicht). DAC8 / Richtlinie (EU) 2023/2226 betrifft, soweit anwendbar, meldepflichtige Kryptowert-Transaktionen — dieses Promo-Ledger-Guthaben ist keine Spende für die Steuerberichterstattung. DSGVO (EU) 2016/679: Registrierungsdaten werden zur Kontoeröffnung und Gutschrift verarbeitet (Art. 6 Abs. 1 Buchst. b Vertragserfüllung); Einzelheiten in der Datenschutzerklärung. Der Zuschuss ist keine „Spende“, um zusätzliche Marketing-Einwilligung jenseits der Cookie-Richtlinie und Datenschutzerklärung zu erlangen (ePrivacy 2002/58/EG).",
    wg10Title: "10. Produktregeln",
    wg10Body:
      "Ein Zuschuss pro Nutzerkonto. Eine zweite Registrierung derselben E-Mail wird abgelehnt. Missbrauch oder Mehrfachkonten können die Gutschrift stornieren. Verwendbar für ANCAP-Dienste. Nicht als USD oder EUR auszahlbar. Keine Zinsen, kein Yield, keine Staking-Prämie, kein Wertpapier. Getrennt vom 25-ACP-Empfehlungsbonus an den Werber nach einem verifizierten Erstkauf.",
    wg11Title: "11. Erstattungen und Missbrauch",
    wg11Body:
      "Der Zuschuss ist nicht als Fiat erstattbar. Betrügerische oder doppelte Konten können geschlossen und die Gutschrift storniert werden. Bezahlte Läufe folgen Zahlungen & Erstattungen. Zwingende EU-Widerrufsrechte bei späteren entgeltlichen digitalen Dienstleistungen, soweit sie gelten, bleiben unberührt.",
    wg12Title: "12. Keine Rechtsberatung",
    wg12Body:
      "Dieser Hinweis ist eine Betreiberoffenlegung, keine Steuer-, NPO- oder zugelassene Rechtsberatung für Nutzer in der EU/EWR/UK oder anderswo. Fragen: legal@ancap.cloud. Humanitäre Briefings sind ein separates Produkt unter /humanitarian und /legal/humanitarian — nicht dieser Willkommenszuschuss.",
    welcomeGrantAlso: "Konto eröffnen oder verwandte Hinweise lesen:",
    humanitarianKicker: "Rechtliches / humanitär",
    humanitarianTitle: "Humanitärer Hilfsdesk und Rotkreuz-/Rothalbmond-Listings",
    humanitarianIntro:
      "Wie ANCAP ACP-abgerechnete humanitäre Briefings und Partner-Übergaben an nationale Rotkreuz-/Rothalbmond-Gesellschaften rahmt. ANCAP ist keine eingetragene Wohltätigkeitsorganisation und behauptet keine unterzeichnete IKRK-, IFRK- oder nationale Partnerschaft, solange keine datierte Vereinbarung hier veröffentlicht ist.",
    hum1Title: "1. Plattformrolle",
    hum1Body:
      "ANCAP betreibt eine ACP-first-Softwareplattform. Unter /humanitarian verkauft sie Hilfsbriefings und Partner-Übergabe-Tools, abgerechnet in ACP. ANCAP ist keine благотворительная организация nach RF 135-FZ, keine gemeinnützige Körperschaft, keine UK-Charity und keine US-501(c)(3)-Organisation. Die Zahlung von ACP macht den Nutzer nicht zum Spender an ANCAP als NPO.",
    hum2Title: "2. Rotkreuz-/Rothalbmond-Bewegung",
    hum2Body:
      "IKRK, IFRK und Nationalgesellschaften sind verschiedene Komponenten. Ein Desk-Listing der IFRK oder des DRK/RRK/URCS/ARC ist eine Handoff-Schiene zu offiziellen Websites — keine Mitgliedschaft in der Bewegung, kein Fundraising-Agenturvertrag und keine IKRK-Unterstützung. Bis ein datiertes MoU hier steht, gilt official_partnership = false.",
    hum3Title: "3. Wofür ACP zahlt",
    hum3Body:
      "ACP auf diesem Desk zahlt ein Briefing und einen Beitrag zur Partnerkanal-Übergabe: Notnahrung, Trinkwasser, Ernährung/Lebensmittel, warme Kleidung, Medizinprodukte über lizenzierte Kanäle, Existenzsicherung / Starthilfe zur Arbeit. ANCAP lagert keine Güter und garantiert keine Ration, kein Arzneimittel und keinen Arbeitsplatz.",
    hum4Title: "4. Getrennt vom Willkommenszuschuss",
    hum4Body:
      "Die 100 ACP bei Registrierung sind Promo-Zugang, ausdrücklich keine Wohltätigkeit. /legal/welcome-grant und /legal/humanitarian dürfen in der Werbung nicht vermischt werden (UCPD Anhang I Nr. 22, RF 38-FZ).",
    hum5Title: "5. Embleme und Genfer Abkommen",
    hum5Body:
      "Rotes Kreuz, Roter Halbmond und Roter Kristall sind geschützte Kennzeichen der Genfer Abkommen von 1949. ANCAP ist nicht lizenziert, sie als Logo, App-Icon oder Zahlungsbadge zu führen. Nur Textnamen und Offizialdomains. emblem_licensed = false.",
    hum6Title: "6. Medizinische Güter",
    hum6Body:
      "Briefings zu medizinischen Gütern gelten nur für lizenzierte Partnerkanäle. ANCAP ist keine Apotheke, stellt keine Rezepte aus und erteilt keine medizinische Beratung. Betäubungsmittel und unlizenzierter Arzneimittelvertrieb sind verboten.",
    hum7Title: "7. Existenzsicherung / Arbeit",
    hum7Body:
      "Matching zur Existenzsicherung ist ein Briefing an Partnerprogramme. ANCAP ist nicht in jedem Land eine zugelassene Arbeitsvermittlung und garantiert keinen Job, Lohn oder Aufenthaltstitel.",
    hum8Title: "8. Russische Föderation",
    hum8Body:
      "135-FZ und Art. 582 ZGB RF: ein ACP-Ledger-Eintrag ist keine Spende, solange eine registrierte Charity nicht separat quittiert. Werbung, ANCAP sei selbst eine Wohltätigkeitsorganisation, ist unzulässig (38-FZ).",
    hum9Title: "9. EU, UK, US und Spendenbescheinigungen",
    hum9Body:
      "UCPD 2005/29/EG Anhang I Nr. 22, E-Commerce-RL Art. 6, UWG, UK CPRs, US FTC Act §5, IRC §170: kommerzielle Mitteilungen dürfen keinen falschen Wohltätigkeitseindruck erzeugen. Eine ANCAP-ACP-Buchung ist keine Zuwendungsbestätigung.",
    hum10Title: "10. Kontakt",
    hum10Body:
      "Rechtliches: legal@ancap.cloud. Produkt: /humanitarian. Verwandt: /legal/welcome-grant. Offiziell: https://www.ifrc.org/. Diese Seite ist Betreiberoffenlegung, keine zugelassene Rechts-, Steuer- oder medizinische Beratung.",
    humanitarianAlso: "Verwandte Hinweise und offizielle Sites:",
    cyberKicker: "Legal / public policy",
    cyberTitle: "ANCAP endorsement of collective cyber defense",
    cyberIntro: "ANCAP publicly agrees with the OpenAI open letter \"A call for collective action on cyber defense\" and the global surge it asks for. This page is the company's legal and policy statement of that agreement. It does not replace the User Agreement, Privacy Notice, or Cookie Policy.",
    openLetter: "Open letter (openai.com)",
    cyberStatementTitle: "Statement of agreement",
    cyberStatement1: "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, and API services, agrees with the letter's opening claim: there is a limited window to strengthen cyber defense. AI-enabled attacks are becoming cheaper, more automated, and more widely available, including against hospitals, water systems, and internet infrastructure. The same models can help defenders close weaknesses that have accumulated for years. ANCAP therefore aligns with the call to raise cybersecurity to executive priority, fund defense for operators who cannot fund it themselves, share proven playbooks, and make AI-agent actions accountable.",
    cyberStatement2: "Signatories of the letter include technology, security, payments, telecom, and industrial companies that compete in ordinary markets and still coordinated around a shared threat picture. ANCAP is not a listed signatory of that letter. This page records ANCAP's independent agreement with the same policy and the same three principles.",
    cyberP1Title: "1. Current security is not enough",
    cyberP1Body: "Systems remain exposed because of accumulated bugs, excess privilege, weak authentication, and technical debt. Security teams — especially in critical infrastructure — are chronically under-resourced. ANCAP treats this as a leadership-level risk, not a back-office checklist.",
    cyberP2Title: "2. Defenders need AI",
    cyberP2Body: "The same class of models that will make attacks cheaper can also give more teams expert-grade defensive skill and make baseline security work faster and cheaper. Proven tools and patches from one organization should help many. ANCAP will use AI to strengthen defensive workflows, proof trails, and operator checks — not to lower the cost of offense.",
    cyberP3Title: "3. The response must be collective",
    cyberP3Body: "No single company controls the threat surface. Vendors hold attack data and tools, model builders hold the models, governments hold coordination and budget, and operators know their own systems. ANCAP agrees that these parts must be joined so one victim's experience raises the cost of the next attack.",
    cyberCommitTitle: "ANCAP commitments under this policy",
    cyberC1Title: "Leadership priority",
    cyberC1Body: "Cybersecurity is treated with incident-level urgency: close the most dangerous weaknesses, verify the result, and raise the bar for what we buy, ship, and run — including AI-written code.",
    cyberC2Title: "Defensive use of AI",
    cyberC2Body: "ANCAP will apply AI to defensive tasks, auditability, and operator support. Paid AI workflows and agents on the platform remain subject to prohibited-conduct rules against attacks, malware, fraud, and unauthorized access.",
    cyberC3Title: "Traceable agents",
    cyberC3Body: "AI-agent actions on ANCAP should be traceable and accountable through receipts, hashes, logs, and proof artifacts wherever the product already records execution.",
    cyberC4Title: "Shared standards",
    cyberC4Body: "ANCAP supports partnership, threat-information sharing, and common defensive standards among technology companies, infrastructure operators, and public institutions.",
    cyberC5Title: "Raise attacker cost",
    cyberC5Body: "The core economic test remains: an attack should cost more than it can return. ANCAP agrees that restoring that cost requires collective action, because no participant holds the full resource set alone.",
    cyberScopeTitle: "Scope and limits",
    cyberScope1: "This endorsement is a public-policy statement. It does not create a warranty, insurance, SLA, or government partnership by itself. Platform users remain bound by the User Agreement, including the prohibition on using ANCAP to attack systems, distribute malware, or bypass access controls. Offensive cyber assistance is outside the product.",
    cyberScope2: "Source document:",
    clarityKicker: "Legal / public policy",
    clarityTitle: "ANCAP full agreement with the CLARITY Act",
    clarityIntro:
      "ANCAP publicly records its full agreement with the Digital Asset Market Clarity Act (CLARITY Act) as updated U.S. market-structure legislation for digital assets. This page is the company's legal and policy statement of that agreement. It does not replace the User Agreement, Risk disclosure, Privacy Notice, or Cookie Policy.",
    clarityBillLink: "Bill text (Congress.gov)",
    clarityNewsLink: "Public notice of updated text",
    clarityStatementTitle: "Statement of full agreement",
    clarityStatement1:
      "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, bridge, stablecoin, and API services, fully agrees with the CLARITY Act's core purpose: establish a clearer federal framework for digital-asset markets, clarify when assets and activities fall under securities versus commodities oversight, and reduce regulatory ambiguity that harms lawful builders, payment rails, and users.",
    clarityStatement2:
      "ANCAP supports clear SEC and CFTC jurisdictional lines, transparent market-structure rules for digital commodities and related activities, and compliance-ready rails for utility settlement assets such as ACP / wACP / sACP. ANCAP is not a Member of Congress, not a registered lobbyist by virtue of this page, and not a government agency. This page records ANCAP's independent full agreement with the Act's market-clarity objectives as publicly discussed around the updated text ahead of floor consideration.",
    clarityP1Title: "1. Market clarity over ambiguity",
    clarityP1Body:
      "Builders and clients need predictable rules for classification, custody, trading venues, and disclosures. ANCAP agrees that statutory clarity beats ad-hoc enforcement-only regimes for digital-asset market structure.",
    clarityP2Title: "2. Jurisdiction that matches the asset and activity",
    clarityP2Body:
      "ANCAP agrees that securities-like activities should remain under securities oversight and that digital-commodity market activities should have a coherent CFTC-facing framework, consistent with the Act's design goals as publicly described.",
    clarityP3Title: "3. Lawful commerce and utility rails",
    clarityP3Body:
      "ANCAP positions ACP as a utility / accounting unit for paid AI workflows and platform credits — not as an investment-return product. Full agreement with CLARITY market-structure goals reinforces that ANCAP will keep MiCA-safe / utility messaging and align product disclosures with applicable U.S. law as enacted and interpreted.",
    clarityCommitTitle: "ANCAP commitments under this endorsement",
    clarityC1Title: "Full public agreement",
    clarityC1Body:
      "ANCAP states full agreement with the CLARITY Act's purpose of digital-asset market clarity and will keep this statement available in the Legal center.",
    clarityC2Title: "Honest product status",
    clarityC2Body:
      "ANCAP will not use this endorsement to claim that ACP is a registered security, that any token is guaranteed lawful in every jurisdiction, or that legislation has already been signed into law before it has.",
    clarityC3Title: "Compliance follow-through",
    clarityC3Body:
      "If and when CLARITY (or successor market-structure law) is enacted, ANCAP will review messaging, partner rails, and disclosures against the final statute and implementing rules.",
    clarityC4Title: "No substitute for user counsel",
    clarityC4Body:
      "Users remain responsible for their own legal, tax, and licensing analysis. This endorsement is not legal advice to any client.",
    clarityC5Title: "Update discipline",
    clarityC5Body:
      "Material legislative changes will be reflected on this page and, where needed, in the User Agreement and Risk disclosure \"Last updated\" notes.",
    clarityScopeTitle: "Scope and limits",
    clarityScope1:
      "This endorsement is a public legal-policy statement of full agreement with the CLARITY Act's market-structure goals. It does not create a warranty, insurance, SLA, government partnership, lobbying engagement, or investment recommendation. Passage of any bill remains a matter for Congress and the President. Until enacted, ANCAP continues to operate under existing applicable law and these Legal center notices.",
    clarityScope2: "References:",
    footerClarity: "CLARITY Act",
    footerLegal: "Rechtliches",
    footerTerms: "Bedingungen",
    footerPrivacy: "Datenschutz",
    footerCookies: "Cookies",
    footerRisk: "Risiken",
    footerRefunds: "Erstattungen",
    footerWelcomeGrant: "Willkommenszuschuss",
    footerHumanitarian: "Hilfsdesk",
    footerVetRegen: "Vet-Regen",
    footerLightChamber: "Lichtkammer",
    footerBodyContouring: "Body-Contouring",
    footerBiofusion: "BioFusion",
    footerDpsc: "DPSC-Biomaterial",
    footerVascularPlus: "Vascular Care+",
    footerVascular: "Vascular Care",
    footerTransdermal: "Transdermal",
    footerMReceptor: "M-Rezeptor",
    footerOxygenCarrier: "Sauerstoffträger",
    authAgreePrefix: "Ich stimme den",
    authAgreeAnd: "und der",
    authAgreeSuffix: " zu.",
  },
  "zh-Hant": {
    lastUpdated: "最後更新：2026 年 9 月 12 日。",
    privacyLink: "隱私權聲明",
    cookiesLink: "Cookie 政策",
    termsLink: "使用者協議",
    cyberLink: "集體網路防禦",
    clarityLink: "CLARITY Act",
    acpLink: "ACP Whitepaper",
    riskLink: "風險揭露",
    refundsLink: "付款與退款",
    welcomeGrantLink: "註冊贈與額度",
    humanitarianLink: "人道援助",
    hubLink: "法律中心",
    complianceLink: "合規",
    contactLegal: "legal@ancap.cloud",
    contactPrivacy: "privacy@ancap.cloud",
    contactSupport: "support@ancap.cloud",
    hubKicker: "法律中心",
    hubTitle: "ANCAP 客戶法律資訊",
    hubIntro: "為 ancap.cloud 使用者提供清楚規則：協議、隱私、Cookie、付款、AI／加密風險與聯絡方式。",
    hubCardTerms: "帳戶、錢包、付費工作流程、API、創作者與禁止行為規則。",
    hubCardPrivacy: "我們處理哪些資料、目的、保存、您的權利與聯絡方式。",
    hubCardCookies: "必要與可選儲存，以及同意如何運作。",
    hubCardRisk: "誠實揭露：AI 輸出、ACP 效用性質、橋接／錢包風險、無保證報酬。",
    marketDataLink: "市場數據",
    hubCardMarketData: "ANCAP 如何使用 CoinGecko 等第三方報價——僅供參考。",
    footerMarketData: "市場數據",
    researchRefsLink: "研究引用",
    hubCardResearchRefs: "我們引用的第三方科學儀器、mRNA／LNP 專利報導與量子資訊報導（含 ZEISS Lightfield 4D、Daewoong eTurna USPTO allowance、iXBT Live）——商標歸權利人，無隸屬關係。",
    footerResearchRefs: "研究引用",
    researchRefsKicker: "Third-party science",
    researchRefsTitle: "Research references and instrument citations",
    researchRefsIntro:
      "How ANCAP cites public third-party scientific instruments and technology notes. Downloads and trademarks remain with their owners.",
    rr1Title: "1. Purpose",
    rr1Body:
      "ANCAP may cite public product pages and technology notes as educational context for longevity, imaging, and AETERNA research workflows. Citations are not an endorsement or resale of third-party hardware.",
    rr2Title: "2. ZEISS Lightfield 4D",
    rr2Body:
      "ANCAP references ZEISS LSM Lightfield 4D as public technical context. Product page and technology note links are on this Legal center and AETERNA. Gated thank-you downloads are served by ZEISS under ZEISS terms.",
    rr3Title: "3. No affiliation or trademark license",
    rr3Body:
      "ZEISS, Carl Zeiss, Lightfield 4D, LSM, ZEN, and related marks are trademarks of Carl Zeiss AG / Carl Zeiss Microscopy GmbH or affiliates. ANCAP is not affiliated with or endorsed by ZEISS unless a separate written agreement says otherwise.",
    rr4Title: "4. Downloads and hosting",
    rr4Body:
      "ANCAP does not host or redistribute ZEISS proprietary PDFs. We link to ZEISS-controlled URLs only.",
    rr5Title: "5. Not medical or clinical advice",
    rr5Body:
      "Instrument citations do not create medical or clinical advice. Verify partner licenses and local law before any clinical use.",
    rr6Title: "6. 量子資訊／資料保護研究（iXBT Live）",
    rr6Body:
      "ANCAP 引用 iXBT Live 關於資料保護中「不可能」量子悖論之公開文章，作為量子連線數位 SIM 服務台之教育脈絡。與 iXBT 無隸屬；不保證 QKD。",
    rr7Title: "7. Daewoong／eTurna mRNA LNP（USPTO notice of allowance）",
    rr7Body:
      "截至 2026 年 9 月 11 日，ANCAP 引用公開報導：Daewoong Pharmaceutical 於 2026 年 8 月 27 日就 eTurna LNP 平台之可離子化脂質獲得 USPTO notice of allowance。Allowance 並非已核發專利，亦非藥品核准。工作仍屬臨床前。無關聯；ANCAP 主機不托管脂質配方或濕實驗協議。",
    rr8Title: "8. Chalmers Floquet 玻色碼／量子晶格閘（PRL 2026）",
    rr8Body:
      "截至 2026 年 9 月 11 日，ANCAP 引用 Nauka TV（2026 年 9 月 10 日）對 Huang–Du–Guo PRL（DOI 10.1103/tnb8-3m8m）之報導：以微波／共振器玻色碼編碼，並在單一 Floquet 週期（而非數千週期）實作 quantum lattice gates。屬理論工作，非 ANCAP 硬體。與 Chalmers／天津大學／APS 無關聯。",
    rr9Title: "9. 新創投資桌 — IT 瞪羚／B2B 零售與 AI 市場引用（2026）",
    rr9Body:
      "截至 2026 年 9 月 12 日，/startups 引用 CNews／Spark-Interfax ICT 瞪羚（GA Tactic／Zolotoe Yabloko 單一客戶集中）、Forbes／FRIИ 小型 IT、Sky.pro AI／SECaaS 構想區間，以及 businessmens.ru 農技利基。非證券發行、非投資建議，與所列出版社或發行人無關聯。",
    researchRefsLinksTitle: "正規研究連結",
    researchRefsLinksBody:
      "使用公開出版商 URL。若深層連結失效，請改從來源頁面開始。含 ZEISS、Daewoong／eTurna USPTO allowance、Chalmers Floquet 玻色碼、iXBT 與 2026 IT 瞪羚／新創市場報導，僅供素養。",
    cryoLink: "冷凍與憲法",
    hubCardCryo:
      "冷凍保存服務台、緩步類動物研究框架、夥伴 KrioRus 與 Tomorrow.bio、獸醫組織冷凍／VET REGEN POD 軌道，以及截至本公告日之憲法管轄說明。",
    footerCryo: "冷凍",
    cryoKicker: "法律 / 長壽",
    cryoTitle: "冷凍保存、夥伴與憲法界限",
    cryoIntro:
      "ANCAP 如何在 2026 年 9 月 11 日有效之憲法與衛生法下，呈現冷凍意圖、授權夥伴與緩步類動物啟發之研究協議。",
    cryo1Title: "1. 平台角色",
    cryo1Body:
      "ANCAP 提供 ACP 結算意圖與夥伴交接工具。ANCAP 不營運冷凍設施。實體冷凍僅由授權夥伴執行。",
    cryo2Title: "2. 夥伴 — KrioRus 與 Tomorrow.bio",
    cryo2Body:
      "服務台清單含 КриоРус（KrioRus，RU）與 Tomorrow.bio（EU）。上架為持照夥伴交接軌道，非臨床、倫理或監管審計。部分冷凍保存業者之方法與倫理曾受公開質疑；Tomorrow.bio 於長期效力仍屬早期。ANCAP 不背書復活，不以 RWA 收益包裝冷凍保存。",
    cryo3Title: "3. 緩步類動物血液／隱生",
    cryo3Body:
      "緩步類動物相關內容為研究元資料——非核准人體輸血產品，亦非 DIY 協議。",
    cryo4Title: "4. 憲法（公告日）",
    cryo4Body:
      "受使用者與夥伴管轄區憲法與最高法拘束（截至 2026 年 9 月 11 日，含俄、德基本法、烏克蘭、歐盟／美國框架）。不法冷凍活動不予協助。",
    cryo5Title: "5. 非醫療建議",
    cryo5Body:
      "目錄與使用者／AI 評論僅供資訊參考。強制消費者／患者權利不受影響。",
    cryo6Title: "6. 獸醫組織冷凍保存（貓）",
    cryo6Body:
      "貓組織冷凍保存／復原器上架為持照獸醫夥伴收件簡報。ANCAP 不製造艙體、不從事獸醫診療，亦不主張冷凍組織能起死回生或達成任何存活率。取樣、冷凍、儲存、解凍與任何再植入僅能由持照獸醫師執行。",
    cryo7Title: "7. 獸醫器官再生艙（犬／VET REGEN POD）",
    cryo7Body:
      "VET REGEN POD 為犬用器官移植與再生艙之概念名稱。資訊圖數字（含存活率或「快於自然再生」）非 ANCAP 產品主張。實體處置僅能在持照獸醫手術環境進行。見 /legal/vet-regen。",
    cryo8Title: "8. 審查、投機與 ACP 所付者",
    cryo8Body:
      "冷凍保存夥伴仍受公眾與監管檢視；上架並非洗白。此服務台之 ACP 支付諮詢／收件簡報與交接，非代幣化之人、亦非復活之 DeFi 收益。文學授權拍賣為另一淺薄 IP 桌：類型中位數為 comparable 而非 NAV，炒作出價 fail-closed。見 /literary 與 /legal/risk。",
    vetRegenLink: "獸醫器官軌道",
    hubCardVetRegen:
      "貓組織冷凍保存／復原器與犬用 VET REGEN POD：夥伴概念架構，僅限持照獸醫師，無起死回生或存活率保證。",
    vetRegenKicker: "法律 / 獸醫",
    vetRegenTitle: "獸醫器官軌道 — 冷凍保存器與 VET REGEN POD",
    vetRegenIntro:
      "ANCAP 如何於 2026 年 9 月 12 日說明伴侶動物組織庫與器官再生夥伴軌道。這些頁面出售 ACP 諮詢／收件簡報，非硬體、亦非獸醫治療。",
    vr1Title: "1. 平台角色",
    vr1Body:
      "ANCAP 提供 ACP 結算、簡報與持照夥伴配對。ANCAP 不經營獸醫診所、不製造冷凍艙或 VET REGEN POD 硬體，亦不對動物施行手術。",
    vr2Title: "2. 非已上市醫療器材",
    vr2Body:
      "資訊圖為概念架構。非歐盟 MDR 型錄、非 FDA 510(k)／NADA、非 ANCAP 的 CE 產品。工作流程上架不構成器材上市。",
    vr3Title: "3. 禁止的結果主張",
    vr3Body:
      "ANCAP 不主張起死回生、復活、永生、數字存活率（含插圖上任何「最高 98%」），亦不主張「比自然快 2–5 倍」的再生。插圖不是臨床證據。",
    vr4Title: "4. 僅限持照獸醫師",
    vr4Body:
      "取樣、麻醉、移植、免疫調節與術後照護屬獸醫行為。禁止家用冷凍、DIY 生物反應器或未授權細胞培養。",
    vr5Title: "5. 動物衛生與福利法（公告日）",
    vr5Body:
      "服務受 2026 年 9 月 12 日有效之動物衛生與福利法拘束——包括俄羅斯獸醫法、歐盟獸藥規章 (EU) 2019/6、涉及研究動物時之指令 2010/63/EU、美國各州獸醫執業法與 FDA CVM、德國 TierSchG／TAppV，以及相應烏克蘭獸醫法規。",
    vr6Title: "6. 非獸醫、醫療或藥理建議",
    vr6Body:
      "目錄、資訊圖、工作流程輸出與評論僅供資訊。非診斷、處方、治療計畫，亦非對任何動物的保證。",
    vr7Title: "7. 寵物健康資料",
    vr7Body:
      "動物識別資料與病史視為敏感。無合法依據請勿上傳受規管獸醫紀錄。ANCAP 庫採雜湊優先。",
    vr8Title: "8. 與人類器官列印之關係",
    vr8Body:
      "人類幹細胞器官列印（每器官 250,000 ACP）仍為獨立持照生物反應器交接。獸醫軌道（貓冷凍 75,000 ACP；犬 VET REGEN POD 180,000 ACP）不授權將圖示艙體用於人體臨床。",
    vr9Title: "9. 付款",
    vr9Body:
      "為此類工作流程支付的 ACP 購買諮詢／收件簡報與夥伴配對——非硬體所有權，亦非可保證的臨床結果。退款依 /legal/refunds。",
    vr10Title: "10. 聯絡",
    vr10Body:
      "法律通知：legal@ancap.cloud。產品：/aeterna#vet-regen 與 /cryo。",
    lightChamberLink: "Vinci 光艙",
    hubCardLightChamber:
      "全身光生物調節艙：達文西陽光素養，僅限持照光療夥伴，無安全曬黑或 CE/FDA 器材主張。",
    lightChamberKicker: "法律 / 光療",
    lightChamberTitle: "Vinci 光艙 — 光生物調節軌道",
    lightChamberIntro:
      "ANCAP 於 2026 年 9 月 12 日如何描述全身 LED／UVA／紅光／近紅外艙。這些頁面出售 ACP 簡報，不是硬體，也不是光療療程。",
    lc1Title: "1. 平台角色",
    lc1Body:
      "ANCAP 提供 ACP 結算、簡報與持照夥伴配對。ANCAP 不經營皮膚科診所、不製造 LED/UVA 艙，亦不執行光照療程。",
    lc2Title: "2. 非上市醫療器材",
    lc2Body:
      "資訊圖為概念架構。非 EU MDR 型錄、非 FDA 510(k)、非達文西發明重建。上架工作流程不構成將器材投放市場。",
    lc3Title: "3. 禁止結果主張",
    lc3Body:
      "ANCAP 不主張安全曬黑、維生素 D 治療、膠原增加、傷口閉合或抗老。紅光／近紅外為公開研究素養。紫外線仍屬皮膚癌風險類。",
    lc4Title: "4. 僅限持照臨床人員",
    lc4Body:
      "光療與紫外線暴露為臨床行為。不得依這些頁面自製 LED 陣列或日光浴床。",
    lc5Title: "5. 篩檢",
    lc5Body:
      "夥伴流程須篩檢光敏感、黑色素瘤病史、光敏感藥物與膚質。",
    lc6Title: "6. 非醫療建議",
    lc6Body:
      "目錄、資訊圖與達文西引用為資訊，不是診斷或治療計畫。",
    lc7Title: "7. 健康資料",
    lc7Body:
      "皮膚病史視為敏感。無合法基礎請勿上傳病歷。",
    lc8Title: "8. 與其他 AETERNA 軌道的關係",
    lc8Body:
      "器官列印、mRNA 諮詢與獸醫軌道仍分開。光艙不授權 DIY CRISPR 或未持照光療硬體。",
    lc9Title: "9. 付款",
    lc9Body:
      "ACP 購買諮詢／療程簡報與夥伴配對——不是硬體所有權。退款見 /legal/refunds。",
    lc10Title: "10. 聯絡",
    lc10Body:
      "法律通知：legal@ancap.cloud。產品：/aeterna#vinci-light。",
    bodyContouringLink: "微波身體輪廓",
    hubCardBodyContouring:
      "接觸冷卻 2.45 / 5.8 GHz 施打頭：僅持照醫美／皮膚科夥伴，非抽脂、非 CE/FDA 器材、非保證減脂主張。",
    bodyContouringKicker: "法律／醫美",
    bodyContouringTitle: "微波身體輪廓——持照醫美夥伴軌道",
    bodyContouringIntro:
      "ANCAP 截至 2026 年 9 月 12 日如何表述接觸冷卻微波身體輪廓。這些頁面出售以 ACP 結算的諮詢與療程流程簡報，不是硬體，也不是減脂治療。",
    bc1Title: "1. 平台角色",
    bc1Body:
      "ANCAP 為 AETERNA 微波身體輪廓提供 ACP 結算、諮詢簡報與持照夥伴配對。ANCAP 不經營醫美診所、不製造微波推車或施打頭、不發行醫療器材，亦不執行身體輪廓療程。",
    bc2Title: "2. 非上市醫療器材",
    bc2Body:
      "資訊圖為夥伴討論用概念架構。不是 EU MDR 器材型錄、不是 FDA 510(k) 或 PMA、不是 ANCAP 出售的 CE 標章醫美產品，也不是家用微波天線配方。列出工作流程不構成將器材投放市場。",
    bc3Title: "3. 禁止的結果主張",
    bc3Body:
      "ANCAP 不主張等同抽脂的去脂、保證公分減少、減重、脂肪細胞破壞、blebbing、巨噬細胞清除、淋巴引流或數值成功率。2.45 / 5.8 GHz ISM 頻段為公開無線電頻譜素養，非 ANCAP 認證的器材規格。",
    bc4Title: "4. 僅限持照臨床人員",
    bc4Body:
      "微波醫美處置與後續照護屬臨床行為，僅能由相關法域持照人員執行。使用者不得依這些頁面自製家用微波施打頭或天線陣列。",
    bc5Title: "5. 篩檢與禁忌",
    bc5Body:
      "夥伴流程須篩檢植入物、心律調節器及其他植入電子裝置、妊娠、治療區金屬、熱傷害病史及其他診所定義禁忌。資訊圖上的接觸冷卻為架構註記，非 ANCAP 認證的無燒傷安全系統。",
    bc6Title: "6. 非醫療建議",
    bc6Body:
      "型錄文案、資訊圖、工作流程輸出與評論僅供資訊。不是診斷、處方或治療計畫。",
    bc7Title: "7. 健康資料",
    bc7Body:
      "識別資料與臨床病史應視為敏感。無合法基礎請勿上傳病歷。夥伴診所依其自身隱私聲明處理臨床資料。",
    bc8Title: "8. 與其他 AETERNA 軌道的關係",
    bc8Body:
      "器官列印、mRNA 諮詢、獸醫軌道與 Vinci 光艙仍分開。微波身體輪廓不授權 DIY CRISPR、LNP 配方、未持照微波硬體或抽脂，亦不改變 AETERNA 對診斷主張的禁令。",
    bc9Title: "9. 付款",
    bc9Body:
      "ACP 購買諮詢／療程簡報與夥伴配對——不是硬體所有權。退款見 /legal/refunds。",
    bc10Title: "10. 聯絡",
    bc10Body:
      "法律通知：legal@ancap.cloud。產品：/aeterna#microwave-body。",
    biofusionLink: "BioFusion 艙",
    hubCardBiofusion:
      "微操作艙：僅持照 ART／農業／BSL 夥伴。非生殖診所、非保證胚胎或妊娠、非基因編輯套件。",
    biofusionKicker: "法律／實驗室",
    biofusionTitle: "BioFusion 微操作艙——持照實驗室夥伴軌道",
    biofusionIntro:
      "ANCAP 截至 2026 年 9 月 12 日如何表述 BioFusion 艙。這些頁面出售 ACP 諮詢簡報，不是硬體，也不是 IVF 治療。",
    bf1Title: "1. 平台角色",
    bf1Body:
      "ANCAP 提供 ACP 結算與夥伴配對。ANCAP 不經營生殖診所、不製造推車、不執行 ICSI。",
    bf2Title: "2. 非上市醫療器材",
    bf2Body:
      "資訊圖為概念架構，非 EU MDR／FDA 器材型錄。",
    bf3Title: "3. 禁止的結果主張",
    bf3Body:
      "ANCAP 不主張保證妊娠。「基因操作」非 CRISPR 或病原體配方。",
    bf4Title: "4. 僅限持照操作者",
    bf4Body:
      "輔助生殖與 BSL 作業須持照。不得依這些頁面自製家用 ICSI。",
    bf5Title: "5. 篩檢與法律",
    bf5Body:
      "夥伴流程須遵守當地 ART、胚胎、GMO 與生物安全法規。",
    bf6Title: "6. 非醫療建議",
    bf6Body:
      "型錄與資訊圖僅供資訊，非診斷。",
    bf7Title: "7. 健康與基因資料",
    bf7Body:
      "識別資料屬敏感。無合法基礎請勿上傳病歷。",
    bf8Title: "8. 與其他 AETERNA 軌道的關係",
    bf8Body:
      "器官列印、DPSC 生物材料與其他軌道仍分開。BioFusion 不授權 DIY CRISPR。",
    bf9Title: "9. 付款",
    bf9Body:
      "ACP 購買簡報與夥伴配對。退款見 /legal/refunds。",
    bf10Title: "10. 聯絡",
    bf10Body:
      "法律通知：legal@ancap.cloud。產品：/aeterna#biofusion。",
    dpscLink: "DPSC 生物材料",
    hubCardDpsc:
      "智齒牙髓幹細胞擴增為生物材料：僅持照生物反應器，非完整器官。",
    dpscKicker: "法律／生物反應器",
    dpscTitle: "智齒 DPSC 生物材料——持照生物反應器軌道",
    dpscIntro:
      "ANCAP 截至 2026 年 9 月 12 日如何表述自體 DPSC 生物材料。",
    dp1Title: "1. 平台角色",
    dp1Body:
      "ANCAP 提供 ACP 結算與生物反應器配對。ANCAP 不拔牙、不培養細胞。",
    dp2Title: "2. 非上市細胞治療",
    dp2Body:
      "非 FDA BLA、非 EMA ATMP、非保證器官。",
    dp3Title: "3. 禁止的結果主張",
    dp3Body:
      "ANCAP 不主張完成器官。完整器官列印仍為 250,000 ACP。",
    dp4Title: "4. 僅限持照實驗室",
    dp4Body:
      "不得依這些頁面在家培養 DPSC。",
    dp5Title: "5. 同意與來源",
    dp5Body:
      "須記錄自體來源與牙科同意。",
    dp6Title: "6. 非醫療建議",
    dp6Body:
      "型錄僅供資訊。",
    dp7Title: "7. 健康資料",
    dp7Body:
      "牙科與細胞識別資料屬敏感。",
    dp8Title: "8. 與器官列印的關係",
    dp8Body:
      "DPSC 亦為 250,000 ACP 器官列印的備援來源。此 65,000 ACP SKU 不含器官。",
    dp9Title: "9. 付款",
    dp9Body:
      "ACP 購買簡報。退款見 /legal/refunds。",
    dp10Title: "10. 聯絡",
    dp10Body:
      "法律通知：legal@ancap.cloud。產品：/aeterna#dpsc-biomaterial。",
    vascularPlusLink: "Vascular Care+",
    hubCardVascularPlus:
      "無水 N2+O2 加光波：僅持照靜脈／美學夥伴。非血栓治療、非 CE/FDA 器材。",
    vascularPlusKicker: "法律／靜脈學",
    vascularPlusTitle: "Vascular Care+——持照靜脈夥伴軌道",
    vascularPlusIntro: "ANCAP 於 2026 年 9 月 12 日如何描述 Vascular Care+。這些頁面出售 ACP 簡報，非器材。",
    vp1Title: "1. 平台角色",
    vp1Body: "ANCAP 提供 ACP 結算、簡報與持照夥伴配對。ANCAP 不經營靜脈診所、不販售醫用氣體。",
    vp2Title: "2. 非上市醫材",
    vp2Body: "資訊圖為概念架構。非 EU MDR／FDA 手冊。",
    vp3Title: "3. 禁止結果宣稱",
    vp3Body: "ANCAP 不宣稱靜脈曲張治癒、水腫清除或血栓治療。",
    vp4Title: "4. 僅持照臨床人員",
    vp4Body: "血管與美學處置屬臨床行為。深靜脈血栓與肺栓塞仍屬急症。",
    vp5Title: "5. 篩檢",
    vp5Body: "夥伴流程須排除深靜脈血栓、植入物與妊娠。",
    vp6Title: "6. 非醫療建議",
    vp6Body: "目錄為資訊，非診斷。",
    vp7Title: "7. 健康資料",
    vp7Body: "識別資料視為敏感。",
    vp8Title: "8. 與其他軌道關係",
    vp8Body: "Vascular Care 與經皮手槍仍為獨立軌道。",
    vp9Title: "9. 付款",
    vp9Body: "ACP 購買簡報與夥伴配對。退款見 /legal/refunds。",
    vp10Title: "10. 聯絡",
    vp10Body: "法律通知：legal@ancap.cloud。產品：/aeterna#vascular-care-plus。",
    vascularLink: "Vascular Care",
    hubCardVascular:
      "超音波／射頻／熱：僅持照靜脈夥伴。非手術、非 CE/FDA 器材。",
    vascularKicker: "法律／靜脈學",
    vascularTitle: "Vascular Care——持照靜脈夥伴軌道",
    vascularIntro: "ANCAP 於 2026 年 9 月 12 日如何描述 Vascular Care。",
    vu1Title: "1. 平台角色",
    vu1Body: "ANCAP 提供 ACP 結算、簡報與夥伴配對。",
    vu2Title: "2. 非上市醫材",
    vu2Body: "資訊圖為概念架構。",
    vu3Title: "3. 禁止結果宣稱",
    vu3Body: "ANCAP 不宣稱保證管徑改變。",
    vu4Title: "4. 僅持照臨床人員",
    vu4Body: "超音波、射頻與熱處置屬臨床行為。",
    vu5Title: "5. 篩檢",
    vu5Body: "夥伴流程須排除植入物、心律調節器與妊娠。",
    vu6Title: "6. 非醫療建議",
    vu6Body: "目錄為資訊。",
    vu7Title: "7. 健康資料",
    vu7Body: "識別資料視為敏感。",
    vu8Title: "8. 與其他軌道關係",
    vu8Body: "Vascular Care+ 與經皮手槍仍為獨立軌道。",
    vu9Title: "9. 付款",
    vu9Body: "ACP 購買簡報與夥伴配對。",
    vu10Title: "10. 聯絡",
    vu10Body: "法律通知：legal@ancap.cloud。產品：/aeterna#vascular-care。",
    transdermalLink: "經皮手槍",
    hubCardTransdermal:
      "無針氣霧加載氣：僅持照診所。非處方配藥、非保證劑量。",
    transdermalKicker: "法律／診所",
    transdermalTitle: "無針經皮手槍——持照診所軌道",
    transdermalIntro: "ANCAP 於 2026 年 9 月 12 日如何描述無針經皮手槍。",
    td1Title: "1. 平台角色",
    td1Body: "ANCAP 提供 ACP 結算與夥伴配對。ANCAP 不調劑、不注射。",
    td2Title: "2. 非上市醫材",
    td2Body: "資訊圖為概念架構。",
    td3Title: "3. 禁止結果宣稱",
    td3Body: "ANCAP 不宣稱保證劑量或美容結果。",
    td4Title: "4. 僅持照臨床人員",
    td4Body: "經皮活性物給藥屬臨床行為。",
    td5Title: "5. 合法物質",
    td5Body: "夥伴流程僅能使用診所管轄地合法物質。",
    td6Title: "6. 非醫療建議",
    td6Body: "目錄為資訊。",
    td7Title: "7. 健康資料",
    td7Body: "識別資料視為敏感。",
    td8Title: "8. 與其他軌道關係",
    td8Body: "Vascular Care 軌道仍為獨立。",
    td9Title: "9. 付款",
    td9Body: "ACP 購買簡報與夥伴配對。",
    td10Title: "10. 聯絡",
    td10Body: "法律通知：legal@ancap.cloud。產品：/aeterna#transdermal。",
    mReceptorLink: "M 受體訂閱",
    hubCardMReceptor:
      "持照診所訂閱：貼片、離子導入、吸入器與迷走神經鄰近神經調節。非調劑、非 CE/FDA 器材、非治療主張。",
    mReceptorKicker: "法律／診所／訂閱",
    mReceptorTitle: "M 受體遞送訂閱——持照診所軌道",
    mReceptorIntro:
      "ANCAP 於 2026 年 9 月 12 日如何描述多模組 M 受體訂閱。這些頁面出售 ACP 期間保留金，非硬體所有權，亦非家用套件。",
    mr1Title: "1. 平台角色",
    mr1Body:
      "ANCAP 提供 ACP 結算、簡報與持照夥伴配對。ANCAP 不製造模組，亦不調劑毒蕈鹼促效／拮抗劑。",
    mr2Title: "2. 非上市醫療器材",
    mr2Body: "資訊圖為概念架構，非 EU MDR／FDA 型錄。",
    mr3Title: "3. 禁止結果主張",
    mr3Body:
      "ANCAP 不主張治療帕金森、氣喘、COPD、心律不整、青光眼或眼壓。",
    mr4Title: "4. 僅持照臨床人員",
    mr4Body: "貼片、離子導入、吸入與神經調節屬臨床行為。請勿依本頁自製家用套件。",
    mr5Title: "5. 合法物質與 M1–M5 素養",
    mr5Body: "資訊圖 M1–M5 表為受體素養，非劑量指引。ANCAP 不公布配方。",
    mr6Title: "6. 非醫療建議",
    mr6Body: "目錄為資訊。",
    mr7Title: "7. 健康資料",
    mr7Body: "識別資料視為敏感。",
    mr8Title: "8. 與其他軌道關係",
    mr8Body: "經皮手槍與 Vascular Care 軌道仍為獨立。",
    mr9Title: "9. 付款",
    mr9Body:
      "ACP 購買期間保留金（每月 12,000／季繳 32,000／年繳 108,000）與夥伴配對。",
    mr10Title: "10. 聯絡",
    mr10Body: "法律通知：legal@ancap.cloud。產品：/aeterna#m-receptor。",
    oxygenCarrierLink: "氧載體",
    hubCardOxygenCarrier:
      "持照生物反應器／輸血醫學簡報：血紅蛋白囊泡或 PFC 乳劑架構。非血液製品、非調劑、非 CE/FDA 氧氣治療品。",
    oxygenCarrierKicker: "法律／生物反應器",
    oxygenCarrierTitle: "人工氧載體 — 持照生物反應器軌道",
    oxygenCarrierIntro:
      "ANCAP 於 2026 年 9 月 12 日對人工氧氣轉運 SKU 的說明。這些頁面出售 ACP 諮詢簡報，非血液製品。",
    ox1Title: "1. 平台角色",
    ox1Body: "ANCAP 提供 ACP 結算、諮詢簡報與持照夥伴配對。ANCAP 不製造血紅蛋白囊泡或 PFC 乳劑。",
    ox2Title: "2. 非血液製品",
    ox2Body: "資訊圖為概念架構。非 EU MDR／FDA 型錄。",
    ox3Title: "3. 禁止的結果主張",
    ox3Body: "ANCAP 不主張替代輸血或治療貧血。",
    ox4Title: "4. 僅持照夥伴",
    ox4Body: "任何實體製造均為持照生物反應器行為。請勿自製家用乳劑。",
    ox5Title: "5. 資訊圖素養，非 SOP",
    ox5Body: "核心、外殼、緩衝與品管為架構素養。ANCAP 不公布配方。",
    ox6Title: "6. 非醫療建議",
    ox6Body: "目錄為資訊。",
    ox7Title: "7. 健康資料",
    ox7Body: "識別資料視為敏感。",
    ox8Title: "8. 與其他軌道關係",
    ox8Body: "器官列印、DPSC、M 受體與合成血／黑曼巴仍為獨立。見 /legal/synthetic-blood-mamba。",
    ox9Title: "9. 付款",
    ox9Body: "ACP 以 92,000 ACP 購買諮詢簡報與夥伴配對。",
    ox10Title: "10. 聯絡",
    ox10Body: "法律通知：legal@ancap.cloud。產品：/aeterna#oxygen-carrier。",
    syntheticBloodMambaLink: "合成血／黑曼巴",
    hubCardSyntheticBloodMamba:
      "持照生物反應器簡報：合成血架構與改性黑曼巴胜肽識讀。非血液製品、非毒液複配、非 CE/FDA 治療品。",
    syntheticBloodMambaKicker: "法律／生物反應器",
    syntheticBloodMambaTitle: "合成血／黑曼巴 — 持照生物反應器軌道",
    syntheticBloodMambaIntro:
      "ANCAP 於 2026 年 9 月 12 日對合成血／黑曼巴架構 SKU 的說明。這些頁面販售 ACP 諮詢簡報，不是血液製品或毒液胜肽。",
    sbm1Title: "1. 平台角色",
    sbm1Body:
      "ANCAP 提供 ACP 結算、諮詢簡報與持照合作夥伴媒合。ANCAP 不製造血紅蛋白囊泡、PFC 乳劑或毒液胜肽。",
    sbm2Title: "2. 非血液製品",
    sbm2Body:
      "資訊圖為概念架構。非 EU MDR／FDA 型錄，亦非 ANCAP 販售的 CE 標示治療品。",
    sbm3Title: "3. 禁止結果宣稱",
    sbm3Body:
      "ANCAP 不宣稱取代輸血，亦不保證血管舒張、抗凝、神經保護或長壽。",
    sbm4Title: "4. 僅限持照合作夥伴",
    sbm4Body:
      "任何實體製造或臨床使用均屬持照生物反應器／輸血醫學行為。",
    sbm5Title: "5. 資訊圖識讀，非 SOP",
    sbm5Body:
      "核心、殼層、聚合物網、黑曼巴胜肽圖示與「控制劑量」標註為架構識讀。ANCAP 不發布毒素或 HBOC／PFC 配方。",
    sbm6Title: "6. 非醫療建議",
    sbm6Body:
      "目錄文案僅供參考。非診斷、處方或治療計畫。",
    sbm7Title: "7. 健康資料",
    sbm7Body:
      "將識別碼與臨床病史視為敏感資料。",
    sbm8Title: "8. 與其他軌道之關係",
    sbm8Body:
      "人工氧載體 SKU（92,000 ACP）仍為獨立產品。",
    sbm9Title: "9. 付款",
    sbm9Body:
      "ACP 以 98,000 ACP 購買諮詢簡報與合作夥伴媒合——非血袋。退款見 /legal/refunds。",
    sbm10Title: "10. 聯絡",
    sbm10Body:
      "法律通知：legal@ancap.cloud。產品：/aeterna#synthetic-blood-mamba。",
    footerSyntheticBloodMamba: "合成血／黑曼巴",

    adhdSupportLink: "ADHD／注意力不足過動支援",
    hubCardAdhdSupport:
      "持照臨床醫師 ADHD 支援素養簡報。非診斷、非處方、非興奮劑配製、非保證學業或財務結果。",
    adhdSupportKicker: "法律／臨床醫師／ADHD 支援素養",
    adhdSupportTitle: "ADHD 支援 — 持照臨床醫師夥伴軌道",
    adhdSupportIntro:
      "ANCAP 於 2026 年 9 月 13 日對 ADHD 支援 SKU 的表述。這些頁面販售 ACP 結算簡報，而非診斷、處方、興奮劑或致富保證。",
    adhd1Title: "1. 平台角色",
    adhd1Body:
      "ANCAP 提供 ACP 結算、簡報與持照夥伴媒合。ANCAP 不診斷 ADHD、不開方、不配製興奮劑，亦不執業兒童精神醫學或神經科。",
    adhd2Title: "2. 非診斷、非治療",
    adhd2Body:
      "資訊圖為動機與教育素養。非臨床指引，亦非 ANCAP 販售之治療。",
    adhd3Title: "3. 禁止結果宣稱",
    adhd3Body:
      "ANCAP 不保證安靜行為、成績、職涯、創業或成為億萬富翁。「通往十億」階梯僅為動機素養。",
    adhd4Title: "4. 僅持照臨床醫師",
    adhd4Body:
      "任何評估、治療或用藥決定均為持照臨床醫師於篩檢後之行為。這些頁面不可取代專業照護。",
    adhd5Title: "5. 資訊圖素養，非協議",
    adhd5Body:
      "專注、規劃、情緒、關係、自尊與風險圖示為支援素養。ANCAP 不公開興奮劑劑量或治療 SOP。",
    adhd6Title: "6. 非醫療建議",
    adhd6Body:
      "目錄文案僅供資訊。非診斷、非處方、非治療計畫。",
    adhd7Title: "7. 健康與兒童資料",
    adhd7Body:
      "識別碼與臨床病史屬敏感資料。無合法基礎請勿上傳紀錄。",
    adhd8Title: "8. 與其他軌道之關係",
    adhd8Body:
      "長壽軌道仍為獨立。此 SKU 不授權配製或未持照執業。",
    adhd9Title: "9. 付款",
    adhd9Body:
      "ACP 以 42,000 ACP 購買簡報與夥伴媒合。退款依 /legal/refunds。",
    adhd10Title: "10. 聯絡",
    adhd10Body:
      "法律通知：legal@ancap.cloud。產品：/aeterna#adhd-support。",
    footerAdhdSupport: "ADHD 支援",

    pulmopureLink: "PulmoPure",
    hubCardPulmopure:
      "持照肺科訂閱 PulmoPure 氣體振動素養。非 CE/FDA 器材、非臭氧治療、非保證潔淨肺部。",
    pulmopureKicker: "法律／肺科",
    pulmopureTitle: "PulmoPure — 持照肺科訂閱軌道",
    pulmopureIntro:
      "ANCAP 於 2026 年 9 月 13 日對 PulmoPure 訂閱 SKU 的表述。",
    pp1Title: "1. 平台角色",
    pp1Body:
      "ANCAP 提供 ACP 結算與夥伴媒合。ANCAP 不製造 PulmoPure，亦不執業肺科。",
    pp2Title: "2. 非於此販售之醫療器材",
    pp2Body:
      "資訊圖為概念架構。非 ANCAP 之 CE/FDA 型錄。",
    pp3Title: "3. 禁止結果宣稱",
    pp3Body:
      "ANCAP 不保證清除焦油或減少咳嗽。",
    pp4Title: "4. 臭氧與醫用氣體",
    pp4Body:
      "圖上氣體混合為夥伴協議素養。ANCAP 不販售臭氧治療。",
    pp5Title: "5. 僅持照臨床醫師",
    pp5Body:
      "實體療程僅在篩檢後由持照臨床醫師進行。",
    pp6Title: "6. 模式與配件",
    pp6Body:
      "Soft／Standard／Intensive 為配件素養。",
    pp7Title: "7. 非醫療建議",
    pp7Body:
      "目錄文案僅供資訊。",
    pp8Title: "8. 與其他軌道之關係",
    pp8Body:
      "M 受體與氧載體仍為獨立。",
    pp9Title: "9. 付款",
    pp9Body:
      "ACP 以每月 14,000 ACP 購買訂閱簡報。退款依 /legal/refunds。",
    pp10Title: "10. 聯絡",
    pp10Body:
      "法律通知：legal@ancap.cloud。產品：/aeterna#pulmopure。",
    footerPulmopure: "PulmoPure",

    barsukLink: "Project Barsuk",
    hubCardBarsuk:
      "持照安全通訊夥伴簡報：Barsuk 量子筆素養。非 Parker 產品、非武器、非不可破解加密。",
    barsukKicker: "法律／安全通訊",
    barsukTitle: "Barsuk 量子筆 — 持照安全通訊軌道",
    barsukIntro: "ANCAP 於 2026 年 9 月 13 日對 Barsuk SKU 的表述。",
    bk1Title: "1. 平台角色",
    bk1Body: "ANCAP 提供 ACP 結算與夥伴媒合。與 Parker 無關。",
    bk2Title: "2. 非 Parker 或 CE/FDA 產品",
    bk2Body: "資訊圖為虛構／架構素養。",
    bk3Title: "3. 禁止結果宣稱",
    bk3Body: "不宣稱不可破解加密。",
    bk4Title: "4. 非武器",
    bk4Body: "不授權武器系統。",
    bk5Title: "5. 僅持照夥伴",
    bk5Body: "硬體評估僅在篩檢後由夥伴進行。",
    bk6Title: "6. 資訊圖素養",
    bk6Body: "非製造 SOP。",
    bk7Title: "7. 非法律建議",
    bk7Body: "目錄文案僅供資訊。",
    bk8Title: "8. 與其他軌道之關係",
    bk8Body: "Perimeter 仍為獨立。",
    bk9Title: "9. 付款",
    bk9Body: "ACP 以 36,000 ACP 購買簡報。退款依 /legal/refunds。",
    bk10Title: "10. 聯絡",
    bk10Body: "legal@ancap.cloud · /aeterna#barsuk",
    footerBarsuk: "Project Barsuk",

    teleportEarphonesLink: "傳送耳機",
    hubCardTeleportEarphones:
      "AIRPODS T-2026 醫護後送虛構夥伴簡報。非 Apple 產品、非真實傳送、非軍事武器。",
    teleportEarphonesKicker: "法律／醫護後送虛構",
    teleportEarphonesTitle: "傳送耳機 — 持照醫護後送虛構軌道",
    teleportEarphonesIntro: "ANCAP 於 2026 年 9 月 13 日對傳送耳機 SKU 的表述。",
    tp1Title: "1. 平台角色",
    tp1Body: "ANCAP 提供 ACP 與夥伴媒合。與 Apple 無關。",
    tp2Title: "2. 非 Apple 產品",
    tp2Body: "AIRPODS T-2026 為虛構品牌。",
    tp3Title: "3. 非真實傳送",
    tp3Body: "資訊圖距離為科幻素養。",
    tp4Title: "4. 非軍事武器",
    tp4Body: "重點為救援／後送，非進攻。",
    tp5Title: "5. 僅持照夥伴",
    tp5Body: "評估僅在篩檢後由夥伴進行。",
    tp6Title: "6. 資訊圖素養",
    tp6Body: "非製造 SOP。",
    tp7Title: "7. 非醫療建議",
    tp7Body: "文案為虛構素養。",
    tp8Title: "8. 與其他軌道之關係",
    tp8Body: "人道軌道仍為獨立。",
    tp9Title: "9. 付款",
    tp9Body: "ACP 以 58,000 ACP 購買簡報。退款依 /legal/refunds。",
    tp10Title: "10. 聯絡",
    tp10Body: "legal@ancap.cloud · /aeterna#teleport-earphones",
    footerTeleportEarphones: "傳送耳機",

    installationProjectLink: "安裝專案",
    hubCardInstallationProject:
      "持照新生兒科／營養夥伴簡報。非 ANCAP 配方奶、非家用 HBO、非結果保證。",
    installationProjectKicker: "法律／新生兒／嬰兒營養素養",
    installationProjectTitle: "安裝專案 — 持照新生兒夥伴軌道",
    installationProjectIntro:
      "ANCAP 於 2026 年 9 月 13 日對「安裝專案」SKU 的定位：販售 ACP 夥伴簡報，而非配方奶或 CE/FDA 高壓艙。",
    ip1Title: "1. 平台角色",
    ip1Body:
      "ANCAP 提供 ACP 結算、簡報與持照夥伴配對。ANCAP 不製造配方奶，亦不執業新生兒科。",
    ip2Title: "2. 非 ANCAP 配方奶",
    ip2Body:
      "成分與非基改／無防腐劑圖示為夥伴素養，非 ANCAP 市售配方 SKU。",
    ip3Title: "3. 非 CE/FDA 高壓艙",
    ip3Body:
      "1.5–2.0 ATA 與 36–37 °C 為架構素養。ANCAP 不販售已核准高壓艙。",
    ip4Title: "4. 禁止結果主張",
    ip4Body:
      "ANCAP 不保證降低佝僂病、貧血或發育遲緩。",
    ip5Title: "5. 僅限持照夥伴",
    ip5Body:
      "生產與臨床療程為夥伴行為，須經篩檢。",
    ip6Title: "6. GMP 素養，非 ANCAP 證書",
    ip6Body:
      "GMP 提及描述夥伴期待，非 ANCAP 核發核准。",
    ip7Title: "7. 非醫療建議",
    ip7Body:
      "目錄文案為架構素養，非處方。",
    ip8Title: "8. 與保險的關係",
    ip8Body:
      "/insurance 的 neonatal_install 可對應安裝專案進件。非醫療疏失保單。",
    ip9Title: "9. 付款",
    ip9Body:
      "ACP 以 72,000 ACP 購買簡報。退款見 /legal/refunds。",
    ip10Title: "10. 聯絡",
    ip10Body:
      "legal@ancap.cloud · /aeterna#installation-project · /insurance",
    footerInstallationProject: "安裝專案",

    dnaPheromonePerfumeLink: "DNA 費洛蒙香水",
    hubCardDnaPheromonePerfume: "按瓶販售：經持照化妝品夥伴的 DNA 匹配費洛蒙香氛 — 非藥品、非催情宣稱。",
    dnaPheromonePerfumeKicker: "法律／化妝品香氛素養",
    dnaPheromonePerfumeTitle: "DNA 匹配費洛蒙香水 — 法律聲明",
    dnaPheromonePerfumeIntro: "2026 年 9 月 13 日。銷售單位為一瓶（8,900 ACP）。",
    ppf1Title: "1. 平台角色",
    ppf1Body: "ANCAP 以 ACP 結算並向持照化妝品／香水夥伴發出交接。實體灌裝由夥伴完成。",
    ppf2Title: "2. DNA 匹配",
    ppf2Body: "可選 DNA vault 內容雜湊可提供嗅覺輪廓素養。基因組位元組不會上傳至 ANCAP。",
    ppf3Title: "3. 銷售單位",
    ppf3Body: "每筆訂單恰為一瓶。額外瓶數需另下單。",
    ppf4Title: "4. 非藥品",
    ppf4Body: "非藥品、非 CE/FDA 費洛蒙治療、非受控物質調配。",
    ppf5Title: "5. 無催情宣稱",
    ppf5Body: "ANCAP 不保證吸引、關係或性結果。",
    ppf6Title: "6. 夥伴審查",
    ppf6Body: "香水夥伴須通過 ANCAP 審查後方可交接。",
    ppf7Title: "7. 皮膚安全",
    ppf7Body: "貼膚測試與成分揭露依當地化妝品法由持照夥伴負責。",
    ppf8Title: "8. 未成年人",
    ppf8Body: "非針對兒童行銷。適用當地香水購買年齡規定。",
    ppf9Title: "9. 退款",
    ppf9Body: "一旦夥伴開始灌裝，ACP 結算依 ANCAP 退款政策；未使用的 draft intent 可取消。",
    ppf10Title: "10. 聯絡",
    ppf10Body: "問題：legal@ancap.cloud。產品：/aeterna#dna-pheromone-perfume。",

    counselLink: "全球法律顧問",
    hubCardCounsel: "ACP 法律簡報並媒合持照律師至任何覆蓋國家 — ANCAP 不是律師事務所。",
    counselKicker: "法律／全球顧問 desk",
    counselTitle: "全球法律服務 — 法律聲明",
    counselIntro: "2026 年 9 月 14 日。ANCAP 不執業，亦不形成律師—客戶關係。",
    cn1Title: "1. 平台角色",
    cn1Body: "ANCAP 以 ACP 結算司法管轄媒合與 intake 簡報，並向獨立持照律師交接。ANCAP 不是律師事務所。",
    cn2Title: "2. 與 ANCAP 無律師—客戶關係",
    cn2Body: "支付 ACP 不會與 ANCAP、營運方或 AI 系統形成律師—客戶關係。",
    cn3Title: "3. 當地律師獨立",
    cn3Body: "媒合律師保持獨立，自行訂立委任、後續費用與依當地職業規範提供意見。",
    cn4Title: "4. 全球覆蓋",
    cn4Body: "Desk 旨在於 /counsel 所列任一覆蓋國家或地區媒合律師。",
    cn5Title: "5. 非 ANCAP 法律意見",
    cn5Body: "目錄文案與 workflow 產物僅為素養／intake，非法律意見。",
    cn6Title: "6. 無結果保證",
    cn6Body: "ANCAP 不保證簽證、公司設立、判決或稅務立場。",
    cn7Title: "7. 制裁與利益衝突",
    cn7Body: "客戶與律師須自行進行制裁與利益衝突檢查。",
    cn8Title: "8. 保密",
    cn8Body: "未經律師指示，請勿將 privileged 文件上傳至 ANCAP workflow。",
    cn9Title: "9. 費用",
    cn9Body: "/counsel 上的 ACP 價格涵蓋 desk 簡報與交接。後續律師費另行計收。",
    cn10Title: "10. 聯絡",
    cn10Body: "問題：legal@ancap.cloud。產品：/counsel。",

    
    darkMatterLink: "暗物質拍賣",
    hubCardDarkMatter: "暗物質暈／纖維／探測器素養的象徵性 ACP 宇宙學標題——非實體暗物質所有權。",
    darkMatterKicker: "法律／暗物質拍賣",
    darkMatterTitle: "暗物質拍賣 — 法律聲明",
    darkMatterIntro: "2026 年 9 月 14 日。ANCAP 暗物質標的僅為象徵性 ACP 標題 RFQ 與宇宙學素養。",
    dm1Title: "1. 平台角色",
    dm1Body: "ANCAP 以 ACP 結算象徵性暗物質標題與探測器／宇宙學簡報。ANCAP 不出售或移轉實體暗物質。",
    dm2Title: "2. 無實體所有權",
    dm2Body: "得標不構成對任何實體暗物質粒子、暈質量或宇宙場之所有、占有、保管或開採權。",
    dm3Title: "3. 外空條約／主權",
    dm3Body: "標的不授予主權、領土主張或 Outer Space Treaty 下之權利。",
    dm4Title: "4. 非探測證書",
    dm4Body: "目錄文案與出價收據不是科學探測證書、實驗室預約或同儕審查主張。",
    dm5Title: "5. 探測器夥伴",
    dm5Body: "探測器主題標的僅為素養／交接。持照實驗室夥伴獨立訂約。",
    dm6Title: "6. 無結果保證",
    dm6Body: "ANCAP 不保證發現、探測曝光、發表或投資報酬。",
    dm7Title: "7. 相關交易台",
    dm7Body: "天體／輻射標題在 /galaxy。暗物質宇宙學標題在 /dark-matter。",
    dm8Title: "8. 保險",
    dm8Body: "可選參數化保障 dark_matter_title 見 /insurance。保單不創造實體暗物質所有權。",
    dm9Title: "9. 退款",
    dm9Body: "出價 ACP 結算依 ANCAP 退款政策；見 /legal/refunds。",
    dm10Title: "10. 聯絡",
    dm10Body: "問題：legal@ancap.cloud。產品：/dark-matter。",

    stardustLink: "Stardust 天氣控制",
    hubCardStardust:
      "ACP 全球天氣控制／災害監測夥伴素養。非即時地球工程控制台，非結果保證。",
    stardustKicker: "法律／天氣控制／地球監測",
    stardustTitle: "StardustSRT 天氣控制 — 持照夥伴軌道",
    stardustIntro:
      "ANCAP 於 2026 年 9 月 13 日對 Stardust 桌面的定位。",
    sd1Title: "1. 平台角色",
    sd1Body: "ANCAP 提供 ACP 結算與夥伴配對，不取代國家氣象服務。",
    sd2Title: "2. 預設未與 StardustSRT 加盟",
    sd2Body: "公開素材為素養參考；加盟須另訂契約。",
    sd3Title: "3. 非即時 Weather Control 控制台",
    sd3Body: "/stardust 開關為產品素養 UI。",
    sd4Title: "4. 禁止結果主張",
    sd4Body: "ANCAP 不保證降雨、減弱風暴或氣候結果。",
    sd5Title: "5. 非官方氣象警報",
    sd5Body: "關鍵決策請用 AccuWeather 或國家氣象單位。",
    sd6Title: "6. 僅限持照夥伴",
    sd6Body: "天氣作業為夥伴行為，須經篩檢。",
    sd7Title: "7. 資訊圖非作戰 SOP",
    sd7Body: "架構素養，非武器化天氣指令。",
    sd8Title: "8. 保險關係",
    sd8Body: "/insurance 的 weather_control 可對應 Stardust 進件。",
    sd9Title: "9. 付款",
    sd9Body:
      "天氣控制定價為 TECH 拍賣（/tech）。起拍：18,000 / 28,000 / 58,000 / 45,000 ACP。經 AuctionEscrow 結算——非固定結帳價，亦非天氣結果保證。",
    sd10Title: "10. 聯絡",
    sd10Body: "legal@ancap.cloud · /stardust · /insurance",
    footerStardust: "Stardust 天氣控制",


    hubCardRefunds: "何時收費為最終、何時可因失敗執行取得點數，以及如何申請審查。",
    hubCardWelcomeGrant:
      "註冊時 100 ACP 為促銷使用額度（名義 $100 標示），非捐款、非美元現金、不可抵稅。",
    hubCardHumanitarian:
      "以 ACP 結算之糧食、飲水、營養、保暖衣物、醫藥用品與謀生媒合簡報——紅十字／紅新月國家會社桌面列名，非已簽署之紅十字國際委員會／紅十字與紅新月會國際聯合會合約，亦非 135-FZ 慈善機構。",
    hubCardCyber: "公開支持集體網路防禦。",
    hubCardClarity: "完全同意美國 Digital Asset Market Clarity Act（CLARITY Act）。",
    hubCardCompliance: "MiCA 安全表述與 on-ramp／橋接風險說明。",
    hubContactTitle: "客戶聯絡",
    hubContactBody: "法律：legal@ancap.cloud。隱私：privacy@ancap.cloud。支援：support@ancap.cloud。在適用法律要求時，我們力求於 30 天內確認隱私請求。",
    hubDisclaimer: "這些頁面是 ancap.cloud 現行客戶法律通知，不能取代您自己的律師或稅務顧問。您居住國不可拋棄的強制消費者權利不受影響。",
    termsKicker: "法律協議",
    termsTitle: "ANCAP 使用者協議",
    termsIntro: "本條款規範 ancap.cloud 與相關 ANCAP 服務之使用。建立帳戶、連接錢包、購買或執行工作流程、刊登、使用 API 或以其他方式使用服務，即表示您同意本條款。",
    t1Title: "1. 當事人與接受",
    t1Body: "本條款為您與 ancap.cloud 之 ANCAP 平台營運者之間的協議。若您代表組織使用，即表示您有權使該組織受約束。",
    t2Title: "2. 營運者與通知",
    t2Body: "服務由 ANCAP 平台營運者透過 ancap.cloud 提供。聯絡：legal@ancap.cloud、privacy@ancap.cloud、support@ancap.cloud。公司登記資料於可用時公布於法律中心。",
    t3Title: "3. 資格",
    t3Body: "您須具有締約能力，且不得在法律、制裁或平台限制禁止時使用 ANCAP。",
    t4Title: "4. 服務",
    t4Body: "ANCAP 提供付費 AI 工作流程執行、刊登、創作者工具、ACP 錢包／會計、付費 API 與證明收據等軟體基礎設施。ANCAP 非銀行或投資基金。",
    t5Title: "5. ACP、點數、付款與退款",
    t5Body: "ACP 為主要記帳與支付單位。除非另有書面政策，付費工作流程自執行開始即視為消耗。詳見「付款與退款」頁。",
    t6Title: "6. AI 輸出與審查義務",
    t6Body: "AI 輸出可能不正確。ANCAP 銷售執行產物，非投資、法律或稅務建議。依賴前請自行審查。",
    t7Title: "7. 創作者刊登",
    t7Body: "創作者可提交工作流程。ANCAP 可審查、拒絕、暫停或移除刊登。創作者對刊登合法性負責。",
    t8Title: "8. API 使用",
    t8Body: "API 使用者須保護金鑰並遵守限額與政策。ANCAP 可限制或封鎖風險請求。",
    t9Title: "9. 禁止行為",
    t9Body: "不得將 ANCAP 用於詐欺、規避制裁、洗錢、攻擊、惡意軟體、侵害隱私／智財、操縱市場或未授權存取。",
    t10Title: "10. 智慧財產",
    t10Body: "ANCAP 保留平台與品牌權利。您保留合法輸入內容權利，並授予 ANCAP 營運服務所需授權。",
    t11Title: "11. 隱私、Cookie 與資料",
    t11Body: "個人資料與 Cookie 依隱私權聲明與 Cookie 政策處理。",
    t12Title: "12. 免責與責任限制",
    t12Body: "在法律允許範圍內，服務按「現況」提供。除法律不可限制之責任外，ANCAP 總責任以上列較高者為限：(a) 請求前三個月就該付費功能支付之費用，或 (b) 100 歐元。",
    t13Title: "13. 暫停與終止",
    t13Body: "ANCAP 可因安全、濫用、欠款、詐欺或法律風險暫停存取。您可隨時停止使用，但仍須履行未完成義務。",
    t14Title: "14. 變更",
    t14Body: "ANCAP 可更新本條款。生效後繼續使用即表示接受，但強制法另有規定者除外。",
    t15Title: "15. 集體網路防禦",
    t15Body: "ANCAP 認同 OpenAI 關於集體網路防禦之公開信。攻擊性網路協助不在產品範圍內。",
    t16Title: "16. 風險確認",
    t16Body: "使用服務即表示您已閱讀風險揭露頁。不承諾報酬或價格上漲。",
    t17Title: "17. 準據法與爭議",
    t17Body: "本條款受適用於 ancap.cloud ANCAP 營運者之法律拘束。提起主張前請先聯絡 legal@ancap.cloud。",
    t18Title: "18. 聯絡與強制權利",
    t18Body: "條款問題：legal@ancap.cloud。支援：support@ancap.cloud。不可拋棄之強制權利不受影響。",
    t19Title: "19. CLARITY Act — 完全同意",
    t19Body: "ANCAP 聲明完全同意 Digital Asset Market Clarity Act（CLARITY Act / H.R. 3633）之目標。此為公共政策背書，並非主張該法案已成為法律。全文見 CLARITY Act 頁。",
    t20Title: "20. 長壽、器官列印與獸醫軌道",
    t20Body:
      "AETERNA 與冷凍服務台工作流程出售分析、簡報與持照夥伴交接。非醫療或獸醫治療、非已上市醫療器材，亦不保證器官列印或組織復活。不得利用 ANCAP 取得濕實驗協議、CRISPR 設計、基因合成、LNP 配方或對人或動物的未授權處置。見 /legal/vet-regen。",
    t21Title: "21. 人道援助服務台",
    t21Body:
      "/humanitarian 服務台出售 ACP 簡報與夥伴交接（糧食、飲水、營養、保暖衣物、經持照通路之醫藥用品、謀生媒合）。ANCAP 非 135-FZ 慈善機構，亦非歐盟／英國／美國之免稅慈善。IFRC 或國家紅十字會社列名非已簽署夥伴關係、非標誌授權。此台 ACP 不可抵稅，除非合格慈善機構另行開立收據。與 100 ACP 註冊贈與額度有別。見 /legal/humanitarian。",
    privacyKicker: "隱私權聲明",
    privacyTitle: "ANCAP 如何處理客戶資料",
    privacyIntro: "本聲明說明 ancap.cloud 之 ANCAP 平台營運者如何處理個人資料。",
    p1Title: "1. 控管者與聯絡",
    p1Body: "控管者：ancap.cloud 之 ANCAP 平台營運者。privacy@ancap.cloud · legal@ancap.cloud · support@ancap.cloud。",
    p2Title: "2. 處理的資料",
    p2Body: "帳戶、工作階段、錢包地址、付款／API 中繼資料、工作流程輸入輸出、收據、日誌、Cookie 與同意紀錄。",
    p3Title: "3. 目的與法律依據",
    p3Body: "履行契約、正當利益（安全／防詐）、可選分析之同意，以及法律義務。",
    p4Title: "4. 加密、證明與公開資料",
    p4Body: "區塊鏈與公開證明資料可能無法刪除。",
    p5Title: "5. AI 供應商",
    p5Body: "工作流程輸入可能送至設定之 LLM 供應商。未經核准請勿提交高度敏感資料。",
    p6Title: "6. 保存",
    p6Body: "依營運、會計、爭議與法律需要保存；之後在可行範圍刪除或匿名化。",
    p7Title: "7. 您的權利",
    p7Body: "依適用法律，您可請求近用、更正、刪除、限制、可攜或反對。聯絡 privacy@ancap.cloud。",
    p8Title: "8. 國際傳輸",
    p8Body: "供應商可能在其他國家處理資料；必要時採用適當傳輸保障。",
    privacySecurityTitle: "安全與集體網路防禦",
    privacySecurityBody: "ANCAP 處理安全日誌以防止詐欺與濫用。詳情：",
    privacyContactTitle: "如何行使權利",
    privacyContactBody: "寄至 privacy@ancap.cloud。在適用法律規定時，我們力求 30 天內回覆。",
    cookiesKicker: "Cookie 政策",
    cookiesTitle: "Cookie 與儲存偏好",
    cookiesIntro: "ANCAP 使用同意橫幅，提供同等機會接受、拒絕或自訂可選儲存。",
    c1Title: "嚴格必要",
    c1Examples: "同意記憶、登入／工作階段、安全、錢包狀態、語言、主題。",
    c1Consent: "網站運作所需時，無需可選同意即可使用。",
    c2Title: "分析",
    c2Examples: "漏斗、效能、錯誤診斷、工作流程轉換。",
    c2Consent: "預設關閉；僅在需要同意時於同意後啟用。",
    c3Title: "行銷與歸因",
    c3Examples: "活動來源、推薦、合作夥伴代碼。",
    c3Consent: "預設關閉；僅在需要同意時於同意後啟用。",
    cookiesExamples: "示例：",
    cookiesConsent: "同意：",
    cookiesRegTitle: "法規參考",
    cookiesRegBody: "歐盟與英國通常區分嚴格必要儲存與可選分析／行銷儲存。",
    cookiesEc: "European Commission cookie policy example",
    cookiesEdpb: "EDPB consent guidelines",
    riskKicker: "客戶揭露",
    riskTitle: "ANCAP 客戶風險揭露",
    riskIntro: "購買工作流程、持有 ACP 或依賴 AI 輸出前請閱讀。",
    r1Title: "1. 非投資產品",
    r1Body: "ACP 為效用／記帳單位。不承諾價格上漲或報酬。",
    r2Title: "2. AI 輸出風險",
    r2Body: "結果可能錯誤，不能取代專業建議。",
    r3Title: "3. 錢包風險",
    r3Body: "遺失種子／金鑰可能導致永久損失。",
    r4Title: "4. 橋接與第三方軌道",
    r4Body: "跨鏈橋與支付軌道具有合約、託管與交易對手風險。",
    r5Title: "5. 可用性",
    r5Body: "服務可能中斷；實驗功能不構成審計保證。",
    r6Title: "6. 監管與稅務風險",
    r6Body: "各國規則不同。稅務由您自行負責。ANCAP full agreement with CLARITY goals does not replace your local rules.",
    r7Title: "7. 第三方市場數據",
    r7Body: "ANCAP 上顯示的現貨價格可能來自 CoinGecko，僅供參考，非結算價亦非投資建議。",
    r8Title: "8. 長壽、器官列印與獸醫結果風險",
    r8Body:
      "AETERNA 軌道（器官列印、貓組織冷凍、犬用 VET REGEN POD）可能失敗或被夥伴拒絕。插圖為概念。不承諾存活率或起死回生。",
    r9Title: "9. 人道援助風險",
    r9Body:
      "人道簡報可能被國家會社延遲或拒絕。ANCAP 本身不運送糧食、飲水、衣物、藥品，亦不提供職位。桌面列名非已簽署之紅十字夥伴關係，亦非可抵稅捐款。見 /legal/humanitarian。",
    riskMarketDataMore: "完整市場數據揭露：",
    p9Title: "9. 市場數據供應商",
    p9Body: "ANCAP 可能呼叫 CoinGecko API 顯示參考行情；請求使用伺服器憑證。",
    marketDataKicker: "客戶揭露",
    marketDataTitle: "市場數據與 CoinGecko",
    marketDataIntro: "說明 ANCAP 如何使用第三方市場數據。",
    md1Title: "1. 我們顯示什麼",
    md1Body: "參考現貨價（BTC、ETH、USDT、BNB、SOL）。API：GET /api/v1/market/prices。可顯示於首頁與 Reserves。",
    md2Title: "2. 非結算、非建議",
    md2Body: "CoinGecko 價格不是 ANCAP 結算價。",
    md3Title: "3. 準確性與可用性",
    md3Body: "資料源可能延遲或中斷。",
    md4Title: "4. 出處標示",
    md4Body: "顯示時標示 CoinGecko 來源。",
    md5Title: "5. 您的責任",
    md5Body: "請勿依賴參考畫面進行不可逆轉帳。",
    md6Title: "6. 天氣（AccuWeather）",
    md6Body: "Earth / Support 小工具可依 IP 顯示當地時間與天氣，資料來自 AccuWeather（https://www.accuweather.com/）與 GET /api/v1/weather/current。",
    md7Title: "7. 非警報服務",
    md7Body: "小工具天氣僅供介面參考，非官方氣象警報。",
    md8Title: "8. 位置與 AccuWeather 隱私",
    md8Body: "約略 IP 座標會送到 ANCAP weather API。AccuWeather 依其條款處理資料。ANCAP 不出售此資料。",
    marketDataAttributionTitle: "供應商",
    marketDataAttributionBody: "市場數據：CoinGecko。天氣：AccuWeather（https://www.accuweather.com/）。",
    refundsKicker: "帳單政策",
    refundsTitle: "付款與退款",
    refundsIntro: "說明 ANCAP 如何處理付費執行、API 費用、點數與法幣儲值。",
    f1Title: "1. 何時收費為最終",
    f1Body: "除非另有說明，付費工作流程自執行開始即消耗；成功完成通常不可退款。",
    f2Title: "2. 失敗執行",
    f2Body: "若因平台可證明故障導致失敗，請寄 support@ancap.cloud 申請點數或重跑。",
    f3Title: "3. 點數與 ACP 餘額",
    f3Body: "為服務記帳單位，非銀行存款。",
    f4Title: "4. 法幣處理商",
    f4Body: "卡片付款遵循 Stripe／合作夥伴規則。請先聯絡 support@ancap.cloud。",
    f5Title: "5. 如何申請審查",
    f5Body: "寄 support@ancap.cloud 並附帳戶與付款／執行 ID。強制消費者權利在適用時不受影響。",
    refundsWelcomeGrantMore: "註冊贈與額度為平台促銷點數，非捐款，亦不以法幣退還。詳情：",
    welcomeGrantKicker: "帳務／消費者法",
    welcomeGrantTitle: "註冊贈與額度：100 ACP 使用點數",
    welcomeGrantIntro:
      "ANCAP 於新帳戶入帳 100 ACP，讓使用者無需先儲值即可試用付費 AI 工作流程。「$100」為名義會計標示。本頁說明法律定性：使用額度，非慈善、非美元、不可抵稅。歐盟規範見第 5–9 節。",
    wg1Title: "1. 您獲得什麼",
    wg1Body:
      "註冊成功後，ANCAP 將 100 ACP 記入平台帳本。「$100」是名義會計標示，因 ACP 為 SKU 計價單位。這不是支付 100 美元、不是銀行轉帳，也不是法幣贈與。",
    wg2Title: "2. 使用目的（為何聽起來像慈善）",
    wg2Body:
      "營運方聲明的目的是降低現金門檻，讓新使用者能試用付費 AI 工作流程。日常用語可稱為使用贈與。該目的並不會使該點數在法律上成為捐款。",
    wg3Title: "3. 俄羅斯法 — 非捐贈",
    wg3Body:
      "依俄羅斯民法第 582 條，пожертвование 是為一般有益目的向受贈人贈與財產。平台將點數記入自有帳本，並未向慈善機構移轉財產。135-FZ 適用於已登記慈善組織及實際移轉資金／財產並開立憑證的情形。ANCAP 不以本贈與自稱為慈善組織。若無該法律形式而將行銷點數稱為「慈善」，屬不當廣告（38-FZ 第 5 條）。本贈與非彩券。使用者不得僅因收到或使用此點數主張抵稅。",
    wg4Title: "4. 美國",
    wg4Body:
      "本贈與並非 IRC §170 可抵稅慈善捐款，亦非對 501(c)(3) 的贈與，除非另有已登記慈善機構實際收款。FTC Act §5 禁止欺騙：將註冊促銷稱為「捐款」而實為平台點數，屬誤導。ACP 仍為效用／會計單位，非投資報酬產品。",
    wg5Title: "5. 歐盟 — 不公平商業行為（非慈善）",
    wg5Body:
      "指令 2005/29/EC（UCPD，經 (EU) 2019/2161 修正）禁止誤導行為與隱匿（第 6–7 條）。附件 I 第 22 點：虛偽主張交易人並非為其營業或職業目的而行為。若將本註冊額度稱為捐款、人道贈與或已認可公益機構之活動——而 ANCAP 為商業平台且未將資金移轉予已登記之歐盟慈善機構——即屬誤導性商業行為。電子商務指令 2000/31/EC 第 6 條：商業通訊須可識別為商業通訊。本國對應：德國 UWG §§ 5／5a、法國消費法典、義大利 Codice del Consumo。英國脫歐後仍適用 CPRs 2008。本額度不使 ANCAP 成為德國 AO § 52 公益法人、法國 mécénat 之 organisme d’intérêt général，或 Charities Act 2011 下的 charity。",
    wg6Title: "6. 歐盟 — 消費者權利與不公平條款",
    wg6Body:
      "消費者權利指令 2011/83/EU 與 (EU) 2019/770：本贈與為無償促銷點數，非有償遠距契約。14 日撤回權（CRD 第 9 條）適用於嗣後訂購的付費數位服務，而非本免費點數本身。若消費者於撤回期間請求立即履行付費數位服務（CRD 第 16(m)／16a 條），規則見付款與退款。不公平條款指令 93/13/EEC：因濫用而撤銷點數的條款須透明且合比例，不得排除強制消費者權利。地理封鎖規則 (EU) 2018/302：本點數不依會員國國籍差別定價。DSA (EU) 2022/2065 不會把平台帳本點數改定性為捐款。",
    wg7Title: "7. 歐盟 — 非電子貨幣、非支付服務、非消費信貸",
    wg7Body:
      "電子貨幣指令 2009/110/EC（EMD2）：電子貨幣須於收受資金後發行，並由發行人以外之人接受。本贈與未向使用者收受資金、僅能用於 ANCAP 服務，且不可兌成 EUR／USD。PSD2 (EU) 2015/2366：非支付交易、非支付帳戶。消費信貸指令 2008/48/EC 與 (EU) 2023/2225：非貸款、非附利息或還款期之信貸。每帳戶一次的確定額度非博弈，亦非需執照的歐盟彩券。",
    wg8Title: "8. 歐盟 — MiCA 與資本市場定性",
    wg8Body:
      "加密資產市場規則 (EU) 2023/1114（MiCA）：ACP 定位為付費 AI 工作流程的效用／會計單位。本贈與非 ART／EMT 公開要約、非加密資產募資、非股息或利息權利。非 MiFID II 2014/65/EU 金融工具，亦非 Prospectus Regulation (EU) 2017/1129 證券要約。行銷不得使用「保證報酬」或「無風險 100 美元」。名義「$100」為 SKU 計價尺度，非承諾支付 100 美元或 100 歐元。",
    wg9Title: "9. 歐盟 — 加值稅、稅務與個人資料",
    wg9Body:
      "VAT 指令 2006/112/EC：無對價的免費促銷點數於入帳時通常非應稅供應。嗣後付費使用工作流程可能依供應地／OSS 成為應稅供應；本頁不決定使用者的 VAT 地位。本贈與不可作為對歐盟公益組織的可抵稅捐贈。DAC8／(EU) 2023/2226（如適用）針對應申報加密資產交易——本促銷帳本點數非慈善捐款。GDPR (EU) 2016/679：註冊資料為開戶及入帳而處理（第 6(1)(b) 條履行契約）；詳見隱私權聲明。本贈與不得作為超出 Cookie／隱私政策的行銷同意對價（ePrivacy 2002/58/EC）。",
    wg10Title: "10. 產品規則",
    wg10Body:
      "每帳戶一次。同一 email 再次註冊會被拒絕。濫用或多帳戶可能撤銷點數。僅能用於 ANCAP 服務。不可提領美元或歐元。非利息、非收益、非質押獎勵、非證券。與推薦人在驗證推薦購買後獲得的 25 ACP 分開。",
    wg11Title: "11. 退款與濫用",
    wg11Body:
      "本贈與不以法幣退還。詐欺或重複帳戶可能被關閉並撤銷點數。付費執行依付款與退款政策。嗣後付費數位服務的歐盟強制撤回權（如依法適用）不受影響。",
    wg12Title: "12. 非法律意見",
    wg12Body:
      "本頁為營運方揭露，非對歐盟／歐洲經濟區／英國或其他地區使用者的稅務、慈善申報或執業法律意見。詢問：legal@ancap.cloud。人道援助簡報為獨立產品，見 /humanitarian 與 /legal/humanitarian，並非本註冊贈與額度。",
    welcomeGrantAlso: "開立帳戶或閱讀相關說明：",
    humanitarianKicker: "法律／人道",
    humanitarianTitle: "人道援助服務台與紅十字／紅新月列名",
    humanitarianIntro:
      "ANCAP 如何說明以 ACP 結算之人道簡報，以及向紅十字／紅新月國家會社之夥伴交接。ANCAP 非登記慈善機構，且未主張已簽署紅十字國際委員會、紅十字與紅新月會國際聯合會或國家會社夥伴關係，除非本頁公布載明日期之協議。",
    hum1Title: "1. 平台角色",
    hum1Body:
      "ANCAP 營運 ACP 優先之軟體平台。於 /humanitarian 出售援助簡報與夥伴交接工具，以 ACP 結算。ANCAP 非俄羅斯 135-FZ 慈善組織、非公益法人、非英國 charity、非美國 501(c)(3)。支付 ACP 並不使使用者成為對 ANCAP 作為慈善機構之捐款人。",
    hum2Title: "2. 紅十字／紅新月運動",
    hum2Body:
      "紅十字國際委員會、紅十字與紅新月會國際聯合會與國家會社為不同組成。聯合會或俄／烏／德／美紅十字列名僅為官方網站交接軌道，非運動成員身分、非募款代理合約、亦非紅十字國際委員會背書。在本頁公布載明日期之備忘錄前，official_partnership 為 false。",
    hum3Title: "3. ACP 所支付者",
    hum3Body:
      "此台 ACP 支付簡報及對夥伴通路交接之貢獻：緊急糧食、安全飲水、營養／食品、保暖衣物、經持照通路之醫藥用品、謀生／起步工作媒合。ANCAP 不倉儲物資，亦不保證配給、藥品或職位。",
    hum4Title: "4. 與註冊贈與額度有別",
    hum4Body:
      "註冊 100 ACP 為促銷平台使用額度，明確非慈善。廣告上不得將 /legal/welcome-grant 與 /legal/humanitarian 混為一談（UCPD 附件一第 22 點、俄羅斯 38-FZ）。",
    hum5Title: "5. 標誌與日內瓦公約",
    hum5Body:
      "紅十字、紅新月與紅水晶為 1949 年日內瓦公約之受保護識別標誌。ANCAP 未獲授權將其作為標誌、應用程式圖示或付款徽章。本站僅使用文字名稱與官方網域。emblem_licensed 為 false。",
    hum6Title: "6. 醫藥用品",
    hum6Body:
      "醫藥用品簡報僅適用持照／夥伴通路。ANCAP 非藥局、不開立處方、不提供醫療建議。管制藥品與未授權藥品流通均禁止。",
    hum7Title: "7. 謀生／起步工作",
    hum7Body:
      "謀生媒合為對夥伴方案之簡報。ANCAP 並非各國持照就業仲介，亦不保證職位、薪資或工作許可。",
    hum8Title: "8. 俄羅斯聯邦",
    hum8Body:
      "135-FZ 與民法典第 582 條：ANCAP 帳本之 ACP 扣帳本身並非捐贈，除非登記慈善機構另行開立收據。宣傳 ANCAP 本身為慈善機構為違法廣告（38-FZ）。",
    hum9Title: "9. 歐盟、英國、美國與抵稅收據",
    hum9Body:
      "UCPD 2005/29/EC 附件一第 22 點、電子商務指令第 6 條、英國 CPRs、美國 FTC 法第 5 條、IRC §170：商業通訊不得造成慈善目的之虛假印象。ANCAP ACP 分錄並非合格機構收據。",
    hum10Title: "10. 聯絡",
    hum10Body:
      "法律通知：legal@ancap.cloud。產品：/humanitarian。相關：/legal/welcome-grant。官方網站：https://www.ifrc.org/。本頁為營運方揭露，非執業法律、稅務或醫療意見。",
    humanitarianAlso: "相關說明與官方網站：",
    cyberKicker: "Legal / public policy",
    cyberTitle: "ANCAP endorsement of collective cyber defense",
    cyberIntro: "ANCAP publicly agrees with the OpenAI open letter \"A call for collective action on cyber defense\" and the global surge it asks for. This page is the company's legal and policy statement of that agreement. It does not replace the User Agreement, Privacy Notice, or Cookie Policy.",
    openLetter: "Open letter (openai.com)",
    cyberStatementTitle: "Statement of agreement",
    cyberStatement1: "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, and API services, agrees with the letter's opening claim: there is a limited window to strengthen cyber defense. AI-enabled attacks are becoming cheaper, more automated, and more widely available, including against hospitals, water systems, and internet infrastructure. The same models can help defenders close weaknesses that have accumulated for years. ANCAP therefore aligns with the call to raise cybersecurity to executive priority, fund defense for operators who cannot fund it themselves, share proven playbooks, and make AI-agent actions accountable.",
    cyberStatement2: "Signatories of the letter include technology, security, payments, telecom, and industrial companies that compete in ordinary markets and still coordinated around a shared threat picture. ANCAP is not a listed signatory of that letter. This page records ANCAP's independent agreement with the same policy and the same three principles.",
    cyberP1Title: "1. Current security is not enough",
    cyberP1Body: "Systems remain exposed because of accumulated bugs, excess privilege, weak authentication, and technical debt. Security teams — especially in critical infrastructure — are chronically under-resourced. ANCAP treats this as a leadership-level risk, not a back-office checklist.",
    cyberP2Title: "2. Defenders need AI",
    cyberP2Body: "The same class of models that will make attacks cheaper can also give more teams expert-grade defensive skill and make baseline security work faster and cheaper. Proven tools and patches from one organization should help many. ANCAP will use AI to strengthen defensive workflows, proof trails, and operator checks — not to lower the cost of offense.",
    cyberP3Title: "3. The response must be collective",
    cyberP3Body: "No single company controls the threat surface. Vendors hold attack data and tools, model builders hold the models, governments hold coordination and budget, and operators know their own systems. ANCAP agrees that these parts must be joined so one victim's experience raises the cost of the next attack.",
    cyberCommitTitle: "ANCAP commitments under this policy",
    cyberC1Title: "Leadership priority",
    cyberC1Body: "Cybersecurity is treated with incident-level urgency: close the most dangerous weaknesses, verify the result, and raise the bar for what we buy, ship, and run — including AI-written code.",
    cyberC2Title: "Defensive use of AI",
    cyberC2Body: "ANCAP will apply AI to defensive tasks, auditability, and operator support. Paid AI workflows and agents on the platform remain subject to prohibited-conduct rules against attacks, malware, fraud, and unauthorized access.",
    cyberC3Title: "Traceable agents",
    cyberC3Body: "AI-agent actions on ANCAP should be traceable and accountable through receipts, hashes, logs, and proof artifacts wherever the product already records execution.",
    cyberC4Title: "Shared standards",
    cyberC4Body: "ANCAP supports partnership, threat-information sharing, and common defensive standards among technology companies, infrastructure operators, and public institutions.",
    cyberC5Title: "Raise attacker cost",
    cyberC5Body: "The core economic test remains: an attack should cost more than it can return. ANCAP agrees that restoring that cost requires collective action, because no participant holds the full resource set alone.",
    cyberScopeTitle: "Scope and limits",
    cyberScope1: "This endorsement is a public-policy statement. It does not create a warranty, insurance, SLA, or government partnership by itself. Platform users remain bound by the User Agreement, including the prohibition on using ANCAP to attack systems, distribute malware, or bypass access controls. Offensive cyber assistance is outside the product.",
    cyberScope2: "Source document:",
    clarityKicker: "Legal / public policy",
    clarityTitle: "ANCAP full agreement with the CLARITY Act",
    clarityIntro:
      "ANCAP publicly records its full agreement with the Digital Asset Market Clarity Act (CLARITY Act) as updated U.S. market-structure legislation for digital assets. This page is the company's legal and policy statement of that agreement. It does not replace the User Agreement, Risk disclosure, Privacy Notice, or Cookie Policy.",
    clarityBillLink: "Bill text (Congress.gov)",
    clarityNewsLink: "Public notice of updated text",
    clarityStatementTitle: "Statement of full agreement",
    clarityStatement1:
      "ANCAP, as operator of ancap.cloud and related ACP, wallet, workflow, bridge, stablecoin, and API services, fully agrees with the CLARITY Act's core purpose: establish a clearer federal framework for digital-asset markets, clarify when assets and activities fall under securities versus commodities oversight, and reduce regulatory ambiguity that harms lawful builders, payment rails, and users.",
    clarityStatement2:
      "ANCAP supports clear SEC and CFTC jurisdictional lines, transparent market-structure rules for digital commodities and related activities, and compliance-ready rails for utility settlement assets such as ACP / wACP / sACP. ANCAP is not a Member of Congress, not a registered lobbyist by virtue of this page, and not a government agency. This page records ANCAP's independent full agreement with the Act's market-clarity objectives as publicly discussed around the updated text ahead of floor consideration.",
    clarityP1Title: "1. Market clarity over ambiguity",
    clarityP1Body:
      "Builders and clients need predictable rules for classification, custody, trading venues, and disclosures. ANCAP agrees that statutory clarity beats ad-hoc enforcement-only regimes for digital-asset market structure.",
    clarityP2Title: "2. Jurisdiction that matches the asset and activity",
    clarityP2Body:
      "ANCAP agrees that securities-like activities should remain under securities oversight and that digital-commodity market activities should have a coherent CFTC-facing framework, consistent with the Act's design goals as publicly described.",
    clarityP3Title: "3. Lawful commerce and utility rails",
    clarityP3Body:
      "ANCAP positions ACP as a utility / accounting unit for paid AI workflows and platform credits — not as an investment-return product. Full agreement with CLARITY market-structure goals reinforces that ANCAP will keep MiCA-safe / utility messaging and align product disclosures with applicable U.S. law as enacted and interpreted.",
    clarityCommitTitle: "ANCAP commitments under this endorsement",
    clarityC1Title: "Full public agreement",
    clarityC1Body:
      "ANCAP states full agreement with the CLARITY Act's purpose of digital-asset market clarity and will keep this statement available in the Legal center.",
    clarityC2Title: "Honest product status",
    clarityC2Body:
      "ANCAP will not use this endorsement to claim that ACP is a registered security, that any token is guaranteed lawful in every jurisdiction, or that legislation has already been signed into law before it has.",
    clarityC3Title: "Compliance follow-through",
    clarityC3Body:
      "If and when CLARITY (or successor market-structure law) is enacted, ANCAP will review messaging, partner rails, and disclosures against the final statute and implementing rules.",
    clarityC4Title: "No substitute for user counsel",
    clarityC4Body:
      "Users remain responsible for their own legal, tax, and licensing analysis. This endorsement is not legal advice to any client.",
    clarityC5Title: "Update discipline",
    clarityC5Body:
      "Material legislative changes will be reflected on this page and, where needed, in the User Agreement and Risk disclosure \"Last updated\" notes.",
    clarityScopeTitle: "Scope and limits",
    clarityScope1:
      "This endorsement is a public legal-policy statement of full agreement with the CLARITY Act's market-structure goals. It does not create a warranty, insurance, SLA, government partnership, lobbying engagement, or investment recommendation. Passage of any bill remains a matter for Congress and the President. Until enacted, ANCAP continues to operate under existing applicable law and these Legal center notices.",
    clarityScope2: "References:",
    footerClarity: "CLARITY Act",
    footerLegal: "法律",
    footerTerms: "條款",
    footerPrivacy: "隱私",
    footerCookies: "Cookie",
    footerRisk: "風險",
    footerRefunds: "退款",
    footerWelcomeGrant: "註冊贈與額度",
    footerHumanitarian: "人道援助",
    footerVetRegen: "獸醫再生",
    footerLightChamber: "光艙",
    footerBodyContouring: "身體輪廓",
    footerBiofusion: "BioFusion",
    footerDpsc: "DPSC 生物材料",
    footerVascularPlus: "Vascular Care+",
    footerVascular: "Vascular Care",
    footerTransdermal: "經皮手槍",
    footerMReceptor: "M 受體",
    footerOxygenCarrier: "氧載體",
    authAgreePrefix: "我同意",
    authAgreeAnd: "與",
    authAgreeSuffix: "。",
  },
};
