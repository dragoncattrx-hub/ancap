# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# --- CLAUDE.md ---
claude = ROOT / "CLAUDE.md"
t = claude.read_text(encoding="utf-8")
old = (
    "teleport-earphones medevac fiction brief (58,000 ACP; not Apple/real teleport/"
    "weapon; `/legal/teleport-earphones`). Track:"
)
new = (
    "teleport-earphones medevac fiction brief (58,000 ACP; not Apple/real teleport/"
    "weapon; `/legal/teleport-earphones`), Installation Project / Проект Установки "
    "(72,000 ACP high-protein infant milk-line + neonatal hyperbaric literacy; "
    "licensed neonatology/nutrition partner only; not formula sold by ANCAP; "
    "not CE/FDA HBO; not home HBO; not a guaranteed rickets/anemia/infection outcome; "
    "`/legal/installation-project`; insurance `neonatal_install`). Track:"
)
if "Installation Project / Проект Установки" not in t:
    if old not in t:
        raise SystemExit("CLAUDE marker not found")
    t = t.replace(old, new, 1)
old2 = "ADHD-support / PulmoPure / Barsuk / teleport-earphones rails wired"
new2 = "ADHD-support / PulmoPure / Barsuk / teleport-earphones / Installation Project rails wired"
if old2 in t:
    t = t.replace(old2, new2, 1)
claude.write_text(t, encoding="utf-8")
print("CLAUDE ok")

# --- roadmap intent line ---
road = ROOT / "docs" / "AETERNA_LONGEVITY_MARKETPLACE_ROADMAP.md"
rt = road.read_text(encoding="utf-8")
marker = "Intent `teleport_earphones_brief` defaults to `aeterna-teleport-earphones` (`>= 58000`)."
add = (
    " Intent `installation_project_brief` defaults to `aeterna-installation-project` "
    "(`>= 72000`)."
)
if "installation_project_brief" not in rt:
    if marker not in rt:
        # looser search
        alt = "aeterna-teleport-earphones` (`>= 58000`)."
        if alt not in rt:
            raise SystemExit("roadmap teleport intent marker missing")
        rt = rt.replace(alt, alt[:-1] + add, 1)
    else:
        rt = rt.replace(marker, marker + add, 1)
    road.write_text(rt, encoding="utf-8")
print("roadmap ok")
