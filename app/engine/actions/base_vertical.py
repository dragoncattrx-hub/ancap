"""BaseVertical actions: const, math_*, cmp, if, rand_uniform, portfolio_buy/sell.
All deterministic (rand uses seed); no external network.
"""
import hashlib
import random
from typing import Any, Callable

# Allowed action names for BaseVertical
BASE_VERTICAL_ACTIONS = frozenset({
    "const", "math_add", "math_sub", "math_mul", "math_div",
    "cmp", "if", "rand_uniform", "portfolio_buy", "portfolio_sell",
})


def _resolve(val: Any, context: dict) -> Any:
    """Resolve ref from context: args can be {"ref": "key"} to take context[key]."""
    if isinstance(val, dict) and len(val) == 1 and "ref" in val:
        key = val["ref"]
        return context.get(key)
    return val


def _num(a: Any, context: dict) -> float:
    v = _resolve(a, context)
    if isinstance(v, (int, float)):
        return float(v)
    raise ValueError(f"Expected number, got {type(v)}")


def action_const(args: dict, context: dict, **kwargs) -> Any:
    return args.get("value")


def action_math_add(args: dict, context: dict, **kwargs) -> float:
    return _num(args.get("a", 0), context) + _num(args.get("b", 0), context)


def action_math_sub(args: dict, context: dict, **kwargs) -> float:
    return _num(args.get("a", 0), context) - _num(args.get("b", 0), context)


def action_math_mul(args: dict, context: dict, **kwargs) -> float:
    return _num(args.get("a", 0), context) * _num(args.get("b", 0), context)


def action_math_div(args: dict, context: dict, **kwargs) -> float:
    a = _num(args.get("a", 0), context)
    b = _num(args.get("b", 1), context)
    if b == 0:
        return 0.0
    return a / b


def action_cmp(args: dict, context: dict, **kwargs) -> bool:
    op = args.get("op", "eq")
    a = _resolve(args.get("a"), context)
    b = _resolve(args.get("b"), context)
    if op == "lt":
        return a < b
    if op == "lte":
        return a <= b
    if op == "gt":
        return a > b
    if op == "gte":
        return a >= b
    if op == "eq":
        return a == b
    if op == "neq":
        return a != b
    raise ValueError(f"Unknown cmp op: {op}")


def action_if(args: dict, context: dict, **kwargs) -> Any:
    cond = _resolve(args.get("cond"), context)
    if cond:
        return _resolve(args.get("then"), context)
    return _resolve(args.get("else"), context)


def action_rand_uniform(args: dict, context: dict, run_id: str = "", **kwargs) -> float:
    low = _num(args.get("low", 0), context)
    high = _num(args.get("high", 1), context)
    seed = args.get("seed")
    if seed is not None:
        rng = random.Random(int(seed))
    else:
        # Deterministic seed from run_id: first 8 hex chars of sha256
        h = hashlib.sha256((run_id or "default").encode()).hexdigest()[:8]
        rng = random.Random(int(h, 16))
    return rng.uniform(low, high)


def _get_portfolio(context: dict) -> dict:
    if "_portfolio" not in context:
        context["_portfolio"] = {}
    return context["_portfolio"]


def _get_equity(context: dict) -> list:
    if "_equity_curve" not in context:
        context["_equity_curve"] = []
    return context["_equity_curve"]


def action_portfolio_buy(args: dict, context: dict, **kwargs) -> dict:
    asset = args.get("asset", "ASSET")
    amount = _num(args.get("amount", 0), context)
    price = _num(args.get("price", 0), context)
    portfolio = _get_portfolio(context)
    cost = amount * price
    if asset not in portfolio:
        portfolio[asset] = {"qty": 0.0, "cost": 0.0}
    portfolio[asset]["qty"] += amount
    portfolio[asset]["cost"] += cost
    eq = _get_equity(context)
    if not eq and "_start_equity" in context:
        eq.append(context["_start_equity"])
    current = sum(p["cost"] for p in portfolio.values())
    eq.append(context.get("_start_equity", 0) - current)
    return {"asset": asset, "qty": amount, "cost": cost}


def action_portfolio_sell(args: dict, context: dict, **kwargs) -> dict:
    asset = args.get("asset", "ASSET")
    amount = _num(args.get("amount", 0), context)
    price = _num(args.get("price", 0), context)
    # price=0: no-op (e.g. baseline "don't sell" branch), return skipped
    if price == 0:
        return {"skipped": True, "asset": asset, "qty": 0, "cost": 0}
    portfolio = _get_portfolio(context)
    if asset not in portfolio:
        portfolio[asset] = {"qty": 0.0, "cost": 0.0}
    qty = min(amount, portfolio[asset]["qty"])
    if qty <= 0:
        return {"asset": asset, "qty": 0, "cost": 0}
    proceeds = qty * price
    if portfolio[asset]["qty"] > 0:
        cost_released = portfolio[asset]["cost"] * (qty / portfolio[asset]["qty"])
        portfolio[asset]["cost"] -= cost_released
    portfolio[asset]["qty"] -= qty
    if portfolio[asset]["qty"] <= 0:
        portfolio[asset] = {"qty": 0.0, "cost": 0.0}
    eq = _get_equity(context)
    current_cost = sum(p["cost"] for p in portfolio.values())
    eq.append(context.get("_start_equity", 0) - current_cost + proceeds)
    return {"asset": asset, "qty": qty, "cost": proceeds}


_ACTIONS: dict[str, Callable] = {
    "const": action_const,
    "math_add": action_math_add,
    "math_sub": action_math_sub,
    "math_mul": action_math_mul,
    "math_div": action_math_div,
    "cmp": action_cmp,
    "if": action_if,
    "rand_uniform": action_rand_uniform,
    "portfolio_buy": action_portfolio_buy,
    "portfolio_sell": action_portfolio_sell,
}


def execute_base_vertical_action(
    action_name: str,
    args: dict,
    context: dict,
    run_id: str = "",
) -> Any:
    if action_name not in _ACTIONS:
        raise ValueError(f"Unknown BaseVertical action: {action_name}")
    return _ACTIONS[action_name](args, context, run_id=run_id)
