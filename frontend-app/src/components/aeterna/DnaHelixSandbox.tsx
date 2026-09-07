"use client";

import { useEffect, useRef, useState } from "react";

const BASES = ["A", "T", "G", "C"] as const;
type Base = (typeof BASES)[number];

const PAIR: Record<Base, Base> = { A: "T", T: "A", G: "C", C: "G" };
const COLOR: Record<Base, string> = {
  A: "#ff6b9d",
  T: "#3dd68c",
  G: "#4aa3ff",
  C: "#ff8a3d",
};

const PAIR_COUNT = 28;
const DEFAULT_SEQ: Base[] = Array.from({ length: PAIR_COUNT }, (_, i) => BASES[i % 4]);

type Props = {
  onSequenceChange?: (seq: string) => void;
};

export function DnaHelixSandbox({ onSequenceChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seqRef = useRef<Base[]>([...DEFAULT_SEQ]);
  const rotRef = useRef(0);
  const selectedRef = useRef<number | null>(null);
  const dragRef = useRef<{ x: number; rot: number } | null>(null);
  const [seqLabel, setSeqLabel] = useState(DEFAULT_SEQ.join(""));
  const [hint, setHint] = useState("Drag to rotate · click a rung to swap bases");

  useEffect(() => {
    onSequenceChange?.(seqLabel);
  }, [seqLabel, onSequenceChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || 640;
      const h = Math.max(360, Math.min(520, Math.round(w * 0.62)));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const project = (i: number, phase: number, side: -1 | 1, w: number, h: number) => {
      const t = i / (PAIR_COUNT - 1);
      const y = 36 + t * (h - 72);
      const amp = Math.min(118, w * 0.22);
      const angle = rotRef.current + t * Math.PI * 5.2 + phase;
      const x = w / 2 + Math.cos(angle) * amp * side;
      const z = Math.sin(angle);
      return { x, y, z, angle };
    };

    const draw = () => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(8, 28, 36, 0.95)");
      g.addColorStop(1, "rgba(4, 10, 18, 0.98)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const backbone: { x: number; y: number; z: number }[][] = [[], []];
      const rungs: {
        i: number;
        a: { x: number; y: number; z: number };
        b: { x: number; y: number; z: number };
        base: Base;
      }[] = [];

      for (let i = 0; i < PAIR_COUNT; i++) {
        const left = project(i, 0, -1, w, h);
        const right = project(i, Math.PI, 1, w, h);
        backbone[0].push(left);
        backbone[1].push(right);
        rungs.push({ i, a: left, b: right, base: seqRef.current[i] });
      }

      const strokeBackbone = (pts: { x: number; y: number; z: number }[], color: string) => {
        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.2;
        ctx.lineCap = "round";
        ctx.stroke();
      };
      strokeBackbone(backbone[0], "rgba(122, 208, 200, 0.55)");
      strokeBackbone(backbone[1], "rgba(90, 140, 220, 0.5)");

      const ordered = [...rungs].sort((u, v) => u.a.z + u.b.z - (v.a.z + v.b.z));
      for (const rung of ordered) {
        const midZ = (rung.a.z + rung.b.z) / 2;
        const alpha = 0.35 + (midZ + 1) * 0.28;
        const base = rung.base;
        const complement = PAIR[base];
        const isSel = selectedRef.current === rung.i;

        ctx.beginPath();
        ctx.moveTo(rung.a.x, rung.a.y);
        ctx.lineTo(rung.b.x, rung.b.y);
        ctx.strokeStyle = isSel ? "rgba(255,255,255,0.85)" : `rgba(180,220,230,${0.25 + alpha * 0.35})`;
        ctx.lineWidth = isSel ? 3.5 : 2;
        ctx.stroke();

        const drawBase = (p: { x: number; y: number }, letter: Base) => {
          const r = isSel ? 9 : 7;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = COLOR[letter];
          ctx.globalAlpha = 0.55 + alpha * 0.45;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#061018";
          ctx.font = "700 10px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(letter, p.x, p.y + 0.5);
        };
        drawBase(rung.a, base);
        drawBase(rung.b, complement);
      }

      rotRef.current += 0.004;
      raf = requestAnimationFrame(draw);
    };
    draw();

    const hitIndex = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      let best = -1;
      let bestD = 22;
      for (let i = 0; i < PAIR_COUNT; i++) {
        const a = project(i, 0, -1, w, h);
        const b = project(i, Math.PI, 1, w, h);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const d = Math.hypot(x - mx, y - my);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    };

    const onPointerDown = (e: PointerEvent) => {
      dragRef.current = { x: e.clientX, rot: rotRef.current };
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      if (Math.abs(dx) > 2) {
        rotRef.current = dragRef.current.rot + dx * 0.012;
        setHint("Rotating helix…");
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const start = dragRef.current;
      dragRef.current = null;
      if (!start) return;
      const moved = Math.abs(e.clientX - start.x) > 6;
      if (moved) {
        setHint("Drag to rotate · click a rung to swap bases");
        return;
      }
      const idx = hitIndex(e.clientX, e.clientY);
      if (idx < 0) return;
      const cur = seqRef.current[idx];
      const next = BASES[(BASES.indexOf(cur) + 1) % BASES.length];
      seqRef.current = seqRef.current.map((b, i) => (i === idx ? next : b));
      const label = seqRef.current.join("");
      setSeqLabel(label);
      selectedRef.current = idx;
      setHint(`Rung ${idx + 1}: ${cur}→${next} (pair ${next}/${PAIR[next]}) — educational sandbox only`);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#071018]">
        <canvas ref={canvasRef} className="block w-full touch-none" aria-label="Interactive DNA helix sandbox" />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-white/55">{hint}</p>
        <p className="font-mono text-[11px] tracking-wide text-[#7ad0c8]/80">
          {seqLabel.slice(0, 16)}
          {seqLabel.length > 16 ? "…" : ""}
        </p>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/40">
        Procedural helix — no PDB/genome blob downloaded to ANCAP. Swap rungs locally; real files stay as
        SHA-256 fingerprints only.
      </p>
    </div>
  );
}
