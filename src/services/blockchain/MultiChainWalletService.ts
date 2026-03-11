/**
 * MultiChainWalletService - Unified wallet service for all blockchains
 * 
 * This service provides a unified interface for managing wallets across
 * multiple blockchains, building on the existing WalletService.
 */

import * as bip39 from 'bip39';
import chainRegistry from './ChainRegistry';
import StorageService from '../StorageService';
import { encrypt, decrypt } from '../../utils/crypto';
import {
  BlockchainType,
  NetworkType,
  UnifiedWallet,
  ChainAccount,
  Balance,
  SendTransactionParams,
  TransactionResult,
  UnifiedTransaction,
  TransactionFee,
  AssetInfo,
} from './types';

class MultiChainWalletService {
  /**
   * Generate a new multi-chain wallet from BIP39 mnemonic
   * Creates accounts for all enabled blockchains
   */
  async generateMultiChainWallet(
    chains?: BlockchainType[]
  ): Promise<{ mnemonic: string; wallet: UnifiedWallet }> {
    try {
      // Generate BIP39 mnemonic
      const mnemonic = bip39.generateMnemonic(128); // 12 words

      // Determine which chains to generate accounts for
      const enabledChains = chains || 
        chainRegistry.getEnabledChainConfigs().map(c => c.chain);

      // Generate accounts for each chain
      const accounts: ChainAccount[] = [];
      
      for (const chain of enabledChains) {
        try {
          const adapter = chainRegistry.getAdapter(chain);
          if (adapter) {
            const account = await adapter.generateAccount(mnemonic);
            accounts.push(account);
          }
        } catch (error) {
          console.error(`Failed to generate account for ${chain}:`, error);
        }
      }

      const wallet: UnifiedWallet = {
        id: this.generateWalletId(),
        name: 'Main Wallet',
        accounts,
        createdAt: Date.now(),
        isMain: false,
      };

      return { mnemonic, wallet };
    } catch (error) {
      console.error('Failed to generate multi-chain wallet:', error);
      throw new Error('Failed to generate multi-chain wallet');
    }
  }

  /**
   * Restore multi-chain wallet from mnemonic
   */
  async restoreMultiChainWallet(
    mnemonic: string,
    chains?: BlockchainType[]
  ): Promise<UnifiedWallet> {
    try {
      // Validate mnemonic
      const trimmedMnemonic = mnemonic.trim().toLowerCase();
      if (!bip39.validateMnemonic(trimmedMnemonic)) {
        throw new Error('Invalid seed phrase');
      }

      // Determine which chains to restore
      const enabledChains = chains || 
        chainRegistry.getEnabledChainConfigs().map(c => c.chain);

      // Restore accounts for each chain
      const accounts: ChainAccount[] = [];
      
      for (const chain of enabledChains) {
        try {
          const adapter = chainRegistry.getAdapter(chain);
          if (adapter) {
            const account = await adapter.generateAccount(trimmedMnemonic);
            accounts.push(account);
          }
        } catch (error) {
          console.error(`Failed to restore account for ${chain}:`, error);
        }
      }

      const wallet: UnifiedWallet = {
        id: this.generateWalletId(),
        name: 'Restored Wallet',
        accounts,
        createdAt: Date.now(),
        isMain: false,
      };

      return wallet;
    } catch (error) {
      console.error('Failed to restore multi-chain wallet:', error);
      throw new Error('Failed to restore multi-chain wallet');
    }
  }

  /**
   * Save multi-chain wallet to storage
   */
  async saveMultiChainWallet(
    wallet: UnifiedWallet,
    mnemonic: string,
    pin: string
  ): Promise<void> {
    try {
      // Encrypt mnemonic with PIN
      const encryptedMnemonic = encrypt(mnemonic, pin);

      // Store wallet data
      const walletData = {
        id: wallet.id,
        name: wallet.name,
        accounts: wallet.accounts,
        encryptedMnemonic,
        isMain: wallet.isMain,
        createdAt: wallet.createdAt,
      };

      // Save to storage
      await StorageService.set(`multichain_wallet_${wallet.id}`, walletData);
      await StorageService.set('active_multichain_wallet_id', wallet.id);
    } catch (error) {
      console.error('Failed to save multi-chain wallet:', error);
      throw new Error('Failed to save multi-chain wallet');
    }
  }

  /**
   * Get multi-chain wallet by ID
   */
  async getMultiChainWallet(walletId: string, pin: string): Promise<{
    wallet: UnifiedWallet;
    mnemonic: string;
  } | null> {
    try {
      const walletData = await StorageService.get(`multichain_wallet_${walletId}`);
      if (!walletData) return null;

      // Decrypt mnemonic
      const mnemonic = decrypt(walletData.encryptedMnemonic, pin);

      const wallet: UnifiedWallet = {
        id: walletData.id,
        name: walletData.name,
        accounts: walletData.accounts,
        createdAt: walletData.createdAt,
        isMain: walletData.isMain,
      };

      return { wallet, mnemonic };
    } catch (error) {
      console.error('Failed to get multi-chain wallet:', error);
      return null;
    }
  }

