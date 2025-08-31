// app/api/hl/candles/route.js
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const coin = (searchParams.get("coin") || "BTC").toUpperCase();
  const interval = searchParams.get("interval") || "1m";
  const start = Number(searchParams.get("start"));
  const end = Number(searchParams.get("end")) || Date.now();

  if (!start || start <= 0) {
    return new Response(JSON.stringify({ error: "Missing/invalid start (ms)" }), { status: 400 });
  }

  const body = { type: "candleSnapshot", req: { coin, interval, startTime: start, endTime: end } };

  const r = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!r.ok) {
    return new Response(JSON.stringify({ error: `HL HTTP ${r.status}` }), { status: 502 });
  }

  const arr = await r.json(); // [{t,T,o,h,l,c,v,i,s,n}, ...]
  return new Response(JSON.stringify(arr), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
