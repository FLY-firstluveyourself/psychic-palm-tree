# WonderWallet Backup System Documentation

## Overview

The WonderWallet Backup System provides a comprehensive, secure, and user-friendly solution for backing up and restoring wallet data. It implements a zero-knowledge, non-custodial architecture with compression, encryption, and integrity verification.

## Architecture

### Core Components

1. **BackupService** (`src/services/BackupService.ts`)
   - Core backup and restore logic
   - Compression using pako (gzip)
   - AES-256 encryption with PBKDF2
   - Backup metadata management
   - Integrity verification

2. **BackupScreen** (`src/screens/BackupScreen.jsx`)
   - User interface for creating backups
   - Backup status dashboard
   - History management
   - Security tips

3. **RestoreFromBackupScreen** (`src/screens/RestoreFromBackupScreen.jsx`)
   - Restore wizard interface
   - File upload and validation
   - Conflict resolution
   - Progress tracking

## Features

### 1. Backup Creation

#### Standard Features
- **Compression**: All backups are compressed using gzip for optimal size
- **Encryption**: AES-256 encryption with PBKDF2 key derivation
- **Metadata**: Version, timestamp, wallet count, checksum included
- **Automatic**: Optional automatic backup scheduling

#### Backup Types

**Quick Backup**
- Fast, one-click backup
- No additional passphrase required
- Encrypted with wallet PIN
- Suitable for frequent backups

**Secure Backup**
- Optional separate backup passphrase
- Additional layer of security
- Recommended for long-term storage
- Can include/exclude app settings

### 2. Backup File Format

Backup files use the `.wbk` extension (WonderWallet Backup) and contain:

```typescript
interface BackupData {
  metadata: {
    version: string;           // Backup format version (e.g., "1.0.0")
    timestamp: number;          // Unix timestamp of backup creation
    walletCount: number;        // Number of wallets in backup
    compressed: boolean;        // Whether data is compressed
    checksum: string;          // SHA-256 checksum for integrity
    backupId: string;          // Unique backup identifier
  };
  wallets: StoredWallet[];     // Array of encrypted wallet data
  settings: AppSettings;        // App settings (optional)
  encryptedPayload?: string;   // When using backup passphrase
}
```

### 3. Encryption Strategy

#### Multi-Layer Encryption

1. **Wallet Layer**: Each wallet's mnemonic is encrypted with its PIN
2. **Backup Layer** (optional): Entire backup encrypted with backup passphrase
3. **Transport Layer**: HTTPS for cloud storage (future feature)

#### Key Derivation
- **Algorithm**: PBKDF2
- **Iterations**: 10,000
- **Salt**: Random 128-bit per encryption
- **Output**: 256-bit key

### 4. Compression

- **Algorithm**: gzip (via pako library)
- **Compression Ratio**: Typically 60-70% size reduction
- **Performance**: Fast compression/decompression
- **Format**: Industry-standard gzip format

### 5. Backup Storage

#### Local Storage
- Automatic backups stored in localStorage
- Limited to last 3 automatic backups
- Cleanup of old backups automatic

#### Exported Files
- User downloads `.wbk` file
- Can be stored anywhere (USB, cloud, etc.)
- User maintains full control
- No server-side storage

### 6. Restore Process

#### Steps

1. **File Upload**
   - User selects `.wbk` backup file
   - File validation performed
   - Metadata extracted and displayed

2. **Verification**
   - Checksum verification
   - Version compatibility check
   - Backup passphrase entry (if required)

3. **Conflict Resolution**
   - Three strategies available:
     - **Skip**: Keep existing wallets, add only new ones
     - **Replace**: Replace existing wallets with backup versions
     - **Merge**: Keep all wallets from both sources

4. **PIN Setup**
   - User sets new PIN for device
   - Wallets re-encrypted with new PIN
   - Original backup data preserved

5. **Completion**
   - Statistics displayed (wallets restored, conflicts resolved)
   - User redirected to dashboard

### 7. Integrity Verification

#### Checksum Validation
```typescript
// Process for checksum generation
1. Create backup data structure (without checksum)
2. Convert to JSON
3. Compress with gzip
4. Convert to base64
5. Calculate SHA-256 hash
6. Store as checksum in metadata

// Process for verification
1. Extract backup data
2. Remove existing checksum
3. Repeat steps 2-5 above
4. Compare calculated hash with stored checksum
```

#### Version Compatibility
- Major version must match current version
- Future versions will include migration logic
- Incompatible backups rejected with clear error

### 8. Backup History

