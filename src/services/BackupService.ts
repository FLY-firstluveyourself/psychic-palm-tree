/**
 * BackupService - Handles encrypted backup, compression, and restoration of wallet data
 * Implements zero-knowledge, non-custodial backup strategy with multi-factor access
 */

import pako from 'pako';
import { encrypt, decrypt, hashData, generateSecureRandom } from '../utils/crypto';
import StorageService, { StoredWallet, AppSettings } from './StorageService';

export interface BackupMetadata {
  version: string;
  timestamp: number;
  walletCount: number;
  compressed: boolean;
  checksum: string;
  backupId: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  wallets: StoredWallet[];
  settings: AppSettings;
  encryptedPayload?: string; // When using backup passphrase
}

export interface BackupInfo {
  backupId: string;
  timestamp: number;
  walletCount: number;
  size: number;
  checksum: string;
  location: 'local' | 'exported';
}

export interface RestoreResult {
  success: boolean;
  walletsRestored: number;
  conflictsResolved: number;
  errors: string[];
}

const BACKUP_VERSION = '1.0.0';
const STORAGE_KEY_BACKUP_HISTORY = 'wonderwallet_backup_history';
const STORAGE_KEY_LAST_BACKUP = 'wonderwallet_last_backup_timestamp';

class BackupService {
  /**
   * Create a compressed, encrypted backup of all wallet data
   * @param backupPassphrase - Optional separate passphrase for backup encryption (recommended)
   * @param includeSettings - Whether to include app settings in backup
   * @returns Encrypted backup data as string
   */
  async createBackup(
    backupPassphrase?: string,
    includeSettings: boolean = true
  ): Promise<string> {
    try {
      // Gather all wallet data
      const wallets = await StorageService.getAllWallets();
      const settings = includeSettings ? await StorageService.getSettings() : {
        theme: 'dark',
        currency: 'USD',
        biometricEnabled: false,
        autoLockTimeout: 5,
      } as AppSettings;

      // Create backup metadata
      const backupId = generateSecureRandom(16);
      const timestamp = Date.now();

      const backupData: BackupData = {
        metadata: {
          version: BACKUP_VERSION,
          timestamp,
          walletCount: wallets.length,
          compressed: true,
          checksum: '',
          backupId,
        },
        wallets,
        settings,
      };

      // Convert to JSON
      const jsonData = JSON.stringify(backupData);

      // Compress the data
      const compressed = pako.gzip(jsonData);

      // Convert to base64 for storage
      const base64Compressed = this.arrayBufferToBase64(compressed);

      // Calculate checksum of compressed data
      const checksum = hashData(base64Compressed);
      backupData.metadata.checksum = checksum;

      // Re-compress with checksum
      const finalJsonData = JSON.stringify(backupData);
      const finalCompressed = pako.gzip(finalJsonData);
      const finalBase64 = this.arrayBufferToBase64(finalCompressed);

      // Encrypt with backup passphrase if provided
      let finalBackup = finalBase64;
      if (backupPassphrase) {
        finalBackup = encrypt(finalBase64, backupPassphrase);
      }

      // Store backup info
      await this.recordBackupInfo({
        backupId,
        timestamp,
        walletCount: wallets.length,
        size: finalBackup.length,
        checksum,
        location: 'local',
      });

      // Update last backup timestamp
      localStorage.setItem(STORAGE_KEY_LAST_BACKUP, timestamp.toString());

      return finalBackup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Export backup as downloadable file
   * @param backupPassphrase - Optional backup passphrase
   * @param filename - Custom filename for backup
   */
  async exportBackup(
    backupPassphrase?: string,
    filename?: string
  ): Promise<void> {
    try {
      const backupData = await this.createBackup(backupPassphrase, true);
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultFilename = `wonderwallet-backup-${timestamp}.wbk`;
      const finalFilename = filename || defaultFilename;

      // Create blob and download
      const blob = new Blob([backupData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);

      // Update backup info to mark as exported
      const history = await this.getBackupHistory();
      if (history.length > 0) {
        history[0].location = 'exported';
        await this.saveBackupHistory(history);
      }
    } catch (error) {
      console.error('Failed to export backup:', error);
      throw new Error('Failed to export backup');
    }
  }

  /**
   * Restore from backup data
   * @param backupData - Encrypted backup string
   * @param backupPassphrase - Passphrase used to encrypt backup (if any)
   * @param userPIN - User's PIN (currently unused, wallets retain original encryption)
   * @param mergeStrategy - How to handle conflicts ('skip', 'replace', 'merge')
   * @returns Restore result with statistics
   * @note Wallets are restored with their original PIN encryption. Users must use
   *       their original PINs to access restored wallets. Future enhancement will
   *       support re-encrypting all wallets with a single new PIN.
   */
  async restoreFromBackup(
    backupData: string,
    backupPassphrase: string | undefined,
    userPIN: string,
    mergeStrategy: 'skip' | 'replace' | 'merge' = 'skip'
  ): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: false,
      walletsRestored: 0,
      conflictsResolved: 0,
      errors: [],
    };

    try {
      // Decrypt with backup passphrase if provided
      let decryptedData = backupData;
      if (backupPassphrase) {
        try {
          decryptedData = decrypt(backupData, backupPassphrase);
        } catch (error) {
          result.errors.push('Invalid backup passphrase');
          return result;
        }
      }

      // Decompress
      const compressedBuffer = this.base64ToArrayBuffer(decryptedData);
      const decompressed = pako.ungzip(compressedBuffer, { to: 'string' });
      
      // Parse backup data
      const backup: BackupData = JSON.parse(decompressed);

      // Verify backup version compatibility
      if (!this.isBackupVersionCompatible(backup.metadata.version)) {
        result.errors.push('Incompatible backup version');
        return result;
      }

      // Verify backup integrity
      if (!await this.verifyBackupIntegrity(backup)) {
        result.errors.push('Backup integrity check failed');
        return result;
      }

      // Get existing wallets
      const existingWallets = await StorageService.getAllWallets();
      const existingAddresses = new Set(existingWallets.map(w => w.address));

      // Restore wallets
      for (const wallet of backup.wallets) {
        try {
          const exists = existingAddresses.has(wallet.address);

          if (exists && mergeStrategy === 'skip') {
            result.conflictsResolved++;
            continue;
          }

          if (exists && mergeStrategy === 'replace') {
            // Delete existing wallet first
            await StorageService.deleteWallet(wallet.id);
            result.conflictsResolved++;
          }

          // Note: Wallets in backup are encrypted with their original PINs
          // We keep them as-is to preserve the encryption
          // Users will use their original PINs to access these wallets
          // TODO: Future enhancement - provide option to re-encrypt all wallets with single new PIN
          const walletToStore = {
            ...wallet,
          };

          await StorageService.setWallet(walletToStore);
          result.walletsRestored++;
        } catch (error) {
          result.errors.push(`Failed to restore wallet ${wallet.address}: ${error}`);
        }
      }

      // Restore settings if in merge mode
      if (mergeStrategy === 'merge' && backup.settings) {
        await StorageService.setSettings(backup.settings);
      }

      result.success = result.walletsRestored > 0;
      return result;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      result.errors.push('Failed to restore backup: ' + error);
      return result;
    }
  }

  /**
   * Restore from backup file
   * @param file - Backup file
   * @param backupPassphrase - Backup passphrase
   * @param userPIN - User's PIN
   * @param mergeStrategy - Merge strategy
   * @returns Restore result
   */
  async restoreFromFile(
    file: File,
    backupPassphrase: string | undefined,
    userPIN: string,
    mergeStrategy: 'skip' | 'replace' | 'merge' = 'skip'
  ): Promise<RestoreResult> {
    try {
      const backupData = await this.readFileAsText(file);
      return await this.restoreFromBackup(backupData, backupPassphrase, userPIN, mergeStrategy);
    } catch (error) {
      console.error('Failed to read backup file:', error);
      return {
        success: false,
        walletsRestored: 0,
        conflictsResolved: 0,
        errors: ['Failed to read backup file'],
      };
    }
  }

  /**
   * Verify backup integrity using checksum
   * @param backup - Backup data to verify
   * @returns True if backup is valid
   */
  async verifyBackupIntegrity(backup: BackupData): Promise<boolean> {
    try {
      // Create a copy without checksum
      const backupCopy = {
        ...backup,
        metadata: {
          ...backup.metadata,
          checksum: '',
        },
      };

      const jsonData = JSON.stringify(backupCopy);
      const compressed = pako.gzip(jsonData);
      const base64Compressed = this.arrayBufferToBase64(compressed);
      const calculatedChecksum = hashData(base64Compressed);

      return calculatedChecksum === backup.metadata.checksum;
    } catch (error) {
      console.error('Failed to verify backup integrity:', error);
      return false;
    }
  }

  /**
   * Get backup history
   * @returns Array of backup info
   */
  async getBackupHistory(): Promise<BackupInfo[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_BACKUP_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get backup history:', error);
      return [];
    }
  }

