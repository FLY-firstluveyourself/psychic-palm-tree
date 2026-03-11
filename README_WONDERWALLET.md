# WonderWallet - Secure Multi-Chain Crypto Wallet 🔐

A secure, web-based cryptocurrency wallet application with revolutionary decoy security system. Built with React and designed for maximum security and privacy.

## 🚀 Features

### Core Wallet Functionality
- ✅ **BIP39 Seed Phrase Generation** - 12-word mnemonic for wallet recovery
- ✅ **Multi-Chain Support** - Unified backend for all major blockchains
  - Ethereum, BSC, Polygon, Avalanche, Arbitrum, Optimism (fully supported)
  - Bitcoin, Solana (framework ready)
- ✅ **Unified Transaction Layer** - Send/receive across all chains with one interface
- ✅ **Secure Storage** - AES-256 encryption with PIN protection
- ✅ **Balance Checking** - Real-time balance display across all chains
- ✅ **Token Support** - Auto-detect and manage ERC-20, BEP-20 tokens
- ✅ **Wallet Restoration** - Recover wallet from seed phrase on all chains
- ✅ **Cross-Chain Bridge Ready** - Prepared for DEX and bridge integrations

### Revolutionary Security Features
- 🎭 **Decoy Wallet System** - Create 4-9 decoy wallets that look identical to your main wallet
- 🔒 **PIN Authentication** - 4-6 digit PIN for quick access
- ⚠️ **Duress Mode** - Special PIN opens a decoy wallet in threatening situations
- 🛡️ **Auto-Lock** - Locks after 3 failed PIN attempts
- 👁️ **Master View** - Biometric auth reveals your main wallet (future feature)

### User Experience
- 🌑 **Dark Theme** - Sleek black and green Matrix-style interface
- 📱 **Responsive Design** - Works on desktop and mobile browsers
- ⚡ **Fast & Lightweight** - Optimized bundle size
- 🎨 **Material Design** - Clean, modern UI components

## 🛠️ Technology Stack

- **React 18.2** - Modern UI framework
- **TypeScript** - Type-safe services and utilities
- **Vite 6.3** - Lightning-fast build tool
- **ethers.js v6** - Ethereum blockchain interaction
- **bip39** - HD wallet seed phrase generation
- **crypto-js** - Encryption and security utilities
- **localStorage** - Encrypted local storage (web equivalent of react-native-keychain)

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm

### Setup
```bash
# Clone the repository
git clone https://github.com/FLY-firstluveyourself/codespaces-react.git
cd codespaces-react

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

The app will be available at `http://localhost:3000`

## 🎯 Usage Guide

### Creating a New Wallet
1. Click **"Create New Wallet"** on the welcome screen
2. **Write down your 12-word seed phrase** - This is critical for wallet recovery!
3. Verify your seed phrase by entering 3 random words
4. Set a 4-6 digit PIN to secure your wallet
5. Confirm your PIN
6. Success! Your wallet is ready to use

### Restoring an Existing Wallet
1. Click **"Restore from Seed Phrase"**
2. Enter your 12-word seed phrase
3. Set a new PIN for this device
4. Your wallet will be restored with the same address

### Using the Dashboard
- **View Balance** - See your ETH balance in real-time
- **Copy Address** - Click to copy your Ethereum address
- **Send/Receive** - Coming soon in v0.2
- **Setup Decoy System** - Enhance security with decoy wallets

### Setting Up Decoy Wallets
1. From the dashboard, click **"Setup Decoy System"**
2. Choose number of decoys (4-9 recommended)
3. The system will create multiple wallets, each with unique PIN
4. All wallets appear identical - even you won't know which is real!
5. Optional: Set up a duress PIN for emergency situations

## 🔒 Security Architecture

### Encryption
- **Algorithm**: AES-256 with PBKDF2 key derivation
- **Salt**: Random 128-bit salt per encryption
- **Iterations**: 10,000 PBKDF2 iterations
- **Storage**: Encrypted mnemonics stored in localStorage

### PIN Protection
- 4-6 digit numeric PIN
- Maximum 3 failed attempts before lock
- No PIN stored - derived key used for decryption

### Data Storage
- **Encrypted**: Wallet mnemonics (with PIN as key)
- **Plain Text**: Addresses, wallet names, settings
- **Never Stored**: Private keys in plain text, actual PIN values

### Decoy System
- Main wallet indistinguishable from decoys
- Each wallet has independent PIN
- `isMain` flag encrypted with main PIN
- Optional duress PIN for emergency access

## 📁 Project Structure

```
src/
├── services/
│   ├── WalletService.ts      # Wallet generation, restoration, balance
│   ├── DecoyService.ts        # Decoy wallet management
│   ├── SecurityService.ts     # PIN auth, encryption
│   └── StorageService.ts      # Encrypted localStorage wrapper
├── screens/
│   ├── CreateWalletScreen.tsx # New wallet creation flow
│   ├── RestoreWalletScreen.tsx # Wallet restoration
│   ├── DashboardScreen.tsx    # Main wallet view
│   ├── DecoySetupScreen.tsx   # Decoy configuration
│   └── SettingsScreen.tsx     # App settings
├── components/
│   ├── SeedPhraseDisplay.tsx  # 12-word grid display
│   ├── PINInput.tsx           # PIN entry component
│   ├── WalletCard.tsx         # Wallet info card
│   └── TransactionItem.tsx    # Transaction list item
├── utils/
│   ├── crypto.ts              # Encryption utilities
│   └── validation.ts          # Input validation
└── App.jsx                    # Main app with navigation
```

