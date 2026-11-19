import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin';
import { formatUnits } from 'ethers';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { GROUPS, caipId, icon } from './networks.js';

/* ---------- settings ---------- */
const PROJECT_ID = 'ddc82ce31c14de75c01b8b11db2694c5';
// The amount every payment is for, in US dollars. It is converted to the chosen coin at the live price.
const USD_AMOUNT = '1.00';
// Where payments go, one address per chain family. An EVM address works on every EVM network.
// Solana and Bitcoin each need their own. Payments land in these wallets directly.
const RECEIVE = {
  eip155: '0xc9376c2E238b91D72760f726370BC17FC570E096',
  solana: '9nnnLu4AiLctu5tzRN7mEaJkpQBYjERdk49vMu18CXoP',
  bip122: 'bc1qu7ffey507z55m4q3hzwda5vjcnk5vqnlkz4uru',
};
// false = real networks, real money. true = test networks only, for trying changes with test coins.
// The addresses above are real-network addresses, so keep this false unless you also swap in test addresses.
const TESTNETS_ONLY = false;
// Prices older than this are fetched again before a payment is sent.
const PRICE_MAX_AGE_MS = 60_000;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rawErr = (e) => (e && e.shortMessage) || (e && e.message) || String(e);
// Turn the wallets' terse errors into something a person can act on.
function errText(e, net) {
  const text = rawErr(e);
  if (/invalid chain|unsupported chain|chain.*not supported|unrecognized chain/i.test(text) && net) {
    return `Your wallet does not support ${net.name}. Pick another network, or use a wallet that supports it.`;
  }
  if (/user rejected|user denied|rejected the request|cancel/i.test(text)) return 'You cancelled the payment in your wallet.';
  if (/method not found|not supported|unsupported method/i.test(text) || (e && e.code === -32601)) {
    return `Your wallet refused the ${e && e.step ? e.step : 'request'} ("${text}"). This wallet may not take payments from websites on ${net ? net.name : 'this network'}. Pick another network, or use another wallet.`;
  }
  return text;
}
// Label an error with the step that failed, so the message can say which request the wallet refused.
const tagged = (step, e) => Object.assign(e instanceof Error ? e : new Error(rawErr(e)), { step, code: e && e.code });
const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const nsOf = (n) => caipId(n).split(':')[0];
const dueText = usdFmt.format(Number(USD_AMOUNT));

// Each coin's id on CoinGecko, the price source. Test networks use the real coin's price.
const PRICE_ID = { ETH: 'ethereum', POL: 'polygon-ecosystem-token', BNB: 'binancecoin', tBNB: 'binancecoin', SOL: 'solana', BTC: 'bitcoin', AVAX: 'avalanche-2' };
const priceId = (n) => PRICE_ID[n.nativeCurrency.symbol];

// The networks offered: the chain families with a receive address, and only coins with a known price.
// The networks offered. Keep this list short: when a wallet connects, it is asked for every network here at once,
// and some wallets (Bitget, for one) refuse to connect until the person has added each of them.
// Real networks first, then their test networks.
const PAY_CHAINS = [
  'eip155:1', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', 'bip122:000000000019d6689c085ae165831e93',
  'eip155:56', 'eip155:8453', 'eip155:42161', 'eip155:137',
  'eip155:11155111', 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', 'bip122:000000000933ea01ad0ee984209779ba',
  'eip155:97', 'eip155:84532', 'eip155:421614', 'eip155:80002',
];
const PAY_GROUPS = GROUPS
  .map((g) => ({ title: g.title, nets: g.nets.filter((n) => PAY_CHAINS.includes(caipId(n)) && RECEIVE[nsOf(n)] && priceId(n) && (TESTNETS_ONLY ? n.testnet : !n.testnet)) }))
  .filter((g) => g.nets.length);
const nets = PAY_GROUPS.flatMap((g) => g.nets);

// A payment link can fix the network: pay.html?network=11155111
// The network is an EVM chain id, or "solana" / "bitcoin".
const link = new URLSearchParams(location.search);
const linkNet = nets.find((n) => String(n.id) === link.get('network') || (link.get('network') === 'solana' && nsOf(n) === 'solana') || (link.get('network') === 'bitcoin' && nsOf(n) === 'bip122'));
let selected = linkNet || nets[0];

const modal = createAppKit({
  adapters: [new EthersAdapter(), new SolanaAdapter(), new BitcoinAdapter()],
  networks: nets,
  defaultNetwork: selected,
  themeMode: 'dark',
  projectId: PROJECT_ID,
  metadata: { name: 'Wallet Connect Demo', description: 'Pay from your wallet', url: location.origin, icons: [] },
  // Shown first in the list: MetaMask, Trust Wallet, Phantom, SafePal.
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393',
    '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150',
  ],
  experimental_preferUniversalLinks: true,
  features: { analytics: false, email: false, socials: [], swaps: false, onramp: false },
});

// The wallet connection for the selected network's chain family.
function current() {
  const ns = nsOf(selected);
  return { ns, address: modal.getAddress(ns), provider: modal.getProvider(ns), network: modal.getCaipNetwork(ns) };
}

