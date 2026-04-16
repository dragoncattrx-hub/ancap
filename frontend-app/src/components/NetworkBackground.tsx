"use client";

import { useEffect, useRef } from "react";

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width: number, height: number;
    let nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }> = [];
    const nodeCount = 80;
    const maxDist = 180;
    let scrollPhase = 0;
    let rafId: number;

    function resize() {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      if (nodes.length === 0) initNodes();
    }

    function initNodes() {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: 1.5 + Math.random() * 1.5,
        });
      }
    }

    function updateScrollPhase() {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollPhase = docHeight > 0 ? Math.min(1, scrollY / docHeight) : 0;
    }

    function draw() {
      if (!ctx || !width || !height) return;
      if (nodes.some((n) => !Number.isFinite(n.x) || !Number.isFinite(n.y))) {
        initNodes();
      }

      ctx.clearRect(0, 0, width, height);

      const connectionDist = maxDist * (0.7 + scrollPhase * 0.5);
      const lineOpacity = 0.15 + scrollPhase * 0.2;
      const glowIntensity = 0.3 + scrollPhase * 0.5;
      const hueShift = scrollPhase * 40;

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < connectionDist) {
            const alpha = (1 - d / connectionDist) * lineOpacity;
            const hue = (170 + hueShift) % 360;
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        n.x = Math.max(0, Math.min(width, n.x));
        n.y = Math.max(0, Math.min(height, n.y));

        const hue = (170 + hueShift) % 360;
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        grd.addColorStop(0, `hsla(${hue}, 80%, 70%, ${glowIntensity})`);
        grd.addColorStop(0.4, `hsla(${hue}, 70%, 55%, ${glowIntensity * 0.4})`);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${hue}, 85%, 65%, ${0.6 + scrollPhase * 0.3})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    }

    function onScroll() {
      updateScrollPhase();
    }

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    resize();
    updateScrollPhase();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="canvas-wrap" aria-hidden="true">
      <canvas ref={canvasRef} id="network"></canvas>
    </div>
  );
}
