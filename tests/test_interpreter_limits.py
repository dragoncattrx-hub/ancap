from app.engine.interpreter import run_workflow


def test_context_size_limit_kills_run():
    workflow = {
        "vertical_id": "base",
        "version": "1.0",
        "steps": [
            {"id": "s1", "action": "const", "args": {"value": "x" * 5000}, "save_as": "blob"}
        ],
    }
    out = run_workflow(
        workflow_json=workflow,
        params={},
        run_id="r1",
        pool_id="p1",
        limits={"max_context_size_bytes": 200},
        dry_run=True,
    )
    assert out.state == "killed"
    assert out.failure_reason == "context_size_limit_exceeded"

