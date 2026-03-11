/**
 * AirGapService - Handles offline/air-gapped wallet operations
 * Enables secure transaction signing on offline devices with QR code transfer
 */

import { ethers } from 'ethers';
import WalletService from './WalletService';

export interface AirGapTransaction {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
  chainId?: number;
}

export interface SignedTransaction {
  raw: string;
  hash: string;
  from: string;
  to: string;
  value: string;
}

export interface QRCodeData {
  type: 'unsigned-tx' | 'signed-tx' | 'address' | 'wallet-export';
  data: string;
  timestamp: number;
}

class AirGapService {
  private readonly AIRGAP_MODE_KEY = 'wonderwallet_airgap_mode';
  private readonly OFFLINE_TXS_KEY = 'wonderwallet_offline_txs';

  /**
   * Enable air-gapped mode (disables network requests)
   */
  async enableAirGapMode(): Promise<boolean> {
    try {
      localStorage.setItem(this.AIRGAP_MODE_KEY, 'true');
      console.log('Air-gap mode enabled - all network requests disabled');
      return true;
    } catch (error) {
      console.error('Failed to enable air-gap mode');
      return false;
    }
  }

  /**
   * Disable air-gapped mode
   */
  async disableAirGapMode(): Promise<boolean> {
    try {
      localStorage.removeItem(this.AIRGAP_MODE_KEY);
      console.log('Air-gap mode disabled');
      return true;
    } catch (error) {
      console.error('Failed to disable air-gap mode');
      return false;
    }
  }

  /**
   * Check if air-gap mode is active
   */
  isAirGapMode(): boolean {
    return localStorage.getItem(this.AIRGAP_MODE_KEY) === 'true';
  }

  /**
   * Generate unsigned transaction for QR code transfer
   * @param tx - Transaction details
   * @returns QR code data string
   */
  async generateUnsignedTransaction(tx: AirGapTransaction): Promise<string> {
    try {
      const qrData: QRCodeData = {
        type: 'unsigned-tx',
        data: JSON.stringify(tx),
        timestamp: Date.now(),
      };

      return JSON.stringify(qrData);
    } catch (error) {
      console.error('Failed to generate unsigned transaction');
      throw new Error('Failed to generate unsigned transaction');
    }
  }

  /**
   * Sign transaction on air-gapped device
   * @param walletId - Wallet ID
   * @param pin - User PIN
   * @param unsignedTxData - Unsigned transaction from QR code
   */
  async signTransactionOffline(
    walletId: string,
    pin: string,
    unsignedTxData: string
  ): Promise<string> {
    try {
      // Parse QR code data
      const qrData: QRCodeData = JSON.parse(unsignedTxData);
      
      if (qrData.type !== 'unsigned-tx') {
        throw new Error('Invalid QR code data - expected unsigned transaction');
      }

      const tx: AirGapTransaction = JSON.parse(qrData.data);

      // Get wallet instance (without network access)
      const wallet = await WalletService.getWalletInstance(walletId, pin);

      // Sign the transaction
      const signedTx = await wallet.signTransaction({
        to: tx.to,
        value: ethers.parseEther(tx.value),
        data: tx.data || '0x',
        gasLimit: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
        gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
        nonce: tx.nonce,
        chainId: tx.chainId || 1,
      });

      // Create signed transaction QR data
      const signedQrData: QRCodeData = {
        type: 'signed-tx',
        data: signedTx,
        timestamp: Date.now(),
      };

      // Store offline for backup
      await this.storeOfflineTransaction(signedTx);

      return JSON.stringify(signedQrData);
    } catch (error) {
      console.error('Failed to sign transaction offline');
      throw new Error('Failed to sign transaction offline');
    }
  }

  /**
   * Parse signed transaction from QR code
   * @param signedTxData - Signed transaction QR data
   */
  parseSignedTransaction(signedTxData: string): string {
    try {
      const qrData: QRCodeData = JSON.parse(signedTxData);
      
      if (qrData.type !== 'signed-tx') {
        throw new Error('Invalid QR code data - expected signed transaction');
      }

      return qrData.data;
    } catch (error) {
      console.error('Failed to parse signed transaction');
      throw new Error('Failed to parse signed transaction');
    }
  }

  /**
   * Generate wallet address QR code
   * @param address - Ethereum address
   */
  generateAddressQRCode(address: string): string {
    const qrData: QRCodeData = {
      type: 'address',
      data: address,
      timestamp: Date.now(),
    };

    return JSON.stringify(qrData);
  }

