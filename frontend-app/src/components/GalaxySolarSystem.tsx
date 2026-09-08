"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  compact?: boolean;
  scaleLabel?: string;
};

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Animated Milky Way that zooms into the Solar System.
 * Brand visualization — not an astrometric simulation.
 */
export function GalaxySolarSystem({ className = "", compact = false, scaleLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || 960;
      const h = compact
        ? Math.max(300, Math.min(460, Math.round(w * 0.46)))
        : Math.max(380, Math.min(640, Math.round(w * 0.52)));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const starCount = compact ? 520 : 780;
    const stars = Array.from({ length: starCount }, () => {
      const arm = Math.floor(Math.random() * 4);
      const t = Math.random();
      const theta = t * Math.PI * 4.2 + arm * (Math.PI / 2) + (Math.random() - 0.5) * 0.35;
      const r = 0.08 + t * 0.92 + (Math.random() - 0.5) * 0.08;
      return {
        theta,
        r,
        z: (Math.random() - 0.5) * 0.12,
        size: Math.random() < 0.08 ? 1.6 + Math.random() * 1.4 : 0.5 + Math.random() * 0.9,
        tint: Math.random(),
        tw: Math.random() * Math.PI * 2,
      };
    });

    const planets = [
      { name: "Mercury", a: 22, r: 2.1, color: "#c9b199", speed: 4.15, phase: 0.2 },
      { name: "Venus", a: 32, r: 3.4, color: "#e8d5a3", speed: 1.62, phase: 1.1 },
      { name: "Earth", a: 44, r: 3.6, color: "#6db7ff", speed: 1.0, phase: 0.4, moon: true },
      { name: "Mars", a: 58, r: 2.8, color: "#d0724a", speed: 0.53, phase: 2.4 },
      { name: "Jupiter", a: 88, r: 8.2, color: "#d9b48a", speed: 0.084, phase: 0.7 },
      { name: "Saturn", a: 118, r: 7.0, color: "#e6d3a3", speed: 0.034, phase: 3.1, rings: true },
      { name: "Uranus", a: 148, r: 4.6, color: "#9ad7e0", speed: 0.012, phase: 1.8 },
      { name: "Neptune", a: 176, r: 4.4, color: "#4f7cff", speed: 0.006, phase: 2.9 },
    ];

    const drawGalaxy = (w: number, h: number, t: number, alpha: number) => {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(w * 0.52, h * 0.52);
      ctx.rotate(-0.55 + t * 0.04);
      ctx.scale(1.05, 0.46);

      const grd = ctx.createRadialGradient(0, 0, 8, 0, 0, Math.min(w, h) * 0.62);
      grd.addColorStop(0, "rgba(255, 236, 210, 0.95)");
      grd.addColorStop(0.12, "rgba(255, 196, 140, 0.55)");
      grd.addColorStop(0.28, "rgba(120, 90, 180, 0.22)");
      grd.addColorStop(1, "rgba(8, 12, 28, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.62, 0, Math.PI * 2);
      ctx.fill();

      for (const star of stars) {
        const spin = star.theta + t * 0.12;
        const x = Math.cos(spin) * star.r * Math.min(w, h) * 0.58;
        const y = Math.sin(spin) * star.r * Math.min(w, h) * 0.58 + star.z * h;
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2 + star.tw));
        ctx.fillStyle =
          star.tint > 0.82
            ? `rgba(255, 214, 170, ${0.55 * tw})`
            : star.tint > 0.55
              ? `rgba(186, 210, 255, ${0.5 * tw})`
              : `rgba(240, 248, 255, ${0.4 * tw})`;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawSolar = (w: number, h: number, t: number, alpha: number, zoom: number) => {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const cx = w * 0.5;
      const cy = h * 0.52;
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);

      for (const p of planets) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(180, 210, 255, 0.16)";
        ctx.lineWidth = 1 / zoom;
        ctx.ellipse(0, 0, p.a, p.a * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const sunGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 36);
      sunGlow.addColorStop(0, "rgba(255, 244, 200, 1)");
      sunGlow.addColorStop(0.35, "rgba(255, 176, 64, 0.85)");
      sunGlow.addColorStop(1, "rgba(255, 140, 40, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe7a0";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      for (const p of planets) {
        const ang = t * p.speed + p.phase;
        const x = Math.cos(ang) * p.a;
        const y = Math.sin(ang) * p.a * 0.62;
        if (p.rings) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-0.4);
          ctx.strokeStyle = "rgba(230, 210, 160, 0.7)";
          ctx.lineWidth = 2 / zoom;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r + 6, p.r * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.moon) {
          const mx = x + Math.cos(t * 6.2) * 8;
          const my = y + Math.sin(t * 6.2) * 5;
          ctx.fillStyle = "#d9dce6";
          ctx.beginPath();
          ctx.arc(mx, my, 1.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const cycle = 18;
    const paint = (now: number) => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const t = reduce ? 4.2 : (now / 1000) % cycle;
      const u = t / cycle;
      const galaxyAlpha = 1 - smoothstep(0.28, 0.48, u) + smoothstep(0.86, 1, u) * 0.85;
      const solarAlpha = smoothstep(0.32, 0.52, u) * (1 - smoothstep(0.88, 1, u));
      const solarZoom = 0.55 + smoothstep(0.38, 0.72, u) * 1.35;

      ctx.fillStyle = "#050814";
      ctx.fillRect(0, 0, w, h);
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "#0b1230");
      bg.addColorStop(1, "#050814");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      drawGalaxy(w, h, t, Math.min(1, galaxyAlpha));
      drawSolar(w, h, t, Math.min(1, solarAlpha), solarZoom);

      if (labelRef.current) {
        const inSolar = solarAlpha > 0.45;
        labelRef.current.textContent = inSolar
          ? scaleLabel || "Solar System"
          : scaleLabel || "Milky Way";
      }

      if (!reduce) raf = requestAnimationFrame(paint);
    };

    if (reduce) paint(4200);
    else raf = requestAnimationFrame(paint);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [compact, scaleLabel]);

  return (
    <div className={className} style={{ position: "relative", width: "100%" }}>
      <canvas
        ref={canvasRef}
        aria-label="Animated view of the Milky Way zooming into the Solar System"
        style={{ display: "block", width: "100%", background: "#050814" }}
      />
      <div
        ref={labelRef}
        style={{
          position: "absolute",
          left: 16,
          bottom: 14,
          padding: "6px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(232, 238, 248, 0.9)",
          background: "rgba(5, 8, 20, 0.55)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        Milky Way
      </div>
    </div>
  );
}
