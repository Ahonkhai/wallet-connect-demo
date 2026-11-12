import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin';
import { TonAdapter } from '@reown/appkit-adapter-ton';
import {
  mainnet, base, arbitrum, optimism, polygon, bsc, avalanche, zksync, linea, scroll, blast, mantle, gnosis, celo, sonic,
  sepolia, baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy, bscTestnet,
  solana, solanaDevnet, bitcoin, bitcoinTestnet, ton, tonTestnet,
} from '@reown/appkit/networks';
// Chain logos, bundled into the page so they work offline.
import eth from '../node_modules/cryptocurrency-icons/svg/color/eth.svg';
import btc from '../node_modules/@web3icons/core/dist/svgs/networks/background/bitcoin.svg.js';
import bnb from '../node_modules/@web3icons/core/dist/svgs/networks/background/binance-smart-chain.svg.js';
import base_ from '../node_modules/@web3icons/core/dist/svgs/networks/background/base.svg.js';
import arb from '../node_modules/@web3icons/core/dist/svgs/networks/background/arbitrum-one.svg.js';
import pol from '../node_modules/@web3icons/core/dist/svgs/networks/background/polygon.svg.js';
import op from '../node_modules/@web3icons/core/dist/svgs/networks/background/optimism.svg.js';
import tonI from '../node_modules/@web3icons/core/dist/svgs/networks/background/ton.svg.js';
import avax from '../node_modules/@web3icons/core/dist/svgs/networks/background/avalanche.svg.js';
import zk from '../node_modules/@web3icons/core/dist/svgs/networks/background/zksync.svg.js';
import lineaI from '../node_modules/@web3icons/core/dist/svgs/networks/background/linea.svg.js';
import scrollI from '../node_modules/@web3icons/core/dist/svgs/networks/background/scroll.svg.js';
import blastI from '../node_modules/@web3icons/core/dist/svgs/networks/background/blast.svg.js';
import mantleI from '../node_modules/@web3icons/core/dist/svgs/networks/background/mantle.svg.js';
import gnosisI from '../node_modules/@web3icons/core/dist/svgs/networks/background/gnosis.svg.js';
import celoI from '../node_modules/@web3icons/core/dist/svgs/networks/background/celo.svg.js';
import sonicI from '../node_modules/@web3icons/core/dist/svgs/networks/background/sonic.svg.js';

const PROJECT_ID = 'ddc82ce31c14de75c01b8b11db2694c5';

const $ = (id) => document.getElementById(id);
const enc = new TextEncoder();
const toHex = (bytes) => '0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const errText = (e) => (e && e.code !== undefined ? `code ${e.code}: ` : '') + (e && e.message ? e.message : String(e));
const show = (v) => (v === undefined ? 'undefined' : JSON.stringify(v, (k, x) => (x instanceof Uint8Array ? toHex(x) : x), 2));
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58(bytes) {
  let n = 0n, s = '';
  for (const b of bytes) n = n * 256n + BigInt(b);
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) s = '1' + s;
  return s;
}

/* ---------- wire log ---------- */
function logCall(tag, method, params) {
  $('log-empty').hidden = true;
  const li = document.createElement('li');
  li.innerHTML =
    `<div class="k">${esc(tag)} · ${new Date().toLocaleTimeString()}</div>` +
    `<pre class="req">page → wallet   ${esc(method)}${params !== undefined ? '\n' + esc(show(params)) : ''}</pre>` +
    `<pre class="res">waiting for the wallet…</pre>`;
  $('log').prepend(li);
  const res = li.querySelector('.res');
  return {
    ok: (v) => { res.className = 'res good'; res.textContent = 'wallet → page   ' + show(v); },
    fail: (e) => { res.className = 'res bad'; res.textContent = 'wallet → page   ERROR ' + errText(e); },
  };
}
$('log-clear').onclick = () => { $('log').innerHTML = ''; $('log-empty').hidden = false; };

// Network picker groups, most used first. The same order feeds AppKit's own list.
const GROUPS = [
  { title: 'Popular', nets: [mainnet, solana, bitcoin, bsc, base, arbitrum, polygon, optimism, ton, avalanche] },
  { title: 'More EVM chains', nets: [zksync, linea, scroll, blast, mantle, gnosis, celo, sonic] },
  { title: 'Testnets', nets: [sepolia, baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy, bscTestnet, solanaDevnet, bitcoinTestnet, tonTestnet] },
];
// Solana's mark: three gradient bars on black.
const sol = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="solg" x1="5" y1="18" x2="19" y2="6" gradientUnits="userSpaceOnUse"><stop stop-color="#9945FF"/><stop offset="1" stop-color="#14F195"/></linearGradient></defs><circle cx="12" cy="12" r="12" fill="#000"/><g fill="url(#solg)"><path d="M7.6 7h10.9l-2.1 2.2H5.5z"/><path d="M5.5 10.9h10.9l2.1 2.2H7.6z"/><path d="M7.6 14.8h10.9l-2.1 2.2H5.5z"/></g></svg>';
// Testnets reuse their main chain's logo.
const ICONS = new Map([
  [mainnet, eth], [sepolia, eth], [solana, sol], [solanaDevnet, sol], [bitcoin, btc], [bitcoinTestnet, btc],
  [bsc, bnb], [bscTestnet, bnb], [base, base_], [baseSepolia, base_], [arbitrum, arb], [arbitrumSepolia, arb],
  [polygon, pol], [polygonAmoy, pol], [optimism, op], [optimismSepolia, op], [ton, tonI], [tonTestnet, tonI],
  [avalanche, avax], [zksync, zk], [linea, lineaI], [scroll, scrollI], [blast, blastI], [mantle, mantleI],
  [gnosis, gnosisI], [celo, celoI], [sonic, sonicI],
]);
const icon = (n) => `<span class="ico" aria-hidden="true">${ICONS.get(n) || ''}</span>`;
const allNets = GROUPS.flatMap((g) => g.nets);
const caipId = (n) => n.caipNetworkId || `eip155:${n.id}`;
const familyTag = (n) => ({ eip155: 'EVM', solana: 'SOL', bip122: 'BTC', ton: 'TON' }[caipId(n).split(':')[0]] || '');

