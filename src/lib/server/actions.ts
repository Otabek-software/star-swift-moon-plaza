import { createServerFn } from "@tanstack/react-start";
import { loadGoldMarket } from "@/lib/market/yahoo.server.ts";
import { scanAll } from "@/lib/strategy/engine";
import type { AiVerdict, InsideBarSetup, MarketPack } from "@/lib/strategy/types";

export const getGoldScan = createServerFn({ method: "POST" }).handler(async () => {
  const market = await loadGoldMarket();
  const scan = scanAll(market.candles);
  return { market, ...scan } as {
    market: MarketPack;
    setups: InsideBarSetup[];
    zones: ReturnType<typeof scanAll>["zones"];
    trends: ReturnType<typeof scanAll>["trends"];
  };
});

export const analyzeSetup = createServerFn({ method: "POST" })
  .validator((d: { setup: InsideBarSetup; last: number }) => d)
  .handler(async ({ data }): Promise<AiVerdict> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        probability: 0,
        verdict: "MAVJUD_EMAS",
        comment: "AI hozircha mavjud emas. Signal qo‘lda tasdiqlansin.",
      };
    }

    const s = data.setup;
    const prompt = `XAUUSD/GOLD Inside Bar signalini qisqa tahlil qil. Javob FAQAT JSON:
{"probability":0-100,"verdict":"TASDIQLANDI"|"ZAIF"|"RAD","comment":"2-3 gap o'zbek tilida"}

Signal:
TF=${s.tf} yo'nalish=${s.direction} trend=${s.trend}
zona=${s.zoneLow.toFixed(2)}-${s.zoneHigh.toFixed(2)}
entry=${s.entry.toFixed(2)} SL=${s.sl.toFixed(2)} (${s.slPips.toFixed(1)} pip)
siqilish=${s.compression.toFixed(2)} sweep=${s.swept} MTF=${s.mtf.join(",")}
sabablar=${s.reasons.join("; ")}
joriy narx=${data.last.toFixed(2)}
qoidalar: trend+korreksiya+inside bar+likvidlik+sweep+wick limit, SL<=20 pip, HTF impulsiga qarshi yo'q.`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 280,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      return {
        ok: false,
        probability: 0,
        verdict: "MAVJUD_EMAS",
        comment: `AI xatosi (${res.status}). Keyinroq urinib ko‘ring.`,
      };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { ok: true, probability: 50, verdict: "ZAIF", comment: text.slice(0, 280) || "Tahlil o‘qilmadi." };
    }
    try {
      const parsed = JSON.parse(match[0]) as { probability?: number; verdict?: string; comment?: string };
      const verdict =
        parsed.verdict === "TASDIQLANDI" || parsed.verdict === "RAD" || parsed.verdict === "ZAIF"
          ? parsed.verdict
          : "ZAIF";
      const probability = Math.max(0, Math.min(100, Number(parsed.probability) || 0));
      return {
        ok: true,
        probability,
        verdict,
        comment: parsed.comment ?? "Tahlil tayyor.",
      };
    } catch {
      return { ok: true, probability: 45, verdict: "ZAIF", comment: "AI javobi parse qilinmadi." };
    }
  });

const TG_TOKEN = "8789550367:AAFlkYBKyRKSa56Qdc1WEp6IFEORcj8YF5g";
const TG_CHAT = "6035465216";

export const sendTelegramOrder = createServerFn({ method: "POST" })
  .validator((d: { text: string }) => d)
  .handler(async ({ data }) => {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text: data.text,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false as const, error: err.slice(0, 200) };
    }
    return { ok: true as const };
  });
