/**
 * DecoyService - Manages decoy wallet system for enhanced security
 */

import WalletService from './WalletService';
import StorageService, { StoredWallet } from './StorageService';
import { encrypt } from '../utils/crypto';

export interface DecoyConfig {
  numDecoys: number; // 4-9 decoy wallets
  mainWalletId: string;
  duressPIN?: string; // Optional duress PIN
  duressWalletId?: string; // Wallet to open when duress PIN used
}

class DecoyService {
  private readonly DECOY_CONFIG_KEY = 'wonderwallet_decoy_config';

  /**
   * Create decoy wallet system
   * @param mainWalletId - ID of the main wallet
   * @param mainPIN - PIN of the main wallet
   * @param numDecoys - Number of decoy wallets to create (4-9)
   * @returns Array of created decoy wallet IDs
   */
  async createDecoySystem(
    mainWalletId: string,
    mainPIN: string,
    numDecoys: number = 5
  ): Promise<string[]> {
    if (numDecoys < 4 || numDecoys > 9) {
      throw new Error('Number of decoys must be between 4 and 9');
    }

    try {
      const decoyWalletIds: string[] = [];

      // Create decoy wallets
      for (let i = 0; i < numDecoys; i++) {
        // Generate a new wallet
        const walletData = await WalletService.generateWallet();
        
        // Generate a random PIN for this decoy (4-6 digits)
        const decoyPIN = this.generateRandomPIN();
        
        // Save decoy wallet
        await WalletService.saveWallet(
          walletData,
          decoyPIN,
          `Wallet ${i + 1}`,
          false // Not the main wallet
        );

        decoyWalletIds.push(walletData.id);
      }

      // Store decoy configuration (encrypted)
      const config: DecoyConfig = {
        numDecoys,
        mainWalletId,
      };

      // Encrypt config with main PIN
      const encryptedConfig = encrypt(JSON.stringify(config), mainPIN);
      localStorage.setItem(this.DECOY_CONFIG_KEY, encryptedConfig);

      return decoyWalletIds;
    } catch (error) {
      console.error('Failed to create decoy system');
      throw new Error('Failed to create decoy system');
    }
  }

  /**
   * Get decoy configuration
   * @param mainPIN - Main wallet PIN to decrypt config
   * @returns Decoy configuration
   */
  async getDecoyConfig(mainPIN: string): Promise<DecoyConfig | null> {
    try {
      const encryptedConfig = localStorage.getItem(this.DECOY_CONFIG_KEY);
      if (!encryptedConfig) return null;

      const { decrypt } = await import('../utils/crypto');
      const configStr = decrypt(encryptedConfig, mainPIN);
      return JSON.parse(configStr);
    } catch (error) {
      console.error('Failed to get decoy config');
      return null;
    }
  }

  /**
   * Check if a wallet is the main wallet
   * @param walletId - Wallet ID to check
   * @param mainPIN - Main wallet PIN
   * @returns True if this is the main wallet
   */
  async isMainWallet(walletId: string, mainPIN: string): Promise<boolean> {
    try {
      const config = await this.getDecoyConfig(mainPIN);
      return config?.mainWalletId === walletId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Set up duress PIN
   * @param mainPIN - Main wallet PIN
   * @param duressPIN - PIN to use for duress mode
   * @param duressWalletId - Wallet to open when duress PIN used
   */
  async setupDuressPIN(
    mainPIN: string,
    duressPIN: string,
    duressWalletId: string
  ): Promise<void> {
    try {
      const config = await this.getDecoyConfig(mainPIN);
      if (!config) {
        throw new Error('Decoy system not initialized');
      }

      config.duressPIN = duressPIN;
      config.duressWalletId = duressWalletId;

      const encryptedConfig = encrypt(JSON.stringify(config), mainPIN);
      localStorage.setItem(this.DECOY_CONFIG_KEY, encryptedConfig);
    } catch (error) {
      console.error('Failed to setup duress PIN');
      throw new Error('Failed to setup duress PIN');
    }
  }

  /**
   * Check if PIN is duress PIN
   * @param pin - PIN to check
   * @param mainPIN - Main wallet PIN
   * @returns Duress wallet ID if duress PIN, null otherwise
   */
  async checkDuressMode(pin: string, mainPIN: string): Promise<string | null> {
    try {
      const config = await this.getDecoyConfig(mainPIN);
      if (!config || !config.duressPIN) return null;

      if (pin === config.duressPIN) {
        // Log duress mode activation (in production, send alert)
        console.warn('Duress mode activated');
        return config.duressWalletId || null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all wallets with their display info (addresses only, no identification)
   * @returns Array of wallets with minimal info
   */
  async getAllWalletsAnonymous(): Promise<Array<{ id: string; address: string; name: string }>> {
    const wallets = await StorageService.getAllWallets();
    
    // Return wallets without revealing which is main
    return wallets.map((w) => ({
      id: w.id,
      address: w.address,
      name: w.name,
    }));
  }

  /**
   * Shuffle wallet order (future feature - randomize weekly)
   * @param mainPIN - Main wallet PIN
   */
  async shuffleWallets(mainPIN: string): Promise<void> {
    // Future implementation: randomly reorder wallets in storage
    // This prevents pattern recognition attacks
    console.log('Wallet shuffle not yet implemented');
  }

  /**
   * Reveal main wallet (requires biometric or special authentication)
   * @param mainPIN - Main wallet PIN
   * @returns Main wallet ID
   */
  async revealMainWallet(mainPIN: string): Promise<string | null> {
    try {
      const config = await this.getDecoyConfig(mainPIN);
      return config?.mainWalletId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate random PIN for decoy wallets
   * @returns Random 4-6 digit PIN
   */
  private generateRandomPIN(): string {
    const length = Math.floor(Math.random() * 3) + 4; // 4-6 digits
    const randomBytes = generateSecureRandom(length);
    // Convert hex to digits
    let pin = '';
    for (let i = 0; i < length && i < randomBytes.length * 2; i++) {
      const digit = parseInt(randomBytes[Math.floor(i / 2)] || '0', 16) % 10;
      pin += digit.toString();
    }
    // Ensure we have exactly the right length
    return pin.slice(0, length).padEnd(length, '0');
  }

  /**
   * Fund decoy wallet with small amount (future feature)
   * This makes decoys more convincing
   */
  async fundDecoyWallet(walletId: string, amount: string): Promise<void> {
    // Future implementation: transfer small amount to decoy
    console.log(`Would fund wallet ${walletId} with ${amount} ETH`);
  }

  /**
   * Get wallet statistics (for master view)
   * @param mainPIN - Main wallet PIN
   */
  async getWalletStats(mainPIN: string): Promise<{
    total: number;
    mainWalletId: string;
    decoyCount: number;
    hasDuressMode: boolean;
  }> {
    const wallets = await StorageService.getAllWallets();
    const config = await this.getDecoyConfig(mainPIN);

    return {
      total: wallets.length,
      mainWalletId: config?.mainWalletId || '',
      decoyCount: config?.numDecoys || 0,
      hasDuressMode: !!config?.duressPIN,
    };
  }
}

export default new DecoyService();
