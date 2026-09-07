"use client";

import { useEffect, useRef } from "react";

/**
 * Conceptual AETERNA hero motion: nanobots + chemical scissors editing a DNA fragment.
 * Educational / brand visualization only — not a wet-lab protocol.
 */
export function DnaNanobotScissors({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let running = true;
    let t0 = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || 960;
      const h = Math.max(280, Math.min(420, Math.round(w * 0.42)));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type Bot = { phase: number; lane: number; size: number };
    const bots: Bot[] = [
      { phase: 0.0, lane: -1, size: 1 },
      { phase: 0.35, lane: 1, size: 0.85 },
      { phase: 0.7, lane: -0.4, size: 0.7 },
    ];

    const COLORS = {
      A: "#ff6b9d",
      T: "#3dd68c",
      G: "#4aa3ff",
      C: "#ff8a3d",
    } as const;
    const SEQ = ["A", "T", "G", "C", "A", "G", "T", "C", "G", "A", "T", "C"] as const;
    const PAIR: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };

    const drawBot = (x: number, y: number, scale: number, scissorsOpen: number, active: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // body
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = active ? "rgba(122, 208, 200, 0.92)" : "rgba(140, 170, 210, 0.75)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // eye / sensor
      ctx.beginPath();
      ctx.arc(5, -1, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "#04201e";
      ctx.fill();

      // chemical scissors (Cas-style blades)
      const open = 0.35 + scissorsOpen * 0.55;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = active ? "#ffe08a" : "rgba(255, 220, 140, 0.65)";

      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(18, -10 * open, 26, -14 * open);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(18, 10 * open, 26, 14 * open);
      ctx.stroke();

      // hinge
      ctx.beginPath();
      ctx.arc(10, 0, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "#f0c14a";
      ctx.fill();

      // micro thruster trail
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-22 - scissorsOpen * 4, -3);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-22 - scissorsOpen * 4, 3);
      ctx.closePath();
      ctx.fillStyle = "rgba(80, 200, 255, 0.35)";
      ctx.fill();

      ctx.restore();
    };

    const draw = (now: number) => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const t = reduce ? 0.4 : (now - t0) / 1000;

      ctx.clearRect(0, 0, w, h);

      // atmosphere
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(6, 22, 28, 0.95)");
      g.addColorStop(0.55, "rgba(5, 12, 22, 0.98)");
      g.addColorStop(1, "rgba(8, 18, 32, 0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // soft vignette nodes
      for (let i = 0; i < 18; i++) {
        const px = ((i * 97 + t * 12) % w);
        const py = (i * 53) % h;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(122, 208, 200, 0.18)";
        ctx.fill();
      }

      const pairs = SEQ.length;
      const leftX = w * 0.12;
      const rightX = w * 0.88;
      const top = 36;
      const bot = h - 40;
      const amp = Math.min(48, w * 0.06);

      // helix strands + rungs
      const editIndex = Math.floor((t * 0.55) % pairs);
      const editPulse = 0.5 + 0.5 * Math.sin(t * 6);

      for (let i = 0; i < pairs; i++) {
        const u = i / (pairs - 1);
        const y = top + u * (bot - top);
        const ang = t * 1.1 + u * Math.PI * 4.2;
        const x1 = w / 2 + Math.cos(ang) * amp * -1.15;
        const x2 = w / 2 + Math.cos(ang + Math.PI) * amp * 1.15;
        const z = Math.sin(ang);
        const alpha = 0.35 + (z + 1) * 0.3;

        const base = SEQ[i];
        const comp = PAIR[base];
        const isEdit = i === editIndex;

        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = isEdit
          ? `rgba(255, 224, 138, ${0.45 + editPulse * 0.4})`
          : `rgba(170, 210, 230, ${0.2 + alpha * 0.35})`;
        ctx.lineWidth = isEdit ? 3 : 1.6;
        ctx.stroke();

        const drawBase = (x: number, letter: string, cut: boolean) => {
          const r = isEdit ? 8 : 6;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = COLORS[letter as keyof typeof COLORS] || "#fff";
          ctx.globalAlpha = cut ? 0.25 + editPulse * 0.2 : 0.55 + alpha * 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;
          if (cut) {
            ctx.strokeStyle = "rgba(255, 224, 138, 0.9)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 5);
            ctx.lineTo(x + 5, y + 5);
            ctx.stroke();
          }
          ctx.fillStyle = "#061018";
          ctx.font = "700 9px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(letter, x, y + 0.5);
        };

        const cutSide = isEdit && editPulse > 0.55;
        drawBase(x1, base, cutSide);
        drawBase(x2, comp, cutSide && editPulse > 0.75);

        // replacement flash (new base pairing)
        if (isEdit && editPulse > 0.8) {
          const next = SEQ[(i + 1) % pairs];
          ctx.globalAlpha = (editPulse - 0.8) * 5;
          ctx.fillStyle = COLORS[next as keyof typeof COLORS];
          ctx.beginPath();
          ctx.arc(x1, y - 14, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // backbone curves
      ctx.beginPath();
      for (let i = 0; i < pairs; i++) {
        const u = i / (pairs - 1);
        const y = top + u * (bot - top);
        const ang = t * 1.1 + u * Math.PI * 4.2;
        const x = w / 2 + Math.cos(ang) * amp * -1.15;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(122, 208, 200, 0.45)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < pairs; i++) {
        const u = i / (pairs - 1);
        const y = top + u * (bot - top);
        const ang = t * 1.1 + u * Math.PI * 4.2;
        const x = w / 2 + Math.cos(ang + Math.PI) * amp * 1.15;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(90, 140, 220, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // nanobots orbiting toward edit site
      const editU = editIndex / (pairs - 1);
      const editY = top + editU * (bot - top);
      const editAng = t * 1.1 + editU * Math.PI * 4.2;
      const editX = w / 2 + Math.cos(editAng) * amp * -1.15;

      bots.forEach((bot, bi) => {
        const cycle = (t * 0.35 + bot.phase) % 1;
        const approach = Math.min(1, cycle * 1.4);
        const bx = leftX + (editX - leftX - 28) * approach + bot.lane * 18;
        const by = 28 + (editY - 28) * approach + Math.sin(t * 2 + bi) * 6;
        const scissors = 0.2 + 0.8 * Math.max(0, Math.sin((cycle - 0.55) * Math.PI * 2));
        const active = approach > 0.85;
        drawBot(bx, by, bot.size, scissors, active);

        if (active && !reduce) {
          // snip spark
          ctx.beginPath();
          ctx.arc(editX + 8, editY, 3 + editPulse * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 224, 138, ${0.25 + editPulse * 0.35})`;
          ctx.fill();
        }
      });

      // label
      ctx.fillStyle = "rgba(236, 244, 255, 0.55)";
      ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("nanobot · chemical scissors · DNA fragment", 16, h - 14);
      void rightX;

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    if (reduce) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={className} style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        className="block w-full"
        aria-label="Animation: nanorobots using chemical scissors to edit a DNA fragment"
      />
    </div>
  );
}
