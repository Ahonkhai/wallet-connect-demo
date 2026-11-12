# Wallet Connect Demo

A single page that connects to real wallets on EVM chains, Solana, Bitcoin and TON, with a network picker, message signing, native-coin sending, and a log of every wallet request.

Wallet connections use Reown AppKit. The project ID in `src/main.js` comes from https://cloud.reown.com.

## Pay page

`pay.html` is a four-step payment page in the same style: select network, enter amount, connect wallet, approve transaction. The wallet is asked to send the amount to one fixed address, `RECEIVE_ADDRESS` in `src/pay.js`, which is the address a sweeper watches.

- It offers test networks only until you set `TESTNETS_ONLY` to `false` in `src/pay.js`. Do that only after `RECEIVE_ADDRESS` is a wallet whose key only you hold.
- A payment link can fix the network and amount, and show a reference: `pay.html?network=11155111&amount=0.01&ref=1042`. The network is its chain id.

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
