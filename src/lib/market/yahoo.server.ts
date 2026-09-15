import type { Candle, MarketPack, Timeframe } from "@/lib/strategy/types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type Quote = { open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[] };

type ChartResult = {
  meta?: { regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number; symbol?: string };
  timestamp?: number[];
  indicators?: { quote?: Quote[] };
};

async function yahoo(
  symbol: string,
  interval: string,
  range: string,
): Promise<{ price?: number; prev?: number; candles: Candle[] } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const json = (await res.json()) as { chart?: { result?: ChartResult[] } };
  const result = json.chart?.result?.[0];
  if (!result?.timestamp) return null;
  const q = result.indicators?.quote?.[0];
  if (!q) return null;
  const candles: Candle[] = [];
  for (let i = 0; i < result.timestamp.length; i++) {
    const t = result.timestamp[i];
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    if (t == null || o == null || h == null || l == null || c == null) continue;
    if (![o, h, l, c].every((n) => Number.isFinite(n))) continue;
    candles.push({ time: t, open: o, high: h, low: l, close: c });
  }
  return {
    price: result.meta?.regularMarketPrice,
    prev: result.meta?.previousClose ?? result.meta?.chartPreviousClose,
    candles,
  };
}

function resample(src: Candle[], seconds: number): Candle[] {
  const out: Candle[] = [];
  let bucket: Candle | null = null;
  let bucketStart = 0;
  for (const c of src) {
    const start = Math.floor(c.time / seconds) * seconds;
    if (!bucket || start !== bucketStart) {
      if (bucket) out.push(bucket);
      bucket = { time: start, open: c.open, high: c.high, low: c.low, close: c.close };
      bucketStart = start;
    } else {
      bucket.high = Math.max(bucket.high, c.high);
      bucket.low = Math.min(bucket.low, c.low);
      bucket.close = c.close;
    }
  }
  if (bucket) out.push(bucket);
  return out;
}

const SYMBOLS = ["GC=F", "XAUUSD=X"];

export async function loadGoldMarket(): Promise<MarketPack> {
  let pack: Awaited<ReturnType<typeof yahoo>> | null = null;
  let symbol = "GC=F";
  for (const s of SYMBOLS) {
    pack = await yahoo(s, "15m", "10d");
    if (pack && pack.candles.length > 40) {
      symbol = s;
      break;
    }
  }
  if (!pack || pack.candles.length < 20) {
    throw new Error("GOLD narxlarini yuklab bo‘lmadi");
  }

  const h1 = await yahoo(symbol, "60m", "60d");
  const m5 = await yahoo(symbol, "5m", "5d");
  const m15 = pack.candles;
  const m5c = m5?.candles ?? [];
  const h1c = h1?.candles?.length ? h1.candles : resample(m15, 3600);
  const m30 = resample(m15, 1800);
  const h2 = resample(h1c, 7200);
  const h4 = resample(h1c, 14400);

  const lastC = m15[m15.length - 1] ?? h1c[h1c.length - 1];
  const last = lastC?.close ?? pack.price ?? 0;
  const prev = pack.prev ?? last;
  const change = last - prev;
  const changePct = prev ? (change / prev) * 100 : 0;

  const candles: Record<Timeframe, Candle[]> = {
    M5: m5c,
    M15: m15,
    M30: m30,
    H1: h1c,
    H2: h2,
    H4: h4,
  };

  return {
    symbol,
    mt5: "GOLD",
    last,
    change,
    changePct,
    updatedAt: Date.now(),
    candles,
  };
}
