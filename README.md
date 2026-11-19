# Wallet Connect Demo

A single page that connects to real wallets on EVM chains, Solana, Bitcoin and TON, with a network picker, message signing, native-coin sending, and a log of every wallet request.

Wallet connections use Reown AppKit. The project ID in `src/main.js` comes from https://cloud.reown.com.

## Pay page

`pay.html` is a learning demo of a click-and-pay checkout on test networks. It has a "Pay with" network menu and one button: pressing it connects a wallet, then asks the wallet to approve a fixed amount, `USD_AMOUNT` in `src/pay.js`, converted to the chosen coin at the live CoinGecko price.

- Test networks only, so no real money moves: Sepolia, Base Sepolia, Arbitrum Sepolia, Polygon Amoy, BNB Smart Chain Testnet and Solana Devnet. Test coins have no price of their own, so the real coin's price is used.
- Payments go to the addresses in `RECEIVE` in `src/pay.js`. Bitcoin is left out until a test-network (`tb1`) address is added.
- Fixes for wallet quirks: the request waits a moment after connecting, transfers include an empty `data` field (some iPhone wallets fail without one), and the built-in Coinbase option is off because its library fails in Safari. Coinbase Wallet still connects by QR code.
- A link can fix the network: `pay.html?network=11155111`. The network is an EVM chain id, or `solana`.

## Run it

`index.html` and `pay.html` are self-contained. Serve the folder over http, since wallet extensions ignore pages opened as local files:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173 for the demo, or http://localhost:4173/pay.html for the pay page. It also works on any static host such as GitHub Pages.

## Change it

The demo's code is in `src/main.js` and its markup in `src/template.html`. The pay page is `src/pay.js` and `src/pay-template.html`. Both share the network list in `src/networks.js`. Rebuild `index.html` and `pay.html` with:

```bash
npm install
```

```bash
node build.mjs
```