  /**
   * Get balance for a specific chain account
   */
  async getAccountBalance(
    account: ChainAccount
  ): Promise<Balance | null> {
    try {
      const adapter = chainRegistry.getAdapter(account.chain, account.network);
      if (!adapter) {
        console.error(`Adapter not found for ${account.chain}`);
        return null;
      }

      return await adapter.getBalance(account.address);
    } catch (error) {
      console.error(`Failed to get balance for ${account.chain}:`, error);
      return null;
    }
  }

  /**
   * Get all balances for a multi-chain wallet
   */
  async getAllBalances(wallet: UnifiedWallet): Promise<Map<BlockchainType, Balance[]>> {
    const balances = new Map<BlockchainType, Balance[]>();

    for (const account of wallet.accounts) {
      try {
        const adapter = chainRegistry.getAdapter(account.chain, account.network);
        if (adapter) {
          const accountBalances = await adapter.getAllBalances(account.address);
          balances.set(account.chain, accountBalances);
        }
      } catch (error) {
        console.error(`Failed to get balances for ${account.chain}:`, error);
      }
    }

    return balances;
  }

  /**
   * Send transaction on a specific chain
   */
  async sendTransaction(
    account: ChainAccount,
    params: SendTransactionParams,
    mnemonic: string
  ): Promise<TransactionResult> {
    try {
      const adapter = chainRegistry.getAdapter(account.chain, account.network);
      if (!adapter) {
        throw new Error(`Adapter not found for ${account.chain}`);
      }

      // Derive private key from mnemonic
      const privateKey = await this.getPrivateKey(mnemonic, account);

      // Send transaction
      return await adapter.sendTransaction(params, privateKey);
    } catch (error: any) {
      console.error('Transaction failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  /**
   * Estimate transaction fee for a specific chain
   */
  async estimateFee(
    account: ChainAccount,
    params: SendTransactionParams
  ): Promise<TransactionFee | null> {
    try {
      const adapter = chainRegistry.getAdapter(account.chain, account.network);
      if (!adapter) {
        console.error(`Adapter not found for ${account.chain}`);
        return null;
      }

      return await adapter.estimateFee(params);
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      return null;
    }
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(
    account: ChainAccount,
    limit?: number
  ): Promise<UnifiedTransaction[]> {
    try {
      const adapter = chainRegistry.getAdapter(account.chain, account.network);
      if (!adapter) {
        console.error(`Adapter not found for ${account.chain}`);
        return [];
      }

      return await adapter.getTransactionHistory(account.address, limit);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Detect tokens for an account
   */
  async detectTokens(account: ChainAccount): Promise<AssetInfo[]> {
    try {
      const adapter = chainRegistry.getAdapter(account.chain, account.network);
      if (!adapter) {
        console.error(`Adapter not found for ${account.chain}`);
        return [];
      }

      return await adapter.detectTokens(account.address);
    } catch (error) {
      console.error('Failed to detect tokens:', error);
      return [];
    }
  }

  /**
   * Get account for a specific chain from wallet
   */
  getAccountForChain(
    wallet: UnifiedWallet,
    chain: BlockchainType,
    network: NetworkType = NetworkType.MAINNET
  ): ChainAccount | null {
    return wallet.accounts.find(
      acc => acc.chain === chain && acc.network === network
    ) || null;
  }

  /**
   * Validate address for any chain
   */
  validateAddress(address: string, chain?: BlockchainType): boolean {
    const result = chainRegistry.validateAddress(address, chain);
    return result.valid;
  }

  /**
   * Get private key for an account
   */
  private async getPrivateKey(
    mnemonic: string,
    account: ChainAccount
  ): Promise<string> {
    const adapter = chainRegistry.getAdapter(account.chain, account.network);
    if (!adapter) {
      throw new Error(`Adapter not found for ${account.chain}`);
    }

    // Regenerate account to get private key
    const regenerated = await adapter.generateAccount(
      mnemonic,
      account.derivationPath
    );

    // For EVM chains using ethers
    if (account.chain === BlockchainType.ETHEREUM ||
        account.chain === BlockchainType.BSC ||
        account.chain === BlockchainType.POLYGON ||
        account.chain === BlockchainType.AVALANCHE ||
        account.chain === BlockchainType.ARBITRUM ||
        account.chain === BlockchainType.OPTIMISM) {
      const { ethers } = await import('ethers');
      const wallet = ethers.HDNodeWallet.fromPhrase(
        mnemonic,
        undefined,
        account.derivationPath || "m/44'/60'/0'/0/0"
      );
      return wallet.privateKey;
    }

    throw new Error(`Private key derivation not implemented for ${account.chain}`);
  }

  /**
   * Generate unique wallet ID
   */
  private generateWalletId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
const multiChainWalletService = new MultiChainWalletService();
export default multiChainWalletService;
