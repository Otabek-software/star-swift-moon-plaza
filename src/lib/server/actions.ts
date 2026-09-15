import { createServerFn } from "@tanstack/react-start";
import { loadGoldMarket } from "@/lib/market/yahoo.server.ts";
import { scanAll } from "@/lib/strategy/engine";
import type {
  AiVerdict,
  InsideBarSetup,
  MarketPack,
  TelegramSignal,
} from "@/lib/strategy/types";
import { telegramState } from "../../../server/lib/telegram-state";

function telegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  return token && chatId ? { token, chatId } : null;
}

async function telegramSend(payload: Record<string, unknown>) {
  const cfg = telegramConfig();
  if (!cfg) {
    return { ok: false as const, error: "Telegram env sozlamalari mavjud emas." };
  }
  const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.text();
    return { ok: false as const, error: error.slice(0, 300) };
  }
  return { ok: true as const };
}

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
    const prompt = `XAUUSD/GOLD Inside Bar signalini qisqa tahlil qil. Javob FAQAT JSON:\n{"probability":0-100,"verdict":"TASDIQLANDI"|"ZAIF"|"RAD","comment":"2-3 gap o'zbek tilida"}\n\nSignal:\nTF=${s.tf} yo'nalish=${s.direction} trend=${s.trend}\nzona=${s.zoneLow.toFixed(2)}-${s.zoneHigh.toFixed(2)}\nentry=${s.entry.toFixed(2)} SL=${s.sl.toFixed(2)} (${s.slPips.toFixed(1)} pip)\nsiqilish=${s.compression.toFixed(2)} sweep=${s.swept} MTF=${s.mtf.join(",")}\nsabablar=${s.reasons.join("; ")}\njoriy narx=${data.last.toFixed(2)}\nqoidalar: trend+korreksiya+inside bar+likvidlik+sweep+wick limit, SL<=20 pip, HTF impulsiga qarshi yo'q.`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Siz XAUUSD Inside Bar trader assistenti. Faqat JSON qaytaring." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      return {
        ok: false,
        probability: 0,
        verdict: "MAVJUD_EMAS",
        comment: "AI so‘rovi muvaffaqiyatsiz.",
      };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      const parsed = JSON.parse(raw.slice(start, end + 1)) as {
        probability?: number;
        verdict?: string;
        comment?: string;
      };
      const verdict =
        parsed.verdict === "TASDIQLANDI" || parsed.verdict === "ZAIF" || parsed.verdict === "RAD"
          ? parsed.verdict
          : "ZAIF";
      return {
        ok: true,
        probability: Math.max(0, Math.min(100, Number(parsed.probability) || 50)),
        verdict,
        comment: String(parsed.comment || "Tahlil yakunlandi"),
      };
    } catch {
      return {
        ok: false,
        probability: 40,
        verdict: "ZAIF",
        comment: "AI javobini o‘qib bo‘lmadi.",
      };
    }
  });

export function telegramSignalText(
  setup: InsideBarSetup,
  last: number,
  ai: AiVerdict,
): string {
  return [
    `<b>IB Terminal · GOLD</b>`,
    `${setup.direction} ${setup.tf} · ${setup.quality}`,
    `Entry: <code>${setup.entry.toFixed(2)}</code>`,
    `SL: <code>${setup.sl.toFixed(2)}</code> (${setup.slPips.toFixed(1)} pip)`,
    `AI: ${ai.verdict} (${ai.probability}%)`,
    ai.comment,
    `Narx: ${last.toFixed(2)}`,
  ].join("\n");
}

export const sendTelegramSignal = createServerFn({ method: "POST" })
  .validator(
    (d: {
      signal: TelegramSignal;
      setup: InsideBarSetup;
      last: number;
      ai: AiVerdict;
    }) => d,
  )
  .handler(async ({ data }) => {
    const cfg = telegramConfig();
    if (!cfg) return { ok: false as const, error: "Telegram env sozlamalari mavjud emas." };
    const callbackId = data.signal.signalId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    telegramState.signals.set(callbackId, {
      signalId: callbackId,
      setupId: data.setup.id,
      direction: data.setup.direction,
      tf: data.setup.tf,
      createdAt: Date.now(),
    });
    const text = telegramSignalText(data.setup, data.last, data.ai);
    return telegramSend({
      chat_id: cfg.chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Limit qo‘yish", callback_data: `limit:${callbackId}` },
            { text: "❌ Rad etish", callback_data: `reject:${callbackId}` },
          ],
        ],
      },
    });
  });

export const sendTelegramOrder = createServerFn({ method: "POST" })
  .validator((d: { text: string }) => d)
  .handler(async ({ data }) => {
    const cfg = telegramConfig();
    if (!cfg) return { ok: false as const, error: "Telegram env sozlamalari mavjud emas." };
    return telegramSend({
      chat_id: cfg.chatId,
      text: data.text,
      parse_mode: "HTML",
    });
  });

export const telegramStatus = createServerFn({ method: "POST" }).handler(async () => {
  const configured = Boolean(telegramConfig());
  return { configured };
});
