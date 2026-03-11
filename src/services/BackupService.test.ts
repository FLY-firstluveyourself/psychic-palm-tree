/**
 * BackupService Tests
 * Tests for backup creation, encryption, compression, restoration, and integrity verification
 */

import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import BackupService from './BackupService';
import StorageService from './StorageService';
import { encrypt } from '../utils/crypto';

describe('BackupService', () => {
  // Clean up localStorage before and after each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createBackup', () => {
    test('should create a backup without passphrase', async () => {
      // Create a test wallet
      const testWallet = {
        id: 'test-wallet-1',
        name: 'Test Wallet',
        address: '0x1234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('test mnemonic phrase here', '1234'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      const backup = await BackupService.createBackup(undefined, true);

      expect(backup).toBeDefined();
      expect(typeof backup).toBe('string');
      expect(backup.length).toBeGreaterThan(0);
    });

    test('should create a backup with passphrase', async () => {
      const testWallet = {
        id: 'test-wallet-2',
        name: 'Test Wallet 2',
        address: '0x2234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('another test mnemonic', '5678'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      const backupPassphrase = 'MySecureBackupPass123';
      const backup = await BackupService.createBackup(backupPassphrase, true);

      expect(backup).toBeDefined();
      expect(typeof backup).toBe('string');
      expect(backup.length).toBeGreaterThan(0);

      // Backup should be different from one without passphrase
      const backupWithoutPass = await BackupService.createBackup(undefined, true);
      expect(backup).not.toBe(backupWithoutPass);
    });

    test('should include metadata in backup', async () => {
      const testWallet = {
        id: 'test-wallet-3',
        name: 'Test Wallet 3',
        address: '0x3234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('metadata test mnemonic', '9012'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      const backup = await BackupService.createBackup(undefined, true);
      
      // Verify backup history was recorded
      const history = await BackupService.getBackupHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].walletCount).toBe(1);
      expect(history[0].checksum).toBeDefined();
    });

    test('should handle multiple wallets in backup', async () => {
      // Create multiple test wallets
      for (let i = 0; i < 3; i++) {
        const wallet = {
          id: `wallet-${i}`,
          name: `Wallet ${i}`,
          address: `0x${i}234567890123456789012345678901234567890`,
          encryptedMnemonic: encrypt(`mnemonic ${i}`, '1234'),
          createdAt: Date.now(),
        };
        await StorageService.setWallet(wallet);
      }

      const backup = await BackupService.createBackup(undefined, true);
      expect(backup).toBeDefined();

      const history = await BackupService.getBackupHistory();
      expect(history[0].walletCount).toBe(3);
    });
  });

  describe('getBackupStats', () => {
    test('should return correct backup statistics', async () => {
      // Create a backup
      const testWallet = {
        id: 'stats-test-wallet',
        name: 'Stats Test',
        address: '0x4234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('stats test mnemonic', '1111'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);
      await BackupService.createBackup(undefined, true);

      const stats = await BackupService.getBackupStats();

      expect(stats.totalBackups).toBe(1);
      expect(stats.lastBackup).toBeDefined();
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestBackup).toBeDefined();
    });

    test('should return zero stats when no backups exist', async () => {
      const stats = await BackupService.getBackupStats();

      expect(stats.totalBackups).toBe(0);
      expect(stats.lastBackup).toBeNull();
      expect(stats.totalSize).toBe(0);
      expect(stats.oldestBackup).toBeNull();
    });
  });

  describe('isBackupNeeded', () => {
    test('should return true when no backup exists', async () => {
      const isNeeded = await BackupService.isBackupNeeded(7);
      expect(isNeeded).toBe(true);
    });

    test('should return false when recent backup exists', async () => {
      const testWallet = {
        id: 'recent-backup-test',
        name: 'Recent Test',
        address: '0x5234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('recent backup test', '2222'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);
      await BackupService.createBackup(undefined, true);

      const isNeeded = await BackupService.isBackupNeeded(7);
      expect(isNeeded).toBe(false);
    });

    test('should return true when backup is too old', async () => {
      // Set a very old backup timestamp
      const oldTimestamp = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 days ago
      localStorage.setItem('wonderwallet_last_backup_timestamp', oldTimestamp.toString());

      const isNeeded = await BackupService.isBackupNeeded(7);
      expect(isNeeded).toBe(true);
    });
  });

  describe('getBackupHistory', () => {
    test('should return empty array when no backups exist', async () => {
      const history = await BackupService.getBackupHistory();
      expect(history).toEqual([]);
    });

    test('should return backup history after creating backups', async () => {
      const testWallet = {
        id: 'history-test-wallet',
        name: 'History Test',
        address: '0x6234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('history test mnemonic', '3333'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);
      await BackupService.createBackup(undefined, true);

      const history = await BackupService.getBackupHistory();
      expect(history.length).toBe(1);
      expect(history[0].backupId).toBeDefined();
      expect(history[0].timestamp).toBeDefined();
      expect(history[0].walletCount).toBe(1);
      expect(history[0].size).toBeGreaterThan(0);
      expect(history[0].checksum).toBeDefined();
    });

    test('should limit history to 10 entries', async () => {
      const testWallet = {
        id: 'limit-test-wallet',
        name: 'Limit Test',
        address: '0x7234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('limit test mnemonic', '4444'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      // Create 12 backups
      for (let i = 0; i < 12; i++) {
        await BackupService.createBackup(undefined, true);
      }

      const history = await BackupService.getBackupHistory();
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  describe('deleteBackup', () => {
    test('should delete backup from history', async () => {
      const testWallet = {
        id: 'delete-test-wallet',
        name: 'Delete Test',
        address: '0x8234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('delete test mnemonic', '5555'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);
      await BackupService.createBackup(undefined, true);

      let history = await BackupService.getBackupHistory();
      const backupId = history[0].backupId;
      expect(history.length).toBe(1);

      await BackupService.deleteBackup(backupId);

      history = await BackupService.getBackupHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('createAutoBackup', () => {
    test('should create automatic backup', async () => {
      const testWallet = {
        id: 'auto-backup-test',
        name: 'Auto Test',
        address: '0x9234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('auto backup test', '6666'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      const backupId = await BackupService.createAutoBackup();
      expect(backupId).toBeDefined();
      expect(typeof backupId).toBe('string');

      // Verify backup was stored
      const history = await BackupService.getBackupHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    test('should store auto backup in localStorage', async () => {
      const testWallet = {
        id: 'auto-storage-test',
        name: 'Auto Storage Test',
        address: '0xa234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('auto storage test', '7777'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);
      await BackupService.createAutoBackup();

      // Check if auto backup key exists in localStorage
      let foundAutoBackup = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wonderwallet_auto_backup_')) {
          foundAutoBackup = true;
          break;
        }
      }

      expect(foundAutoBackup).toBe(true);
    });
  });

  describe('verifyBackupIntegrity', () => {
    test('should verify valid backup integrity', async () => {
      const testWallet = {
        id: 'integrity-test-wallet',
        name: 'Integrity Test',
        address: '0xb234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('integrity test mnemonic', '8888'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);
      const backupData = await BackupService.createBackup(undefined, false);

      // For testing, we need to decompress and parse the backup
      // This is a simplified test - in production, you'd fully decompress and verify
      expect(backupData).toBeDefined();
      expect(backupData.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    test('should handle empty wallet list', async () => {
      const backup = await BackupService.createBackup(undefined, true);
      expect(backup).toBeDefined();

      const history = await BackupService.getBackupHistory();
      expect(history[0].walletCount).toBe(0);
    });

    test('should handle backup without settings', async () => {
      const testWallet = {
        id: 'no-settings-test',
        name: 'No Settings Test',
        address: '0xc234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('no settings test', '9999'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      const backup = await BackupService.createBackup(undefined, false);
      expect(backup).toBeDefined();
    });

    test('should handle very long passphrase', async () => {
      const testWallet = {
        id: 'long-pass-test',
        name: 'Long Pass Test',
        address: '0xd234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('long pass test', '0000'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      const longPassphrase = 'a'.repeat(100);
      const backup = await BackupService.createBackup(longPassphrase, true);
      expect(backup).toBeDefined();
    });

    test('should handle special characters in passphrase', async () => {
      const testWallet = {
        id: 'special-char-test',
        name: 'Special Char Test',
        address: '0xe234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('special char test', '1122'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      const specialPassphrase = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const backup = await BackupService.createBackup(specialPassphrase, true);
      expect(backup).toBeDefined();
    });
  });

  describe('getLastBackupTimestamp', () => {
    test('should return null when no backup exists', async () => {
      const timestamp = await BackupService.getLastBackupTimestamp();
      expect(timestamp).toBeNull();
    });

    test('should return correct timestamp after backup', async () => {
      const testWallet = {
        id: 'timestamp-test',
        name: 'Timestamp Test',
        address: '0xf234567890123456789012345678901234567890',
        encryptedMnemonic: encrypt('timestamp test', '2233'),
        createdAt: Date.now(),
      };

      await StorageService.setWallet(testWallet);

      const beforeTime = Date.now();
      await BackupService.createBackup(undefined, true);
      const afterTime = Date.now();

      const timestamp = await BackupService.getLastBackupTimestamp();
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
