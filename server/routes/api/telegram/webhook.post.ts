import { defineEventHandler, readBody } from "h3";
import { telegramState, type PaperDraftState } from "../../../lib/telegram-state";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function cfg() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token ? { token } : null;
}

async function tg(method: string, payload: Record<string, unknown>) {
  const c = cfg();
  if (!c) return false;
  const res = await fetch(`https://api.telegram.org/bot${c.token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

async function reply(chatId: string, text: string, replyMarkup?: Record<string, unknown>) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

function validChat(chatId: string) {
  const allowed = process.env.TELEGRAM_CHAT_ID?.trim();
  return !allowed || allowed === chatId;
}

function parseNumber(text: string): number | null {
  const n = Number(text.replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

async function answerCallback(callbackQueryId: string) {
  if (callbackQueryId) {
    await tg("answerCallbackQuery", { callback_query_id: callbackQueryId });
  }
}

async function handleCallback(chatId: string, data: string, callbackQueryId: string) {
  await answerCallback(callbackQueryId);

  const [action, signalId, value] = data.split(":");

  if (action === "reject") {
    if (signalId) telegramState.drafts.delete(chatId);
    await reply(chatId, "❌ Signal rad etildi. Yangi signal kutamiz.");
    return;
  }

  if (action === "cancel") {
    telegramState.drafts.delete(chatId);
    await reply(chatId, "❌ Paper order bekor qilindi.");
    return;
  }

  if (!signalId) return;

  const signal = telegramState.signals.get(signalId);
  if (!signal) {
    await reply(chatId, "⚠️ Bu signal sessiyasi tugagan. Yangi signal kuting.");
    return;
  }

  if (action === "limit") {
    telegramState.drafts.set(chatId, { ...signal, step: "lot" });
    await reply(chatId, `📌 <b>${signal.direction} ${signal.tf}</b>\nLot hajmini tanlang:`, {
      inline_keyboard: [
        [
          { text: "0.01", callback_data: `lot:${signalId}:0.01` },
          { text: "0.02", callback_data: `lot:${signalId}:0.02` },
          { text: "0.05", callback_data: `lot:${signalId}:0.05` },
        ],
        [
          { text: "0.10", callback_data: `lot:${signalId}:0.10` },
          { text: "0.20", callback_data: `lot:${signalId}:0.20` },
          { text: "Bekor", callback_data: `cancel:${signalId}` },
        ],
      ],
    });
    return;
  }

  if (action === "lot") {
    const lot = parseNumber(value ?? "");
    const draft = telegramState.drafts.get(chatId);
    if (!lot || lot <= 0 || lot > 100 || !draft || draft.signalId !== signalId) {
      await reply(chatId, "⚠️ Lot qiymati noto‘g‘ri.");
      return;
    }

    draft.lot = lot;
    draft.step = "entry";
    telegramState.drafts.set(chatId, draft);
    await reply(
      chatId,
      `✅ Lot: <b>${lot}</b>\nEndi Entry narxini yuboring (masalan: 2650.50):`,
    );
    return;
  }
}

async function handleText(chatId: string, text: string) {
  const draft = telegramState.drafts.get(chatId);
  if (!draft) {
    await reply(chatId, "ℹ️ Hozircha aktiv paper-order draft yo‘q. Yangi signal kuting.");
    return;
  }

  if (draft.step === "entry") {
    const entry = parseNumber(text);
    if (entry == null || entry <= 0) {
      await reply(chatId, "⚠️ Entry narxi noto‘g‘ri. Qayta yuboring.");
      return;
    }
    draft.entry = entry;
    draft.step = "sl";
    telegramState.drafts.set(chatId, draft);
    await reply(chatId, `✅ Entry: <b>${entry}</b>\nEndi Stop Loss (SL) narxini yuboring:`);
    return;
  }

  if (draft.step === "sl") {
    const sl = parseNumber(text);
    if (sl == null || sl <= 0) {
      await reply(chatId, "⚠️ SL narxi noto‘g‘ri. Qayta yuboring.");
      return;
    }
    draft.sl = sl;
    draft.step = "confirm";
    telegramState.drafts.set(chatId, draft);

    await reply(
      chatId,
      `📋 <b>Paper order tasdiqlash</b>\n` +
        `Direction: <b>${draft.direction}</b>\n` +
        `TF: <b>${draft.tf}</b>\n` +
        `Lot: <b>${draft.lot}</b>\n` +
        `Entry: <b>${draft.entry}</b>\n` +
        `SL: <b>${sl}</b>\n\n` +
        `Tasdiqlaysizmi?`,
      {
        inline_keyboard: [
          [
            { text: "✅ Tasdiqlash", callback_data: `confirm:${draft.signalId}` },
            { text: "❌ Bekor", callback_data: `cancel:${draft.signalId}` },
          ],
        ],
      },
    );
    return;
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null);
  if (!body) return { ok: true };

  // Callback query
  if (body.callback_query) {
    const cq = body.callback_query;
    const chatId = String(cq.message?.chat?.id ?? "");
    if (!validChat(chatId)) return { ok: true };
    const data = String(cq.data ?? "");
    await handleCallback(chatId, data, String(cq.id ?? ""));

    // confirm action
    const [action, signalId] = data.split(":");
    if (action === "confirm" && signalId) {
      const draft = telegramState.drafts.get(chatId);
      if (draft && draft.signalId === signalId && draft.lot && draft.entry && draft.sl) {
        const id = `paper_${Date.now()}`;
        telegramState.paperOrders.push({
          id,
          chatId,
          signalId: draft.signalId,
          direction: draft.direction,
          tf: draft.tf,
          lot: draft.lot,
          entry: draft.entry,
          sl: draft.sl,
          createdAt: Date.now(),
        });
        telegramState.drafts.delete(chatId);
        await reply(
          chatId,
          `✅ Paper order saqlandi!\nID: <code>${id}</code>\n` +
            `${draft.direction} ${draft.tf} | Lot ${draft.lot} | Entry ${draft.entry} | SL ${draft.sl}`,
        );
      }
    }
    return { ok: true };
  }

  // Text message
  if (body.message?.text) {
    const chatId = String(body.message.chat?.id ?? "");
    if (!validChat(chatId)) return { ok: true };
    await handleText(chatId, String(body.message.text));
  }

  return { ok: true };
});
