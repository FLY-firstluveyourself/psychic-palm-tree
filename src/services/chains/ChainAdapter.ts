/**
 * ChainAdapter Interface
 * 
 * Abstract interface that all blockchain adapters must implement.
 * Provides a unified API for interacting with different blockchains.
 */

export type ChainType = 'EVM' | 'UTXO' | 'Account' | 'Custom';

export interface WalletData {
  id: string;
  chainId: string;
  address: string;
  publicKey: string;
  privateKey: string;  // Should be encrypted before storage
  derivationPath: string;
}

export interface Token {
  address?: string;     // Contract address (undefined for native tokens)
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  logo?: string;
  value?: string;       // USD value
}

export interface NFT {
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  collection: string;
}

export interface TransactionParams {
  from: string;
  to: string;
  amount: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp?: number;
  fee?: string;
}

export interface FeeEstimate {
  low: string;
  medium: string;
  high: string;
  currency: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  fee: string;
  blockNumber?: number;
}

export interface NetworkStatus {
  isConnected: boolean;
  blockHeight: number;
  averageBlockTime: number;
  networkCongestion: 'low' | 'medium' | 'high';
}

/**
 * Abstract base class for all blockchain adapters
 */
export abstract class ChainAdapter {
  // Chain metadata
  abstract readonly chainId: string;
  abstract readonly name: string;
  abstract readonly symbol: string;
  abstract readonly type: ChainType;
  abstract readonly decimals: number;
  abstract readonly explorer: string;
  abstract readonly rpcUrl: string;

  /**
   * Generate a new wallet from mnemonic
   * @param mnemonic BIP39 mnemonic phrase
   * @param index Derivation index (default: 0)
   */
  abstract generateWallet(mnemonic: string, index?: number): Promise<WalletData>;

  /**
   * Restore wallet from mnemonic
   * @param mnemonic BIP39 mnemonic phrase
   * @param index Derivation index (default: 0)
   */
  abstract restoreWallet(mnemonic: string, index?: number): Promise<WalletData>;

  /**
   * Validate if address is valid for this chain
   * @param address Address to validate
   */
  abstract validateAddress(address: string): boolean;

  /**
   * Get native token balance
   * @param address Wallet address
   */
  abstract getBalance(address: string): Promise<string>;

  /**
   * Get all tokens held by address
   * @param address Wallet address
   */
  abstract getTokens(address: string): Promise<Token[]>;

  /**
   * Get all NFTs held by address
   * @param address Wallet address
   */
  abstract getNFTs(address: string): Promise<NFT[]>;

  /**
   * Send transaction
   * @param params Transaction parameters
   */
  abstract sendTransaction(params: TransactionParams): Promise<TransactionResult>;

  /**
   * Estimate transaction fee
   * @param params Transaction parameters
   */
  abstract estimateFee(params: TransactionParams): Promise<FeeEstimate>;

  /**
   * Get transaction history
   * @param address Wallet address
   * @param page Page number for pagination
   */
  abstract getTransactionHistory(
    address: string,
    page?: number
  ): Promise<Transaction[]>;

  /**
   * Get current network status
   */
  abstract getNetworkStatus(): Promise<NetworkStatus>;

  /**
   * Get current block height
   */
  abstract getCurrentBlockHeight(): Promise<number>;

  /**
   * Format balance for display
   * @param balance Raw balance string
   */
  formatBalance(balance: string): string {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0.00';
    return num.toFixed(4);
  }

  /**
   * Truncate address for display
   * @param address Full address
   */
  truncateAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

/**
 * Factory for creating chain adapters
 */
export class ChainAdapterFactory {
  private static adapters: Map<string, () => ChainAdapter> = new Map();

  /**
   * Register a chain adapter
   */
  static register(chainId: string, factory: () => ChainAdapter): void {
    this.adapters.set(chainId, factory);
  }

  /**
   * Create a chain adapter instance
   */
  static create(chainId: string): ChainAdapter {
    const factory = this.adapters.get(chainId);
    if (!factory) {
      throw new Error(`Chain adapter not found for chain: ${chainId}`);
    }
    return factory();
  }

  /**
   * Get all registered chain IDs
   */
  static getSupportedChains(): string[] {
    return Array.from(this.adapters.keys());
  }
}
