# GoldAI Telegram setup

The project now keeps Telegram credentials server-side and never embeds the bot token in client code.

## Environment

Copy `.env.example` to `.env` locally or configure the same variables in the deployment:

```env
XAI_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
TELEGRAM_WEBHOOK_URL=https://your-domain.example
```

Do not commit `.env`.

## Telegram flow

1. The web terminal polls the XAUUSD scan every 30 seconds while the terminal is open.
2. A new strategy setup is sent through Grok for a compact JSON verdict.
3. Risk rules are applied.
4. A new accepted signal is sent to `TELEGRAM_CHAT_ID`.
5. The message contains `Limit qo‘yish` and `Rad etish`.
6. `Limit qo‘yish` asks for lot size, then Entry, then SL.
7. The final order is saved as a paper order and is **not** sent to a broker.

## Webhook

After deployment on a public HTTPS URL:

```bash
npm run telegram:webhook
```

with `TELEGRAM_WEBHOOK_URL` set to the deployed base URL.

## Important

The existing repository contained a hard-coded Telegram bot token. Rotate that bot token in BotFather before deploying this version. The token must exist only in the deployment secret/environment configuration.
