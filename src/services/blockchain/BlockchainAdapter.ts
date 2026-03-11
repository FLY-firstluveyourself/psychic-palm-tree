/**
 * BlockchainAdapter - Abstract base class for blockchain integrations
 * 
 * This class defines the interface that all blockchain adapters must implement.
 * It provides a unified API for interacting with different blockchains.
 */

import {
  BlockchainType,
  NetworkType,
  ChainConfig,
  ChainAccount,
  Balance,
  UnifiedTransaction,
  SendTransactionParams,
  TransactionResult,
  AssetInfo,
  TransactionFee,
} from './types';

export abstract class BlockchainAdapter {
  protected config: ChainConfig;
  protected chain: BlockchainType;
  protected network: NetworkType;

  constructor(config: ChainConfig) {
    this.config = config;
    this.chain = config.chain;
    this.network = config.network;
  }

  /**
   * Get the blockchain type
   */
  getChain(): BlockchainType {
    return this.chain;
  }

  /**
   * Get the network type
   */
  getNetwork(): NetworkType {
    return this.network;
  }

  /**
   * Get chain configuration
   */
  getConfig(): ChainConfig {
    return this.config;
  }

  /**
   * Generate a new account for this blockchain
   * @param mnemonic - BIP39 mnemonic phrase
   * @param derivationPath - Optional derivation path
   * @returns Chain account with address and keys
   */
  abstract generateAccount(
    mnemonic: string,
    derivationPath?: string
  ): Promise<ChainAccount>;

  /**
   * Import an account from private key
   * @param privateKey - Private key or seed
   * @returns Chain account
   */
  abstract importAccount(privateKey: string): Promise<ChainAccount>;

  /**
   * Validate an address for this blockchain
   * @param address - Address to validate
   * @returns True if valid
   */
  abstract validateAddress(address: string): boolean;

  /**
   * Get native balance for an address
   * @param address - Address to check
   * @returns Balance information
   */
  abstract getBalance(address: string): Promise<Balance>;

  /**
   * Get all balances (native + tokens) for an address
   * @param address - Address to check
   * @returns Array of balances
   */
  abstract getAllBalances(address: string): Promise<Balance[]>;

  /**
   * Get token balance for an address
   * @param address - Address to check
   * @param tokenAddress - Token contract address
   * @returns Token balance
   */
  abstract getTokenBalance(
    address: string,
    tokenAddress: string
  ): Promise<Balance>;

  /**
   * Send a transaction
   * @param params - Transaction parameters
   * @param privateKey - Private key for signing
   * @returns Transaction result
   */
  abstract sendTransaction(
    params: SendTransactionParams,
    privateKey: string
  ): Promise<TransactionResult>;

  /**
   * Estimate transaction fee
   * @param params - Transaction parameters
   * @returns Estimated fee
   */
  abstract estimateFee(params: SendTransactionParams): Promise<TransactionFee>;

  /**
   * Get transaction by hash
   * @param hash - Transaction hash
   * @returns Transaction details
   */
  abstract getTransaction(hash: string): Promise<UnifiedTransaction | null>;

  /**
   * Get transaction history for an address
   * @param address - Address to check
   * @param limit - Maximum number of transactions to return
   * @returns Array of transactions
   */
  abstract getTransactionHistory(
    address: string,
    limit?: number
  ): Promise<UnifiedTransaction[]>;

  /**
   * Detect and return all tokens held by an address
   * @param address - Address to check
   * @returns Array of token assets
   */
  abstract detectTokens(address: string): Promise<AssetInfo[]>;

  /**
   * Get asset information
   * @param assetIdentifier - Contract address or token symbol
   * @returns Asset information
   */
  abstract getAssetInfo(assetIdentifier: string): Promise<AssetInfo | null>;

  /**
   * Get native asset for this chain
   * @returns Native asset information
   */
  getNativeAsset(): AssetInfo {
    return this.config.nativeAsset;
  }

  /**
   * Check if chain supports tokens
   */
  supportsTokens(): boolean {
    return this.config.supportsTokens;
  }

  /**
   * Check if chain supports NFTs
   */
  supportsNFTs(): boolean {
    return this.config.supportsNFTs;
  }

  /**
   * Get blockchain explorer URL for an address
   * @param address - Address
   * @returns Explorer URL
   */
  getAddressExplorerUrl(address: string): string {
    return `${this.config.explorerUrl}/address/${address}`;
  }

  /**
   * Get blockchain explorer URL for a transaction
   * @param hash - Transaction hash
   * @returns Explorer URL
   */
  getTransactionExplorerUrl(hash: string): string {
    return `${this.config.explorerUrl}/tx/${hash}`;
  }

  /**
   * Format amount for display
   * @param amount - Raw amount
   * @param decimals - Number of decimals
   * @returns Formatted amount
   */
  protected formatAmount(amount: string, decimals: number): string {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    
    if (remainder === BigInt(0)) {
      return whole.toString();
    }
    
    const fractional = remainder.toString().padStart(decimals, '0');
    return `${whole}.${fractional}`.replace(/\.?0+$/, '');
  }

  /**
   * Parse amount from display format to raw format
   * @param amount - Display amount
   * @param decimals - Number of decimals
   * @returns Raw amount as string
   */
  protected parseAmount(amount: string, decimals: number): string {
    const [whole = '0', fractional = ''] = amount.split('.');
    const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
    return (BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFractional || 0)).toString();
  }
}

export default BlockchainAdapter;
