/**
 * MultiChainWalletService
 * 
 * Orchestrates wallet operations across multiple blockchains.
 * Provides unified interface for multi-chain asset management.
 */

import * as bip39 from 'bip39';
import { ChainAdapter } from './chains/ChainAdapter';
import {
  ETHEREUM_MAINNET,
  POLYGON_MAINNET,
  BSC_MAINNET,
  ARBITRUM_MAINNET,
  OPTIMISM_MAINNET
} from './chains/EthereumAdapter';
import { BITCOIN_MAINNET } from './chains/BitcoinAdapter';
import { encrypt, decrypt } from '../utils/crypto';
import { generateSecureRandom } from '../utils/crypto';
import StorageService from './StorageService';

export interface MultiChainWallet {
  id: string;
  mnemonic: string;  // Should be encrypted
  wallets: Record<string, ChainWalletData>;
  enabledChains: string[];
  createdAt: number;
  lastAccessedAt: number;
}

export interface ChainWalletData {
  id: string;
  chainId: string;
  address: string;
  publicKey: string;
  privateKey: string;  // Should be encrypted
  derivationPath: string;
}

export interface PortfolioAsset {
  chain: string;
  chainName: string;
  symbol: string;
  balance: string;
  value?: string;  // USD value
  address: string;
}

export interface Portfolio {
  totalValue: string;
  currency: string;
  assets: PortfolioAsset[];
  lastUpdated: number;
}

/**
 * Multi-Chain Wallet Service
 * 
 * Manages wallets across multiple blockchains from a single mnemonic
 */
class MultiChainWalletService {
  private adapters: Map<string, ChainAdapter>;
  private initialized: boolean = false;

  constructor() {
    this.adapters = new Map();
  }

  /**
   * Initialize service with chain adapters
   */
  initialize(): void {
    if (this.initialized) return;

    // Register EVM chains
    this.adapters.set('ethereum', ETHEREUM_MAINNET);
    this.adapters.set('polygon', POLYGON_MAINNET);
    this.adapters.set('bsc', BSC_MAINNET);
    this.adapters.set('arbitrum', ARBITRUM_MAINNET);
    this.adapters.set('optimism', OPTIMISM_MAINNET);

    // Register non-EVM chains
    this.adapters.set('bitcoin', BITCOIN_MAINNET);

    this.initialized = true;
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): string[] {
    this.initialize();
    return Array.from(this.adapters.keys());
  }

  /**
   * Get chain adapter
   */
  getAdapter(chainId: string): ChainAdapter | undefined {
    this.initialize();
    return this.adapters.get(chainId);
  }

  /**
   * Get chain info
   */
  getChainInfo(chainId: string): {
    id: string;
    name: string;
    symbol: string;
    type: string;
  } | null {
    const adapter = this.getAdapter(chainId);
    if (!adapter) return null;

    return {
      id: chainId,
      name: adapter.name,
      symbol: adapter.symbol,
      type: adapter.type
    };
  }

  /**
   * Generate new mnemonic
   */
  generateMnemonic(): string {
    return bip39.generateMnemonic(128);
  }

