export type PendingSignalState = {
  signalId: string;
  setupId: string;
  direction: "BUY" | "SELL";
  tf: string;
  createdAt: number;
};

export type PaperDraftState = PendingSignalState & {
  step: "lot" | "entry" | "sl" | "confirm";
  lot?: number;
  entry?: number;
  sl?: number;
};

type TelegramState = {
  signals: Map<string, PendingSignalState>;
  drafts: Map<string, PaperDraftState>;
  paperOrders: Array<{
    id: string;
    chatId: string;
    signalId: string;
    direction: "BUY" | "SELL";
    tf: string;
    lot: number;
    entry: number;
    sl: number;
    createdAt: number;
  }>;
};

const root = globalThis as typeof globalThis & {
  __goldAiTelegramState__?: TelegramState;
};

export const telegramState =
  root.__goldAiTelegramState__ ??
  (root.__goldAiTelegramState__ = {
    signals: new Map(),
    drafts: new Map(),
    paperOrders: [],
  });
