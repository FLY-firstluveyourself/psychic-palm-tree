/**
 * EthereumAdapter - Ethereum and EVM-compatible chains
 * 
 * Supports: Ethereum, Polygon, BSC, Arbitrum, Optimism, and all EVM chains
 */

import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import {
  ChainAdapter,
  ChainType,
  WalletData,
  Token,
  NFT,
  TransactionParams,
  TransactionResult,
  FeeEstimate,
  Transaction,
  NetworkStatus
} from './ChainAdapter';
import { generateSecureRandom } from '../../utils/crypto';

export interface EVMChainConfig {
  chainId: string;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorer: string;
  derivationPath: string;
}

/**
 * Ethereum/EVM Chain Adapter
 */
export class EthereumAdapter extends ChainAdapter {
  readonly chainId: string;
  readonly name: string;
  readonly symbol: string;
  readonly type: ChainType = 'EVM';
  readonly decimals: number;
  readonly explorer: string;
  readonly rpcUrl: string;
  readonly derivationPath: string;

  private provider: ethers.JsonRpcProvider;

  constructor(config?: EVMChainConfig) {
    super();

    // Default to Ethereum mainnet
    const defaultConfig: EVMChainConfig = {
      chainId: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      rpcUrl: 'https://eth.llamarpc.com',
      explorer: 'https://etherscan.io',
      derivationPath: "m/44'/60'/0'/0/0"
    };

    const cfg = config || defaultConfig;
    this.chainId = cfg.chainId;
    this.name = cfg.name;
    this.symbol = cfg.symbol;
    this.decimals = cfg.decimals;
    this.rpcUrl = cfg.rpcUrl;
    this.explorer = cfg.explorer;
    this.derivationPath = cfg.derivationPath;

    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  /**
   * Generate wallet from mnemonic
   */
  async generateWallet(mnemonic: string, index: number = 0): Promise<WalletData> {
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Use custom derivation path if index is provided
      const path = index > 0 
        ? `m/44'/60'/0'/0/${index}`
        : this.derivationPath;

      // Create HD wallet from mnemonic with proper derivation
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
      const wallet = new ethers.Wallet(hdNode.privateKey);

      const id = generateSecureRandom(16);

      return {
        id,
        chainId: this.chainId,
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        derivationPath: path
      };
    } catch (error) {
      console.error(`Failed to generate ${this.name} wallet:`, error);
      throw new Error(`Failed to generate ${this.name} wallet`);
    }
  }

  /**
   * Restore wallet from mnemonic
   */
  async restoreWallet(mnemonic: string, index: number = 0): Promise<WalletData> {
    // Same as generate for EVM chains
    return this.generateWallet(mnemonic, index);
  }

