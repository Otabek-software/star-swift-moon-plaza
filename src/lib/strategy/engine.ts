import type {
  Candle,
  Direction,
  InsideBarSetup,
  Quality,
  Timeframe,
  Trend,
  Zone,
} from "./types";

export const PIP = 0.1;
export const MAX_SL_PIPS = 20;

export function pips(distance: number): number {
  return Math.abs(distance) / PIP;
}

function candleAt(c: Candle[], i: number): Candle | undefined {
  return c[i];
}

export function detectInsideBars(candles: Candle[]): { mother: number; child: number }[] {
  const out: { mother: number; child: number }[] = [];
  for (let i = 1; i < candles.length; i++) {
    const mother = candles[i - 1];
    const child = candles[i];
    if (!mother || !child) continue;
    if (child.high <= mother.high && child.low >= mother.low) {
      const mRange = mother.high - mother.low;
      if (mRange > PIP * 4) out.push({ mother: i - 1, child: i });
    }
  }
  return out;
}

function swings(candles: Candle[], left = 3, right = 3) {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = left; i < candles.length - right; i++) {
    const c = candles[i];
    if (!c) continue;
    let isHigh = true;
    let isLow = true;
    for (let k = i - left; k <= i + right; k++) {
      if (k === i) continue;
      const n = candles[k];
      if (!n) continue;
      if (n.high >= c.high) isHigh = false;
      if (n.low <= c.low) isLow = false;
    }
    if (isHigh) highs.push(i);
    if (isLow) lows.push(i);
  }
  return { highs, lows };
}

export function detectTrend(candles: Candle[]): Trend {
  if (candles.length < 20) return "NEUTRAL";
  const { highs, lows } = swings(candles);
  if (highs.length < 2 || lows.length < 2) {
    const slice = candles.slice(-20);
    const first = slice[0];
    const last = slice[slice.length - 1];
    if (!first || !last) return "NEUTRAL";
    if (last.close > first.close * 1.004) return "BULLISH";
    if (last.close < first.close * 0.996) return "BEARISH";
    return "NEUTRAL";
  }
  const h1 = candles[highs[highs.length - 2]!];
  const h2 = candles[highs[highs.length - 1]!];
  const l1 = candles[lows[lows.length - 2]!];
  const l2 = candles[lows[lows.length - 1]!];
  if (!h1 || !h2 || !l1 || !l2) return "NEUTRAL";
  const hh = h2.high > h1.high;
  const hl = l2.low > l1.low;
  const lh = h2.high < h1.high;
  const ll = l2.low < l1.low;
  if (hh && hl) return "BULLISH";
  if (lh && ll) return "BEARISH";
  return "NEUTRAL";
}

function nearSwing(candles: Candle[], idx: number, kind: "high" | "low"): boolean {
  const { highs, lows } = swings(candles, 2, 2);
  const list = kind === "high" ? highs : lows;
  return list.some((s) => Math.abs(s - idx) <= 3);
}

function wasSwept(candles: Candle[], childIdx: number, direction: Direction): boolean {
  const child = candles[childIdx];
  if (!child) return false;
  for (let i = childIdx + 1; i < Math.min(candles.length, childIdx + 8); i++) {
    const c = candles[i];
    if (!c) continue;
    if (direction === "BUY" && c.low < child.low) return true;
    if (direction === "SELL" && c.high > child.high) return true;
  }
  return false;
}

function inCorrection(candles: Candle[], idx: number, trend: Trend): boolean {
  if (idx < 6) return false;
  const recent = candles.slice(Math.max(0, idx - 8), idx + 1);
  if (recent.length < 5) return false;
  let impulse = 0;
  for (let i = 1; i < recent.length; i++) {
    const a = recent[i - 1];
    const b = recent[i];
    if (!a || !b) continue;
    impulse += b.close - a.close;
  }
  if (trend === "BULLISH") return impulse < PIP * 8;
  if (trend === "BEARISH") return impulse > -PIP * 8;
  return false;
}

function qualityFromScore(score: number, confluence: boolean): Quality {
  if (confluence && score >= 70) return "A+";
  if (score >= 70) return "A";
  if (score >= 50) return "B";
  return "C";
}

function overlap(aHigh: number, aLow: number, bHigh: number, bLow: number): number {
  const o = Math.min(aHigh, bHigh) - Math.max(aLow, bLow);
  if (o <= 0) return 0;
  const smaller = Math.min(aHigh - aLow, bHigh - bLow);
  return smaller > 0 ? o / smaller : 0;
}

