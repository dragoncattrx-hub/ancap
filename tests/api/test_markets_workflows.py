from app.services.workflow_execution import (
    WORKFLOW_BUNDLES,
    execute_workflow_template,
    find_workflow_template,
)


def test_markets_templates_registered():
    for slug in (
        "market-direction-brief",
        "commodity-price-outlook",
        "crypto-quote-momentum-scan",
        "markets-ai-radar-pro",
    ):
        t = find_workflow_template(slug)
        assert t is not None
        assert t.category == "Markets"


def test_markets_intel_bundle():
    b = next(x for x in WORKFLOW_BUNDLES if x.slug == "markets-intel-pack")
    assert "commodity-price-outlook" in b.workflow_slugs
    assert len(b.workflow_slugs) == 4


def test_commodity_outlook_stub_has_disclaimer():
    t = find_workflow_template("commodity-price-outlook")
    out = execute_workflow_template(t, {"commodity": "uranium", "horizon": "90 days"})
    assert "disclaimer" in out["deliverable"]
    assert out["deliverable"]["commodity"] == "uranium"
    assert "scenario_paths" in out["deliverable"]
