import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { parseUnits } from 'ethers';
import { GROUPS, caipId, icon } from './networks.js';

/* ---------- settings ---------- */
const PROJECT_ID = 'ddc82ce31c14de75c01b8b11db2694c5';
// Where payments go: the address the sweeper watches. The same address works on every EVM network.
const RECEIVE_ADDRESS = '0xf30c50b0a2473b3fFB401ee86B0a950d96E45849';
// true = only test networks are offered. Set it to false once RECEIVE_ADDRESS is a wallet whose key only you hold.
const TESTNETS_ONLY = true;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const errText = (e) => (e && e.shortMessage) || (e && e.message) || String(e);

// The sweeper handles EVM networks, so those are the ones offered here.
const PAY_GROUPS = GROUPS
  .map((g) => ({ title: g.title, nets: g.nets.filter((n) => caipId(n).startsWith('eip155:') && (!TESTNETS_ONLY || n.testnet)) }))
  .filter((g) => g.nets.length);
const nets = PAY_GROUPS.flatMap((g) => g.nets);

// A payment link can fix the network and amount: pay.html?network=11155111&amount=0.01&ref=1042
const link = new URLSearchParams(location.search);
const linkNet = nets.find((n) => String(n.id) === link.get('network'));
const linkAmount = /^\d*\.?\d+$/.test(link.get('amount') || '') ? link.get('amount') : '';
const ref = (link.get('ref') || '').slice(0, 40);
let selected = linkNet || nets[0];

const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: nets,
  defaultNetwork: selected,
  themeMode: 'dark',
  projectId: PROJECT_ID,
  metadata: { name: 'Wallet Connect Demo', description: 'Pay from your wallet', url: location.origin, icons: [] },
  // Shown first in the list: MetaMask, Trust Wallet, SafePal.
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150',
  ],
  experimental_preferUniversalLinks: true,
  features: { analytics: false, email: false, socials: [], swaps: false, onramp: false },
});

const current = () => ({ address: modal.getAddress('eip155'), provider: modal.getProvider('eip155'), network: modal.getCaipNetwork('eip155') });
const unit = () => selected.nativeCurrency.symbol;

// The amount in the coin's smallest unit, or null while it is not a usable number.
function amountUnits() {
  try {
    const units = parseUnits($('amount').value.trim(), selected.nativeCurrency.decimals);
    return units > 0n ? units : null;
  } catch { return null; }
}

function render() {
  const c = current();
  const on = !!(c.address && c.provider);
  const amountOk = amountUnits() !== null;
  $('net-name').innerHTML = icon(selected) + esc(selected.name);
  document.querySelectorAll('#net-panel .chip').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.id === caipId(selected))));
  $('unit').textContent = unit();
  $('connect').textContent = on ? `${c.address.slice(0, 6)}…${c.address.slice(-4)}` : 'Connect Wallet';
  $('pay').disabled = !(on && amountOk);
  $('pay').textContent = amountOk ? `Pay ${$('amount').value.trim()} ${unit()}` : 'Pay';
  // Tick each step off as it is completed.
  $('step-network').classList.add('done');
  $('step-amount').classList.toggle('done', amountOk);
  $('step-connect').classList.toggle('done', on);
}

/* ---------- step 1: network ---------- */
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
  try { await modal.switchNetwork(selected); } catch (e) { $('result').innerHTML = `<span class="bad">${esc(errText(e))}</span>`; }
};

/* ---------- step 2: amount ---------- */
$('amount').oninput = render;

/* ---------- step 3: connect ---------- */
$('connect').onclick = () => modal.open();

/* ---------- step 4: approve ---------- */
$('pay').onclick = async () => {
  const units = amountUnits();
  if (units === null) return;
  $('pay').disabled = true;
  $('result').innerHTML = '<span class="k">Check your wallet and approve the payment.</span>';
  try {
    // Make sure the wallet is on the chosen network before it is asked to pay.
    if (Number(current().network?.id) !== selected.id) await modal.switchNetwork(selected);
    const c = current();
    const params = [{ from: c.address, to: RECEIVE_ADDRESS, value: '0x' + units.toString(16) }];
    const hash = await c.provider.request({ method: 'eth_sendTransaction', params });
    const explorer = selected.blockExplorers?.default?.url;
    $('step-approve').classList.add('done');
    $('result').innerHTML =
      `<span class="good">Payment sent: ${esc($('amount').value.trim())} ${esc(unit())}.</span><br>` +
      `<span class="k">transaction id: </span>${esc(hash)}` +
      (explorer ? `<br><a href="${esc(explorer)}/tx/${esc(hash)}" target="_blank" rel="noopener">View on the block explorer</a>` : '');
  } catch (e) {
    $('result').innerHTML = `<span class="bad">${esc(errText(e))}</span>`;
  }
  render();
};

/* ---------- start ---------- */
$('to').textContent = RECEIVE_ADDRESS;
if (linkNet) $('net-btn').disabled = true;
if (linkAmount) { $('amount').value = linkAmount; $('amount').readOnly = true; }
if (ref) { $('ref').textContent = `Invoice ${ref}`; $('ref').hidden = false; }
$('testnet-note').hidden = !TESTNETS_ONLY;
modal.subscribeAccount(render);
modal.subscribeNetwork(render);
modal.subscribeProviders(render);
render();
