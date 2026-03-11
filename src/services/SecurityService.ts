/**
 * SecurityService - Handles authentication and security features
 * Enhanced with biometric support, duress mode, and comprehensive alerting
 */

import { encrypt, decrypt, hashData } from '../utils/crypto';
import { validatePIN } from '../utils/validation';
import StorageService from './StorageService';
import BiometricService from './BiometricService';
import AlertService from './AlertService';
import DecoyService from './DecoyService';

const MAX_FAILED_ATTEMPTS = 3;

export interface AuthResult {
  success: boolean;
  walletId?: string;
  isDuress?: boolean;
  message?: string;
}

class SecurityService {
  /**
   * Authenticate user with PIN or biometric
   * @param pin - User's PIN
   * @param walletId - Specific wallet to authenticate against
   * @param useBiometric - Use biometric if available
   */
  async authenticateWithPIN(pin: string, walletId?: string, useBiometric?: boolean): Promise<AuthResult> {
    // Try biometric first if requested
    if (useBiometric && await BiometricService.isAvailable()) {
      const bioResult = await BiometricService.authenticate();
      if (bioResult.success) {
        await AlertService.logSecurityEvent('login', 'low', 'Biometric authentication successful');
        // Continue with PIN validation to unlock wallet
      }
    }

    if (!validatePIN(pin)) {
      return { success: false, message: 'Invalid PIN format' };
    }

    // Check if app is locked
    const isLocked = await StorageService.isAppLocked();
    if (isLocked) {
      await AlertService.logSecurityEvent('failed-auth', 'high', 'Authentication attempt while locked');
      return { success: false, message: 'App is locked due to too many failed attempts' };
    }

    try {
      const wallets = await StorageService.getAllWallets();
      
      if (wallets.length === 0) {
        return { success: false, message: 'No wallets found' };
      }

      // Check for duress PIN first
      const duressCheck = await this.checkDuressMode(pin);
      if (duressCheck.isDuress) {
        await AlertService.triggerDuressAlert();
        return duressCheck;
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
          await AlertService.logSecurityEvent('login', 'low', 'Successful wallet access');
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
          await AlertService.logSecurityEvent('login', 'low', 'Successful wallet access');
          
          return { success: true, walletId: wallet.id, isDuress: false };
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
      await AlertService.logSecurityEvent('failed-auth', 'medium', 'Authentication error occurred');
      return { success: false, message: 'Authentication failed' };
    }
  }

  /**
   * Handle failed authentication attempt
   */
  private async handleFailedAttempt(): Promise<void> {
    const failedAttempts = await StorageService.incrementFailedAttempts();
    
    await AlertService.logSecurityEvent(
      'failed-auth',
      'medium',
      `Failed authentication attempt (${failedAttempts}/${MAX_FAILED_ATTEMPTS})`
    );
    
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await StorageService.lockApp();
      await AlertService.logSecurityEvent(
        'failed-auth',
        'critical',
        'App locked due to too many failed attempts'
      );
      console.warn('App locked due to too many failed attempts');
    }
  }

  /**
   * Check if PIN is a duress PIN
   */
  private async checkDuressMode(pin: string): Promise<AuthResult> {
    try {
      const config = await DecoyService.getDecoyConfig(pin);
      
      if (config && config.duressPIN === pin) {
        // Open duress wallet if configured
        if (config.duressWalletId) {
          return {
            success: true,
            walletId: config.duressWalletId,
            isDuress: true,
            message: 'Duress mode activated',
          };
        }
      }
      
      return { success: false, isDuress: false };
    } catch (error) {
      return { success: false, isDuress: false };
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
    return await BiometricService.isAvailable();
  }

  /**
   * Register biometric authentication
   */
  async registerBiometric(userId: string, userName: string): Promise<boolean> {
    const result = await BiometricService.registerBiometric(userId, userName);
    if (result.success) {
      await AlertService.logSecurityEvent(
        'settings-changed',
        'low',
        'Biometric authentication registered'
      );
    }
    return result.success;
  }

  /**
   * Authenticate with biometric only
   */
  async authenticateWithBiometric(): Promise<boolean> {
    const result = await BiometricService.authenticate();
    if (result.success) {
      await AlertService.logSecurityEvent('login', 'low', 'Biometric authentication successful');
    } else {
      await AlertService.logSecurityEvent('failed-auth', 'medium', 'Biometric authentication failed');
    }
    return result.success;
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
