/**
 * CloudBackupService - Encrypted cloud backup (opt-in)
 * Provides secure backup to cloud storage with end-to-end encryption
 */

import { encrypt, decrypt, hashData, generateSecureRandom } from '../utils/crypto';
import StorageService from './StorageService';

export interface BackupData {
  version: string;
  wallets: any[];
  settings: any;
  timestamp: number;
  checksum: string;
}

export interface EncryptedBackup {
  data: string;
  salt: string;
  version: string;
  timestamp: number;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  message?: string;
}

class CloudBackupService {
  private readonly BACKUP_ENABLED_KEY = 'wonderwallet_backup_enabled';
  private readonly LAST_BACKUP_KEY = 'wonderwallet_last_backup';
  private readonly BACKUP_VERSION = '1.0';

  /**
   * Check if cloud backup is enabled
   */
  isBackupEnabled(): boolean {
    return localStorage.getItem(this.BACKUP_ENABLED_KEY) === 'true';
  }

  /**
   * Enable cloud backup
   */
  async enableBackup(): Promise<boolean> {
    try {
      localStorage.setItem(this.BACKUP_ENABLED_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Failed to enable cloud backup');
      return false;
    }
  }

  /**
   * Disable cloud backup
   */
  async disableBackup(): Promise<boolean> {
    try {
      localStorage.removeItem(this.BACKUP_ENABLED_KEY);
      return true;
    } catch (error) {
      console.error('Failed to disable cloud backup');
      return false;
    }
  }

  /**
   * Create encrypted backup of wallet data
   * @param masterPassword - Strong password for backup encryption (minimum 12 characters recommended)
   */
  async createBackup(masterPassword: string): Promise<EncryptedBackup> {
    try {
      if (masterPassword.length < 12) {
        throw new Error('Master password must be at least 12 characters for adequate security');
      }

      // Additional password strength validation
      const hasUpperCase = /[A-Z]/.test(masterPassword);
      const hasLowerCase = /[a-z]/.test(masterPassword);
      const hasNumbers = /\d/.test(masterPassword);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(masterPassword);
      
      const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
      
      if (strengthScore < 3) {
        console.warn('Weak master password detected. Recommend using uppercase, lowercase, numbers, and special characters.');
      }

      // Gather all wallet data
      const wallets = await StorageService.getAllWallets();
      const settings = await StorageService.getSettings();

      // Create backup data structure
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        wallets: wallets,
        settings: settings,
        timestamp: Date.now(),
        checksum: '', // Will be set after serialization
      };

      // Serialize and create checksum
      const serialized = JSON.stringify({
        ...backupData,
        checksum: '', // Exclude checksum from its own calculation
      });
      backupData.checksum = hashData(serialized);

      // Encrypt with master password
      const finalSerialized = JSON.stringify(backupData);
      const encrypted = encrypt(finalSerialized, masterPassword);

      const encryptedBackup: EncryptedBackup = {
        data: encrypted,
        salt: generateSecureRandom(16), // Additional salt for cloud storage
        version: this.BACKUP_VERSION,
        timestamp: Date.now(),
      };

      // Store backup metadata
      localStorage.setItem(this.LAST_BACKUP_KEY, JSON.stringify({
        timestamp: Date.now(),
        version: this.BACKUP_VERSION,
      }));

      return encryptedBackup;
    } catch (error) {
      console.error('Failed to create backup');
      throw new Error('Failed to create encrypted backup');
    }
  }

  /**
   * Restore from encrypted backup
   * @param encryptedBackup - Encrypted backup data
   * @param masterPassword - Master password used for encryption
   */
  async restoreBackup(
    encryptedBackup: EncryptedBackup,
    masterPassword: string
  ): Promise<BackupResult> {
    try {
      // Decrypt backup
      const decrypted = decrypt(encryptedBackup.data, masterPassword);
      const backupData: BackupData = JSON.parse(decrypted);

      // Verify version
      if (backupData.version !== this.BACKUP_VERSION) {
        return {
          success: false,
          message: `Incompatible backup version: ${backupData.version}. Current version: ${this.BACKUP_VERSION}`,
        };
      }

      // Verify checksum
      const serialized = JSON.stringify({
        ...backupData,
        checksum: '',
      });
      const expectedChecksum = hashData(serialized);
      
      if (backupData.checksum !== expectedChecksum) {
        return {
          success: false,
          message: 'Backup data corrupted - checksum mismatch',
        };
      }

      // Restore wallets
      for (const wallet of backupData.wallets) {
        await StorageService.setWallet(wallet);
      }

      // Restore settings
      await StorageService.setSettings(backupData.settings);

      // Set active wallet if available
      if (backupData.wallets.length > 0) {
        await StorageService.setActiveWalletId(backupData.wallets[0].id);
      }

      return {
        success: true,
        message: `Successfully restored ${backupData.wallets.length} wallet(s)`,
      };
    } catch (error) {
      console.error('Failed to restore backup');
      if (error instanceof Error) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Failed to restore from backup' };
    }
  }