  /**
   * Get last backup timestamp
   * @returns Timestamp of last backup or null
   */
  async getLastBackupTimestamp(): Promise<number | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if backup is needed (based on age and changes)
   * @param maxAgeDays - Maximum age in days before backup is considered stale
   * @returns True if backup is recommended
   */
  async isBackupNeeded(maxAgeDays: number = 7): Promise<boolean> {
    const lastBackup = await this.getLastBackupTimestamp();
    
    if (!lastBackup) {
      return true; // No backup exists
    }

    const ageInDays = (Date.now() - lastBackup) / (1000 * 60 * 60 * 24);
    return ageInDays >= maxAgeDays;
  }

  /**
   * Create automatic backup (scheduled)
   * @param backupPassphrase - Optional backup passphrase
   * @returns Backup ID or null if failed
   */
  async createAutoBackup(backupPassphrase?: string): Promise<string | null> {
    try {
      const backup = await this.createBackup(backupPassphrase, true);
      
      // Store in localStorage for local backup
      const timestamp = Date.now();
      const key = `wonderwallet_auto_backup_${timestamp}`;
      localStorage.setItem(key, backup);

      // Cleanup old auto backups (keep only last 3)
      await this.cleanupOldAutoBackups(3);

      const history = await this.getBackupHistory();
      return history[0]?.backupId || null;
    } catch (error) {
      console.error('Auto backup failed:', error);
      return null;
    }
  }

