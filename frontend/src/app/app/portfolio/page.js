"use client";

import { useState } from "react";

export default function EdgeXPage() {
  const [accountId, setAccountId] = useState("");
  const [coin, setCoin] = useState("USDT");
  const [balanceRes, setBalanceRes] = useState(null);
  const [busyBal, setBusyBal] = useState(false);

  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [bridgeRes, setBridgeRes] = useState(null);
  const [busyBridge, setBusyBridge] = useState(false);

  async function fetchBalance() {
    setBusyBal(true);
    setBalanceRes(null);
    try {
      const params = new URLSearchParams({ accountId, coin });
      const r = await fetch(`/api/edgex?${params.toString()}`, { cache: "no-store" });
      const data = await r.json();
      setBalanceRes({ status: r.status, data });
    } catch (e) {
      setBalanceRes({ status: 500, data: { error: e.message } });
    } finally {
      setBusyBal(false);
    }
  }

  async function bridge() {
    setBusyBridge(true);
    setBridgeRes(null);
    try {
      const r = await fetch("/api/edgex", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "bridge",
          sender_account_id: sender,
          receiver_account_id: receiver,
          coin,
          amount,
        }),
      });
      const data = await r.json();
      setBridgeRes({ status: r.status, data });
    } catch (e) {
      setBridgeRes({ status: 500, data: { error: e.message } });
    } finally {
      setBusyBridge(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">edgeX tools</h1>

      {/* Balance card */}
      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="text-lg font-medium">Get Balance</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="text-sm text-gray-600">Account ID</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="123456"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600">Coin</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={coin}
              onChange={(e) => setCoin(e.target.value)}
              placeholder="USDT"
            />
          </label>
        </div>
        <button
          onClick={fetchBalance}
          disabled={!accountId || busyBal}
          className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busyBal ? "Loading…" : "Fetch"}
        </button>
        {balanceRes && (
          <pre className="overflow-auto rounded-xl bg-gray-50 p-3 text-sm">
            {JSON.stringify(balanceRes, null, 2)}
          </pre>
        )}
      </div>

      {/* Bridge card */}
      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="text-lg font-medium">Bridge Funds (account → account)</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="text-sm text-gray-600">Sender Account ID</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="123456"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600">Receiver Account ID</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="654321"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600">Coin</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={coin}
              onChange={(e) => setCoin(e.target.value)}
              placeholder="USDT"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600">Amount</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.5"
            />
          </label>
        </div>
        <button
          onClick={bridge}
          disabled={!sender || !receiver || !amount || busyBridge}
          className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busyBridge ? "Submitting…" : "Bridge"}
        </button>
        {bridgeRes && (
          <pre className="overflow-auto rounded-xl bg-gray-50 p-3 text-sm">
            {JSON.stringify(bridgeRes, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
