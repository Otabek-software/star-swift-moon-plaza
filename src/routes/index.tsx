import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  ShieldCheck,
  Send,
  RefreshCw,
  Layers,
} from "lucide-react";
import { GoldChart } from "@/components/GoldChart";
import { Badge, Button } from "@/components/ui";
import { analyzeSetup, getGoldScan, sendTelegramOrder } from "@/lib/server/actions";
import { checkRisk, orderTelegramText } from "@/lib/strategy/risk";
import type {
  AiVerdict,
  InsideBarSetup,
  MarketPack,
  PaperOrder,
  PipelineStage,
  Timeframe,
  Zone,
} from "@/lib/strategy/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const TFS: Timeframe[] = ["H4", "H2", "H1", "M30", "M15", "M5"];

function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState<MarketPack | null>(null);
  const [setups, setSetups] = useState<InsideBarSetup[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tf, setTf] = useState<Timeframe>("H1");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [stage, setStage] = useState<PipelineStage>("strategy");
  const [ai, setAi] = useState<AiVerdict | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getGoldScan();
      setMarket(data.market);
      setSetups(data.setups);
      setZones(data.zones);
      setSelectedId((id) => id ?? data.setups[0]?.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuklash xatosi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 90_000);
    return () => window.clearInterval(id);
  }, [load]);

  const selected = setups.find((s) => s.id === selectedId) ?? setups[0];
  const candles = market?.candles[tf] ?? [];
  const last = market?.last ?? 0;
  const risk = selected ? checkRisk(selected, last, ai) : null;

  const strong = useMemo(
    () => setups.filter((s) => s.quality === "A+" || s.quality === "A" || s.confluence),
    [setups],
  );

  async function runAi() {
    if (!selected || !market) return;
    setAiBusy(true);
    setStage("ai");
    setNote(null);
    try {
      const v = await analyzeSetup({ data: { setup: selected, last: market.last } });
      setAi(v);
      setStage(v.verdict === "RAD" ? "blocked" : "risk");
    } catch {
      setNote("AI so‘rovi bajarilmadi");
      setStage("risk");
    } finally {
      setAiBusy(false);
    }
  }

  async function execute() {
    if (!selected || !market || !risk) return;
    setStage("executor");
    const verdict = checkRisk(selected, market.last, ai);
    if (!verdict.allowed) {
      setStage("blocked");
      setNote(verdict.reasons[0] ?? "Risk blokladi");
      return;
    }
    const text = orderTelegramText(selected, market.last);
    const tg = await sendTelegramOrder({ data: { text } });
    const order: PaperOrder = {
      id: `ord-${Date.now()}`,
      setupId: selected.id,
      symbol: "GOLD",
      direction: selected.direction,
      entry: selected.entry,
      sl: selected.sl,
      tf: selected.tf,
      status: tg.ok ? "sent" : "pending",
      telegram: Boolean(tg.ok),
      createdAt: Date.now(),
    };
    setOrders((o) => [order, ...o].slice(0, 12));
    setStage("done");
    setNote(
      tg.ok
        ? "Telegramga yuborildi. MT5 da GOLD bo‘yicha Limit order qo‘ying."
        : `Telegram xatosi. Order saqlandi. ${"error" in tg ? tg.error : ""}`,
    );
  }

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-wide text-muted uppercase">MT5 · GOLD · XAUUSD</p>
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">IB Terminal</h1>
          </div>
          <div className="flex items-center gap-4">
            {market && (
              <div className="text-right">
                <p className="font-mono text-lg tabular-nums">{market.last.toFixed(2)}</p>
                <p
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    market.change >= 0 ? "text-bull" : "text-bear",
                  )}
                >
                  {market.change >= 0 ? "+" : ""}
                  {market.change.toFixed(2)} ({market.changePct.toFixed(2)}%)
                </p>
              </div>
            )}
            <Button variant="ghost" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Yangilash
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] md:p-6">
        <section className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TFS.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={cn(
                  "min-h-10 rounded-sm px-3 font-mono text-xs",
                  tf === t ? "bg-accent text-accent-fg" : "bg-panel text-muted hover:text-fg",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <GoldChart
            candles={candles}
            tf={tf}
            setups={setups}
            zones={zones}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
          <p className="text-xs text-muted">
            Sariq-kulrang to‘rtburchak — Inside Bar zonasi (ona/bola soya). Ko‘k-kulrang —
            oldin ishlagan likvidlik zonalari.
          </p>

          <Pipeline stage={stage} />

          {selected && (
            <article className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={selected.direction === "BUY" ? "bull" : "bear"}>{selected.direction}</Badge>
                <Badge>{selected.tf}</Badge>
                <Badge tone="accent">{selected.quality}</Badge>
                {selected.confluence && <Badge>MTF {selected.mtf.join("+")}</Badge>}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm md:grid-cols-4">
                <Stat k="Entry" v={selected.entry.toFixed(2)} />
                <Stat k="SL" v={`${selected.sl.toFixed(2)} · ${selected.slPips.toFixed(1)}p`} />
                <Stat k="TP 60/120" v={`${selected.tp60.toFixed(1)} / ${selected.tp120.toFixed(1)}`} />
                <Stat k="TP 220/300" v={`${selected.tp220.toFixed(1)} / ${selected.tp300.toFixed(1)}`} />
              </dl>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {selected.reasons.map((r) => (
                  <li key={r}>— {r}</li>
                ))}
              </ul>
              {ai && (
                <div className="mt-3 rounded-md bg-panel p-3">
                  <p className="text-sm font-medium">
                    AI: {ai.verdict} · ehtimol {ai.probability}%
                  </p>
                  <p className="mt-1 text-sm text-muted">{ai.comment}</p>
                </div>
              )}
              {risk && risk.reasons.length > 0 && (
                <p className="mt-2 text-xs text-muted">{risk.reasons.join(" · ")}</p>
              )}
              {note && <p className="mt-2 text-sm text-fg">{note}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => void runAi()} disabled={!selected || aiBusy}>
                  <Bot className="size-4" />
                  {aiBusy ? "AI o‘qimoqda…" : "AI tahlil"}
                </Button>
                <Button variant="ghost" onClick={() => void execute()} disabled={!selected}>
                  <Send className="size-4" />
                  Risk + Telegram
                </Button>
              </div>
            </article>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Layers className="size-4" /> Kuchli Inside Bar
            </h2>
            {loading && <p className="text-sm text-muted">Skaner ishlayapti…</p>}
            {error && <p className="text-sm text-bear">{error}</p>}
            <div className="max-h-[360px] space-y-2 overflow-auto">
              {strong.length === 0 && !loading && (
                <p className="text-sm text-muted">Hozir A+/A signal yo‘q. C/B pastda.</p>
              )}
              {(strong.length ? strong : setups.slice(0, 8)).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedId(s.id);
                    setTf(s.tf);
                    setAi(null);
                    setStage("strategy");
                    setNote(null);
                  }}
                  className={cn(
                    "w-full rounded-md border px-3 py-2.5 text-left",
                    selected?.id === s.id ? "border-accent bg-panel" : "border-border bg-bg hover:border-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {s.direction === "BUY" ? (
                        <ArrowUpRight className="size-4 text-bull" />
                      ) : (
                        <ArrowDownRight className="size-4 text-bear" />
                      )}
                      {s.tf} {s.direction}
                    </span>
                    <Badge tone={s.quality === "C" ? "muted" : "accent"}>{s.quality}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {s.zoneLow.toFixed(1)} – {s.zoneHigh.toFixed(1)}
                    {s.confluence ? ` · ${s.mtf.join("+")}` : ""}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Activity className="size-4" /> Ishlagan zonalar
            </h2>
            <div className="max-h-52 space-y-2 overflow-auto">
              {zones.slice(-10).reverse().map((z) => (
                <div key={z.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-muted">
                    {z.tf} {z.low.toFixed(1)}–{z.high.toFixed(1)}
                  </span>
                  <span className={z.direction === "BUY" ? "text-bull" : "text-bear"}>
                    {z.pipsMoved} pip
                  </span>
                </div>
              ))}
              {zones.length === 0 && <p className="text-sm text-muted">Hali yo‘q</p>}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4" /> Executor · GOLD
            </h2>
            <p className="mb-2 text-xs text-muted">
              Web MT5 hisobiga kira olmaydi. Limit order Telegramga ketadi, siz MT5 da GOLD
              ga qo‘yasiz.
            </p>
            {orders.length === 0 && <p className="text-sm text-muted">Hali order yo‘q</p>}
            {orders.map((o) => (
              <div key={o.id} className="mb-2 font-mono text-xs text-muted">
                {o.direction} {o.tf} @ {o.entry.toFixed(2)} · {o.telegram ? "TG yuborildi" : "TG yo‘q"}
              </div>
            ))}
          </section>
        </aside>
      </div>
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

function Pipeline({ stage }: { stage: PipelineStage }) {
  const steps: { id: PipelineStage; label: string }[] = [
    { id: "strategy", label: "Strategiya" },
    { id: "ai", label: "AI" },
    { id: "risk", label: "Risk" },
    { id: "executor", label: "Executor" },
  ];
  const order = ["strategy", "ai", "risk", "executor", "done"];
  const idx = stage === "blocked" ? 2 : order.indexOf(stage);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {steps.map((s, i) => (
        <li
          key={s.id}
          className={cn(
            "rounded-md border px-2 py-2 text-center text-[11px] font-medium",
            i <= idx && stage !== "blocked"
              ? "border-accent bg-panel text-fg"
              : stage === "blocked" && i <= 2
                ? "border-bear/40 text-bear"
                : "border-border text-muted",
          )}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}
