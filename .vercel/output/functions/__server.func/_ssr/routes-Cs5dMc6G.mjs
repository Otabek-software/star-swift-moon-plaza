import { i as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Layers, c as ArrowDownRight, i as RefreshCw, l as Activity, n as ShieldCheck, o as Bot, r as Send, s as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cs5dMc6G.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GoldChart({ candles, tf, setups, zones, selectedId, onSelect }) {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const draw = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const w = wrap.clientWidth;
			const h = Math.max(280, wrap.clientHeight);
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = "#18181c";
			ctx.fillRect(0, 0, w, h);
			const padL = 12;
			const padR = 58;
			const padT = 16;
			const padB = 28;
			const view = candles.slice(-140);
			if (view.length < 2) {
				ctx.fillStyle = "#9a9aa3";
				ctx.font = "13px IBM Plex Sans, sans-serif";
				ctx.fillText("Narxlar yuklanmoqda…", 20, h / 2);
				return;
			}
			const minT = view[0].time;
			const maxT = view[view.length - 1].time;
			let lo = Math.min(...view.map((c) => c.low));
			let hi = Math.max(...view.map((c) => c.high));
			const pad = (hi - lo) * .08 || 1;
			lo -= pad;
			hi += pad;
			const xAt = (t) => padL + (t - minT) / Math.max(1, maxT - minT) * (w - padL - padR);
			const yAt = (p) => padT + (hi - p) / (hi - lo) * (h - padT - padB);
			const barW = Math.max(3, (w - padL - padR) / view.length * .7);
			ctx.strokeStyle = "#3a3a42";
			ctx.lineWidth = 1;
			for (let i = 0; i < 5; i++) {
				const p = lo + (hi - lo) * i / 4;
				const y = yAt(p);
				ctx.beginPath();
				ctx.moveTo(padL, y);
				ctx.lineTo(w - padR, y);
				ctx.stroke();
				ctx.fillStyle = "#6e6e76";
				ctx.font = "10px IBM Plex Mono, monospace";
				ctx.textAlign = "left";
				ctx.fillText(p.toFixed(1), w - padR + 6, y + 3);
			}
			const tfZones = zones.filter((z) => z.tf === tf).slice(-8);
			for (const z of tfZones) {
				const x1 = xAt(z.time);
				const x2 = w - padR;
				const y1 = yAt(z.high);
				const y2 = yAt(z.low);
				ctx.fillStyle = "rgba(91, 124, 138, 0.12)";
				ctx.fillRect(x1, y1, Math.max(8, x2 - x1), Math.max(2, y2 - y1));
				ctx.strokeStyle = "rgba(91, 124, 138, 0.55)";
				ctx.strokeRect(x1, y1, Math.max(8, x2 - x1), Math.max(2, y2 - y1));
			}
			const tfSetups = setups.filter((s) => s.tf === tf).slice(0, 10);
			for (const s of tfSetups) {
				const x1 = xAt(s.mother.time);
				const x2 = xAt(Math.min(s.child.time + (maxT - minT) * .12, maxT));
				const y1 = yAt(s.zoneHigh);
				const y2 = yAt(s.zoneLow);
				const active = s.id === selectedId;
				ctx.fillStyle = active ? "rgba(210, 212, 216, 0.16)" : "rgba(138, 132, 116, 0.14)";
				ctx.fillRect(x1, y1, Math.max(6, x2 - x1), Math.max(2, y2 - y1));
				ctx.strokeStyle = active ? "#d2d4d8" : "#8a8474";
				ctx.lineWidth = active ? 1.4 : 1;
				ctx.strokeRect(x1, y1, Math.max(6, x2 - x1), Math.max(2, y2 - y1));
			}
			for (const c of view) {
				const x = xAt(c.time);
				const bull = c.close >= c.open;
				ctx.strokeStyle = bull ? "#3f9d73" : "#c45b54";
				ctx.fillStyle = bull ? "#3f9d73" : "#c45b54";
				ctx.beginPath();
				ctx.moveTo(x, yAt(c.high));
				ctx.lineTo(x, yAt(c.low));
				ctx.stroke();
				const top = yAt(Math.max(c.open, c.close));
				const bot = yAt(Math.min(c.open, c.close));
				ctx.fillRect(x - barW / 2, top, barW, Math.max(1, bot - top));
			}
			ctx.fillStyle = "#6e6e76";
			ctx.font = "10px IBM Plex Sans, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(`${tf} · GOLD`, padL, h - 10);
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [
		candles,
		tf,
		setups,
		zones,
		selectedId
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "relative h-[340px] w-full overflow-hidden rounded-lg bg-surface md:h-[420px]",
		onClick: () => {
			const first = setups.find((s) => s.tf === tf);
			if (first) onSelect?.(first.id);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block h-full w-full"
		})
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Button({ className, variant = "primary", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-3.5 text-sm font-medium transition-colors duration-150 disabled:opacity-40", variant === "primary" && "bg-accent text-accent-fg hover:bg-fg", variant === "ghost" && "border border-border bg-transparent text-fg hover:bg-panel", variant === "soft" && "bg-panel text-fg hover:bg-border", variant === "danger" && "bg-bear text-fg hover:opacity-90", className),
		...props
	});
}
function Badge({ className, tone = "muted", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium", tone === "muted" && "bg-panel text-muted", tone === "bull" && "bg-bull/15 text-bull", tone === "bear" && "bg-bear/15 text-bear", tone === "accent" && "bg-fg/10 text-fg", className),
		...props
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getGoldScan = createServerFn({ method: "POST" }).handler(createSsrRpc("436302ff45d9d08db2077ef4b9b733ac5dc5d2a08dd3b8d814539c46f2c7df44"));
var analyzeSetup = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("1dc9a93218756009f6ceb645936b31c3443419f6b6fbf95b36009e9146b1ba06"));
var sendTelegramOrder = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("30a5978685ff54ff9d6bdc5aa48e05595b832848bf4b41a079be18dda723fb2d"));
function checkRisk(setup, last, ai) {
	const reasons = [];
	if (!setup.validSl) reasons.push(`SL ${setup.slPips.toFixed(1)} pip — 20 pip limiti oshgan`);
	if (setup.trend === "NEUTRAL") reasons.push("Trend neytral — yangi savdo yo‘q");
	if (setup.quality === "C" && !setup.confluence) reasons.push("Sifat C va MTF yo‘q");
	if (ai?.verdict === "RAD") reasons.push("AI signalni rad etdi");
	if (ai?.verdict === "MAVJUD_EMAS") reasons.push("AI tasdig‘i yo‘q — ehtiyot bilan davom");
	if (Math.abs(last - setup.entry) / .1 > 80) reasons.push("Narx entry zonadan uzoq");
	if (setup.slPips > 20) reasons.push("Max SL buzilgan");
	return {
		allowed: !reasons.some((r) => r.includes("20 pip") || r.includes("rad etdi") || r.includes("Neytral")),
		reasons
	};
}
function orderTelegramText(setup, last) {
	return [
		`<b>IB Terminal · GOLD</b>`,
		`${setup.direction} ${setup.tf} · ${setup.quality}`,
		`Entry: <code>${setup.entry.toFixed(2)}</code>`,
		`SL: <code>${setup.sl.toFixed(2)}</code> (${setup.slPips.toFixed(1)} pip)`,
		`TP: 60 / 120 / 220 / 300 pip`,
		`MTF: ${setup.mtf.join(" + ")}`,
		`Narx: ${last.toFixed(2)}`,
		setup.reasons.join(" · ")
	].join("\n");
}
var TFS = [
	"H4",
	"H2",
	"H1",
	"M30",
	"M15",
	"M5"
];
function Home() {
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const [market, setMarket] = (0, import_react.useState)(null);
	const [setups, setSetups] = (0, import_react.useState)([]);
	const [zones, setZones] = (0, import_react.useState)([]);
	const [tf, setTf] = (0, import_react.useState)("H1");
	const [selectedId, setSelectedId] = (0, import_react.useState)();
	const [stage, setStage] = (0, import_react.useState)("strategy");
	const [ai, setAi] = (0, import_react.useState)(null);
	const [aiBusy, setAiBusy] = (0, import_react.useState)(false);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [note, setNote] = (0, import_react.useState)(null);
	const load = (0, import_react.useCallback)(async () => {
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
	(0, import_react.useEffect)(() => {
		load();
		const id = window.setInterval(() => void load(), 9e4);
		return () => window.clearInterval(id);
	}, [load]);
	const selected = setups.find((s) => s.id === selectedId) ?? setups[0];
	const candles = market?.candles[tf] ?? [];
	const last = market?.last ?? 0;
	const risk = selected ? checkRisk(selected, last, ai) : null;
	const strong = (0, import_react.useMemo)(() => setups.filter((s) => s.quality === "A+" || s.quality === "A" || s.confluence), [setups]);
	async function runAi() {
		if (!selected || !market) return;
		setAiBusy(true);
		setStage("ai");
		setNote(null);
		try {
			const v = await analyzeSetup({ data: {
				setup: selected,
				last: market.last
			} });
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
		const tg = await sendTelegramOrder({ data: { text: orderTelegramText(selected, market.last) } });
		const order = {
			id: `ord-${Date.now()}`,
			setupId: selected.id,
			symbol: "GOLD",
			direction: selected.direction,
			entry: selected.entry,
			sl: selected.sl,
			tf: selected.tf,
			status: tg.ok ? "sent" : "pending",
			telegram: Boolean(tg.ok),
			createdAt: Date.now()
		};
		setOrders((o) => [order, ...o].slice(0, 12));
		setStage("done");
		setNote(tg.ok ? "Telegramga yuborildi. MT5 da GOLD bo‘yicha Limit order qo‘ying." : `Telegram xatosi. Order saqlandi. ${"error" in tg ? tg.error : ""}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border px-4 py-3 md:px-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] tracking-wide text-muted uppercase",
					children: "MT5 · GOLD · XAUUSD"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold tracking-tight md:text-xl",
					children: "IB Terminal"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4",
					children: [market && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-lg tabular-nums",
							children: market.last.toFixed(2)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: cn("font-mono text-xs tabular-nums", market.change >= 0 ? "text-bull" : "text-bear"),
							children: [
								market.change >= 0 ? "+" : "",
								market.change.toFixed(2),
								" (",
								market.changePct.toFixed(2),
								"%)"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						onClick: () => void load(),
						disabled: loading,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-4", loading && "animate-spin") }), "Yangilash"]
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-[1400px] gap-4 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] md:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "min-w-0 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: TFS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setTf(t),
							className: cn("min-h-10 rounded-sm px-3 font-mono text-xs", tf === t ? "bg-accent text-accent-fg" : "bg-panel text-muted hover:text-fg"),
							children: t
						}, t))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldChart, {
						candles,
						tf,
						setups,
						zones,
						selectedId: selected?.id,
						onSelect: setSelectedId
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Sariq-kulrang to‘rtburchak — Inside Bar zonasi (ona/bola soya). Ko‘k-kulrang — oldin ishlagan likvidlik zonalari."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pipeline, { stage }),
					selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-lg border border-border bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: selected.direction === "BUY" ? "bull" : "bear",
										children: selected.direction
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: selected.tf }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "accent",
										children: selected.quality
									}),
									selected.confluence && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: ["MTF ", selected.mtf.join("+")] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm md:grid-cols-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										k: "Entry",
										v: selected.entry.toFixed(2)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										k: "SL",
										v: `${selected.sl.toFixed(2)} · ${selected.slPips.toFixed(1)}p`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										k: "TP 60/120",
										v: `${selected.tp60.toFixed(1)} / ${selected.tp120.toFixed(1)}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										k: "TP 220/300",
										v: `${selected.tp220.toFixed(1)} / ${selected.tp300.toFixed(1)}`
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-1 text-sm text-muted",
								children: selected.reasons.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["— ", r] }, r))
							}),
							ai && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 rounded-md bg-panel p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-medium",
									children: [
										"AI: ",
										ai.verdict,
										" · ehtimol ",
										ai.probability,
										"%"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: ai.comment
								})]
							}),
							risk && risk.reasons.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted",
								children: risk.reasons.join(" · ")
							}),
							note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-fg",
								children: note
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => void runAi(),
									disabled: !selected || aiBusy,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "size-4" }), aiBusy ? "AI o‘qimoqda…" : "AI tahlil"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									onClick: () => void execute(),
									disabled: !selected,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), "Risk + Telegram"]
								})]
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "mb-3 flex items-center gap-2 text-sm font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4" }), " Kuchli Inside Bar"]
							}),
							loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Skaner ishlayapti…"
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-bear",
								children: error
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "max-h-[360px] space-y-2 overflow-auto",
								children: [strong.length === 0 && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Hozir A+/A signal yo‘q. C/B pastda."
								}), (strong.length ? strong : setups.slice(0, 8)).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setSelectedId(s.id);
										setTf(s.tf);
										setAi(null);
										setStage("strategy");
										setNote(null);
									},
									className: cn("w-full rounded-md border px-3 py-2.5 text-left", selected?.id === s.id ? "border-accent bg-panel" : "border-border bg-bg hover:border-muted"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 text-sm font-medium",
											children: [
												s.direction === "BUY" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4 text-bull" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownRight, { className: "size-4 text-bear" }),
												s.tf,
												" ",
												s.direction
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: s.quality === "C" ? "muted" : "accent",
											children: s.quality
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 font-mono text-[11px] text-muted",
										children: [
											s.zoneLow.toFixed(1),
											" – ",
											s.zoneHigh.toFixed(1),
											s.confluence ? ` · ${s.mtf.join("+")}` : ""
										]
									})]
								}, s.id))]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-surface p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "mb-3 flex items-center gap-2 text-sm font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4" }), " Ishlagan zonalar"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-h-52 space-y-2 overflow-auto",
							children: [zones.slice(-10).reverse().map((z) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-muted",
									children: [
										z.tf,
										" ",
										z.low.toFixed(1),
										"–",
										z.high.toFixed(1)
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: z.direction === "BUY" ? "text-bull" : "text-bear",
									children: [z.pipsMoved, " pip"]
								})]
							}, z.id)), zones.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Hali yo‘q"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "mb-3 flex items-center gap-2 text-sm font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), " Executor · GOLD"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs text-muted",
								children: "Web MT5 hisobiga kira olmaydi. Limit order Telegramga ketadi, siz MT5 da GOLD ga qo‘yasiz."
							}),
							orders.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Hali order yo‘q"
							}),
							orders.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 font-mono text-xs text-muted",
								children: [
									o.direction,
									" ",
									o.tf,
									" @ ",
									o.entry.toFixed(2),
									" · ",
									o.telegram ? "TG yuborildi" : "TG yo‘q"
								]
							}, o.id))
						]
					})
				]
			})]
		})]
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-[11px] text-muted",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "tabular-nums",
		children: v
	})] });
}
function Pipeline({ stage }) {
	const steps = [
		{
			id: "strategy",
			label: "Strategiya"
		},
		{
			id: "ai",
			label: "AI"
		},
		{
			id: "risk",
			label: "Risk"
		},
		{
			id: "executor",
			label: "Executor"
		}
	];
	const idx = stage === "blocked" ? 2 : [
		"strategy",
		"ai",
		"risk",
		"executor",
		"done"
	].indexOf(stage);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "grid grid-cols-4 gap-2",
		children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: cn("rounded-md border px-2 py-2 text-center text-[11px] font-medium", i <= idx && stage !== "blocked" ? "border-accent bg-panel text-fg" : stage === "blocked" && i <= 2 ? "border-bear/40 text-bear" : "border-border text-muted"),
			children: s.label
		}, s.id))
	});
}
//#endregion
export { Home as component };