export function buildSetups(
  tf: Timeframe,
  candles: Candle[],
  others: Partial<Record<Timeframe, Candle[]>>,
): InsideBarSetup[] {
  const trend = detectTrend(candles);
  const ibs = detectInsideBars(candles);
  const setups: InsideBarSetup[] = [];

  for (const ib of ibs) {
    const mother = candleAt(candles, ib.mother);
    const child = candleAt(candles, ib.child);
    if (!mother || !child) continue;
    if (trend === "NEUTRAL") continue;

    const compression = (child.high - child.low) / Math.max(mother.high - mother.low, PIP);
    const direction: Direction = trend === "BULLISH" ? "BUY" : "SELL";
    const entry = direction === "BUY" ? mother.low : mother.high;
    const slRaw = direction === "BUY" ? Math.min(mother.low, child.low) - PIP : Math.max(mother.high, child.high) + PIP;
    const slPipsVal = pips(entry - slRaw);
    const sl =
      direction === "BUY" ? entry - Math.min(slPipsVal, MAX_SL_PIPS) * PIP : entry + Math.min(slPipsVal, MAX_SL_PIPS) * PIP;
    const validSl = slPipsVal <= MAX_SL_PIPS + 0.5;
    const sign = direction === "BUY" ? 1 : -1;
    const swept = wasSwept(candles, ib.child, direction);
    const correction = inCorrection(candles, ib.child, trend);
    const atLiquidity = nearSwing(candles, ib.mother, direction === "BUY" ? "low" : "high");

    const mtf: Timeframe[] = [tf];
    for (const [otherTf, otherCandles] of Object.entries(others) as [Timeframe, Candle[] | undefined][]) {
      if (!otherCandles || otherTf === tf) continue;
      const otherIbs = detectInsideBars(otherCandles).slice(-12);
      for (const o of otherIbs) {
        const om = otherCandles[o.mother];
        if (!om) continue;
        if (overlap(mother.high, mother.low, om.high, om.low) >= 0.28) {
          if (!mtf.includes(otherTf)) mtf.push(otherTf);
        }
      }
    }

    const confluence = mtf.length >= 2;
    const reasons: string[] = [`${trend} trend`];
    let score = 45;
    if (correction) {
      score += 12;
      reasons.push("Korreksiya ichida");
    }
    if (atLiquidity) {
      score += 14;
      reasons.push("Likvidlik / swing zona");
    }
    if (swept) {
      score += 12;
      reasons.push("Sweep bor");
    }
    if (compression < 0.5) {
      score += 10;
      reasons.push("Kuchli siqilish");
    }
    if (confluence) {
      score += 18;
      reasons.push(`MTF: ${mtf.join(" + ")}`);
    }
    if (validSl) {
      score += 8;
      reasons.push(`SL ${slPipsVal.toFixed(1)} pip`);
    } else {
      score -= 20;
      reasons.push("SL 20 pipdan katta — invalid");
    }
    if (ib.child < candles.length - 24) score -= 8;

    const recentOnly = ib.child >= candles.length - 40;
    if (!recentOnly && !confluence) continue;

    setups.push({
      id: `${tf}-${mother.time}-${child.time}-${direction}`,
      tf,
      mother,
      child,
      zoneHigh: mother.high,
      zoneLow: mother.low,
      entry,
      sl,
      slPips: Math.min(slPipsVal, MAX_SL_PIPS),
      tp60: entry + sign * 60 * PIP,
      tp120: entry + sign * 120 * PIP,
      tp220: entry + sign * 220 * PIP,
      tp300: entry + sign * 300 * PIP,
      direction,
      trend,
      compression,
      swept,
      validSl,
      quality: qualityFromScore(score, confluence),
      score,
      mtf,
      reasons,
      confluence,
    });
  }

  return setups.sort((a, b) => b.child.time - a.child.time || b.score - a.score);
}

export function workedZones(tf: Timeframe, candles: Candle[]): Zone[] {
  const ibs = detectInsideBars(candles);
  const zones: Zone[] = [];
  for (const ib of ibs) {
    const mother = candles[ib.mother];
    const child = candles[ib.child];
    if (!mother || !child) continue;
    const future = candles.slice(ib.child + 1, ib.child + 18);
    if (future.length < 4) continue;
    const maxHigh = Math.max(...future.map((c) => c.high));
    const minLow = Math.min(...future.map((c) => c.low));
    const up = pips(maxHigh - mother.high);
    const down = pips(mother.low - minLow);
    const moved = Math.max(up, down);
    if (moved < 70) continue;
    const direction: Direction = up >= down ? "BUY" : "SELL";
    zones.push({
      id: `w-${tf}-${mother.time}`,
      tf,
      high: mother.high,
      low: mother.low,
      time: mother.time,
      childTime: child.time,
      kind: "worked",
      direction,
      pipsMoved: Math.round(moved),
    });
  }
  return zones.slice(-18);
}

export function scanAll(pack: Record<Timeframe, Candle[]>): {
  setups: InsideBarSetup[];
  zones: Zone[];
  trends: Partial<Record<Timeframe, Trend>>;
} {
  const tfs = Object.keys(pack) as Timeframe[];
  const setups: InsideBarSetup[] = [];
  const zones: Zone[] = [];
  const trends: Partial<Record<Timeframe, Trend>> = {};

  for (const tf of tfs) {
    const candles = pack[tf] ?? [];
    trends[tf] = detectTrend(candles);
    const others: Partial<Record<Timeframe, Candle[]>> = {};
    for (const o of tfs) if (o !== tf) others[o] = pack[o];
    setups.push(...buildSetups(tf, candles, others));
    zones.push(...workedZones(tf, candles));
  }

  const unique = new Map<string, InsideBarSetup>();
  for (const s of setups) {
    const prev = unique.get(s.id);
    if (!prev || s.score > prev.score) unique.set(s.id, s);
  }

  const ranked = [...unique.values()].sort((a, b) => {
    const q = { "A+": 4, A: 3, B: 2, C: 1 };
    if (q[a.quality] !== q[b.quality]) return q[b.quality] - q[a.quality];
    return b.child.time - a.child.time;
  });

  return { setups: ranked.slice(0, 40), zones, trends };
}
