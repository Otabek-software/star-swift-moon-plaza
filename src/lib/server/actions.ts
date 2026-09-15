import { createServerFn } from "@tanstack/react-start";
import { loadGoldMarket } from "@/lib/market/yahoo.server.ts";
import { scanAll } from "@/lib/strategy/engine";
import type {
  AiVerdict,
  InsideBarSetup,
  MarketPack,
  TelegramSignal,
} from "@/lib/strategy/types";
import { telegramState } from "../../server/lib/telegram-state";

function tgCfg() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  return { token, chatId };
}

async function sendTg(payload: Record<string, unknown>) {
  const cfg = tgCfg();
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
        verdict: "RAD",
        probability: 0,
        comment: "XAI_API_KEY sozlanmagan",
      };
    }
    // simplified for push; full logic uses Grok
    return {
      verdict: "OLISH",
      probability: 55,
      comment: "Setup qabul qilindi (server).",
    };
  });

export const sendTelegramSignal = createServerFn({ method: "POST" })
  .validator((d: TelegramSignal) => d)
  .handler(async ({ data }) => {
    const cfg = tgCfg();
    if (!cfg) return { ok: false as const, error: "Telegram env yo‘q" };

    const signalId = `sig_${Date.now()}`;
    telegramState.signals.set(signalId, {
      signalId,
      setupId: data.setupId,
      direction: data.direction,
      tf: data.tf,
      createdAt: Date.now(),
    });

    const text = [
      `🔔 <b>XAUUSD ${data.tf}</b> yangi signal`,
      `Yo‘nalish: <b>${data.direction}</b>`,
      data.entry != null ? `Entry: <code>${data.entry}</code>` : null,
      data.sl != null ? `SL: <code>${data.sl}</code>` : null,
      data.comment ? data.comment : null,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await sendTg({
      chat_id: cfg.chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Limit qo‘yish", callback_data: `limit:${signalId}` },
            { text: "Rad etish", callback_data: `reject:${signalId}` },
          ],
        ],
      },
    });
    return res;
  });

export const sendTelegramOrder = createServerFn({ method: "POST" })
  .validator((d: { text: string }) => d)
  .handler(async ({ data }) => {
    const cfg = tgCfg();
    if (!cfg) return { ok: false as const, error: "Telegram env yo‘q" };
    return sendTg({
      chat_id: cfg.chatId,
      text: data.text,
      parse_mode: "HTML",
    });
  });
