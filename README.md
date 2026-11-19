# Wallet Connect Demo

A single page that connects to real wallets on EVM chains, Solana, Bitcoin and TON, with a network picker, message signing, native-coin sending, and a log of every wallet request.

Wallet connections use Reown AppKit. The project ID in `src/main.js` comes from https://cloud.reown.com.

## Pay page

`pay.html` is a four-step payment page in the same style: select network, enter an amount in US dollars, connect wallet, approve transaction.

- The dollar amount is converted to the selected coin at the live price from CoinGecko, and both are shown before the wallet asks for approval. The price is fetched again just before paying if it is over a minute old, and paying is blocked if no price can be loaded.
- It covers EVM networks, Solana and Bitcoin. Payments go to one address per chain family, set in `RECEIVE` in `src/pay.js`: the addresses a sweeper watches.
- It offers test networks only until you set `TESTNETS_ONLY` to `false` in `src/pay.js`. Do that only after every address in `RECEIVE` is a wallet whose key only you hold. Test coins have no price of their own, so test networks use the real coin's price.
- A payment link can fix the network and the dollar amount, and show a reference: `pay.html?network=11155111&usd=10000&ref=1042`. The network is an EVM chain id, or `solana` or `bitcoin`.

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