  /**
   * Get backup statistics
   * @returns Backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    lastBackup: number | null;
    totalSize: number;
    oldestBackup: number | null;
  }> {
    const history = await this.getBackupHistory();
    const lastBackup = await this.getLastBackupTimestamp();

    return {
      totalBackups: history.length,
      lastBackup,
      totalSize: history.reduce((sum, b) => sum + b.size, 0),
      oldestBackup: history.length > 0 ? Math.min(...history.map(b => b.timestamp)) : null,
    };
  }

  /**
   * Delete backup by ID
   * @param backupId - Backup ID to delete
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const history = await this.getBackupHistory();
      const filtered = history.filter(b => b.backupId !== backupId);
      await this.saveBackupHistory(filtered);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw new Error('Failed to delete backup');
    }
  }

  /**
   * Re-encrypt backup with new passphrase
   * @param oldBackupData - Old backup data
   * @param oldPassphrase - Old passphrase (if any)
   * @param newPassphrase - New passphrase
   * @returns New encrypted backup
   */
  async reEncryptBackup(
    oldBackupData: string,
    oldPassphrase: string | undefined,
    newPassphrase: string
  ): Promise<string> {
    try {
      // Decrypt old backup
      let decryptedData = oldBackupData;
      if (oldPassphrase) {
        decryptedData = decrypt(oldBackupData, oldPassphrase);
      }

      // Re-encrypt with new passphrase
      return encrypt(decryptedData, newPassphrase);
    } catch (error) {
      console.error('Failed to re-encrypt backup:', error);
      throw new Error('Failed to re-encrypt backup');
    }
  }

  // Private helper methods

  private async recordBackupInfo(info: BackupInfo): Promise<void> {
    const history = await this.getBackupHistory();
    history.unshift(info); // Add to beginning
    
    // Keep only last 10 backup records
    if (history.length > 10) {
      history.splice(10);
    }

    await this.saveBackupHistory(history);
  }

  private async saveBackupHistory(history: BackupInfo[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY_BACKUP_HISTORY, JSON.stringify(history));
  }

  private async cleanupOldAutoBackups(keepCount: number = 3): Promise<void> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wonderwallet_auto_backup_')) {
          keys.push(key);
        }
      }

      // Sort by timestamp (newest first)
      keys.sort((a, b) => {
        const timeA = parseInt(a.split('_').pop() || '0', 10);
        const timeB = parseInt(b.split('_').pop() || '0', 10);
        return timeB - timeA;
      });

      // Remove old backups
      for (let i = keepCount; i < keys.length; i++) {
        localStorage.removeItem(keys[i]);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  private isBackupVersionCompatible(version: string): boolean {
    // For now, only support current version
    // In future, add migration logic for older versions
    const [major] = version.split('.').map(Number);
    const [currentMajor] = BACKUP_VERSION.split('.').map(Number);
    return major === currentMajor;
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export default new BackupService();
