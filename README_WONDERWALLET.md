# WonderWallet - Secure Multi-Chain Crypto Wallet 🔐

A secure, web-based cryptocurrency wallet application with revolutionary decoy security system. Built with React and designed for maximum security and privacy.

## 🚀 Features

### Core Wallet Functionality
- ✅ **BIP39 Seed Phrase Generation** - 12-word mnemonic for wallet recovery
- ✅ **Ethereum Support** - Full Ethereum mainnet integration
- ✅ **Secure Storage** - AES-256 encryption with PIN protection
- ✅ **Balance Checking** - Real-time ETH balance display
- ✅ **Wallet Restoration** - Recover wallet from seed phrase

### Revolutionary Security Features
- 🎭 **Decoy Wallet System** - Create 4-9 decoy wallets that look identical to your main wallet
- 🔒 **PIN + Biometric Auth** - 4-6 digit PIN with fingerprint/face recognition support
- ⚠️ **Duress Mode** - Special PIN opens a decoy wallet + silent alerts to emergency contacts
- 🛡️ **Auto-Lock** - Locks after 3 failed PIN attempts
- 👁️ **Master View** - Biometric auth reveals your main wallet
- 🔐 **Hardware Wallet** - Support for Ledger and Trezor devices
- ✈️ **Air-Gap Mode** - Completely offline operation with QR code transaction transfer
- ☁️ **Encrypted Backup** - Optional end-to-end encrypted cloud backup
- 🚨 **Security Alerts** - Real-time notifications for suspicious activity
- 👥 **Guardian Recovery** - Social recovery through trusted guardians (M-of-N)

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

### Enabling Biometric Authentication
1. Go to **Settings** → **Security**
2. Click **"Enable Biometric"**
3. Follow browser/device prompts to register fingerprint/face
4. Test biometric login
5. PIN still required as fallback

### Connecting Hardware Wallet
1. Connect Ledger/Trezor device via USB
2. Go to **Settings** → **Hardware Wallet**
3. Click **"Connect Hardware Wallet"**
4. Select device from browser prompt
5. Unlock device with its PIN
6. Sign transactions on device screen

### Setting Up Air-Gap Mode
1. Install WonderWallet on offline device (old phone, dedicated device)
2. **Never connect offline device to internet**
3. Generate wallet on offline device
4. Export address via QR code to online device
5. To sign transaction:
   - Prepare transaction on online device
   - Display unsigned transaction QR code
   - Scan with offline device
   - Sign on offline device
   - Display signed transaction QR code
   - Scan with online device
   - Broadcast transaction

### Creating Encrypted Backup
1. Go to **Settings** → **Backup**
2. Click **"Create Backup"**
3. Enter strong master password (8+ characters, different from PIN)
4. Choose backup method:
   - **Cloud**: Google Drive, iCloud, or Dropbox
   - **File**: Download encrypted JSON file
5. Store backup password safely (physical location recommended)

### Setting Up Guardian Recovery
1. Go to **Settings** → **Recovery**
2. Click **"Setup Guardian Recovery"**
3. Choose threshold (e.g., 3 of 5 guardians)
4. Add trusted guardians:
   - Name, email, phone number
   - Send invitation to each guardian
5. Guardians accept invitation
6. Test recovery process with small amount

### Configuring Security Alerts
1. Go to **Settings** → **Alerts**
2. Enable notification channels:
   - Email notifications
   - SMS notifications (requires service integration)
   - Push notifications (browser permission required)
3. Add emergency contacts
4. Choose which events trigger alerts:
   - New device login
   - Failed authentication attempts
   - Large transactions
   - Recovery requests

### Using Duress Mode
⚠️ **Emergency Use Only**
1. When threatened, enter your duress PIN instead of real PIN
2. System will:
   - Open decoy wallet (appears normal)
   - Silently alert emergency contacts
   - Log location and event details
   - Appear completely normal to attacker
3. Emergency contacts receive immediate notification
4. You can provide decoy wallet funds to attacker safely

## 🔒 Security Architecture

WonderWallet implements a comprehensive **Security-First Architecture** with multiple layers of protection:

### 1. Authentication Layer
- **PIN Protection**: 4-6 digit PIN with PBKDF2 key derivation (10,000 iterations)
- **Biometric Support**: WebAuthn-based fingerprint/face recognition
  - iOS: Face ID / Touch ID
  - Android: Fingerprint / Face Unlock
  - Windows: Windows Hello
  - macOS: Touch ID
- **Rate Limiting**: Maximum 3 failed attempts before auto-lock
- **Fallback**: Always requires PIN as backup method