/* ---------- prices ---------- */
const prices = {};   // CoinGecko id -> { usd, at }
let priceError = '';

async function fetchPrices() {
  const ids = [...new Set(nets.map(priceId))].join(',');
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`the price service answered ${r.status}`);
    const data = await r.json();
    const now = Date.now();
    for (const [id, v] of Object.entries(data)) if (v && v.usd > 0) prices[id] = { usd: v.usd, at: now };
    priceError = '';
  } catch (e) {
    priceError = 'Could not load prices: ' + errText(e);
  }
  render();
}

const priceOf = () => prices[priceId(selected)];

// The fixed dollar amount -> the coin's smallest unit (wei, lamports, satoshis), rounded down.
function quote() {
  const p = priceOf();
  if (!p) return null;
  const decimals = selected.nativeCurrency.decimals;
  // Work in whole cents and a fixed-point price, so no floating-point rounding reaches the amount.
  const cents = BigInt(Math.round(Number(USD_AMOUNT) * 100));
  const priceMicros = BigInt(Math.round(p.usd * 1e6));
  const units = (cents * 10n ** BigInt(decimals) * 10_000n) / priceMicros;
  if (units <= 0n) return null;
  return { price: p.usd, at: p.at, units, coin: formatUnits(units, decimals) };
}

// A readable coin amount: at most 8 decimal places, trailing zeros removed.
const coinText = (q) => {
  const [whole, frac = ''] = q.coin.split('.');
  const f = frac.slice(0, 8).replace(/0+$/, '');
  return f ? `${whole}.${f}` : whole;
};

/* ---------- page ---------- */
let payAfterConnect = false;   // set when the button is pressed before a wallet is connected
let paying = false;
let attempt = 0;               // counts payment requests, so a request that was given up on is ignored if it answers late
// Some phone wallets miss a request that arrives the instant a connection is approved, so wait a moment first.
const SETTLE_MS = 2500;
// After this long with no answer, offer to start over.
const STUCK_MS = 20_000;

function render() {
  const c = current();
  const on = !!(c.address && c.provider);
  const q = quote();
  const sym = selected.nativeCurrency.symbol;
  $('net-name').innerHTML = icon(selected) + esc(selected.name);
  document.querySelectorAll('#net-panel .chip').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.id === caipId(selected))));
  $('wallet').textContent = on ? `Connected: ${c.address.slice(0, 6)}…${c.address.slice(-4)} · Disconnect` : '';
  $('wallet').hidden = !on;
  // One button: connect first, then approve. It always names what is being paid.
  $('pay').disabled = paying || (on && !q);
  $('pay').textContent = paying ? 'Waiting for your wallet…'
    : !on ? `Connect wallet to pay ${dueText}`
    : q ? `Send the request to my wallet again (${coinText(q)} ${sym})`
    : priceError ? 'Price unavailable, try again shortly' : 'Loading price…';
}

// A message under the button, shown only when there is something to say.
function say(html) {
  $('result').innerHTML = html;
  $('result').hidden = !html;
}

// Follow the network the wallet is on, when it is one this page offers.
function followWallet() {
  const active = modal.getCaipNetwork();
  const net = active && nets.find((n) => caipId(n) === String(active.caipNetworkId));
  if (net && !linkNet) selected = net;
}

// The chain families the wallet is connected on, e.g. ['eip155'] for an Ethereum-only wallet.
const connectedFamilies = () => Object.keys(RECEIVE).filter((ns) => modal.getAddress(ns) && modal.getProvider(ns));

// When the wallet is connected, but not on the selected network's family, move to a network it can pay on.
// Returns false, with a message, when that is not possible.
function matchWalletFamily() {
  const c = current();
  if (c.address && c.provider) return true;
  const families = connectedFamilies();
  if (!families.length) return false;
  const familyName = { eip155: 'EVM', solana: 'Solana', bip122: 'Bitcoin' };
  if (linkNet) {
    say(`<span class="bad">Your wallet connected with its ${esc(families.map((f) => familyName[f]).join(' and '))} account, but this payment is on ${esc(selected.name)}. Connect a wallet that supports ${esc(selected.name)}.</span>`);
    return false;
  }
  const net = nets.find((n) => families.includes(nsOf(n)));
  if (!net) return false;
  const was = selected.name;
  selected = net;
  say(`<span class="k">Your wallet has no account on ${esc(was)}, so the payment switched to ${esc(net.name)}.</span>`);
  return true;
}

function onWalletChange() {
  followWallet();
  if (payAfterConnect && connectedFamilies().length) {
    payAfterConnect = false;
    if (matchWalletFamily()) {
      say('<span class="k">Connected. Sending the payment request to your wallet…</span>');
      setTimeout(pay, SETTLE_MS);
    }
  }
  render();
}

