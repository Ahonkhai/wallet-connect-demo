# Wallet Connect Demo

A single page that connects to real wallets on EVM chains, Solana, Bitcoin and TON, with a network picker and a log of each connection and network switch.

Wallet connections use Reown AppKit. The project ID in `src/main.js` comes from https://cloud.reown.com.

## Run it

`index.html` is self-contained. Serve the folder over http, since wallet extensions ignore pages opened as local files:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. It also works on any static host such as GitHub Pages.

## Change it

The code is in `src/main.js` and the markup in `src/template.html`. Rebuild `index.html` with:

```bash
npm install
```

```bash
node build.mjs
```
