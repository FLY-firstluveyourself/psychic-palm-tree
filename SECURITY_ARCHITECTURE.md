# Security Architecture Documentation

## Overview

This document provides a comprehensive technical overview of WonderWallet's security-first architecture. The system is designed with multiple layers of protection to safeguard user assets in all scenarios.

## Architecture Layers

### 1. Authentication Layer

#### PIN Authentication
- **Implementation**: 4-6 digit numeric PIN
- **Storage**: PIN never stored; used as encryption key via PBKDF2
- **Rate Limiting**: Maximum 3 failed attempts before automatic lock
- **Attack Mitigation**:
  - Brute force: Auto-lock after 3 attempts
  - Timing attacks: Constant-time comparison in crypto operations

#### Biometric Authentication (WebAuthn)
- **Implementation**: Web Authentication API (WebAuthn)
- **Platform Support**:
  - iOS: Face ID / Touch ID
  - Android: Fingerprint / Face Unlock
  - Windows: Windows Hello
  - macOS: Touch ID
- **Security**: Platform authenticator with user verification required
- **Fallback**: Always requires PIN as backup authentication
- **Storage**: Public key only (credential) stored locally

#### Hardware Wallet Support
- **Ledger Integration**: Via USB (Web USB API)
- **Trezor Integration**: Via USB (Web USB API)
- **Security Benefits**:
  - Private keys never leave hardware device
  - Transaction signing on device
  - Address verification on device screen
- **User Flow**:
  1. Connect hardware wallet via USB
  2. Unlock device with PIN
  3. Verify address/transaction on device
  4. Sign on device
  5. Return signed transaction to app

### 2. Encryption Layer

#### Key Derivation
```
PIN/Password → PBKDF2(10000 iterations, random salt) → AES-256 Key
```

**Parameters**:
- Algorithm: PBKDF2-SHA256
- Iterations: 10,000 (balance security vs. performance)
- Salt: 128-bit random per encryption
- Key Size: 256 bits

#### Encryption Algorithm
- **Algorithm**: AES-256
- **Mode**: Simulated GCM (via CryptoJS AES)
- **Implementation**: crypto-js library
- **Data Encrypted**:
  - Wallet mnemonics (12-word seed phrases)
  - Private keys (when cached)
  - Decoy configuration
  - Backup data
  - Recovery shards

#### Memory Protection
- **Sensitive Data**: Overwritten with zeros before deletion
- **GC Protection**: Best-effort memory clearing
- **Limitations**: JavaScript GC makes complete memory wiping challenging

### 3. Storage Layer

#### Local Storage Architecture
```
localStorage:
├── wonderwallet_wallets (encrypted)
│   ├── Wallet ID
│   ├── Address (public, safe to store)
│   └── Encrypted Mnemonic (AES-256)
├── wonderwallet_active_wallet (ID only)
├── wonderwallet_settings (preferences)
├── wonderwallet_decoy_config (encrypted with main PIN)
├── wonderwallet_security_events (audit log)
├── wonderwallet_recovery_config (guardian system)
└── wonderwallet_biometric_credential (public key only)
```

#### Data Classification
- **Public**: Addresses, wallet names, settings
- **Encrypted**: Mnemonics, private keys, decoy config
- **Never Stored**: Raw PINs, unencrypted seeds

### 4. Decoy & Duress Layer

#### Decoy Wallet System
**Architecture**:
```
Main PIN → Main Wallet (real funds)
Decoy PIN 1 → Decoy Wallet 1 (small amount)
Decoy PIN 2 → Decoy Wallet 2 (small amount)
...
Duress PIN → Decoy Wallet (minimal funds) + ALERT
```

**Security Properties**:
- All wallets appear identical in UI
- No visible indicators of main wallet
- Each wallet has independent PIN
- Main wallet identifier encrypted separately
- Duress detection triggers silent alerts

**Duress Mode Flow**:
1. User enters duress PIN
2. System detects duress configuration
3. Opens designated decoy wallet (appears normal)
4. **Silently**:
   - Triggers geolocation tracking
   - Sends alerts to emergency contacts
   - Logs event with timestamp
   - May record device information

### 5. Air-Gap & Offline Layer

#### Cold Wallet Architecture
**Setup**:
1. Install app on offline device (old phone, dedicated device)
2. Generate wallet completely offline
3. Never connect device to network

**Transaction Flow**:
```
Online Device                    Offline Device
─────────────                    ──────────────
1. Prepare TX
2. Generate QR → 
                                → 3. Scan QR
                                → 4. Sign TX
                                ← 5. Generate QR
← 6. Scan QR
7. Broadcast TX
```

**QR Code Format**:
```json
{
  "type": "unsigned-tx|signed-tx|address|wallet-export",
  "data": "<encrypted_or_serialized_data>",
  "timestamp": 1234567890,
  "version": "1.0"
}
```

**Security Benefits**:
- Private keys never exposed to network
- Immune to network attacks
- Secure even on compromised online device
- Physical isolation of signing keys

### 6. Backup & Recovery Layer

#### Cloud Backup (Opt-In)
**Encryption Flow**:
```
Wallet Data → JSON → Checksum → Encrypt(Master Password) → Cloud
```

**Security**:
- End-to-end encryption
- Master password never sent to cloud
- Separate from PIN (longer, stronger)
- Integrity verified via SHA-256 checksum
- Multiple backup versions

**Backup Structure**:
```json
{
  "version": "1.0",
  "data": "<AES-256 encrypted blob>",
  "salt": "<random salt>",
  "timestamp": 1234567890
}
```

