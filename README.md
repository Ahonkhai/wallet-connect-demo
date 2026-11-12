# Wallet Connect Demo

A single page that connects to real wallets and signs with them.

- **Browser wallets** (MetaMask, Rabby, Coinbase Wallet…) are found with EIP-6963 and used through the standard EIP-1193 `request()` interface.
- **Phone wallets** pair by QR code through WalletConnect. This needs a free project ID from https://cloud.reown.com.
- **Phantom** (Solana) connects and signs a message through its own injected API.

## Run it

`index.html` is self-contained. Wallet extensions ignore pages opened as local files, so serve the folder over http:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. Any static host (Netlify, Vercel, GitHub Pages) also works.

## Change it

The code is in `src/main.js` and the markup in `src/template.html`. Rebuild `index.html` with:

```bash
npm install
```

```bash
node build.mjs
```

## Safety

"Send 0 ETH to yourself" is a real transaction and costs a network fee. Switch to a testnet (Sepolia or Base Sepolia) first.
