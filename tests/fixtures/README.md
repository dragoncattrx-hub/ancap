# BaseVertical strategy fixtures

These JSON files are valid BaseVertical workflows (see `schemas/basevertical/workflow_v1.json`).

- **vertical_id** in each file is a placeholder `00000000-0000-0000-0000-000000000001`. In tests or when publishing a strategy, replace it with the actual BaseVertical vertical id (e.g. from `GET /v1/verticals` where `name == "BaseVertical"`).

## Fixtures

| File | Description |
|------|-------------|
| `basevertical_conservative_flip.json` | Conservative: 1 buy, 1 sell; small price ranges (95–105, 98–108). |
| `basevertical_aggressive_multi_trade.json` | Multi-trade: buy 2, sell 1, sell 1; wider price ranges. |
| `basevertical_random_baseline.json` | Random baseline: buy 3, coin-flip condition, optional sell (price 0 = no-op/skipped). |

## Usage example

```python
import json
# Load and substitute vertical_id
with open("tests/fixtures/basevertical_conservative_flip.json") as f:
    workflow = json.load(f)
workflow["vertical_id"] = actual_base_vertical_id  # from API
# Use workflow in POST /v1/strategies/{id}/versions
```