  /**
   * Upload backup to cloud storage (placeholder - needs cloud provider integration)
   * @param backup - Encrypted backup
   * @param provider - Cloud provider ('gdrive' | 'icloud' | 'dropbox')
   */
  async uploadToCloud(
    backup: EncryptedBackup,
    provider: 'gdrive' | 'icloud' | 'dropbox'
  ): Promise<BackupResult> {
    try {
      // This is a placeholder. In production, integrate with:
      // - Google Drive API for gdrive
      // - iCloud API for icloud  
      // - Dropbox API for dropbox
      
      console.log(`Would upload backup to ${provider}`);
      console.log('Backup size:', JSON.stringify(backup).length, 'bytes');

      // Simulate successful upload
      const backupId = generateSecureRandom(16);
      
      return {
        success: true,
        backupId,
        message: `Backup uploaded to ${provider} successfully`,
      };
    } catch (error) {
      console.error('Failed to upload backup');
      return { success: false, message: 'Failed to upload backup to cloud' };
    }
  }

  /**
   * Download backup from cloud storage (placeholder)
   * @param backupId - Backup identifier
   * @param provider - Cloud provider
   */
  async downloadFromCloud(
    backupId: string,
    provider: 'gdrive' | 'icloud' | 'dropbox'
  ): Promise<EncryptedBackup | null> {
    try {
      // Placeholder - would fetch from actual cloud provider
      console.log(`Would download backup ${backupId} from ${provider}`);
      
      return null;
    } catch (error) {
      console.error('Failed to download backup');
      return null;
    }
  }

  /**
   * List available backups from cloud (placeholder)
   * @param provider - Cloud provider
   */
  async listCloudBackups(
    provider: 'gdrive' | 'icloud' | 'dropbox'
  ): Promise<Array<{ id: string; timestamp: number; size: number }>> {
    try {
      // Placeholder - would list from actual cloud provider
      console.log(`Would list backups from ${provider}`);
      
      return [];
    } catch (error) {
      console.error('Failed to list backups');
      return [];
    }
  }

  /**
   * Delete backup from cloud (placeholder)
   * @param backupId - Backup identifier
   * @param provider - Cloud provider
   */
  async deleteCloudBackup(
    backupId: string,
    provider: 'gdrive' | 'icloud' | 'dropbox'
  ): Promise<boolean> {
    try {
      // Placeholder - would delete from actual cloud provider
      console.log(`Would delete backup ${backupId} from ${provider}`);
      
      return true;
    } catch (error) {
      console.error('Failed to delete backup');
      return false;
    }
  }

  /**
   * Export backup to file (download)
   * @param backup - Encrypted backup
   */
  exportBackupToFile(backup: EncryptedBackup): void {
    try {
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `wonderwallet-backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export backup file');
      throw new Error('Failed to export backup file');
    }
  }

  /**
   * Import backup from file
   * @param file - Backup file
   */
  async importBackupFromFile(file: File): Promise<EncryptedBackup> {
    try {
      const text = await file.text();
      const backup: EncryptedBackup = JSON.parse(text);
      
      // Validate backup structure
      if (!backup.data || !backup.version || !backup.timestamp) {
        throw new Error('Invalid backup file format');
      }

      return backup;
    } catch (error) {
      console.error('Failed to import backup file');
      throw new Error('Failed to import backup file');
    }
  }

  /**
   * Get last backup info
   */
  getLastBackupInfo(): { timestamp: number; version: string } | null {
    try {
      const data = localStorage.getItem(this.LAST_BACKUP_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate backup integrity before restore
   * @param backup - Encrypted backup
   * @param masterPassword - Master password
   */
  async validateBackup(backup: EncryptedBackup, masterPassword: string): Promise<boolean> {
    try {
      const decrypted = decrypt(backup.data, masterPassword);
      const backupData: BackupData = JSON.parse(decrypted);
      
      // Verify checksum
      const serialized = JSON.stringify({
        ...backupData,
        checksum: '',
      });
      const expectedChecksum = hashData(serialized);
      
      return backupData.checksum === expectedChecksum;
    } catch (error) {
      console.error('Backup validation failed');
      return false;
    }
  }
}

export default new CloudBackupService();
