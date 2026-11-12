// The networks both pages offer, with their logos. Shared by main.js and pay.js.
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


// Network picker groups, most used first. The same order feeds AppKit's own list.
export const GROUPS = [
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
export const icon = (n) => `<span class="ico" aria-hidden="true">${ICONS.get(n) || ''}</span>`;
export const allNets = GROUPS.flatMap((g) => g.nets);
export const caipId = (n) => n.caipNetworkId || `eip155:${n.id}`;
export const familyTag = (n) => ({ eip155: 'EVM', solana: 'SOL', bip122: 'BTC', ton: 'TON' }[caipId(n).split(':')[0]] || '');
