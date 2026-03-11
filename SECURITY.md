# WonderWallet Security Policy

## Security-First Architecture

WonderWallet is built with a comprehensive security-first architecture designed to protect user assets and privacy across all scenarios. This document outlines our security features, best practices, and vulnerability reporting process.

## 🔐 Core Security Features

### 1. Local-Only Private Key Storage
- **Never Server-Side**: All private keys and mnemonics are stored locally only
- **AES-256 Encryption**: Industry-standard encryption with PBKDF2 key derivation (10,000+ iterations)
- **No Cloud Keys**: Private keys never leave the device unless explicitly exported with user consent
- **Encrypted at Rest**: All sensitive data encrypted in localStorage/secure storage

### 2. Multi-Factor Authentication
- **PIN Protection**: 4-6 digit PIN with rate limiting (max 3 attempts before lock)
- **Biometric Support**: WebAuthn-based fingerprint/face recognition on supported devices
- **Fallback Methods**: Strong password recovery for biometric failures
- **Auto-Lock**: Configurable timeout for automatic re-authentication

### 3. Hardware Wallet Integration
- **Ledger Support**: Compatible with Ledger Nano S/X/S Plus (Web USB)
- **Trezor Support**: Compatible with Trezor One/Model T
- **USB/Bluetooth**: Multiple connection methods based on device capability
- **Transaction Signing**: All transactions can be signed on hardware device
- **Address Verification**: Display addresses on hardware device for verification

### 4. Air-Gapped/Offline Mode
- **Cold Wallet Mode**: Run on completely offline devices (old phones, dedicated devices)
- **QR Code Transfer**: Sign transactions offline, transfer via QR code
- **No Network Dependency**: Full wallet functionality without internet
- **Offline Transaction Storage**: Keep records of signed transactions locally
- **Export/Import**: Securely transfer wallets between devices

### 5. Duress Mode & Decoy Wallets
- **Decoy System**: Create 4-9 identical-looking wallets
- **Duress PIN**: Special PIN that opens a decoy wallet in threatening situations
- **Silent Alerts**: Automatically notify emergency contacts when duress PIN used
- **Indistinguishable**: Even the owner can't tell which wallet is real from UI
- **Emergency Response**: Triggers location tracking and silent alarm

### 6. Encrypted Cloud Backup (Opt-In)
- **End-to-End Encryption**: Backups encrypted before leaving device
- **Master Password**: Separate strong password for backup (not the PIN)
- **Multiple Providers**: Support for Google Drive, iCloud, Dropbox
- **Versioning**: Keep multiple backup versions with timestamps
- **Integrity Checking**: SHA-256 checksums verify backup integrity

### 7. Device & Security Alerts
- **New Device Detection**: Alert when wallet accessed from new device
- **Failed Login Alerts**: Notification after suspicious authentication attempts
- **Transaction Notifications**: Real-time alerts for all transactions
- **Email/SMS/Push**: Multiple notification channels
- **Security Event Log**: Complete audit trail of all security events

