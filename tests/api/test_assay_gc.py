from decimal import Decimal

from app.schemas.assay_gc import AssayGcAnalyzeRequest, AssayPeak
from app.services.assay_gc import analyze, catalog


def test_assay_catalog_has_both_modes():
    c = catalog()
    modes = {m.mode for m in c.modes}
    assert "metal_xrf_proxy" in modes
    assert "gas_chromatograph" in modes
    assert "prototype" in c.disclaimer.lower() or "not a certified" in c.disclaimer.lower()


def test_metal_simulate_maps_to_otc_quote():
    r = analyze(
        AssayGcAnalyzeRequest(
            mode="metal_xrf_proxy",
            metal="gold",
            quantity="10",
            simulate=True,
            declared_purity_ppt=999,
        )
    )
    assert r.purity_ppt == 999
    assert Decimal(r.indicative_acp_amount) == Decimal("2497.5")
    assert r.confidence == "simulated"
    assert r.sample_id.startswith("ASM-")


def test_gas_gc_h2s_haircut():
    r = analyze(
        AssayGcAnalyzeRequest(
            mode="gas_chromatograph",
            commodity="natural_gas",
            quantity="1000",
            simulate=False,
            peaks=[
                AssayPeak(label="Methane", retention_or_energy="0.95", area_pct="90"),
                AssayPeak(label="Ethane", retention_or_energy="1.55", area_pct="5"),
                AssayPeak(label="H2S", retention_or_energy="1.10", area_pct="5"),
            ],
        )
    )
    # base 1000 * 0.45 = 450 ACP, purity-weighted then H2S haircut
    assert Decimal(r.indicative_acp_amount) < Decimal("450")
    assert any("H2S" in f for f in r.flags)
