// src/lib/x10.js
import { ec } from 'starknet';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

const E712_DOMAIN_NAME =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_X10_SIGNING_DOMAIN) ||
  'extended.exchange';
const E712_CHAIN_ID =
  (typeof process !== 'undefined' && Number(process.env?.NEXT_PUBLIC_X10_CHAIN_ID)) || 1;
const E712_VERIFYING =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_X10_VERIFYING) || ZERO_ADDR;

const EXTENDED_HOST =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_EXTENDED_HOST) ||
  'extended.exchange';

function toHex(x) {
  if (typeof x === 'string') return x.startsWith('0x') ? x : `0x${x}`;
  try { return `0x${BigInt(x).toString(16)}`; } catch { return x; }
}

async function signAccountCreationTyped(owner, accountIndex, signTyped /* expects wrapper with account */) {
  const domain = {
    name: E712_DOMAIN_NAME,
    chainId: E712_CHAIN_ID,
    verifyingContract: E712_VERIFYING,
  };
  const types = {
    // include all fields present in domain to keep wallets/viem happy
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    AccountCreation: [
      { name: 'accountIndex', type: 'int8' },
      { name: 'wallet', type: 'address' },
      { name: 'tosAccepted', type: 'bool' },
    ],
  };
  const primaryType = 'AccountCreation';
  const message = {
    accountIndex: Number(accountIndex),
    wallet: owner,
    tosAccepted: true,
  };
  const sigHex = await signTyped({ domain, types, primaryType, message });
  if (!sigHex?.startsWith?.('0x') || sigHex.length < 2 + 65 * 2) {
    throw new Error('Signature EIP-712 AccountCreation invalide');
  }
  return sigHex;
}

function deriveStarkFromEthSig(sigHex) {
  const rHex = '0x' + sigHex.slice(2, 2 + 64);
  const priv = ec.starkCurve.grindKey(rHex.replace(/^0x/i, ''));
  const privHex = toHex(priv);
  const pub = ec.starkCurve.getPublicKey(priv);
  const x = pub.x ?? pub[0];
  const y = pub.y ?? pub[1];
  return { privHex, pubX: toHex(x), pubY: toHex(y) };
}

export async function buildOnboardPayloadSDK(owner, signTyped /* wrapper with account */) {
  const sig = await signAccountCreationTyped(owner, 0, signTyped);
  const { pubX, pubY } = deriveStarkFromEthSig(sig);
  return {
    l1_address: owner,
    stark_public_key: pubX,
    stark_public_key_y: pubY,
    // camelCase for compatibility
    starkPublicKey: pubX,
    starkPublicKeyY: pubY,
    signing_domain: E712_DOMAIN_NAME,
    host: EXTENDED_HOST,
  };
}

export async function buildSubAccountPayloadSDK(owner, accountIndex, description, signTyped) {
  const idx = Number(accountIndex);
  if (!Number.isFinite(idx) || idx < 0) throw new Error('accountIndex invalide');
  const sig = await signAccountCreationTyped(owner, idx, signTyped);
  const { pubX, pubY } = deriveStarkFromEthSig(sig);

  return {
    l1_address: owner,
    account_index: idx,
    description: description || 'aeq-agent',
    stark_public_key: pubX,
    stark_public_key_y: pubY,
    starkPublicKey: pubX,
    starkPublicKeyY: pubY,
    signing_domain: E712_DOMAIN_NAME,
    host: EXTENDED_HOST,
  };
}

// (optional) if you ever need AccountRegistration too:
export async function signAccountRegistration(owner, accountIndex, timeISO, action, signTyped) {
  const domain = {
    name: E712_DOMAIN_NAME,
    chainId: E712_CHAIN_ID,
    verifyingContract: E712_VERIFYING,
  };
  const types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    AccountRegistration: [
      { name: 'accountIndex', type: 'int8' },
      { name: 'wallet', type: 'address' },
      { name: 'tosAccepted', type: 'bool' },
      { name: 'time', type: 'string' },
      { name: 'action', type: 'string' },
      { name: 'host', type: 'string' },
    ],
  };
  const primaryType = 'AccountRegistration';
  const message = {
    accountIndex: Number(accountIndex),
    wallet: owner,
    tosAccepted: true,
    time: timeISO,
    action: action || 'CREATE_SUB_ACCOUNT',
    host: EXTENDED_HOST,
  };
  return signTyped({ domain, types, primaryType, message });
}