  /**
   * Validate Ethereum address
   */
  validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Get native token balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Failed to fetch ${this.name} balance:`, error);
      return '0.0';
    }
  }

  /**
   * Get ERC-20 tokens
   * Note: In production, use a token list API or indexer
   */
  async getTokens(address: string): Promise<Token[]> {
    try {
      // For MVP, return empty array
      // In production, integrate with:
      // - CoinGecko API
      // - Moralis API
      // - Alchemy Token API
      // - TheGraph
      return [];
    } catch (error) {
      console.error(`Failed to fetch ${this.name} tokens:`, error);
      return [];
    }
  }

  /**
   * Get NFTs (ERC-721, ERC-1155)
   * Note: In production, use NFT indexer
   */
  async getNFTs(address: string): Promise<NFT[]> {
    try {
      // For MVP, return empty array
      // In production, integrate with:
      // - OpenSea API
      // - Moralis NFT API
      // - Alchemy NFT API
      return [];
    } catch (error) {
      console.error(`Failed to fetch ${this.name} NFTs:`, error);
      return [];
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    try {
      // This method would need wallet instance with private key
      // For security, private key should be passed securely or derived on-demand
      throw new Error('Direct transaction sending not implemented - use WalletService');
    } catch (error) {
      console.error(`Failed to send ${this.name} transaction:`, error);
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(params: TransactionParams): Promise<FeeEstimate> {
    try {
      const feeData = await this.provider.getFeeData();
      
      // Determine gas limit based on transaction type
      let gasLimit: bigint;
      if (params.gasLimit) {
        gasLimit = BigInt(params.gasLimit);
      } else if (params.data && params.data !== '0x') {
        // Contract interaction or token transfer - estimate higher
        gasLimit = 100000n;
      } else {
        // Simple ETH transfer
        gasLimit = 21000n;
      }

      // Calculate fees for different speeds
      const baseFee = feeData.gasPrice || 0n;
      const lowFee = baseFee * 90n / 100n; // 90% of base
      const mediumFee = baseFee; // Base fee
      const highFee = baseFee * 120n / 100n; // 120% of base

      return {
        low: ethers.formatEther(lowFee * gasLimit),
        medium: ethers.formatEther(mediumFee * gasLimit),
        high: ethers.formatEther(highFee * gasLimit),
        currency: this.symbol
      };
    } catch (error) {
      console.error(`Failed to estimate ${this.name} fee:`, error);
      return {
        low: '0.001',
        medium: '0.002',
        high: '0.003',
        currency: this.symbol
      };
    }
  }

  /**
   * Get transaction history
   * Note: In production, use blockchain explorer API
   */
  async getTransactionHistory(
    address: string,
    page: number = 1
  ): Promise<Transaction[]> {
    try {
      // For MVP, return empty array
      // In production, integrate with:
      // - Etherscan API
      // - Blockscout API
      // - Alchemy Enhanced APIs
      return [];
    } catch (error) {
      console.error(`Failed to fetch ${this.name} transaction history:`, error);
      return [];
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const block = await this.provider.getBlock(blockNumber);
      
      // Estimate average block time (12 seconds for Ethereum)
      const averageBlockTime = 12;

      return {
        isConnected: true,
        blockHeight: blockNumber,
        averageBlockTime,
        networkCongestion: 'low' // Would need more logic to determine
      };
    } catch (error) {
      console.error(`Failed to get ${this.name} network status:`, error);
      return {
        isConnected: false,
        blockHeight: 0,
        averageBlockTime: 0,
        networkCongestion: 'low'
      };
    }
  }

  /**
   * Get current block height
   */
  async getCurrentBlockHeight(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error(`Failed to get ${this.name} block height:`, error);
      return 0;
    }
  }

  /**
   * Get explorer URL for address
   */
  getExplorerUrl(address: string): string {
    return `${this.explorer}/address/${address}`;
  }

  /**
   * Get explorer URL for transaction
   */
  getTransactionUrl(txHash: string): string {
    return `${this.explorer}/tx/${txHash}`;
  }
}

// Pre-configured EVM chain adapters
export const ETHEREUM_MAINNET = new EthereumAdapter({
  chainId: 'ethereum',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  rpcUrl: 'https://eth.llamarpc.com',
  explorer: 'https://etherscan.io',
  derivationPath: "m/44'/60'/0'/0/0"
});

export const POLYGON_MAINNET = new EthereumAdapter({
  chainId: 'polygon',
  name: 'Polygon',
  symbol: 'MATIC',
  decimals: 18,
  rpcUrl: 'https://polygon-rpc.com',
  explorer: 'https://polygonscan.com',
  derivationPath: "m/44'/60'/0'/0/0"
});

export const BSC_MAINNET = new EthereumAdapter({
  chainId: 'bsc',
  name: 'Binance Smart Chain',
  symbol: 'BNB',
  decimals: 18,
  rpcUrl: 'https://bsc-dataseed.binance.org',
  explorer: 'https://bscscan.com',
  derivationPath: "m/44'/60'/0'/0/0"
});

export const ARBITRUM_MAINNET = new EthereumAdapter({
  chainId: 'arbitrum',
  name: 'Arbitrum One',
  symbol: 'ETH',
  decimals: 18,
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  explorer: 'https://arbiscan.io',
  derivationPath: "m/44'/60'/0'/0/0"
});

export const OPTIMISM_MAINNET = new EthereumAdapter({
  chainId: 'optimism',
  name: 'Optimism',
  symbol: 'ETH',
  decimals: 18,
  rpcUrl: 'https://mainnet.optimism.io',
  explorer: 'https://optimistic.etherscan.io',
  derivationPath: "m/44'/60'/0'/0/0"
});