  /**
   * Validate mnemonic
   */
  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic.trim().toLowerCase());
  }

  /**
   * Generate multi-chain wallet from mnemonic
   * @param mnemonic BIP39 seed phrase
   * @param enabledChains Array of chain IDs to enable
   */
  async generateMultiChainWallet(
    mnemonic: string,
    enabledChains: string[]
  ): Promise<MultiChainWallet> {
    this.initialize();

    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const id = generateSecureRandom(16);
    const wallets: Record<string, ChainWalletData> = {};

    // Generate wallet for each enabled chain
    for (const chainId of enabledChains) {
      const adapter = this.adapters.get(chainId);
      if (!adapter) {
        console.warn(`Chain adapter not found for: ${chainId}`);
        continue;
      }

      try {
        const walletData = await adapter.generateWallet(mnemonic);
        wallets[chainId] = {
          id: walletData.id,
          chainId,
          address: walletData.address,
          publicKey: walletData.publicKey,
          privateKey: walletData.privateKey,
          derivationPath: walletData.derivationPath
        };
      } catch (error) {
        console.error(`Failed to generate wallet for ${chainId}:`, error);
        // Continue with other chains even if one fails
      }
    }

    if (Object.keys(wallets).length === 0) {
      throw new Error('Failed to generate wallets for any chain');
    }

    return {
      id,
      mnemonic,
      wallets,
      enabledChains,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
  }

  /**
   * Save multi-chain wallet to storage
   * @param wallet Multi-chain wallet data
   * @param pin User's PIN for encryption
   */
  async saveMultiChainWallet(
    wallet: MultiChainWallet,
    pin: string
  ): Promise<void> {
    try {
      // Encrypt mnemonic and private keys
      const encryptedMnemonic = encrypt(wallet.mnemonic, pin);
      
      const encryptedWallets: Record<string, any> = {};
      for (const [chainId, walletData] of Object.entries(wallet.wallets)) {
        encryptedWallets[chainId] = {
          ...walletData,
          privateKey: encrypt(walletData.privateKey, pin)
        };
      }

      // Store in localStorage
      const multiWalletData = {
        id: wallet.id,
        encryptedMnemonic,
        wallets: encryptedWallets,
        enabledChains: wallet.enabledChains,
        createdAt: wallet.createdAt,
        lastAccessedAt: wallet.lastAccessedAt
      };

      localStorage.setItem('multichain_wallet', JSON.stringify(multiWalletData));
      localStorage.setItem('multichain_wallet_id', wallet.id);
    } catch (error) {
      console.error('Failed to save multi-chain wallet:', error);
      throw new Error('Failed to save multi-chain wallet');
    }
  }

  /**
   * Load multi-chain wallet from storage
   * @param pin User's PIN for decryption
   */
  async loadMultiChainWallet(pin: string): Promise<MultiChainWallet | null> {
    try {
      const data = localStorage.getItem('multichain_wallet');
      if (!data) return null;

      const multiWalletData = JSON.parse(data);

      // Decrypt mnemonic with error handling
      let mnemonic: string;
      try {
        mnemonic = decrypt(multiWalletData.encryptedMnemonic, pin);
      } catch (decryptError) {
        console.error('Failed to decrypt mnemonic - invalid PIN');
        return null;
      }

      // Decrypt private keys with error handling
      const wallets: Record<string, ChainWalletData> = {};
      for (const [chainId, walletData] of Object.entries(multiWalletData.wallets)) {
        const encrypted = walletData as any;
        try {
          wallets[chainId] = {
            ...encrypted,
            privateKey: decrypt(encrypted.privateKey, pin)
          };
        } catch (decryptError) {
          console.error(`Failed to decrypt private key for chain ${chainId}`);
          return null;
        }
      }

      return {
        id: multiWalletData.id,
        mnemonic,
        wallets,
        enabledChains: multiWalletData.enabledChains,
        createdAt: multiWalletData.createdAt,
        lastAccessedAt: Date.now()
      };
    } catch (error) {
      console.error('Failed to load multi-chain wallet');
      return null;
    }
  }

  /**
   * Check if multi-chain wallet exists
   */
  async hasMultiChainWallet(): Promise<boolean> {
    return localStorage.getItem('multichain_wallet') !== null;
  }

  /**
   * Get aggregated portfolio across all chains
   * @param wallet Multi-chain wallet
   */
  async getPortfolio(wallet: MultiChainWallet): Promise<Portfolio> {
    this.initialize();

    const assets: PortfolioAsset[] = [];

    // Fetch balance for each chain
    for (const [chainId, walletData] of Object.entries(wallet.wallets)) {
      const adapter = this.adapters.get(chainId);
      if (!adapter) continue;

      try {
        const balance = await adapter.getBalance(walletData.address);
        
        assets.push({
          chain: chainId,
          chainName: adapter.name,
          symbol: adapter.symbol,
          balance,
          address: walletData.address
        });
      } catch (error) {
        console.error(`Failed to fetch balance for ${chainId}:`, error);
        // Continue with other chains
      }
    }

    return {
      totalValue: '0.00', // Would need price API integration
      currency: 'USD',
      assets,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get balance for specific chain
   * @param wallet Multi-chain wallet
   * @param chainId Chain identifier
   */
  async getChainBalance(
    wallet: MultiChainWallet,
    chainId: string
  ): Promise<string> {
    const adapter = this.getAdapter(chainId);
    const walletData = wallet.wallets[chainId];

    if (!adapter || !walletData) {
      throw new Error(`Chain ${chainId} not found in wallet`);
    }

    return await adapter.getBalance(walletData.address);
  }

  /**
   * Validate address for specific chain
   * @param chainId Chain identifier
   * @param address Address to validate
   */
  validateAddress(chainId: string, address: string): boolean {
    const adapter = this.getAdapter(chainId);
    if (!adapter) return false;

    return adapter.validateAddress(address);
  }

  /**
   * Add chain to existing multi-chain wallet
   * @param wallet Multi-chain wallet
   * @param chainId Chain to add
   * @param pin User's PIN
   */
  async addChain(
    wallet: MultiChainWallet,
    chainId: string,
    pin: string
  ): Promise<MultiChainWallet> {
    const adapter = this.getAdapter(chainId);
    if (!adapter) {
      throw new Error(`Chain adapter not found for: ${chainId}`);
    }

    if (wallet.wallets[chainId]) {
      throw new Error(`Chain ${chainId} already exists in wallet`);
    }

    // Generate wallet for new chain
    const walletData = await adapter.generateWallet(wallet.mnemonic);
    
    wallet.wallets[chainId] = {
      id: walletData.id,
      chainId,
      address: walletData.address,
      publicKey: walletData.publicKey,
      privateKey: walletData.privateKey,
      derivationPath: walletData.derivationPath
    };

    wallet.enabledChains.push(chainId);
    wallet.lastAccessedAt = Date.now();

    // Save updated wallet
    await this.saveMultiChainWallet(wallet, pin);

    return wallet;
  }

  /**
   * Get all addresses for a multi-chain wallet
   */
  getAllAddresses(wallet: MultiChainWallet): Record<string, string> {
    const addresses: Record<string, string> = {};
    
    for (const [chainId, walletData] of Object.entries(wallet.wallets)) {
      addresses[chainId] = walletData.address;
    }

    return addresses;
  }

  /**
   * Clear all multi-chain wallet data
   */
  async clearMultiChainWallet(): Promise<void> {
    localStorage.removeItem('multichain_wallet');
    localStorage.removeItem('multichain_wallet_id');
  }
}

export default new MultiChainWalletService();