#### Tracking
- Last 10 backups tracked
- Information stored per backup:
  - Backup ID (unique identifier)
  - Timestamp (creation time)
  - Wallet count
  - File size
  - Checksum
  - Location (local/exported)

#### Statistics
- Total number of backups
- Last backup timestamp
- Total storage used
- Oldest backup age

### 9. Security Features

#### Zero-Knowledge Architecture
- All encryption happens client-side
- No plaintext data ever leaves the device
- No server-side storage of sensitive data
- User controls all encryption keys

#### Non-Custodial
- User owns and controls all keys
- No third-party can access wallet data
- No backdoors or recovery mechanisms
- Complete user sovereignty

#### Best Practices Enforced
- Minimum 8-character backup passphrase
- PIN validation (4-6 digits)
- Secure random generation for IDs
- Memory wiping of sensitive data

### 10. User Experience

#### Dashboard Integration
- Backup status indicator
- "Backup" button in quick actions
- Visual feedback on backup age
- Warnings when backup is stale (>7 days)

#### Settings Integration
- Backup & Recovery section
- Quick access to backup/restore
- Information notices
- Best practices tips

#### Backup Manager
- Comprehensive backup dashboard
- Backup history view
- One-click actions
- Security guidelines

## API Reference

### BackupService Methods

#### `createBackup(backupPassphrase?, includeSettings?): Promise<string>`
Creates a new encrypted backup.

**Parameters:**
- `backupPassphrase` (optional): Additional passphrase for backup encryption
- `includeSettings` (optional): Whether to include app settings (default: true)

**Returns:** Encrypted backup data as string

**Example:**
```typescript
const backup = await BackupService.createBackup('MySecurePass123', true);
```

#### `exportBackup(backupPassphrase?, filename?): Promise<void>`
Exports backup as downloadable file.

**Parameters:**
- `backupPassphrase` (optional): Backup passphrase
- `filename` (optional): Custom filename (default: auto-generated with timestamp)

**Example:**
```typescript
await BackupService.exportBackup('MySecurePass123', 'my-wallet-backup.wbk');
```

#### `restoreFromBackup(backupData, backupPassphrase, userPIN, mergeStrategy): Promise<RestoreResult>`
Restores wallets from backup data.

**Parameters:**
- `backupData`: Encrypted backup string
- `backupPassphrase`: Passphrase used to encrypt backup (if any)
- `userPIN`: User's new PIN for this device
- `mergeStrategy`: How to handle conflicts ('skip', 'replace', 'merge')

**Returns:** RestoreResult with statistics

**Example:**
```typescript
const result = await BackupService.restoreFromBackup(
  backupData,
  'MySecurePass123',
  '1234',
  'skip'
);
console.log(`Restored ${result.walletsRestored} wallets`);
```

#### `restoreFromFile(file, backupPassphrase, userPIN, mergeStrategy): Promise<RestoreResult>`
Restores wallets from backup file.

**Parameters:**
- `file`: File object from file input
- `backupPassphrase`: Backup passphrase (if any)
- `userPIN`: User's new PIN
- `mergeStrategy`: Conflict resolution strategy

**Example:**
```typescript
const result = await BackupService.restoreFromFile(
  selectedFile,
  'MySecurePass123',
  '5678',
  'merge'
);
```

#### `verifyBackupIntegrity(backup): Promise<boolean>`
Verifies backup integrity using checksum.

**Parameters:**
- `backup`: BackupData object to verify

**Returns:** True if backup is valid

#### `getBackupHistory(): Promise<BackupInfo[]>`
Gets history of recent backups.

**Returns:** Array of backup information

#### `getBackupStats(): Promise<BackupStats>`
Gets backup statistics.

**Returns:** Statistics object with totals and last backup info

#### `isBackupNeeded(maxAgeDays?): Promise<boolean>`
Checks if new backup is recommended.

**Parameters:**
- `maxAgeDays`: Maximum age in days (default: 7)

**Returns:** True if backup is needed

#### `createAutoBackup(backupPassphrase?): Promise<string | null>`
Creates automatic backup in localStorage.

**Parameters:**
- `backupPassphrase` (optional): Backup passphrase

**Returns:** Backup ID or null if failed

#### `deleteBackup(backupId): Promise<void>`
Deletes backup from history.

**Parameters:**
- `backupId`: ID of backup to delete

#### `reEncryptBackup(oldBackupData, oldPassphrase, newPassphrase): Promise<string>`
Re-encrypts backup with new passphrase.

**Parameters:**
- `oldBackupData`: Existing backup data
- `oldPassphrase`: Old passphrase (if any)
- `newPassphrase`: New passphrase

