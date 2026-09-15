export type Timeframe = "M5" | "M15" | "M30" | "H1" | "H2" | "H4";

export type Trend = "BULLISH" | "BEARISH" | "NEUTRAL";

export type Direction = "BUY" | "SELL";

export type Quality = "A+" | "A" | "B" | "C";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type Zone = {
  id: string;
  tf: Timeframe;
  high: number;
  low: number;
  time: number;
  childTime: number;
  kind: "inside" | "worked";
  direction?: Direction;
  pipsMoved?: number;
};

export type InsideBarSetup = {
  id: string;
  tf: Timeframe;
  mother: Candle;
  child: Candle;
  zoneHigh: number;
  zoneLow: number;
  entry: number;
  sl: number;
  slPips: number;
  tp60: number;
  tp120: number;
  tp220: number;
  tp300: number;
  direction: Direction;
  trend: Trend;
  compression: number;
  swept: boolean;
  validSl: boolean;
  quality: Quality;
  score: number;
  mtf: Timeframe[];
  reasons: string[];
  confluence: boolean;
};

export type MarketPack = {
  symbol: string;
  mt5: string;
  last: number;
  change: number;
  changePct: number;
  updatedAt: number;
  candles: Record<Timeframe, Candle[]>;
};

export type PipelineStage =
  | "strategy"
  | "ai"
  | "risk"
  | "executor"
  | "done"
  | "blocked";

export type AiVerdict = {
  ok: boolean;
  probability: number;
  verdict: "TASDIQLANDI" | "ZAIF" | "RAD" | "MAVJUD_EMAS";
  comment: string;
};

export type RiskVerdict = {
  allowed: boolean;
  reasons: string[];
};

export type PaperOrder = {
  id: string;
  setupId: string;
  symbol: string;
  direction: Direction;
  entry: number;
  sl: number;
  tf: Timeframe;
  status: "pending" | "sent" | "blocked";
  telegram: boolean;
  createdAt: number;
};

export type TelegramSignal = {
  signalId: string;
  setupId: string;
  sentAt: number;
  direction: Direction;
  tf: Timeframe;
};

export type PaperLimitDraft = {
  signalId: string;
  setupId: string;
  direction: Direction;
  tf: Timeframe;
  lot?: number;
  entry?: number;
  sl?: number;
  createdAt: number;
};