### 8. Guardian Recovery System
- **Social Recovery**: Recover wallet through trusted guardians (M-of-N)
- **Time Delays**: Configurable delay (default 48h) before recovery completion
- **Guardian Approvals**: Requires multiple guardian confirmations
- **No Seed Exposure**: Guardians never see seed phrase (Shamir's Secret Sharing)
- **Emergency Contacts**: Automatic notification to designated contacts

## 🛡️ Security Best Practices

### For Users

1. **Seed Phrase Security**
   - Write down your 12-word seed phrase immediately
   - Store in multiple secure physical locations (fireproof safe, safety deposit box)
   - NEVER store seed phrase digitally (no photos, no cloud storage)
   - NEVER share with anyone, including support staff

2. **PIN Selection**
   - Use a unique PIN not used elsewhere
   - Avoid obvious patterns (1234, birth year, etc.)
   - Change PIN periodically
   - Never share PIN with anyone

3. **Device Security**
   - Keep OS and browser updated
   - Use antivirus/anti-malware software
   - Enable device encryption
   - Use secure lock screen on mobile devices

4. **Network Security**
   - Avoid public WiFi for transactions
   - Use VPN when possible
   - Verify SSL certificates (https://)
   - Be aware of phishing attempts

5. **Recovery Setup**
   - Set up guardian recovery with trusted contacts
   - Test recovery process with small amounts
   - Keep guardian contact information updated
   - Review guardian list regularly

### For Developers

1. **Code Security**
   - All cryptographic operations use vetted libraries (crypto-js, ethers.js)
   - No hardcoded secrets or keys
   - Input validation on all user inputs
   - Secure random generation (crypto.getRandomValues)

2. **Dependencies**
   - Regular security audits (`npm audit`)
   - Keep dependencies updated
   - Review all dependency changes
   - Minimize third-party code

3. **Build Security**
   - Use integrity checking (checksums)
   - Reproducible builds
   - Code signing where applicable
   - Verify all build artifacts

## 🚨 Threat Model

### Protected Against

✅ **Malware on device** - Keys encrypted, requires PIN/biometric
✅ **Physical theft** - Encrypted storage, auto-lock, duress mode
✅ **$5 wrench attack** - Duress PIN opens decoy wallet with minimal funds
✅ **Phishing** - Local-only keys, no server to phish
✅ **Man-in-the-middle** - HTTPS required, local signing
✅ **Brute force** - Rate limiting, auto-lock after 3 attempts
✅ **Lost device** - Recovery via guardians or backup
✅ **Forgotten PIN** - Guardian recovery or backup restore
✅ **Compromised network** - Offline/air-gap mode available

### Limitations

⚠️ **Browser/OS compromise** - If attacker has full device access, they may extract keys
⚠️ **Keylogger** - Can capture PIN during entry
⚠️ **Screen recording** - Could capture seed phrase during display
⚠️ **Physical access + time** - Extended physical access allows attacks
⚠️ **Web-based storage** - Less secure than native mobile secure storage

### Mitigations

- Use air-gapped device for large holdings
- Use hardware wallet for maximum security
- Enable biometric to reduce PIN entry
- Limit displayed seed phrase exposure time
- Regular security audits

## 📊 Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  PIN Input   │  │  Biometric   │  │  Hardware    │        │
│  │              │  │  Scanner     │  │  Wallet USB  │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
├─────────┼──────────────────┼──────────────────┼─────────────────┤
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │         SecurityService (Auth Layer)            │           │
│  │  - PIN Validation    - Biometric Auth           │           │
│  │  - Rate Limiting     - Duress Detection         │           │
│  │  - Session Management                           │           │
│  └──────────────────┬──────────────────────────────┘           │
│                     │                                           │
│                     ▼                                           │
│  ┌─────────────────────────────────────────────────┐           │
│  │          Encryption Layer (crypto.ts)           │           │
│  │  - AES-256-GCM   - PBKDF2 (10k iterations)     │           │
│  │  - Secure Random - SHA-256 Hashing             │           │
│  └──────────────────┬──────────────────────────────┘           │
│                     │                                           │
│         ┌───────────┼───────────┐                              │
│         ▼           ▼           ▼                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐                     │
│  │ Storage │ │ Wallet  │ │   Decoy     │                     │
│  │ Service │ │ Service │ │   Service   │                     │
│  └─────────┘ └─────────┘ └─────────────┘                     │
│       │           │               │                            │
│       ▼           ▼               ▼                            │
│  ┌──────────────────────────────────────┐                     │
│  │    Encrypted Local Storage           │                     │
│  │    (localStorage / Secure Enclave)   │                     │
│  └──────────────────────────────────────┘                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                   Alert & Recovery System                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Alert     │  │  Recovery   │  │   Cloud     │           │
│  │   Service   │  │  Service    │  │   Backup    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Security Audits

### Internal Audits
- **Code Review**: All security-critical code reviewed
- **Dependency Audit**: Regular `npm audit` checks
- **Penetration Testing**: Manual testing of attack vectors
- **Threat Modeling**: Regular threat model updates

### External Audits
- **Status**: Planned for production release
- **Scope**: Full security audit by reputable firm
- **Focus**: Cryptographic implementation, key management, authentication

## 📝 Reporting a Vulnerability

### Process

1. **Do NOT** open a public GitHub issue
2. Email security concerns to: [security contact - to be added]
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Weekly until resolved
- **Fix Timeline**: Critical issues within 7 days, others within 30 days
- **Disclosure**: Coordinated disclosure after fix is released

### Bug Bounty

- **Status**: Planned for future
- **Scope**: Critical security vulnerabilities
- **Rewards**: Based on severity and impact

## 🏆 Acknowledgments

We thank the following security researchers for responsible disclosure:
- [To be added as vulnerabilities are reported and fixed]

## 📜 Supported Versions

| Version | Supported          | Security Features              |
| ------- | ------------------ | ------------------------------ |
| 1.x.x   | :white_check_mark: | Full security stack            |
| 0.2.x   | :white_check_mark: | Core security + recovery       |
| 0.1.x   | :x:                | Basic security only (MVP)      |
| < 0.1   | :x:                | Not recommended for production |

## 🔗 Additional Resources

- [Copilot Instructions](.github/copilot-instructions.md) - Security coding guidelines
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Technical details
- [README](README_WONDERWALLET.md) - User-facing security information

## ⚖️ Disclaimer

**USE AT YOUR OWN RISK**: WonderWallet is provided "as-is" without any warranty. While we implement industry-standard security practices, no system is 100% secure. Users should:
- Start with small amounts for testing
- Use hardware wallets for large holdings
- Maintain proper backups
- Follow security best practices

**NOT FINANCIAL ADVICE**: This software is for educational and experimental purposes. Always do your own research and consult with financial advisors.

---

**Last Updated**: December 29, 2024
**Version**: 1.0
**Security Contact**: [To be added]
