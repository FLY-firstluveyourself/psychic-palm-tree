/**
 * SecurityService - Handles authentication and security features
 */

import { encrypt, decrypt, hashData } from '../utils/crypto';
import { validatePIN } from '../utils/validation';
import StorageService from './StorageService';

const MAX_FAILED_ATTEMPTS = 3;

export interface AuthResult {
  success: boolean;
  walletId?: string;
  isDuress?: boolean;
  message?: string;
}

class SecurityService {
  /**
   * Authenticate user with PIN
   * @param pin - User's PIN
   * @param walletId - Specific wallet to authenticate against
   */
  async authenticateWithPIN(pin: string, walletId?: string): Promise<AuthResult> {
    if (!validatePIN(pin)) {
      return { success: false, message: 'Invalid PIN format' };
    }

    // Check if app is locked
    const isLocked = await StorageService.isAppLocked();
    if (isLocked) {
      return { success: false, message: 'App is locked due to too many failed attempts' };
    }

    try {
      const wallets = await StorageService.getAllWallets();
      
      if (wallets.length === 0) {
        return { success: false, message: 'No wallets found' };
      }

      // If walletId specified, authenticate against that wallet
      if (walletId) {
        const wallet = wallets.find((w) => w.id === walletId);
        if (!wallet) {
          return { success: false, message: 'Wallet not found' };
        }

        try {
          // Try to decrypt the mnemonic with the provided PIN
          decrypt(wallet.encryptedMnemonic, pin);
          await StorageService.resetFailedAttempts();
          await StorageService.setActiveWalletId(wallet.id);
          return { success: true, walletId: wallet.id };
        } catch (error) {
          await this.handleFailedAttempt();
          return { success: false, message: 'Incorrect PIN' };
        }
      }

      // Try to find a wallet that matches this PIN
      for (const wallet of wallets) {
        try {
          decrypt(wallet.encryptedMnemonic, pin);
          await StorageService.resetFailedAttempts();
          await StorageService.setActiveWalletId(wallet.id);
          
          // Record device access
          await StorageService.recordDeviceAccess();
          
          // Check if this is a duress PIN (in a real implementation, we'd store duress flags)
          const isDuress = false; // Placeholder for duress detection
          
          return { success: true, walletId: wallet.id, isDuress };
        } catch (error) {
          // Try next wallet
          continue;
        }
      }

      // No wallet matched
      await this.handleFailedAttempt();
      return { success: false, message: 'Incorrect PIN' };
    } catch (error) {
      console.error('Authentication error');
      return { success: false, message: 'Authentication failed' };
    }
  }

  /**
   * Handle failed authentication attempt
   */
  private async handleFailedAttempt(): Promise<void> {
    const failedAttempts = await StorageService.incrementFailedAttempts();
    
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await StorageService.lockApp();
      console.warn('App locked due to too many failed attempts');
    }
  }

  /**
   * Verify PIN matches wallet
   */
  async verifyPIN(pin: string, walletId: string): Promise<boolean> {
    try {
      const wallet = await StorageService.getWallet(walletId);
      if (!wallet) return false;

      // Try to decrypt - if successful, PIN is correct
      decrypt(wallet.encryptedMnemonic, pin);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change wallet PIN
   */
  async changePIN(walletId: string, oldPIN: string, newPIN: string): Promise<boolean> {
    if (!validatePIN(newPIN)) {
      throw new Error('Invalid new PIN format');
    }

    try {
      const wallet = await StorageService.getWallet(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Decrypt with old PIN
      const mnemonic = decrypt(wallet.encryptedMnemonic, oldPIN);

      // Re-encrypt with new PIN
      const encryptedMnemonic = encrypt(mnemonic, newPIN);

      // Update wallet
      await StorageService.setWallet({
        ...wallet,
        encryptedMnemonic,
      });

      return true;
    } catch (error) {
      console.error('Failed to change PIN');
      throw new Error('Failed to change PIN - verify old PIN is correct');
    }
  }

  /**
   * Generate PIN hash for comparison (without revealing actual PIN)
   */
  generatePINHash(pin: string): string {
    return hashData(pin);
  }

  /**
   * Check if biometric authentication is available (Web API)
   * Note: This uses WebAuthn API which may not be available in all browsers
   */
  async isBiometricAvailable(): Promise<boolean> {
    // Check if Web Authentication API is available
    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  /**
   * Unlock app after lockout (requires manual intervention)
   */
  async unlockApp(): Promise<void> {
    await StorageService.unlockApp();
  }

  /**
   * Get remaining attempts before lockout
   */
  async getRemainingAttempts(): Promise<number> {
    const failed = await StorageService.getFailedAttempts();
    return Math.max(0, MAX_FAILED_ATTEMPTS - failed);
  }
}

export default new SecurityService();
