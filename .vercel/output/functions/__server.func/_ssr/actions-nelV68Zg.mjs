import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-DuYYUqGs.js
var PIP = .1;
function pips(distance) {
	return Math.abs(distance) / PIP;
}
function candleAt(c, i) {
	return c[i];
}
function detectInsideBars(candles) {
	const out = [];
	for (let i = 1; i < candles.length; i++) {
		const mother = candles[i - 1];
		const child = candles[i];
		if (!mother || !child) continue;
		if (child.high <= mother.high && child.low >= mother.low) {
			if (mother.high - mother.low > .4) out.push({
				mother: i - 1,
				child: i
			});
		}
	}
	return out;
}
function swings(candles, left = 3, right = 3) {
	const highs = [];
	const lows = [];
	for (let i = left; i < candles.length - right; i++) {
		const c = candles[i];
		if (!c) continue;
		let isHigh = true;
		let isLow = true;
		for (let k = i - left; k <= i + right; k++) {
			if (k === i) continue;
			const n = candles[k];
			if (!n) continue;
			if (n.high >= c.high) isHigh = false;
			if (n.low <= c.low) isLow = false;
		}
		if (isHigh) highs.push(i);
		if (isLow) lows.push(i);
	}
	return {
		highs,
		lows
	};
}
function detectTrend(candles) {
	if (candles.length < 20) return "NEUTRAL";
	const { highs, lows } = swings(candles);
	if (highs.length < 2 || lows.length < 2) {
		const slice = candles.slice(-20);
		const first = slice[0];
		const last = slice[slice.length - 1];
		if (!first || !last) return "NEUTRAL";
		if (last.close > first.close * 1.004) return "BULLISH";
		if (last.close < first.close * .996) return "BEARISH";
		return "NEUTRAL";
	}
	const h1 = candles[highs[highs.length - 2]];
	const h2 = candles[highs[highs.length - 1]];
	const l1 = candles[lows[lows.length - 2]];
	const l2 = candles[lows[lows.length - 1]];
	if (!h1 || !h2 || !l1 || !l2) return "NEUTRAL";
	const hh = h2.high > h1.high;
	const hl = l2.low > l1.low;
	const lh = h2.high < h1.high;
	const ll = l2.low < l1.low;
	if (hh && hl) return "BULLISH";
	if (lh && ll) return "BEARISH";
	return "NEUTRAL";
}
function nearSwing(candles, idx, kind) {
	const { highs, lows } = swings(candles, 2, 2);
	return (kind === "high" ? highs : lows).some((s) => Math.abs(s - idx) <= 3);
}
function wasSwept(candles, childIdx, direction) {
	const child = candles[childIdx];
	if (!child) return false;
	for (let i = childIdx + 1; i < Math.min(candles.length, childIdx + 8); i++) {
		const c = candles[i];
		if (!c) continue;
		if (direction === "BUY" && c.low < child.low) return true;
		if (direction === "SELL" && c.high > child.high) return true;
	}
	return false;
}
function inCorrection(candles, idx, trend) {
	if (idx < 6) return false;
	const recent = candles.slice(Math.max(0, idx - 8), idx + 1);
	if (recent.length < 5) return false;
	let impulse = 0;
	for (let i = 1; i < recent.length; i++) {
		const a = recent[i - 1];
		const b = recent[i];
		if (!a || !b) continue;
		impulse += b.close - a.close;
	}
	if (trend === "BULLISH") return impulse < PIP * 8;
	if (trend === "BEARISH") return impulse > -.8;
	return false;
}
function qualityFromScore(score, confluence) {
	if (confluence && score >= 70) return "A+";
	if (score >= 70) return "A";
	if (score >= 50) return "B";
	return "C";
}
function overlap(aHigh, aLow, bHigh, bLow) {
	const o = Math.min(aHigh, bHigh) - Math.max(aLow, bLow);
	if (o <= 0) return 0;
	const smaller = Math.min(aHigh - aLow, bHigh - bLow);
	return smaller > 0 ? o / smaller : 0;
}
function buildSetups(tf, candles, others) {
	const trend = detectTrend(candles);
	const ibs = detectInsideBars(candles);
	const setups = [];
	for (const ib of ibs) {
		const mother = candleAt(candles, ib.mother);
		const child = candleAt(candles, ib.child);
		if (!mother || !child) continue;
		if (trend === "NEUTRAL") continue;
		const compression = (child.high - child.low) / Math.max(mother.high - mother.low, PIP);
		const direction = trend === "BULLISH" ? "BUY" : "SELL";
		const entry = direction === "BUY" ? mother.low : mother.high;
		const slPipsVal = pips(entry - (direction === "BUY" ? Math.min(mother.low, child.low) - PIP : Math.max(mother.high, child.high) + PIP));
		const sl = direction === "BUY" ? entry - Math.min(slPipsVal, 20) * PIP : entry + Math.min(slPipsVal, 20) * PIP;
		const validSl = slPipsVal <= 20.5;
		const sign = direction === "BUY" ? 1 : -1;
		const swept = wasSwept(candles, ib.child, direction);
		const correction = inCorrection(candles, ib.child, trend);
		const atLiquidity = nearSwing(candles, ib.mother, direction === "BUY" ? "low" : "high");
		const mtf = [tf];
		for (const [otherTf, otherCandles] of Object.entries(others)) {
			if (!otherCandles || otherTf === tf) continue;
			const otherIbs = detectInsideBars(otherCandles).slice(-12);
			for (const o of otherIbs) {
				const om = otherCandles[o.mother];
				if (!om) continue;
				if (overlap(mother.high, mother.low, om.high, om.low) >= .28) {
					if (!mtf.includes(otherTf)) mtf.push(otherTf);
				}
			}
		}
		const confluence = mtf.length >= 2;
		const reasons = [`${trend} trend`];
		let score = 45;
		if (correction) {
			score += 12;
			reasons.push("Korreksiya ichida");
		}
		if (atLiquidity) {
			score += 14;
			reasons.push("Likvidlik / swing zona");
		}
		if (swept) {
			score += 12;
			reasons.push("Sweep bor");
		}
		if (compression < .5) {
			score += 10;
			reasons.push("Kuchli siqilish");
		}
		if (confluence) {
			score += 18;
			reasons.push(`MTF: ${mtf.join(" + ")}`);
		}
		if (validSl) {
			score += 8;
			reasons.push(`SL ${slPipsVal.toFixed(1)} pip`);
		} else {
			score -= 20;
			reasons.push("SL 20 pipdan katta — invalid");
		}
		if (ib.child < candles.length - 24) score -= 8;
		if (!(ib.child >= candles.length - 40) && !confluence) continue;
		setups.push({
			id: `${tf}-${mother.time}-${child.time}-${direction}`,
			tf,
			mother,
			child,
			zoneHigh: mother.high,
			zoneLow: mother.low,
			entry,
			sl,
			slPips: Math.min(slPipsVal, 20),
			tp60: entry + sign * 60 * PIP,
			tp120: entry + sign * 120 * PIP,
			tp220: entry + sign * 220 * PIP,
			tp300: entry + sign * 300 * PIP,
			direction,
			trend,
			compression,
			swept,
			validSl,
			quality: qualityFromScore(score, confluence),
			score,
			mtf,
			reasons,
			confluence
		});
	}
	return setups.sort((a, b) => b.child.time - a.child.time || b.score - a.score);
}
function workedZones(tf, candles) {
	const ibs = detectInsideBars(candles);
	const zones = [];
	for (const ib of ibs) {
		const mother = candles[ib.mother];
		const child = candles[ib.child];
		if (!mother || !child) continue;
		const future = candles.slice(ib.child + 1, ib.child + 18);
		if (future.length < 4) continue;
		const maxHigh = Math.max(...future.map((c) => c.high));
		const minLow = Math.min(...future.map((c) => c.low));
		const up = pips(maxHigh - mother.high);
		const down = pips(mother.low - minLow);
		const moved = Math.max(up, down);
		if (moved < 70) continue;
		const direction = up >= down ? "BUY" : "SELL";
		zones.push({
			id: `w-${tf}-${mother.time}`,
			tf,
			high: mother.high,
			low: mother.low,
			time: mother.time,
			childTime: child.time,
			kind: "worked",
			direction,
			pipsMoved: Math.round(moved)
		});
	}
	return zones.slice(-18);
}
function scanAll(pack) {
	const tfs = Object.keys(pack);
	const setups = [];
	const zones = [];
	const trends = {};
	for (const tf of tfs) {
		const candles = pack[tf] ?? [];
		trends[tf] = detectTrend(candles);
		const others = {};
		for (const o of tfs) if (o !== tf) others[o] = pack[o];
		setups.push(...buildSetups(tf, candles, others));
		zones.push(...workedZones(tf, candles));
	}
	const unique = /* @__PURE__ */ new Map();
	for (const s of setups) {
		const prev = unique.get(s.id);
		if (!prev || s.score > prev.score) unique.set(s.id, s);
	}
	return {
		setups: [...unique.values()].sort((a, b) => {
			const q = {
				"A+": 4,
				A: 3,
				B: 2,
				C: 1
			};
			if (q[a.quality] !== q[b.quality]) return q[b.quality] - q[a.quality];
			return b.child.time - a.child.time;
		}).slice(0, 40),
		zones,
		trends
	};
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/actions-nelV68Zg.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
async function yahoo(symbol, interval, range) {
	const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
	const res = await fetch(url, { headers: {
		"User-Agent": UA,
		Accept: "application/json"
	} });
	if (!res.ok) return null;
	const result = (await res.json()).chart?.result?.[0];
	if (!result?.timestamp) return null;
	const q = result.indicators?.quote?.[0];
	if (!q) return null;
	const candles = [];
	for (let i = 0; i < result.timestamp.length; i++) {
		const t = result.timestamp[i];
		const o = q.open?.[i];
		const h = q.high?.[i];
		const l = q.low?.[i];
		const c = q.close?.[i];
		if (t == null || o == null || h == null || l == null || c == null) continue;
		if (![
			o,
			h,
			l,
			c
		].every((n) => Number.isFinite(n))) continue;
		candles.push({
			time: t,
			open: o,
			high: h,
			low: l,
			close: c
		});
	}
	return {
		price: result.meta?.regularMarketPrice,
		prev: result.meta?.previousClose ?? result.meta?.chartPreviousClose,
		candles
	};
}
function resample(src, seconds) {
	const out = [];
	let bucket = null;
	let bucketStart = 0;
	for (const c of src) {
		const start = Math.floor(c.time / seconds) * seconds;
		if (!bucket || start !== bucketStart) {
			if (bucket) out.push(bucket);
			bucket = {
				time: start,
				open: c.open,
				high: c.high,
				low: c.low,
				close: c.close
			};
			bucketStart = start;
		} else {
			bucket.high = Math.max(bucket.high, c.high);
			bucket.low = Math.min(bucket.low, c.low);
			bucket.close = c.close;
		}
	}
	if (bucket) out.push(bucket);
	return out;
}
var SYMBOLS = ["GC=F", "XAUUSD=X"];
async function loadGoldMarket() {
	let pack = null;
	let symbol = "GC=F";
	for (const s of SYMBOLS) {
		pack = await yahoo(s, "15m", "10d");
		if (pack && pack.candles.length > 40) {
			symbol = s;
			break;
		}
	}
	if (!pack || pack.candles.length < 20) throw new Error("GOLD narxlarini yuklab bo‘lmadi");
	const h1 = await yahoo(symbol, "60m", "60d");
	const m5 = await yahoo(symbol, "5m", "5d");
	const m15 = pack.candles;
	const m5c = m5?.candles ?? [];
	const h1c = h1?.candles?.length ? h1.candles : resample(m15, 3600);
	const m30 = resample(m15, 1800);
	const h2 = resample(h1c, 7200);
	const h4 = resample(h1c, 14400);
	const last = (m15[m15.length - 1] ?? h1c[h1c.length - 1])?.close ?? pack.price ?? 0;
	const prev = pack.prev ?? last;
	const change = last - prev;
	const changePct = prev ? change / prev * 100 : 0;
	const candles = {
		M5: m5c,
		M15: m15,
		M30: m30,
		H1: h1c,
		H2: h2,
		H4: h4
	};
	return {
		symbol,
		mt5: "GOLD",
		last,
		change,
		changePct,
		updatedAt: Date.now(),
		candles
	};
}
var getGoldScan_createServerFn_handler = createServerRpc({
	id: "436302ff45d9d08db2077ef4b9b733ac5dc5d2a08dd3b8d814539c46f2c7df44",
	name: "getGoldScan",
	filename: "src/lib/server/actions.ts"
}, (opts) => getGoldScan.__executeServer(opts));
var getGoldScan = createServerFn({ method: "POST" }).handler(getGoldScan_createServerFn_handler, async () => {
	const market = await loadGoldMarket();
	return {
		market,
		...scanAll(market.candles)
	};
});
var analyzeSetup_createServerFn_handler = createServerRpc({
	id: "1dc9a93218756009f6ceb645936b31c3443419f6b6fbf95b36009e9146b1ba06",
	name: "analyzeSetup",
	filename: "src/lib/server/actions.ts"
}, (opts) => analyzeSetup.__executeServer(opts));
var analyzeSetup = createServerFn({ method: "POST" }).validator((d) => d).handler(analyzeSetup_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		probability: 0,
		verdict: "MAVJUD_EMAS",
		comment: "AI hozircha mavjud emas. Signal qo‘lda tasdiqlansin."
	};
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
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: .2,
			max_tokens: 280,
			messages: [{
				role: "user",
				content: prompt
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		probability: 0,
		verdict: "MAVJUD_EMAS",
		comment: `AI xatosi (${res.status}). Keyinroq urinib ko‘ring.`
	};
	const text = (await res.json()).choices?.[0]?.message?.content ?? "";
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) return {
		ok: true,
		probability: 50,
		verdict: "ZAIF",
		comment: text.slice(0, 280) || "Tahlil o‘qilmadi."
	};
	try {
		const parsed = JSON.parse(match[0]);
		const verdict = parsed.verdict === "TASDIQLANDI" || parsed.verdict === "RAD" || parsed.verdict === "ZAIF" ? parsed.verdict : "ZAIF";
		return {
			ok: true,
			probability: Math.max(0, Math.min(100, Number(parsed.probability) || 0)),
			verdict,
			comment: parsed.comment ?? "Tahlil tayyor."
		};
	} catch {
		return {
			ok: true,
			probability: 45,
			verdict: "ZAIF",
			comment: "AI javobi parse qilinmadi."
		};
	}
});
var TG_TOKEN = "8789550367:AAFlkYBKyRKSa56Qdc1WEp6IFEORcj8YF5g";
var TG_CHAT = "6035465216";
var sendTelegramOrder_createServerFn_handler = createServerRpc({
	id: "30a5978685ff54ff9d6bdc5aa48e05595b832848bf4b41a079be18dda723fb2d",
	name: "sendTelegramOrder",
	filename: "src/lib/server/actions.ts"
}, (opts) => sendTelegramOrder.__executeServer(opts));
var sendTelegramOrder = createServerFn({ method: "POST" }).validator((d) => d).handler(sendTelegramOrder_createServerFn_handler, async ({ data }) => {
	const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			chat_id: TG_CHAT,
			text: data.text,
			parse_mode: "HTML"
		})
	});
	if (!res.ok) return {
		ok: false,
		error: (await res.text()).slice(0, 200)
	};
	return { ok: true };
});
//#endregion
export { analyzeSetup_createServerFn_handler, getGoldScan_createServerFn_handler, sendTelegramOrder_createServerFn_handler };
