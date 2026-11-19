# Wallet Connect Demo

A single page that connects to real wallets on EVM chains, Solana, Bitcoin and TON, with a network picker, message signing, native-coin sending, and a log of every wallet request.

Wallet connections use Reown AppKit. The project ID in `src/main.js` comes from https://cloud.reown.com.

## Pay page

`pay.html` asks for one fixed amount, $10,000, paid in the coin of your choice. It has two parts: a "Pay with" network menu, and one button. Pressing the button connects a wallet and then asks it to approve the coin equivalent of $10,000 straight away. The button always names the amount, and after connecting it shows the coin amount too.

- The fixed amount is `USD_AMOUNT` in `src/pay.js`. It is converted to the chosen coin at the live price from CoinGecko. The price is fetched again just before paying if it is over a minute old, and paying is blocked if no price can be loaded.
- It covers EVM networks, Solana and Bitcoin. Payments go to one address per chain family, set in `RECEIVE` in `src/pay.js`: the addresses a sweeper watches.
- It uses real networks and real money: payments go straight to the wallets in `RECEIVE`. Setting `TESTNETS_ONLY` to `true` in `src/pay.js` offers test networks instead, for trying changes with test coins; swap in test addresses at the same time. Test coins have no price of their own, so test networks use the real coin's price.
- Not every wallet supports every test network. Trust Wallet, for example, does not support Solana Devnet; the page then says so.
- A payment link can fix the network: `pay.html?network=11155111`. The network is an EVM chain id, or `solana` or `bitcoin`.

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
