"""Galaxy title auction: all major space-body classes plus radiation fields."""
from __future__ import annotations

import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SpaceAuctionBid
from app.services.auction_lock import lock_auction_lot, normalize_lot_id
from app.schemas.space_auction import (
    SpaceAuctionBidPublic,
    SpaceAuctionCatalogPublic,
    SpaceAuctionLotPublic,
    SpaceLotKind,
)

_Q = Decimal("0.00000001")
_MIN_INCREMENT = Decimal("100")
_INCREMENT_BPS = Decimal("100")  # 1%

_COMPLIANCE = (
    "ANCAP space lots are symbolic ACP title claims and desk RFQs. "
    "They do not confer sovereignty under the Outer Space Treaty. "
    "Settlement still requires compliance review and a hashed title pack."
)

_LOTS: tuple[dict[str, Any], ...] = (
    {
        "id": "star-sol",
        "kind": "star",
        "name": "Sol",
        "designation": "G2V / the Sun",
        "parent": None,
        "blurb": "Host star of the Solar System. Title lot for the local gravity well.",
        "starting_acp": "50000000",
        "featured": True,
    },
    {
        "id": "star-proxima",
        "kind": "star",
        "name": "Proxima Centauri",
        "designation": "M5.5V · α Cen C",
        "parent": None,
        "blurb": "Nearest other star — red-dwarf lot on the galactic auction floor.",
        "starting_acp": "12000000",
        "featured": False,
    },
    {
        "id": "star-sirius",
        "kind": "star",
        "name": "Sirius A",
        "designation": "A1V · α CMa",
        "parent": None,
        "blurb": "Brightest star in the night sky. High-visibility title lot.",
        "starting_acp": "8500000",
        "featured": False,
    },
    {
        "id": "star-vega",
        "kind": "star",
        "name": "Vega",
        "designation": "A0V · α Lyr",
        "parent": None,
        "blurb": "Lyra's beacon — historic pole star and photometric standard.",
        "starting_acp": "4200000",
        "featured": False,
    },
    {
        "id": "star-betelgeuse",
        "kind": "star",
        "name": "Betelgeuse",
        "designation": "M1–2 Ia · α Ori",
        "parent": None,
        "blurb": "Red supergiant lot. Volatility priced in — it will not last forever.",
        "starting_acp": "6800000",
        "featured": False,
    },
    {
        "id": "star-polaris",
        "kind": "star",
        "name": "Polaris",
        "designation": "F7Ib · α UMi",
        "parent": None,
        "blurb": "Current north star. Navigation premium on the title.",
        "starting_acp": "3500000",
        "featured": True,
    },
    {
        "id": "planet-mercury",
        "kind": "planet",
        "name": "Mercury",
        "designation": "I · innermost planet",
        "parent": "Sol",
        "blurb": "Closest world to Sol. Compact lot, extreme thermal cycle.",
        "starting_acp": "420000",
        "featured": False,
    },
    {
        "id": "planet-venus",
        "kind": "planet",
        "name": "Venus",
        "designation": "II",
        "parent": "Sol",
        "blurb": "Twin-mass world with a greenhouse premium.",
        "starting_acp": "890000",
        "featured": False,
    },
    {
        "id": "planet-earth",
        "kind": "planet",
        "name": "Earth",
        "designation": "III · homeworld",
        "parent": "Sol",
        "blurb": "Only confirmed biosphere in the catalog. Reserve is not a joke.",
        "starting_acp": "25000000",
        "featured": True,
    },
    {
        "id": "planet-mars",
        "kind": "planet",
        "name": "Mars",
        "designation": "IV",
        "parent": "Sol",
        "blurb": "The settlement narrative planet. High bid interest expected.",
        "starting_acp": "1800000",
        "featured": True,
    },
    {
        "id": "planet-jupiter",
        "kind": "planet",
        "name": "Jupiter",
        "designation": "V",
        "parent": "Sol",
        "blurb": "Gas giant + system of moons. Gravity-assist infrastructure lot.",
        "starting_acp": "9500000",
        "featured": False,
    },
    {
        "id": "planet-saturn",
        "kind": "planet",
        "name": "Saturn",
        "designation": "VI",
        "parent": "Sol",
        "blurb": "Ringed giant. Visual premium on the title certificate.",
        "starting_acp": "7200000",
        "featured": False,
    },
    {
        "id": "planet-uranus",
        "kind": "planet",
        "name": "Uranus",
        "designation": "VII",
        "parent": "Sol",
        "blurb": "Ice giant on a tipped axis. Quieter desk, still a named world.",
        "starting_acp": "3100000",
        "featured": False,
    },
    {
        "id": "planet-neptune",
        "kind": "planet",
        "name": "Neptune",
        "designation": "VIII",
        "parent": "Sol",
        "blurb": "Outer ice giant. Deep-blue lot at the edge of the classic eight.",
        "starting_acp": "3400000",
        "featured": False,
    },
    {
        "id": "sat-luna",
        "kind": "satellite",
        "name": "Luna",
        "designation": "Earth I · the Moon",
        "parent": "Earth",
        "blurb": "Natural satellite of Earth. Nearest major body after LEO.",
        "starting_acp": "4500000",
        "featured": True,
    },
    {
        "id": "sat-phobos",
        "kind": "satellite",
        "name": "Phobos",
        "designation": "Mars I",
        "parent": "Mars",
        "blurb": "Inner Martian moon — irregular, close-in, high relative motion.",
        "starting_acp": "180000",
        "featured": False,
    },
    {
        "id": "sat-deimos",
        "kind": "satellite",
        "name": "Deimos",
        "designation": "Mars II",
        "parent": "Mars",
        "blurb": "Outer Martian moon. Small-lot satellite auction.",
        "starting_acp": "95000",
        "featured": False,
    },
    {
        "id": "sat-io",
        "kind": "satellite",
        "name": "Io",
        "designation": "Jupiter I",
        "parent": "Jupiter",
        "blurb": "Volcanic Galilean moon. Energy-rich title, hostile surface.",
        "starting_acp": "620000",
        "featured": False,
    },
    {
        "id": "sat-europa",
        "kind": "satellite",
        "name": "Europa",
        "designation": "Jupiter II",
        "parent": "Jupiter",
        "blurb": "Icy shell over a suspected ocean. High scientific premium.",
        "starting_acp": "1200000",
        "featured": True,
    },
    {
        "id": "sat-ganymede",
        "kind": "satellite",
        "name": "Ganymede",
        "designation": "Jupiter III",
        "parent": "Jupiter",
        "blurb": "Largest moon in the Solar System. Own magnetic field.",
        "starting_acp": "980000",
        "featured": False,
    },
    {
        "id": "sat-titan",
        "kind": "satellite",
        "name": "Titan",
        "designation": "Saturn VI",
        "parent": "Saturn",
        "blurb": "Thick atmosphere, hydrocarbon lakes. Flagship icy-moon lot.",
        "starting_acp": "1450000",
        "featured": False,
    },
    {
        "id": "sat-enceladus",
        "kind": "satellite",
        "name": "Enceladus",
        "designation": "Saturn II",
        "parent": "Saturn",
        "blurb": "South-pole plumes. Compact satellite with biosignature interest.",
        "starting_acp": "540000",
        "featured": False,
    },
    {
        "id": "sat-iss",
        "kind": "satellite",
        "name": "ISS",
        "designation": "NORAD 25544",
        "parent": "Earth",
        "blurb": "Artificial satellite / station title RFQ. Desk + jurisdiction heavy.",
        "starting_acp": "2800000",
        "featured": False,
    },
    {
        "id": "sat-hubble",
        "kind": "satellite",
        "name": "Hubble Space Telescope",
        "designation": "NORAD 20580",
        "parent": "Earth",
        "blurb": "Science-platform spacecraft lot. Heritage optical payload.",
        "starting_acp": "750000",
        "featured": False,
    },
    {
        "id": "sat-starlink-slot",
        "kind": "satellite",
        "name": "Starlink-class slot",
        "designation": "LEO constellation slot",
        "parent": "Earth",
        "blurb": "Indicative LEO spacecraft / frequency-adjacent satellite lot.",
        "starting_acp": "85000",
        "featured": False,
    },
    {
        "id": "dwarf-pluto",
        "kind": "dwarf_planet",
        "name": "Pluto",
        "designation": "134340 · Kuiper belt",
        "parent": "Sol",
        "blurb": "Classic dwarf planet. Icy world with Charon in a binary-ish lock.",
        "starting_acp": "900000",
        "featured": True,
    },
    {
        "id": "dwarf-ceres",
        "kind": "dwarf_planet",
        "name": "Ceres",
        "designation": "1 Ceres · asteroid belt",
        "parent": "Sol",
        "blurb": "Largest belt body and a dwarf planet. Water-ice and mineral lot.",
        "starting_acp": "220000",
        "featured": False,
    },
    {
        "id": "dwarf-eris",
        "kind": "dwarf_planet",
        "name": "Eris",
        "designation": "136199 · scattered disc",
        "parent": "Sol",
        "blurb": "Massive scattered-disc dwarf. The body that forced the dwarf-planet class.",
        "starting_acp": "380000",
        "featured": False,
    },
    {
        "id": "dwarf-haumea",
        "kind": "dwarf_planet",
        "name": "Haumea",
        "designation": "136108",
        "parent": "Sol",
        "blurb": "Fast-spinning elongated dwarf with rings. Unusual angular-momentum lot.",
        "starting_acp": "190000",
        "featured": False,
    },
    {
        "id": "dwarf-makemake",
        "kind": "dwarf_planet",
        "name": "Makemake",
        "designation": "136472",
        "parent": "Sol",
        "blurb": "Bright Kuiper-belt dwarf. Methane-ice surface premium.",
        "starting_acp": "175000",
        "featured": False,
    },
    {
        "id": "ast-psyche",
        "kind": "asteroid",
        "name": "16 Psyche",
        "designation": "M-type · metal-rich",
        "parent": "Sol",
        "blurb": "Metal-rich asteroid. Indicative mining-narrative title, not a deed to iron.",
        "starting_acp": "850000",
        "featured": True,
    },
    {
        "id": "ast-vesta",
        "kind": "asteroid",
        "name": "4 Vesta",
        "designation": "V-type",
        "parent": "Sol",
        "blurb": "Differentiated belt asteroid. Protoplanet remnant lot.",
        "starting_acp": "310000",
        "featured": False,
    },
    {
        "id": "ast-bennu",
        "kind": "asteroid",
        "name": "101955 Bennu",
        "designation": "B-type NEO",
        "parent": "Sol",
        "blurb": "Sample-return NEO. Compact asteroid with a science-history premium.",
        "starting_acp": "140000",
        "featured": False,
    },
    {
        "id": "ast-apophis",
        "kind": "asteroid",
        "name": "99942 Apophis",
        "designation": "Aten NEO",
        "parent": "Sol",
        "blurb": "Close-approach NEO. Risk-narrative asteroid lot.",
        "starting_acp": "95000",
        "featured": False,
    },
    {
        "id": "ast-eros",
        "kind": "asteroid",
        "name": "433 Eros",
        "designation": "S-type Amor",
        "parent": "Sol",
        "blurb": "First NEA orbited by a spacecraft. Heritage asteroid title.",
        "starting_acp": "120000",
        "featured": False,
    },
    {
        "id": "comet-halley",
        "kind": "comet",
        "name": "1P/Halley",
        "designation": "Periodic comet",
        "parent": "Sol",
        "blurb": "The named periodic comet. Nucleus + coma title as a passing ice body.",
        "starting_acp": "210000",
        "featured": True,
    },
    {
        "id": "comet-67p",
        "kind": "comet",
        "name": "67P/Churyumov–Gerasimenko",
        "designation": "Jupiter-family comet",
        "parent": "Sol",
        "blurb": "Rosetta target. Rubber-duck nucleus, documented dust and ice jets.",
        "starting_acp": "85000",
        "featured": False,
    },
    {
        "id": "neb-orion",
        "kind": "nebula",
        "name": "Orion Nebula",
        "designation": "M42 · stellar nursery",
        "parent": "Milky Way",
        "blurb": "Nearest massive star-forming cloud. Gas-and-dust body, not a solid world.",
        "starting_acp": "1800000",
        "featured": True,
    },
    {
        "id": "neb-crab",
        "kind": "nebula",
        "name": "Crab Nebula",
        "designation": "M1 · SNR",
        "parent": "Milky Way",
        "blurb": "Supernova remnant. Synchrotron-bright expanding shell.",
        "starting_acp": "950000",
        "featured": False,
    },
    {
        "id": "neb-helix",
        "kind": "nebula",
        "name": "Helix Nebula",
        "designation": "NGC 7293 · planetary nebula",
        "parent": "Milky Way",
        "blurb": "Nearby planetary nebula. Dying-star envelope lot.",
        "starting_acp": "420000",
        "featured": False,
    },
    {
        "id": "gal-milky-way",
        "kind": "galaxy",
        "name": "Milky Way",
        "designation": "SBbc barred spiral · home galaxy",
        "parent": None,
        "blurb": "The host galaxy. Floor lot for the entire local stellar disk and halo.",
        "starting_acp": "80000000",
        "featured": True,
    },
    {
        "id": "gal-andromeda",
        "kind": "galaxy",
        "name": "Andromeda",
        "designation": "M31 · SA(s)b",
        "parent": "Local Group",
        "blurb": "Nearest giant spiral. Future-merger counterpart to the Milky Way.",
        "starting_acp": "45000000",
        "featured": False,
    },
    {
        "id": "gal-lmc",
        "kind": "galaxy",
        "name": "Large Magellanic Cloud",
        "designation": "Irr/SB(s)m satellite galaxy",
        "parent": "Milky Way",
        "blurb": "Bright satellite galaxy. Star-bursting dwarf irregular.",
        "starting_acp": "8500000",
        "featured": False,
    },
    {
        "id": "bh-sgr-a",
        "kind": "black_hole",
        "name": "Sagittarius A*",
        "designation": "Milky Way SMBH",
        "parent": "Milky Way",
        "blurb": "The galactic-center supermassive black hole. Event-horizon title, not a surface deed.",
        "starting_acp": "35000000",
        "featured": True,
    },
    {
        "id": "bh-m87",
        "kind": "black_hole",
        "name": "M87*",
        "designation": "Virgo A SMBH",
        "parent": "M87",
        "blurb": "Imaged shadow. Jet-powering supermassive black hole.",
        "starting_acp": "28000000",
        "featured": False,
    },
    {
        "id": "bh-cygnus-x1",
        "kind": "black_hole",
        "name": "Cygnus X-1",
        "designation": "Stellar-mass BH",
        "parent": "Milky Way",
        "blurb": "Classic stellar-mass black hole in an X-ray binary.",
        "starting_acp": "6200000",
        "featured": False,
    },
    {
        "id": "exo-proxima-b",
        "kind": "exoplanet",
        "name": "Proxima Centauri b",
        "designation": "Habitable-zone rocky candidate",
        "parent": "Proxima Centauri",
        "blurb": "Nearest confirmed exoplanet. Red-dwarf HZ lot.",
        "starting_acp": "2400000",
        "featured": True,
    },
    {
        "id": "exo-trappist-1e",
        "kind": "exoplanet",
        "name": "TRAPPIST-1e",
        "designation": "Earth-size · ultra-cool dwarf",
        "parent": "TRAPPIST-1",
        "blurb": "Earth-size world in a compact seven-planet system.",
        "starting_acp": "1800000",
        "featured": False,
    },
    {
        "id": "exo-kepler-452b",
        "kind": "exoplanet",
        "name": "Kepler-452b",
        "designation": "G-star HZ super-Earth",
        "parent": "Kepler-452",
        "blurb": "Sun-like host, longer-period HZ super-Earth.",
        "starting_acp": "950000",
        "featured": False,
    },
    {
        "id": "rad-cmb",
        "kind": "radiation",
        "name": "Cosmic microwave background",
        "designation": "Blackbody · ~2.725 K",
        "parent": None,
        "blurb": "Relic photon field filling the universe. Title on a sky-average radiation lot.",
        "starting_acp": "15000000",
        "featured": True,
    },
    {
        "id": "rad-solar-wind",
        "kind": "radiation",
        "name": "Solar wind / CME flux",
        "designation": "Plasma + magnetic ejecta",
        "parent": "Sol",
        "blurb": "Charged-particle and CME radiation from Sol. Space-weather lot.",
        "starting_acp": "420000",
        "featured": False,
    },
    {
        "id": "rad-cosmic-rays",
        "kind": "radiation",
        "name": "Galactic cosmic rays",
        "designation": "GeV–PeV hadrons",
        "parent": "Milky Way",
        "blurb": "High-energy particle radiation from the Galaxy. Dose-field title.",
        "starting_acp": "890000",
        "featured": False,
    },
    {
        "id": "rad-gamma",
        "kind": "radiation",
        "name": "Gamma-ray sky",
        "designation": "MeV–TeV photons",
        "parent": None,
        "blurb": "Highest-energy electromagnetic radiation band. Burst and diffuse sky lot.",
        "starting_acp": "2100000",
        "featured": False,
    },
    {
        "id": "rad-xray",
        "kind": "radiation",
        "name": "X-ray band",
        "designation": "0.1–100 keV",
        "parent": None,
        "blurb": "X-ray radiation field — coronae, remnants, and compact objects.",
        "starting_acp": "560000",
        "featured": False,
    },
    {
        "id": "rad-uv",
        "kind": "radiation",
        "name": "Ultraviolet band",
        "designation": "Lyman / EUV / FUV",
        "parent": None,
        "blurb": "UV radiation that ionizes hydrogen and sculpts nebulae.",
        "starting_acp": "310000",
        "featured": False,
    },
    {
        "id": "rad-visible",
        "kind": "radiation",
        "name": "Visible light",
        "designation": "~400–700 nm",
        "parent": None,
        "blurb": "The optical photon field. Photosphere and reflected-light lot.",
        "starting_acp": "180000",
        "featured": False,
    },
    {
        "id": "rad-infrared",
        "kind": "radiation",
        "name": "Infrared band",
        "designation": "NIR–FIR dust continuum",
        "parent": None,
        "blurb": "Thermal and dust infrared radiation. Cool-universe lot.",
        "starting_acp": "240000",
        "featured": False,
    },
    {
        "id": "rad-radio",
        "kind": "radiation",
        "name": "Radio / 21 cm sky",
        "designation": "HI hyperfine + continuum",
        "parent": None,
        "blurb": "Long-wavelength electromagnetic radiation, including hydrogen 21 cm.",
        "starting_acp": "390000",
        "featured": False,
    },
    {
        "id": "rad-gw",
        "kind": "radiation",
        "name": "Gravitational waves",
        "designation": "LIGO / PTA band",
        "parent": None,
        "blurb": "Spacetime radiation from mergers and the stochastic background.",
        "starting_acp": "3200000",
        "featured": True,
    },
    {
        "id": "rad-hawking",
        "kind": "radiation",
        "name": "Hawking radiation (Sgr A* scale)",
        "designation": "Theoretical BH radiance",
        "parent": "Sagittarius A*",
        "blurb": "Indicative Hawking-radiation lot tied to the galactic-center black hole.",
        "starting_acp": "740000",
        "featured": False,
    },
    {
        "id": "rad-synchrotron",
        "kind": "radiation",
        "name": "Synchrotron / jet radiation",
        "designation": "Relativistic electrons in B-fields",
        "parent": None,
        "blurb": "Non-thermal radiation from jets and remnants — radio through X-ray.",
        "starting_acp": "510000",
        "featured": False,
    },
)

