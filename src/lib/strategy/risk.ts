export type Setup = {
  id: string;
  direction: "BUY" | "SELL";
  tf: string;
  entry?: number;
  sl?: number;
  tp?: number;
  reason?: string;
};

export type RiskResult = {
  ok: boolean;
  reason?: string;
};

export function checkRisk(setup: Setup, lastPrice: number): RiskResult {
  if (!setup.entry || !setup.sl) {
    return { ok: false, reason: "Entry yoki SL yo‘q" };
  }
  const risk = Math.abs(setup.entry - setup.sl);
  if (risk <= 0) return { ok: false, reason: "Risk 0" };
  // simple RR filter
  if (setup.tp) {
    const reward = Math.abs(setup.tp - setup.entry);
    if (reward / risk < 1.2) {
      return { ok: false, reason: "RR < 1.2" };
    }
  }
  // direction sanity vs last
  if (setup.direction === "BUY" && setup.sl >= setup.entry) {
    return { ok: false, reason: "BUY uchun SL entry dan past bo‘lishi kerak" };
  }
  if (setup.direction === "SELL" && setup.sl <= setup.entry) {
    return { ok: false, reason: "SELL uchun SL entry dan yuqori bo‘lishi kerak" };
  }
  return { ok: true };
}

export function orderTelegramText(setup: Setup, last: number): string {
  return [
    `📊 <b>XAUUSD ${setup.tf}</b>`,
    `Yo‘nalish: <b>${setup.direction}</b>`,
    setup.entry != null ? `Entry: <code>${setup.entry.toFixed(2)}</code>` : null,
    setup.sl != null ? `SL: <code>${setup.sl.toFixed(2)}</code>` : null,
    setup.tp != null ? `TP: <code>${setup.tp.toFixed(2)}</code>` : null,
    `Last: <code>${last.toFixed(2)}</code>`,
    setup.reason ? `Sabab: ${setup.reason}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