/* ---------- AppKit: wallet list, QR code, deep links, EVM + Solana ---------- */
const modal = createAppKit({
  adapters: [new EthersAdapter(), new SolanaAdapter(), new BitcoinAdapter(), new TonAdapter()],
  networks: GROUPS.flatMap((g) => g.nets),
  themeMode: 'dark',
  projectId: PROJECT_ID,
  metadata: { name: 'Wallet Connect Demo', description: 'A learning demo', url: location.origin, icons: [] },
  // Shown first in the list: MetaMask, Trust Wallet, Phantom, SafePal.
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393',
    '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150',
  ],
  // Prefer https links to wallets: if the app is missing, the phone shows its download page instead of an error.
  experimental_preferUniversalLinks: true,
  features: { analytics: false, email: false, socials: [], swaps: false, onramp: false },
});

// What is connected right now, whichever chain family is active.
function current() {
  const ns = modal.getActiveChainNamespace();
  return {
    ns,
    address: ns ? modal.getAddress(ns) : undefined,
    network: ns ? modal.getCaipNetwork(ns) : undefined,
    provider: ns ? modal.getProvider(ns) : undefined,
    wallet: ns ? modal.getWalletInfo(ns) : undefined,
  };
}

const FAMILY = { eip155: 'EVM (eip155)', solana: 'Solana', bip122: 'Bitcoin (bip122)', ton: 'TON' };
let lastAddress = '';
let lastSessionHtml = null;

function render() {
  const c = current();
  const on = !!(c.address && c.provider);
  $('connect').textContent = on ? `${c.address.slice(0, 6)}…${c.address.slice(-4)}` : 'Connect Wallet';
  // Record connects and disconnects in the wire log.
  const address = on ? c.address : '';
  if (address !== lastAddress) {
    lastAddress = address;
    const entry = logCall(on ? FAMILY[c.ns] || c.ns : 'Wallet', on ? 'connect' : 'disconnect');
    entry.ok(on ? { wallet: c.wallet?.name, address: c.address, network: c.network?.caipNetworkId } : 'disconnected');
  }
  const sessionHtml = on
    ? `<span class="k">wallet: </span>${esc(c.wallet?.name || 'unknown')}<br>` +
      `<span class="k">chain family: </span>${esc(FAMILY[c.ns] || c.ns)}<br>` +
      `<span class="k">address: </span>${esc(c.address)}<br>` +
      `<span class="k">network: </span>${esc(c.network?.name || '?')} <span class="k">(${esc(c.network?.caipNetworkId || '')})</span>`
    : '<span class="k">Not connected.</span>';
  // Only touch the box when its content changes, and replay its entrance animation then.
  if (sessionHtml !== lastSessionHtml) {
    const first = lastSessionHtml === null;
    lastSessionHtml = sessionHtml;
    $('session').innerHTML = sessionHtml;
    if (!first) { $('session').classList.remove('flash'); void $('session').offsetWidth; $('session').classList.add('flash'); }
  }
  // Network button label and highlighted chip follow the active network, connected or not.
  const active = modal.getCaipNetwork();
  const activeNet = allNets.find((n) => caipId(n) === String(active?.caipNetworkId));
  $('net-name').innerHTML = (activeNet ? icon(activeNet) : '') + esc(active?.name || 'Choose network');
  document.querySelectorAll('#net-panel .chip').forEach((el) => {
    el.setAttribute('aria-pressed', String(el.dataset.id === String(active?.caipNetworkId)));
  });
}
/* ---------- network picker ---------- */
$('net-panel').innerHTML = GROUPS.map((g) =>
  `<div class="label dd-group">${esc(g.title)}</div>` +
  g.nets.map((n) => `<button class="chip" data-id="${esc(caipId(n))}" aria-pressed="false"><span class="chip-name">${icon(n)}${esc(n.name)}</span><small>${familyTag(n)}</small></button>`).join('') +
  '').join('');
function setMenu(open) {
  $('net-panel').classList.toggle('open', open);
  $('net-btn').setAttribute('aria-expanded', String(open));
}
$('net-btn').onclick = (ev) => { ev.stopPropagation(); setMenu(!$('net-panel').classList.contains('open')); };
document.addEventListener('click', (ev) => { if (!ev.target.closest('.dd')) setMenu(false); });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') setMenu(false); });
$('net-panel').onclick = async (ev) => {
  const chip = ev.target.closest('.chip');
  if (!chip) return;
  const net = allNets.find((n) => caipId(n) === chip.dataset.id);
  const entry = logCall('Network', `switchNetwork → ${net.name}`, { caipNetworkId: caipId(net) });
  try { await modal.switchNetwork(net); entry.ok('switched'); setMenu(false); }
  catch (e) { entry.fail(e); }
  render();
};

// Our own connect button: opens the wallet list, or the account view once connected.
$('connect').onclick = () => modal.open();

modal.subscribeAccount(render);
modal.subscribeNetwork(render);
modal.subscribeProviders(render);
render();