  /**
   * Export wallet for transfer to air-gapped device (encrypted)
   * @param walletId - Wallet ID
   * @param pin - User PIN
   * @param exportPin - PIN for export encryption
   */
  async exportWalletForAirGap(
    walletId: string,
    pin: string,
    exportPin: string
  ): Promise<string> {
    try {
      // Get wallet mnemonic
      const StorageService = (await import('./StorageService')).default;
      const wallet = await StorageService.getWallet(walletId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Decrypt with current PIN
      const { decrypt, encrypt } = await import('../utils/crypto');
      const mnemonic = decrypt(wallet.encryptedMnemonic, pin);

      // Re-encrypt with export PIN
      const exportEncrypted = encrypt(mnemonic, exportPin);

      const exportData = {
        address: wallet.address,
        encryptedMnemonic: exportEncrypted,
        exportedAt: Date.now(),
      };

      const qrData: QRCodeData = {
        type: 'wallet-export',
        data: JSON.stringify(exportData),
        timestamp: Date.now(),
      };

      return JSON.stringify(qrData);
    } catch (error) {
      console.error('Failed to export wallet for air-gap');
      throw new Error('Failed to export wallet');
    }
  }

  /**
   * Import wallet from QR code on air-gapped device
   * @param qrData - QR code data from online device
   * @param exportPin - PIN used for export encryption
   * @param newPin - New PIN for this device
   */
  async importWalletFromQR(
    qrData: string,
    exportPin: string,
    newPin: string
  ): Promise<{ address: string; walletId: string }> {
    try {
      const parsed: QRCodeData = JSON.parse(qrData);
      
      if (parsed.type !== 'wallet-export') {
        throw new Error('Invalid QR code - expected wallet export');
      }

      const exportData = JSON.parse(parsed.data);
      
      // Decrypt with export PIN
      const { decrypt, encrypt } = await import('../utils/crypto');
      const mnemonic = decrypt(exportData.encryptedMnemonic, exportPin);

      // Restore wallet with new PIN
      const walletData = await WalletService.restoreWallet(mnemonic);
      await WalletService.saveWallet(walletData, newPin, 'Air-Gap Wallet', true);

      return {
        address: walletData.address,
        walletId: walletData.id,
      };
    } catch (error) {
      console.error('Failed to import wallet from QR');
      throw new Error('Failed to import wallet from QR code');
    }
  }

  /**
   * Store offline transaction for record keeping
   */
  private async storeOfflineTransaction(signedTx: string): Promise<void> {
    try {
      const stored = localStorage.getItem(this.OFFLINE_TXS_KEY);
      const txs = stored ? JSON.parse(stored) : [];
      
      txs.push({
        signedTx,
        timestamp: Date.now(),
      });

      // Keep only last 50 transactions
      if (txs.length > 50) {
        txs.shift();
      }

      localStorage.setItem(this.OFFLINE_TXS_KEY, JSON.stringify(txs));
    } catch (error) {
      console.error('Failed to store offline transaction');
    }
  }

  /**
   * Get stored offline transactions
   */
  getOfflineTransactions(): Array<{ signedTx: string; timestamp: number }> {
    try {
      const stored = localStorage.getItem(this.OFFLINE_TXS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear offline transaction history
   */
  clearOfflineTransactions(): boolean {
    try {
      localStorage.removeItem(this.OFFLINE_TXS_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate QR code data format
   * @param maxAge - Maximum age in hours (default 48 for air-gap scenarios)
   */
  validateQRData(qrData: string, maxAge: number = 48): { valid: boolean; type?: string; message?: string } {
    try {
      const parsed: QRCodeData = JSON.parse(qrData);
      
      if (!parsed.type || !parsed.data || !parsed.timestamp) {
        return { valid: false, message: 'Invalid QR code format' };
      }

      const validTypes = ['unsigned-tx', 'signed-tx', 'address', 'wallet-export'];
      if (!validTypes.includes(parsed.type)) {
        return { valid: false, message: 'Unknown QR code type' };
      }

      // Check if not too old (configurable, default 48 hours for air-gap scenarios)
      const age = Date.now() - parsed.timestamp;
      const maxAgeMs = maxAge * 60 * 60 * 1000;
      if (age > maxAgeMs) {
        return { valid: false, message: `QR code expired (older than ${maxAge} hours)` };
      }

      return { valid: true, type: parsed.type };
    } catch (error) {
      return { valid: false, message: 'Failed to parse QR code' };
    }
  }
}

export default new AirGapService();
