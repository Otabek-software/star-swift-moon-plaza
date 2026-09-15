import process from "node:process";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL?.trim();

if (!token || !webhookUrl) {
  console.error("TELEGRAM_BOT_TOKEN va TELEGRAM_WEBHOOK_URL kerak.");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl.replace(/\/$/, "") + "/api/telegram/webhook",
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  }),
});

const text = await res.text();
console.log(text);

if (!res.ok) process.exit(1);
