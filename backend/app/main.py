from __future__ import annotations

"""
Minimal FastAPI backend to support your Next.js frontend button:
- POST /hl/agent/new       → server generates an agent wallet (server-side only), returns agent_addr
- POST /hl/agent/approve   → frontend sends EIP-712 signature; backend relays to Hyperliquid /exchange
- GET  /health             → sanity check

No main wallet/private key is ever stored or asked. The server generates ONLY the AGENT key
and never returns it to the client.

ENV:
  HL_ENV            = "testnet" | "mainnet" (default: testnet)
  HL_API_URL        = override API base (optional)  
                      defaults: https://api.hyperliquid-testnet.xyz or https://api.hyperliquid.xyz
  ENC_KEY           = optional urlsafe_base64 32-byte key for encrypting agent privs (Fernet)
  DB_PATH           = optional sqlite path (default: ./agents.db) (only used if ENC_KEY is set)

Run:
  uvicorn app.main:app --host 0.0.0.0 --port 8080
"""

import base64
import os
import sqlite3
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx
from cryptography.fernet import Fernet
from eth_account import Account
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# ----------------------------- Config ---------------------------------------

HL_ENV = os.getenv("HL_ENV", "testnet").lower()
if HL_ENV not in {"testnet", "mainnet"}:
    raise RuntimeError("HL_ENV must be 'testnet' or 'mainnet'")

DEFAULT_API = (
    "https://api.hyperliquid-testnet.xyz" if HL_ENV == "testnet" else "https://api.hyperliquid.xyz"
)
HL_API_URL = os.getenv("HL_API_URL", DEFAULT_API)

# Optional encrypted persistence
ENC_KEY = os.getenv("ENC_KEY")
DB_PATH = os.getenv("DB_PATH", "./agents.db")
fernet: Optional[Fernet] = None
if ENC_KEY:
    try:
        # Accept raw 64-hex too
        if len(ENC_KEY) == 64 and all(c in "0123456789abcdefABCDEF" for c in ENC_KEY):
            ENC_KEY = base64.urlsafe_b64encode(bytes.fromhex(ENC_KEY)).decode()
        fernet = Fernet(ENC_KEY)
    except Exception as e:
        raise RuntimeError("Invalid ENC_KEY; must be urlsafe base64 32 bytes or 64-hex") from e

# ----------------------------- Storage --------------------------------------

def _db_init() -> None:
    if not fernet:
        return
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    with sqlite3.connect(DB_PATH) as con:
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS agents (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT,
              address TEXT NOT NULL,
              enc_priv BLOB NOT NULL,
              created_at INTEGER NOT NULL
            )
            """
        )


def _db_save_agent(name: Optional[str], address: str, priv_hex: str) -> None:
    if not fernet:
        return
    token = fernet.encrypt(priv_hex.encode())
    with sqlite3.connect(DB_PATH) as con:
        con.execute(
            "INSERT INTO agents(name,address,enc_priv,created_at) VALUES(?,?,?,?)",
            (name, address, token, int(time.time())),
        )


_db_init()

# ------------------------------ App -----------------------------------------

app = FastAPI(title="HL Minimal Backend", version="0.1.0")


class NewAgentIn(BaseModel):
    name: str | None = Field(default=None, description="Optional label")


class NewAgentOut(BaseModel):
    agent_addr: str
    agent_name: str | None = None


class ApproveIn(BaseModel):
    # Wallet that approves (your connected EOA) — for logging only
    owner: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$")

    # Agent to approve
    agentAddress: str = Field(alias="agent_address", pattern=r"^0x[a-fA-F0-9]{40}$")
    agentName: str = Field(alias="agent_name")

    # Signing context
    signatureChainId: str = Field(pattern=r"^0x[0-9a-fA-F]+$")  # e.g. 0x66eee
    nonce: int

    # EIP-712 signature produced by the frontend wallet
    signature: str | Dict[str, Any]

    class Config:
        populate_by_name = True


class ApproveOut(BaseModel):
    ok: bool
    response: Dict[str, Any]


@app.get("/health")
async def health():
    return {"ok": True, "env": HL_ENV, "api": HL_API_URL}


@app.post("/hl/agent/new", response_model=NewAgentOut)
async def new_agent(body: NewAgentIn):
    # 1) Generate agent key server-side
    acct = Account.create()
    priv_hex = acct.key.hex()
    addr = acct.address

    # 2) Optionally store encrypted
    _db_save_agent(body.name, addr, priv_hex)

    # 3) Return only public address
    return {"agent_addr": addr, "agent_name": body.name}


@app.post("/hl/agent/approve", response_model=ApproveOut)
async def approve_agent(body: ApproveIn):
     # Accept either 0x… hex or {r,s,v}
    if isinstance(body.signature, str) and body.signature.startswith("0x") and len(body.signature) == 132:
        raw = body.signature[2:]
        r = "0x" + raw[:64]
        s = "0x" + raw[64:128]
        v = int(raw[128:130], 16)
        if v < 27:
            v += 27
        body.signature = {"r": r, "s": s, "v": v}
    # Build the exact exchange payload for "user-signed" ApproveAgent
    action = {
        "type": "approveAgent",
        "hyperliquidChain": "Testnet" if HL_ENV == "testnet" else "Mainnet",
        "signatureChainId": body.signatureChainId,
        "nonce": body.nonce,
        "agentAddress": body.agentAddress,
        "agentName": body.agentName,
    }

    payload: Dict[str, Any] = {
        "action": action,
        "signature": body.signature,
        "nonce": body.nonce,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(f"{HL_API_URL}/exchange", json=payload)
    if r.status_code >= 400:
        raise HTTPException(status_code=400, detail=r.text)

    try:
        data = r.json()
    except Exception:
        data = {"raw": r.text}

    return {"ok": True, "response": data}