**Returns:** Re-encrypted backup data

## Usage Examples

### Creating a Basic Backup

```typescript
import BackupService from './services/BackupService';

// Create and download backup
async function createBackup() {
  try {
    await BackupService.exportBackup();
    console.log('Backup created successfully!');
  } catch (error) {
    console.error('Backup failed:', error);
  }
}
```

### Creating a Secure Backup with Passphrase

```typescript
async function createSecureBackup() {
  const passphrase = 'MyVerySecureBackupPassphrase123!';
  
  try {
    await BackupService.exportBackup(passphrase);
    console.log('Secure backup created!');
    console.log('Remember your passphrase - it cannot be recovered!');
  } catch (error) {
    console.error('Backup failed:', error);
  }
}
```

### Restoring from Backup File

```typescript
async function restoreBackup(file, passphrase) {
  try {
    const result = await BackupService.restoreFromFile(
      file,
      passphrase,
      '1234', // New PIN
      'skip'  // Skip existing wallets
    );
    
    if (result.success) {
      console.log(`Successfully restored ${result.walletsRestored} wallets`);
      if (result.conflictsResolved > 0) {
        console.log(`${result.conflictsResolved} conflicts were handled`);
      }
    } else {
      console.error('Restore failed:', result.errors);
    }
  } catch (error) {
    console.error('Restore error:', error);
  }
}
```

### Checking Backup Status

```typescript
async function checkBackupStatus() {
  const stats = await BackupService.getBackupStats();
  const isNeeded = await BackupService.isBackupNeeded(7);
  
  console.log(`Total backups: ${stats.totalBackups}`);
  console.log(`Last backup: ${new Date(stats.lastBackup)}`);
  console.log(`Backup needed: ${isNeeded ? 'Yes' : 'No'}`);
}
```

### Automatic Backup

```typescript
async function setupAutoBackup() {
  // Check if backup is needed
  const isNeeded = await BackupService.isBackupNeeded(7);
  
  if (isNeeded) {
    const backupId = await BackupService.createAutoBackup();
    if (backupId) {
      console.log('Automatic backup created:', backupId);
    }
  }
}

// Run automatically every day
setInterval(setupAutoBackup, 24 * 60 * 60 * 1000);
```

## Security Considerations

### Backup Passphrase
- **Recommended**: Use a strong, unique passphrase
- **Length**: Minimum 8 characters, longer is better
- **Complexity**: Mix of uppercase, lowercase, numbers, symbols
- **Storage**: Never store with the backup file itself
- **Recovery**: Passphrase cannot be recovered if lost

### File Storage
- **Local**: Keep backups on encrypted storage
- **Cloud**: Use end-to-end encrypted cloud storage only
- **USB**: Hardware encrypted USB drives recommended
- **Multiple Copies**: Store in different physical locations

### Backup Frequency
- **After wallet creation**: Always create backup
- **After adding wallets**: Backup when adding new wallets
- **Regular schedule**: At least every 7 days
- **Before updates**: Backup before app updates

### Testing Backups
- **Regular testing**: Periodically test restore process
- **Separate device**: Test on different device if possible
- **Verify data**: Confirm all wallets restored correctly
- **Keep tested backup**: Don't delete backups that tested successfully

## Troubleshooting

### Backup Creation Fails
- **Storage full**: Check available disk space
- **Permission denied**: Check browser permissions
- **Corruption**: Clear app cache and retry

### Restore Fails
- **Invalid passphrase**: Verify passphrase is correct
- **Corrupted file**: Try different backup file
- **Version mismatch**: Update app to compatible version
- **Checksum failed**: Backup file may be corrupted

### Performance Issues
- **Large backups**: Normal for many wallets
- **Slow compression**: Expected on low-end devices
- **Timeout**: Increase timeout for large datasets

## Future Enhancements

### Planned Features
- [ ] Cloud backup integration (user-controlled)
- [ ] Backup encryption with multiple passphrases
- [ ] Scheduled automatic backups
- [ ] Backup verification reminders
- [ ] Backup compression level selection
- [ ] Incremental backups
- [ ] Backup sharing with encryption
- [ ] Multi-device sync via encrypted backup

### Under Consideration
- [ ] Hardware security module integration
- [ ] Multi-signature backup restoration
- [ ] Social recovery mechanisms
- [ ] Time-locked backup access
- [ ] Quantum-resistant encryption

## Support

For issues, questions, or contributions related to the backup system:

1. Check this documentation first
2. Review the source code comments
3. Open an issue on GitHub
4. Contact the development team

## License

MIT License - Same as WonderWallet project

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: WonderWallet Team