## 🧪 Manual Testing Checklist

### Wallet Creation
- [x] Generate new wallet displays 12-word seed phrase
- [x] Seed phrase words are valid BIP39 words
- [x] Verification asks for 3 random words
- [x] Incorrect verification shows error
- [x] PIN must be 4-6 digits
- [x] PIN confirmation must match
- [x] Wallet saved successfully with encrypted mnemonic

### Wallet Restoration
- [ ] Invalid seed phrase shows error
- [ ] Valid seed phrase restores correct address
- [ ] Restored wallet matches original address
- [ ] Can set new PIN for restored wallet

### Security
- [x] PIN required to unlock app
- [x] Incorrect PIN shows error and decrements attempts
- [x] 3 failed attempts locks the app
- [x] Locked app can be unlocked manually
- [x] Encrypted data cannot be read without PIN

### Dashboard
- [x] Displays correct Ethereum address
- [x] Balance fetches from blockchain (if network available)
- [x] Copy address to clipboard works
- [ ] Logout returns to PIN screen

### Decoy System
- [ ] Can create 4-9 decoy wallets
- [ ] Each decoy has unique address
- [ ] All wallets appear identical
- [ ] Cannot identify main wallet from UI
- [ ] Each wallet accessible with its own PIN

## ⚠️ Security Warnings

### Critical Security Notes
1. **NEVER share your seed phrase** - Anyone with it can access your funds
2. **NEVER share your PIN** - It encrypts your seed phrase
3. **Write down your seed phrase** - Store it offline in a safe place
4. **No recovery without seed phrase** - Lost seed phrase = lost wallet
5. **Test with small amounts first** - This is MVP software

### Known Limitations (MVP)
- Web-based storage (use hardware wallet for large amounts)
- Bitcoin and Solana adapters require additional dependencies for full implementation
- Transaction history requires external indexer APIs
- Token detection requires blockchain explorer APIs
- Cross-chain swaps require DEX aggregator integration
- No mobile biometric authentication (web equivalent limited)
- No backend/cloud sync (fully local)

## 🌐 Multi-Chain Architecture

### Supported Networks

**Fully Integrated (Production Ready):**
- Ethereum Mainnet
- Binance Smart Chain (BSC)
- Polygon (MATIC)
- Avalanche C-Chain
- Arbitrum One
- Optimism

**Framework Ready (Needs SDK Integration):**
- Bitcoin - Requires `bitcoinjs-lib`
- Solana - Requires `@solana/web3.js`

### Key Components

1. **BlockchainAdapter** - Abstract interface for all blockchain integrations
2. **ChainRegistry** - Central registry managing all blockchain adapters
3. **MultiChainWalletService** - Unified wallet operations across chains
4. **CrossChainBridge** - Interface for DEX aggregators and bridges

### Quick Start Examples

```javascript
// Generate multi-chain wallet
const { mnemonic, wallet } = await multiChainWalletService.generateMultiChainWallet();

// Get balances across all chains
const balances = await multiChainWalletService.getAllBalances(wallet);

// Send transaction on specific chain
const ethAccount = wallet.accounts.find(a => a.chain === 'ethereum');
const result = await multiChainWalletService.sendTransaction(
  ethAccount,
  { from: ethAccount.address, to: recipientAddress, amount: '0.1' },
  mnemonic
);

// Get cross-chain swap quote
const quote = await crossChainBridge.getBestQuote({
  fromChain: 'ethereum',
  toChain: 'bsc',
  fromAsset: ethAsset,
  toAsset: bnbAsset,
  amount: '1.0',
  fromAddress: ethAccount.address,
  toAddress: bscAccount.address,
});
```

For detailed integration guide, see [MULTI_CHAIN_DEVELOPER_GUIDE.md](./MULTI_CHAIN_DEVELOPER_GUIDE.md)

## 🗺️ Roadmap

### v0.2 (Q1 2025)
- [x] Multi-chain integration engine
- [x] Unified transaction abstraction layer
- [x] Cross-chain bridge framework
- [ ] Transaction sending UI for all chains
- [ ] QR code scanner for addresses
- [ ] Enhanced UI with chain selection
- [ ] Transaction history from blockchain explorers

### v0.3 (Q2 2025)
- [ ] Complete Bitcoin integration with bitcoinjs-lib
- [ ] Complete Solana integration with @solana/web3.js
- [ ] DEX aggregator integration (Li.Fi, 1inch)
- [ ] Guardian Network integration
- [ ] Social recovery system
- [ ] NFT support across chains

### v1.0 (Q3 2025)
- [ ] Convert to React Native for true mobile app
- [ ] Hardware wallet integration
- [ ] Advanced security features
- [ ] Multi-signature support
- [ ] DApp browser with WalletConnect

## 🤝 Contributing

This is currently a proof-of-concept MVP. Contributions welcome after initial release!

## 📄 License

MIT License - See LICENSE file for details

## 🔐 Disclaimer

**This software is provided "as-is" without warranty of any kind.** Use at your own risk. This is MVP software and should not be used to store large amounts of cryptocurrency. Always test with small amounts first and maintain proper backups of your seed phrases.

---

🤫 Built with ❤️ - "No man left behind"

**WonderWallet** - Your keys, your crypto, your privacy.
