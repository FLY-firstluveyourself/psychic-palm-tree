/**
 * WalletService - Core wallet operations
 */

import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { encrypt } from '../utils/crypto';
import { generateSecureRandom } from '../utils/crypto';
import StorageService, { StoredWallet } from './StorageService';

export interface WalletData {
  id: string;
  address: string;
  mnemonic: string;
  privateKey: string;
}

export interface WalletBalance {
  eth: string;
  usd?: string;
}

class WalletService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Use public Ethereum RPC endpoint
    // In production, you'd want to use Infura, Alchemy, or similar
    this.provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  }

  /**
   * Generate a new wallet with BIP39 mnemonic
   * @returns Wallet data including mnemonic and address
   */
  async generateWallet(): Promise<WalletData> {
    try {
      // Generate 12-word mnemonic (128 bits of entropy)
      const mnemonic = bip39.generateMnemonic(128);

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      const id = generateSecureRandom(16);

      return {
        id,
        address: wallet.address,
        mnemonic,
        privateKey: wallet.privateKey,
      };
    } catch (error) {
      console.error('Failed to generate wallet', error);
      throw new Error('Failed to generate wallet');
    }
  }

  /**
   * Restore wallet from BIP39 mnemonic
   * @param mnemonic - 12-word seed phrase
   * @returns Wallet data
   */
  async restoreWallet(mnemonic: string): Promise<WalletData> {
    try {
      // Validate mnemonic
      const trimmedMnemonic = mnemonic.trim().toLowerCase();
      if (!bip39.validateMnemonic(trimmedMnemonic)) {
        throw new Error('Invalid seed phrase');
      }

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(trimmedMnemonic);

      const id = generateSecureRandom(16);

      return {
        id,
        address: wallet.address,
        mnemonic: trimmedMnemonic,
        privateKey: wallet.privateKey,
      };
    } catch (error) {
      console.error('Failed to restore wallet', error);
      throw new Error('Failed to restore wallet - verify seed phrase is correct');
    }
  }

  /**
   * Save wallet to secure storage
   * @param walletData - Wallet data to save
   * @param pin - User's PIN for encryption
   * @param name - Optional wallet name
   * @param isMain - Whether this is the main wallet (for decoy system)
   */
  async saveWallet(
    walletData: WalletData,
    pin: string,
    name?: string,
    isMain: boolean = false
  ): Promise<void> {
    try {
      // Encrypt mnemonic with PIN
      const encryptedMnemonic = encrypt(walletData.mnemonic, pin);

      // Get current device info
      const currentDevice = await StorageService.getCurrentDevice();

      const storedWallet: StoredWallet = {
        id: walletData.id,
        name: name || `Wallet ${walletData.address.slice(0, 6)}`,
        address: walletData.address,
        encryptedMnemonic,
        isMain,
        createdAt: Date.now(),
        deviceId: currentDevice.id,
      };

      await StorageService.setWallet(storedWallet);
      await StorageService.setActiveWalletId(walletData.id);
      
      // Record device access
      await StorageService.recordDeviceAccess();
    } catch (error) {
      console.error('Failed to save wallet');
      throw new Error('Failed to save wallet');
    }
  }

  /**
   * Get wallet's Ethereum balance
   * @param address - Ethereum address
   * @returns Balance in ETH
   */
  async getBalance(address: string): Promise<WalletBalance> {
    try {
      const balance = await this.provider.getBalance(address);
      const ethBalance = ethers.formatEther(balance);

      return {
        eth: ethBalance,
      };
    } catch (error) {
      console.error('Failed to fetch balance');
      // Return zero balance on error
      return { eth: '0.0' };
    }
  }

  /**
   * Get wallet instance from stored wallet
   * @param walletId - Wallet ID
   * @param pin - User's PIN
   * @returns Wallet instance for signing transactions
   */
  async getWalletInstance(walletId: string, pin: string): Promise<ethers.Wallet> {
    try {
      const storedWallet = await StorageService.getWallet(walletId);
      if (!storedWallet) {
        throw new Error('Wallet not found');
      }

      // Decrypt mnemonic
      const { decrypt } = await import('../utils/crypto');
      const mnemonic = decrypt(storedWallet.encryptedMnemonic, pin);

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      return wallet.connect(this.provider);
    } catch (error) {
      console.error('Failed to get wallet instance', error);
      throw new Error('Failed to access wallet - verify PIN is correct');
    }
  }

  /**
   * Send Ethereum transaction
   * @param walletId - Wallet ID
   * @param pin - User's PIN
   * @param to - Recipient address
   * @param amount - Amount in ETH
   * @returns Transaction hash
   */
  async sendTransaction(
    walletId: string,
    pin: string,
    to: string,
    amount: string
  ): Promise<string> {
    try {
      const wallet = await this.getWalletInstance(walletId, pin);

      const tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Transaction failed');
      throw new Error('Transaction failed');
    }
  }

  /**
   * Validate seed phrase words
   * @param words - Array of words to validate
   * @param indices - Indices to check against original mnemonic
   * @param originalMnemonic - Original mnemonic to compare against
   * @returns True if words match
   */
  validateSeedPhraseWords(
    words: string[],
    indices: number[],
    originalMnemonic: string
  ): boolean {
    const mnemonicWords = originalMnemonic.split(' ');
    
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      if (mnemonicWords[index] !== words[i].toLowerCase().trim()) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get transaction history (simplified - would need indexer in production)
   * @param address - Ethereum address
   * @returns Array of recent transactions
   */
  async getTransactionHistory(address: string): Promise<any[]> {
    // In a production app, you'd use Etherscan API or similar
    // For now, return empty array
    return [];
  }
}

export default new WalletService();