### 2. Hardware Wallet Integration
- **Ledger Support**: Nano S, Nano X, Nano S Plus via Web USB
- **Trezor Support**: Trezor One, Model T via Web USB
- **Transaction Signing**: Sign on device for maximum security
- **Address Verification**: Verify addresses on device screen
- **No Private Key Export**: Keys never leave hardware device

### 3. Air-Gapped/Offline Mode
- **Cold Wallet**: Run on completely offline devices (old phones, dedicated devices)
- **QR Code Transfer**: Sign transactions offline, broadcast online
- **No Network Dependency**: Full wallet functionality without internet
- **Perfect Forward Secrecy**: Even if online device compromised, offline keys safe
- **Transaction History**: Local storage of signed transactions

### 4. Duress Mode & Decoy System
- **Decoy Wallets**: 4-9 identical-looking wallets with independent PINs
- **Duress PIN**: Special PIN that:
  - Opens a decoy wallet (appears normal)
  - Silently triggers emergency alerts
  - Notifies all emergency contacts
  - Tracks geolocation (if enabled)
  - Logs security event
- **Indistinguishable**: No visible indicators of main wallet
- **Emergency Response**: Automatic alerts without attacker knowledge

### 5. Encrypted Cloud Backup (Opt-In)
- **End-to-End Encryption**: AES-256 encryption before cloud upload
- **Master Password**: Separate strong password (not the PIN)
- **Multiple Providers**: Google Drive, iCloud, Dropbox support
- **Integrity Checking**: SHA-256 checksums verify backup validity
- **Version Control**: Multiple backup versions with timestamps
- **Local Export**: Download encrypted backup file

### 6. Device & Security Alerts
- **New Device Detection**: Alert when accessed from unrecognized device
- **Failed Login Tracking**: Notifications after suspicious attempts
- **Transaction Alerts**: Real-time notifications for all transactions
- **Multiple Channels**: Email, SMS, push notifications
- **Security Event Log**: Complete audit trail of all security events
- **Emergency Contacts**: Automatic notifications for critical events

### 7. Guardian Recovery System
- **Social Recovery**: Recover wallet through trusted guardians
- **M-of-N Threshold**: Configurable (e.g., 3 of 5 guardians required)
- **Time Delays**: 48-hour default delay before recovery completion
- **Guardian Privacy**: Guardians never see seed phrase (Shamir's Secret Sharing)
- **User Notification**: Immediate alert when recovery initiated
- **Cancellation**: Can cancel before delay expires

### Encryption Details
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

### Known Limitations (Current Version)
- Web-based storage (use hardware wallet for large amounts)
- Hardware wallet integration requires browser with Web USB support (Chrome, Edge, Opera)
- Biometric authentication availability depends on device/browser support
- Cloud backup providers require user-provided API integration
- Guardian recovery uses placeholder Shamir's Secret Sharing (full implementation pending)
- QR code functionality requires camera access
- Air-gap mode best used with dedicated offline device

## 🗺️ Roadmap

### v0.2 (Q1 2025)
- [x] **Hardware Wallet Integration** - Ledger and Trezor support
- [x] **Biometric Authentication** - Fingerprint and face recognition
- [x] **Air-Gap Mode** - Completely offline wallet operation
- [x] **Cloud Backup** - Encrypted backup to cloud providers
- [x] **Security Alerts** - Real-time notifications system
- [x] **Guardian Recovery** - Social recovery through trusted contacts
- [ ] Transaction sending UI
- [ ] QR code scanner for addresses
- [ ] Multiple blockchain support (Bitcoin, Solana)
- [ ] Enhanced UI with animations
- [ ] Transaction history from blockchain explorers

### v0.3 (Q2 2025)
- [ ] Guardian Network integration
- [ ] Social recovery system
- [ ] Exchange integrations
- [ ] DApp browser
- [ ] NFT support

### v1.0 (Q3 2025)
- [ ] Convert to React Native for true mobile app
- [ ] Hardware wallet integration
- [ ] Advanced security features
- [ ] Multi-signature support

## 🤝 Contributing

This is currently a proof-of-concept MVP. Contributions welcome after initial release!

## 📄 License

MIT License - See LICENSE file for details

## 🔐 Disclaimer

**This software is provided "as-is" without warranty of any kind.** Use at your own risk. This is MVP software and should not be used to store large amounts of cryptocurrency. Always test with small amounts first and maintain proper backups of your seed phrases.

---

🤫 Built with ❤️ - "No man left behind"

**WonderWallet** - Your keys, your crypto, your privacy.