_LOTS_BY_ID: dict[str, dict[str, Any]] = {str(lot["id"]): lot for lot in _LOTS}


def _api_str(value: Decimal) -> str:
    quantized = value.quantize(_Q, rounding=ROUND_HALF_UP)
    text = format(quantized, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def _dec(raw: str, field: str) -> Decimal:
    try:
        value = Decimal(str(raw).strip())
    except (InvalidOperation, AttributeError) as exc:
        raise HTTPException(status_code=400, detail=f"{field} must be a decimal") from exc
    if value <= 0:
        raise HTTPException(status_code=400, detail=f"{field} must be positive")
    if value.as_tuple().exponent < -8:
        raise HTTPException(status_code=400, detail=f"{field} has too many decimal places")
    if value > Decimal("1000000000000"):
        raise HTTPException(status_code=400, detail=f"{field} exceeds the auction ceiling")
    return value


def _clean_note(value: str | None) -> str | None:
    text = "".join(ch for ch in str(value or "") if ch.isprintable())
    text = " ".join(text.split()).strip()
    if not text:
        return None
    if any(ch in text for ch in "<>"):
        raise HTTPException(status_code=400, detail="note cannot contain markup")
    return text[:240]


def _min_next(current: Decimal) -> Decimal:
    step = (current * _INCREMENT_BPS / Decimal("10000")).quantize(_Q, rounding=ROUND_HALF_UP)
    if step < _MIN_INCREMENT:
        step = _MIN_INCREMENT
    return (current + step).quantize(_Q, rounding=ROUND_HALF_UP)


def get_lot_def(lot_id: str) -> dict[str, Any]:
    lot_id = normalize_lot_id(lot_id, unknown="Unknown space auction lot")
    lot = _LOTS_BY_ID.get(lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Unknown space auction lot")
    return lot


async def _high_bids(session: AsyncSession) -> dict[str, tuple[Decimal, uuid.UUID, int]]:
    rows = (
        await session.execute(
            select(
                SpaceAuctionBid.lot_id,
                SpaceAuctionBid.amount_acp,
                SpaceAuctionBid.bidder_user_id,
                SpaceAuctionBid.status,
            )
        )
    ).all()
    best: dict[str, tuple[Decimal, uuid.UUID, int]] = {}
    counts: dict[str, int] = {}
    for lot_id, amount, bidder_id, status in rows:
        counts[lot_id] = counts.get(lot_id, 0) + 1
        if status not in ("placed", "winning"):
            continue
        amt = Decimal(str(amount))
        prev = best.get(lot_id)
        if prev is None or amt > prev[0]:
            best[lot_id] = (amt, uuid.UUID(str(bidder_id)), 0)
    for lot_id, count in counts.items():
        if lot_id in best:
            amt, bidder, _ = best[lot_id]
            best[lot_id] = (amt, bidder, count)
        else:
            best[lot_id] = (Decimal("0"), uuid.UUID(int=0), count)
    return best


def _lot_public(lot: dict[str, Any], high: dict[str, tuple[Decimal, uuid.UUID, int]]) -> SpaceAuctionLotPublic:
    starting = Decimal(str(lot["starting_acp"]))
    info = high.get(str(lot["id"]))
    current = starting
    count = 0
    if info:
        current = max(starting, info[0])
        count = info[2]
    return SpaceAuctionLotPublic(
        id=str(lot["id"]),
        kind=lot["kind"],  # type: ignore[arg-type]
        name=str(lot["name"]),
        designation=str(lot["designation"]),
        parent=lot.get("parent"),
        blurb=str(lot["blurb"]),
        starting_acp=_api_str(starting),
        current_acp=_api_str(current),
        min_next_acp=_api_str(_min_next(current)),
        bid_count=count,
        high_bidder_user_id=None,
        featured=bool(lot.get("featured")),
    )


async def catalog(session: AsyncSession) -> SpaceAuctionCatalogPublic:
    high = await _high_bids(session)
    lots = [_lot_public(lot, high) for lot in _LOTS]
    featured = [lot for lot in lots if lot.featured]
    return SpaceAuctionCatalogPublic(
        title="ANCAP Galaxy Auction",
        tagline="Bid ACP for every major space-body class and radiation field — from the Milky Way to Sol, plus the photon and particle sky.",
        compliance_note=_COMPLIANCE,
        lots=lots,
        featured=featured,
    )


async def get_lot(session: AsyncSession, lot_id: str) -> SpaceAuctionLotPublic:
    lot = get_lot_def(lot_id)
    high = await _high_bids(session)
    return _lot_public(lot, high)


async def place_bid(
    session: AsyncSession,
    *,
    user_id: str,
    lot_id: str,
    amount_acp: str,
    note: str | None = None,
) -> SpaceAuctionBidPublic:
    lot = get_lot_def(lot_id)
    amount = _dec(amount_acp, "amount_acp")
    await lock_auction_lot(session, "galaxy", str(lot["id"]))
    public = await get_lot(session, str(lot["id"]))
    floor = Decimal(public.starting_acp)
    minimum = floor if public.bid_count == 0 else Decimal(public.min_next_acp)
    if amount < minimum:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be at least {_api_str(minimum)} ACP",
        )

    await session.execute(
        update(SpaceAuctionBid)
        .where(
            SpaceAuctionBid.lot_id == str(lot["id"]),
            SpaceAuctionBid.status.in_(("placed", "winning")),
        )
        .values(status="outbid")
    )
    row = SpaceAuctionBid(
        id=str(uuid.uuid4()),
        lot_id=str(lot["id"]),
        bidder_user_id=user_id,
        amount_acp=amount,
        status="winning",
        note=_clean_note(note),
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    updated = await get_lot(session, str(lot["id"]))
    return SpaceAuctionBidPublic(
        id=uuid.UUID(str(row.id)),
        lot_id=str(lot["id"]),
        amount_acp=_api_str(Decimal(str(row.amount_acp))),
        status=str(row.status),
        created_at=row.created_at,
        lot=updated,
    )


def kinds() -> tuple[SpaceLotKind, ...]:
    return (
        "star",
        "planet",
        "satellite",
        "dwarf_planet",
        "asteroid",
        "comet",
        "nebula",
        "galaxy",
        "black_hole",
        "exoplanet",
        "radiation",
    )