#### Guardian Recovery System
**Architecture**: M-of-N Shamir's Secret Sharing
- Example: 3-of-5 guardians required
- No single guardian can recover wallet
- All guardians together cannot recover without threshold

**Recovery Flow**:
```
1. User initiates recovery request
2. System notifies all guardians
3. Each guardian approves independently
4. When M approvals reached:
   - Time delay begins (48 hours default)
   - User notified
5. After delay:
   - Recovery shards combined
   - Wallet reconstructed
   - New PIN set
```

**Security Properties**:
- Time delay prevents unauthorized recovery
- User alerted immediately
- Can cancel before delay expires
- Requires multiple trusted parties
- Guardians never see seed phrase

### 7. Alert & Monitoring Layer

#### Security Event Types
| Event | Severity | Alert Method |
|-------|----------|--------------|
| Login | Low | Log only |
| Failed Auth | Medium | Log + notification after 3 |
| New Device | Medium | Email/SMS/Push |
| Duress Activated | Critical | All methods + emergency contacts |
| Recovery Initiated | Critical | All methods |
| Large Transaction | High | Push notification |

#### Alert Channels
- **Email**: Via configured email address
- **SMS**: Via configured phone number
- **Push**: Browser/device notifications
- **Emergency Contacts**: Multiple trusted contacts

#### Device Tracking
- **Device ID**: Hash of user agent + timestamp
- **Known Devices**: Whitelist of recognized devices
- **New Device Alert**: Triggered on first access from new device
- **Location**: Optional geolocation tracking

### 8. Network Security

#### HTTPS Requirements
- **Production**: HTTPS mandatory (Web Crypto API requirement)
- **Certificate Pinning**: Planned for mobile app version
- **API Security**: All external calls over TLS 1.2+

#### RPC Provider Security
- **Default**: Public Ethereum RPC endpoints
- **Recommended**: User-provided Infura/Alchemy keys
- **Fallback**: Multiple RPC providers for redundancy

## Threat Mitigation Matrix

| Threat | Mitigation | Layer |
|--------|-----------|-------|
| Malware on device | Encryption at rest, PIN required | Encryption |
| Physical theft | Auto-lock, duress mode | Authentication |
| $5 wrench attack | Duress PIN, decoy wallets | Decoy |
| Phishing | Local-only keys, no server auth | Architecture |
| Man-in-the-middle | Local signing, HTTPS | Network |
| Brute force PIN | Rate limiting, auto-lock | Authentication |
| Lost device | Guardian recovery, cloud backup | Recovery |
| Forgotten PIN | Guardian recovery, backup restore | Recovery |
| Compromised network | Offline/air-gap mode | Air-gap |
| Insider threat (guardians) | M-of-N threshold, time delays | Recovery |
| Device compromise | Hardware wallet, air-gap | Hardware |

## Security Best Practices

### For Maximum Security
1. **Use Hardware Wallet**: For large holdings
2. **Air-Gap Device**: For cold storage
3. **Multiple Backups**: Different physical locations
4. **Guardian Recovery**: 3-5 trusted guardians
5. **Test Recovery**: Verify with small amounts
6. **Regular Audits**: Review security events weekly

### For Daily Use
1. **Enable Biometric**: Reduce PIN exposure
2. **Auto-Lock**: Set short timeout (2-5 min)
3. **Unique PIN**: Not used elsewhere
4. **Decoy System**: Set up with small amounts
5. **Cloud Backup**: Enable with strong master password
6. **Alerts**: Configure email/SMS notifications

### For Developers
1. **Code Review**: All security-critical code
2. **Dependency Audits**: Regular npm audit
3. **No Secrets**: Never commit keys/seeds
4. **Input Validation**: All user inputs
5. **Error Handling**: No sensitive data in errors
6. **Secure Random**: Use crypto.getRandomValues
7. **Memory Management**: Clear sensitive data

## Audit Trail

All security events are logged with:
- Event type and severity
- Timestamp
- Device information
- Action taken
- User acknowledgment status

**Retention**: 30 days (configurable)
**Storage**: Encrypted in local storage
**Access**: Requires authentication

## Future Enhancements

### Planned (v2.0)
- [ ] Multi-signature wallets
- [ ] Time-locked transactions
- [ ] Hierarchical deterministic (HD) wallets
- [ ] Multiple account support
- [ ] Advanced key derivation paths

### Researching
- [ ] Zero-knowledge proofs
- [ ] Threshold signatures
- [ ] Secure enclave support (mobile)
- [ ] Formal verification of cryptographic code
- [ ] Hardware security module (HSM) integration

## References

- **BIP39**: Mnemonic code for generating deterministic keys
- **BIP44**: Multi-account hierarchy for deterministic wallets
- **WebAuthn**: W3C Web Authentication standard
- **AES-256**: Advanced Encryption Standard
- **PBKDF2**: Password-Based Key Derivation Function 2
- **Shamir's Secret Sharing**: Threshold secret sharing scheme

## Compliance

### Privacy
- **No Data Collection**: No analytics, no tracking
- **Local-First**: All data stays on device
- **User Control**: Complete control over data

### Regulations
- **GDPR**: Compliant (no data collection)
- **CCPA**: Compliant (no data collection)
- **Financial**: Not a custodial wallet (no license required)

---

**Version**: 1.0
**Last Updated**: December 29, 2024
**Author**: WonderWallet Security Team
