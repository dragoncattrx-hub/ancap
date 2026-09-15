"""Antique fire-restore conservation desk workflow."""

from app.services.workflow_execution import execute_workflow_template, find_workflow_template


def test_antique_fire_restore_template_price():
    tpl = find_workflow_template("antique-fire-restore")
    assert tpl is not None
    assert tpl.price.amount == "42000"
    assert tpl.price.currency == "ACP"
    assert tpl.category == "Conservation"


def test_antique_fire_restore_execution_compliance():
    tpl = find_workflow_template("antique-fire-restore")
    out = execute_workflow_template(tpl, {"project_name": "estate lot"})
    brief = out["deliverable"]["antique_fire_restore"]
    assert brief["price_acp"] == "42000"
    assert brief["architecture"] == "antique_fire_restore_partner_literacy"
    blob = str(out).lower()
    assert "diy" in blob or "furnace" in blob
    assert "medical" in blob or "burn" in blob
