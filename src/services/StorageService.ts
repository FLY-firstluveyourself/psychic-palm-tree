/**
 * StorageService - Handles encrypted storage using localStorage
 * In a real React Native app, this would use react-native-keychain and AsyncStorage
 */

import { DeviceInfo, getCurrentDeviceInfo } from '../utils/device';

const STORAGE_KEYS = {
  WALLETS: 'wonderwallet_wallets',
  ACTIVE_WALLET_ID: 'wonderwallet_active_wallet',
  SETTINGS: 'wonderwallet_settings',
  FAILED_ATTEMPTS: 'wonderwallet_failed_attempts',
  IS_LOCKED: 'wonderwallet_locked',
  DEVICES: 'wonderwallet_devices',
};

export interface StoredWallet {
  id: string;
  name: string;
  address: string;
  encryptedMnemonic: string;
  isMain?: boolean; // Encrypted separately, never shown in UI
  createdAt: number;
  deviceId?: string; // Device that created/accessed this wallet
}

export interface AppSettings {
  theme: 'dark' | 'light';
  currency: 'USD' | 'EUR' | 'GBP';
  biometricEnabled: boolean;
  autoLockTimeout: number; // minutes
}

class StorageService {
  /**
   * Store encrypted wallet data
   */
  async setWallet(wallet: StoredWallet): Promise<void> {
    try {
      const wallets = await this.getAllWallets();
      const existingIndex = wallets.findIndex((w) => w.id === wallet.id);

      if (existingIndex >= 0) {
        wallets[existingIndex] = wallet;
      } else {
        wallets.push(wallet);
      }

      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    } catch (error) {
      console.error('Failed to store wallet');
      throw new Error('Storage error');
    }
  }

  /**
   * Get wallet by ID
   */
  async getWallet(id: string): Promise<StoredWallet | null> {
    try {
      const wallets = await this.getAllWallets();
      return wallets.find((w) => w.id === id) || null;
    } catch (error) {
      console.error('Failed to retrieve wallet');
      return null;
    }
  }

  /**
   * Get all wallets
   */
  async getAllWallets(): Promise<StoredWallet[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WALLETS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve wallets');
      return [];
    }
  }

  /**
   * Delete wallet by ID
   */
  async deleteWallet(id: string): Promise<void> {
    try {
      const wallets = await this.getAllWallets();
      const filtered = wallets.filter((w) => w.id !== id);
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete wallet');
      throw new Error('Storage error');
    }
  }

  /**
   * Set active wallet ID
   */
  async setActiveWalletId(id: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WALLET_ID, id);
  }

  /**
   * Get active wallet ID
   */
  async getActiveWalletId(): Promise<string | null> {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_WALLET_ID);
  }

  /**
   * Store app settings
   */
  async setSettings(settings: AppSettings): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * Get app settings
   */
  async getSettings(): Promise<AppSettings> {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data
      ? JSON.parse(data)
      : {
          theme: 'dark',
          currency: 'USD',
          biometricEnabled: false,
          autoLockTimeout: 5,
        };
  }

  /**
   * Track failed PIN attempts
   */
  async incrementFailedAttempts(): Promise<number> {
    const current = await this.getFailedAttempts();
    const newCount = current + 1;
    localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, newCount.toString());
    return newCount;
  }

  /**
   * Get failed attempts count
   */
  async getFailedAttempts(): Promise<number> {
    const data = localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    return data ? parseInt(data, 10) : 0;
  }

  /**
   * Reset failed attempts
   */
  async resetFailedAttempts(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, '0');
  }

  /**
   * Lock the app
   */
  async lockApp(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
  }

  /**
   * Unlock the app
   */
  async unlockApp(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
    await this.resetFailedAttempts();
  }

  /**
   * Check if app is locked
   */
  async isAppLocked(): Promise<boolean> {
    const locked = localStorage.getItem(STORAGE_KEYS.IS_LOCKED);
    return locked === 'true';
  }

  /**
   * Record device access for current device
   */
  async recordDeviceAccess(): Promise<void> {
    try {
      const currentDevice = getCurrentDeviceInfo();
      const devices = await this.getAllDevices();
      
      const existingIndex = devices.findIndex((d) => d.id === currentDevice.id);
      if (existingIndex >= 0) {
        devices[existingIndex] = currentDevice;
      } else {
        devices.push(currentDevice);
      }
      
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
    } catch (error) {
      console.error('Failed to record device access');
    }
  }

  /**
   * Get all registered devices
   */
  async getAllDevices(): Promise<DeviceInfo[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEVICES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve devices');
      return [];
    }
  }

  /**
   * Get current device info
   */
  async getCurrentDevice(): Promise<DeviceInfo> {
    return getCurrentDeviceInfo();
  }

  /**
   * Remove a device from the list
   */
  async removeDevice(deviceId: string): Promise<void> {
    try {
      const devices = await this.getAllDevices();
      const filtered = devices.filter((d) => d.id !== deviceId);
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove device');
      throw new Error('Storage error');
    }
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAll(): Promise<void> {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}

export default new StorageService();