/* ---------- pay with: network menu ---------- */
$('net-panel').innerHTML = PAY_GROUPS.map((g) =>
  `<div class="label dd-group">${esc(g.title)}</div>` +
  g.nets.map((n) => `<button class="chip" data-id="${esc(caipId(n))}" aria-pressed="false"><span class="chip-name">${icon(n)}${esc(n.name)}</span><small>${esc(n.nativeCurrency.symbol)}</small></button>`).join('')).join('');
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
  selected = nets.find((n) => caipId(n) === chip.dataset.id);
  setMenu(false);
  render();
  say('');
  try { await modal.switchNetwork(selected); } catch (e) { say(`<span class="bad">${esc(errText(e, selected))}</span>`); }
  render();
};

/* ---------- connect, then approve ---------- */
async function send(c, units) {
  const to = RECEIVE[c.ns];
  if (c.ns === 'eip155') {
    return c.provider.request({ method: 'eth_sendTransaction', params: [{ from: c.address, to, value: '0x' + units.toString(16) }] });
  }
  if (c.ns === 'solana') {
    // Solana needs a recent blockhash from a node before the wallet can sign.
    const connection = new Connection(`https://rpc.walletconnect.org/v1/?chainId=${caipId(selected)}&projectId=${PROJECT_ID}`, 'confirmed');
    const from = new PublicKey(c.address);
    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction({ feePayer: from, recentBlockhash: blockhash }).add(
      SystemProgram.transfer({ fromPubkey: from, toPubkey: new PublicKey(to), lamports: units })
    );
    return c.provider.sendTransaction(tx, connection);
  }
  if (c.ns === 'bip122') {
    return c.provider.sendTransfer({ recipient: to, amount: units.toString() });
  }
  throw new Error('This network is not supported here.');
}

async function pay() {
  if (paying) return;
  paying = true;
  const mine = ++attempt;
  let stuck;
  render();
  try {
    // Never pay on an old price: refresh it first, then quote again.
    if (!priceOf() || Date.now() - priceOf().at > PRICE_MAX_AGE_MS) await fetchPrices();
    const q = quote();
    if (!q) throw new Error(priceError || 'No price is available for this coin yet.');
    if (caipId(current().network || {}) !== caipId(selected)) {
      try { await modal.switchNetwork(selected); } catch (e) { throw tagged(`switch to ${selected.name}`, e); }
    }
    const c = current();
    if (!c.address || !c.provider) throw new Error(`Your wallet is not connected on ${selected.name}. Connect a wallet that supports it.`);
    const sym = selected.nativeCurrency.symbol;
    const waiting = `<span class="k">Open your wallet and approve ${esc(coinText(q))} ${esc(sym)} (${esc(dueText)}). If the wallet is on your phone, open the app: the request is waiting there.</span>`;
    say(waiting);
    stuck = setTimeout(() => {
      if (mine !== attempt) return;
      say(waiting + '<br><br><span class="k">Still nothing in your wallet? Reject any earlier payment request you can see there, so you do not pay twice, then start over.</span><br><button class="ghost" id="restart">Start over</button>');
      $('restart').onclick = startOver;
    }, STUCK_MS);
    let id;
    try { id = await send(c, q.units); } catch (e) { throw tagged('payment request', e); }
    if (mine !== attempt) return;    // the person started over; ignore this late answer
    const explorer = selected.blockExplorers?.default?.url;
    say(
      `<span class="good">Payment sent: ${esc(coinText(q))} ${esc(sym)}, worth ${esc(dueText)} at ${esc(usdFmt.format(q.price))} per ${esc(sym)}.</span><br>` +
      `<span class="k">transaction id: </span>${esc(id)}` +
      (explorer && c.ns === 'eip155' ? `<br><a href="${esc(explorer)}/tx/${esc(id)}" target="_blank" rel="noopener">View on the block explorer</a>` : ''));
  } catch (e) {
    if (mine !== attempt) return;
    say(`<span class="bad">${esc(errText(e, selected))}</span>`);
  } finally {
    clearTimeout(stuck);
  }
  if (mine !== attempt) return;
  paying = false;
  render();
}

// Give up on the current request: disconnect, so the next press connects afresh.
async function startOver() {
  attempt++;
  paying = false;
  payAfterConnect = false;
  try { await modal.disconnect(); } catch { /* already disconnected */ }
  say('<span class="k">Disconnected. Press the button to connect and pay again.</span>');
  render();
}

$('pay').onclick = () => {
  say('');
  if (current().address || (connectedFamilies().length && matchWalletFamily())) return pay();
  payAfterConnect = true;          // the payment request follows as soon as the wallet connects
  modal.open();
};
$('wallet').onclick = () => modal.disconnect();
// If the wallet window is closed without connecting, forget the pending payment.
modal.subscribeState((st) => { if (!st.open && !current().address) payAfterConnect = false; });

/* ---------- start ---------- */
if (linkNet) $('net-btn').disabled = true;
modal.subscribeAccount(onWalletChange);
modal.subscribeNetwork(onWalletChange);
modal.subscribeProviders(onWalletChange);
render();
fetchPrices();
setInterval(fetchPrices, 30_000);
