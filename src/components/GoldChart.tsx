import { useEffect, useRef } from "react";
import type { Candle, InsideBarSetup, Timeframe, Zone } from "@/lib/strategy/types";

type Props = {
  candles: Candle[];
  tf: Timeframe;
  setups: InsideBarSetup[];
  zones: Zone[];
  selectedId?: string;
  onSelect?: (id: string) => void;
};

export function GoldChart({ candles, tf, setups, zones, selectedId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = Math.max(280, wrap.clientHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#18181c";
      ctx.fillRect(0, 0, w, h);

      const padL = 12;
      const padR = 58;
      const padT = 16;
      const padB = 28;
      const view = candles.slice(-140);
      if (view.length < 2) {
        ctx.fillStyle = "#9a9aa3";
        ctx.font = "13px IBM Plex Sans, sans-serif";
        ctx.fillText("Narxlar yuklanmoqda…", 20, h / 2);
        return;
      }

      const minT = view[0]!.time;
      const maxT = view[view.length - 1]!.time;
      let lo = Math.min(...view.map((c) => c.low));
      let hi = Math.max(...view.map((c) => c.high));
      const pad = (hi - lo) * 0.08 || 1;
      lo -= pad;
      hi += pad;

      const xAt = (t: number) => padL + ((t - minT) / Math.max(1, maxT - minT)) * (w - padL - padR);
      const yAt = (p: number) => padT + ((hi - p) / (hi - lo)) * (h - padT - padB);
      const barW = Math.max(3, ((w - padL - padR) / view.length) * 0.7);

      ctx.strokeStyle = "#3a3a42";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const p = lo + ((hi - lo) * i) / 4;
        const y = yAt(p);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.fillStyle = "#6e6e76";
        ctx.font = "10px IBM Plex Mono, monospace";
        ctx.textAlign = "left";
        ctx.fillText(p.toFixed(1), w - padR + 6, y + 3);
      }

      const tfZones = zones.filter((z) => z.tf === tf).slice(-8);
      for (const z of tfZones) {
        const x1 = xAt(z.time);
        const x2 = w - padR;
        const y1 = yAt(z.high);
        const y2 = yAt(z.low);
        ctx.fillStyle = "rgba(91, 124, 138, 0.12)";
        ctx.fillRect(x1, y1, Math.max(8, x2 - x1), Math.max(2, y2 - y1));
        ctx.strokeStyle = "rgba(91, 124, 138, 0.55)";
        ctx.strokeRect(x1, y1, Math.max(8, x2 - x1), Math.max(2, y2 - y1));
      }

      const tfSetups = setups.filter((s) => s.tf === tf).slice(0, 10);
      for (const s of tfSetups) {
        const x1 = xAt(s.mother.time);
        const x2 = xAt(Math.min(s.child.time + (maxT - minT) * 0.12, maxT));
        const y1 = yAt(s.zoneHigh);
        const y2 = yAt(s.zoneLow);
        const active = s.id === selectedId;
        ctx.fillStyle = active ? "rgba(210, 212, 216, 0.16)" : "rgba(138, 132, 116, 0.14)";
        ctx.fillRect(x1, y1, Math.max(6, x2 - x1), Math.max(2, y2 - y1));
        ctx.strokeStyle = active ? "#d2d4d8" : "#8a8474";
        ctx.lineWidth = active ? 1.4 : 1;
        ctx.strokeRect(x1, y1, Math.max(6, x2 - x1), Math.max(2, y2 - y1));
      }

      for (const c of view) {
        const x = xAt(c.time);
        const bull = c.close >= c.open;
        ctx.strokeStyle = bull ? "#3f9d73" : "#c45b54";
        ctx.fillStyle = bull ? "#3f9d73" : "#c45b54";
        ctx.beginPath();
        ctx.moveTo(x, yAt(c.high));
        ctx.lineTo(x, yAt(c.low));
        ctx.stroke();
        const top = yAt(Math.max(c.open, c.close));
        const bot = yAt(Math.min(c.open, c.close));
        ctx.fillRect(x - barW / 2, top, barW, Math.max(1, bot - top));
      }

      ctx.fillStyle = "#6e6e76";
      ctx.font = "10px IBM Plex Sans, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${tf} · GOLD`, padL, h - 10);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [candles, tf, setups, zones, selectedId]);

  return (
    <div
      ref={wrapRef}
      className="relative h-[340px] w-full overflow-hidden rounded-lg bg-surface md:h-[420px]"
      onClick={() => {
        const first = setups.find((s) => s.tf === tf);
        if (first) onSelect?.(first.id);
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
