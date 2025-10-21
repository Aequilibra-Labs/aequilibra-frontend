export async function POST(req) {
  try {
    const payload = await req.json();
    const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || process.env.CORE_URL || "http://localhost:8000";

    const res = await fetch(`${CORE_URL}/agents/hl/bracket/apply_now`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ detail: String(e) }), { status: 500 });
  }
}