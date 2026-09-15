import { MAX_SL_PIPS } from "./engine";
import type { AiVerdict, InsideBarSetup, RiskVerdict } from "./types";

export function checkRisk(setup: InsideBarSetup, last: number, ai?: AiVerdict | null): RiskVerdict {
  const reasons: string[] = [];
  if (!setup.validSl) reasons.push(`SL ${setup.slPips.toFixed(1)} pip — 20 pip limiti oshgan`);
  if (setup.trend === "NEUTRAL") reasons.push("Trend neytral — yangi savdo yo‘q");
  if (setup.quality === "C" && !setup.confluence) reasons.push("Sifat C va MTF yo‘q");
  if (ai?.verdict === "RAD") reasons.push("AI signalni rad etdi");
  if (ai?.verdict === "MAVJUD_EMAS") reasons.push("AI tasdig‘i yo‘q — ehtiyot bilan davom");
  const dist = Math.abs(last - setup.entry) / 0.1;
  if (dist > 80) reasons.push("Narx entry zonadan uzoq");
  if (setup.slPips > MAX_SL_PIPS) reasons.push("Max SL buzilgan");

  const hardBlock = reasons.some((r) => r.includes("20 pip") || r.includes("rad etdi") || r.includes("Neytral"));
  return { allowed: !hardBlock, reasons };
}

export function orderTelegramText(setup: InsideBarSetup, last: number): string {
  return [
    `<b>IB Terminal · GOLD</b>`,
    `${setup.direction} ${setup.tf} · ${setup.quality}`,
    `Entry: <code>${setup.entry.toFixed(2)}</code>`,
    `SL: <code>${setup.sl.toFixed(2)}</code> (${setup.slPips.toFixed(1)} pip)`,
    `TP: 60 / 120 / 220 / 300 pip`,
    `MTF: ${setup.mtf.join(" + ")}`,
    `Narx: ${last.toFixed(2)}`,
    setup.reasons.join(" · "),
  ].join("\n");
}
