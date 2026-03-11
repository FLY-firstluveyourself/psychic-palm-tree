/**
 * Blockchain Types - Core type definitions for multi-chain support
 */

/**
 * Supported blockchain networks
 */
export enum BlockchainType {
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
  SOLANA = 'solana',
  BSC = 'bsc',
  POLYGON = 'polygon',
  AVALANCHE = 'avalanche',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
}

/**
 * Network environment (mainnet, testnet, etc.)
 */
export enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Asset/token types
 */
export enum AssetType {
  NATIVE = 'native',        // Native coin (ETH, BTC, SOL, etc.)
  TOKEN = 'token',          // ERC-20, SPL, BEP-20, etc.
  NFT = 'nft',             // NFTs
}

/**
 * Unified wallet data across all chains
 */
export interface UnifiedWallet {
  id: string;
  name: string;
  accounts: ChainAccount[];
  createdAt: number;
  isMain: boolean;
}

/**
 * Account for a specific blockchain
 */
export interface ChainAccount {
  chain: BlockchainType;
  network: NetworkType;
  address: string;
  publicKey?: string;
  derivationPath?: string;
  encryptedPrivateKey?: string;
}

/**
 * Unified transaction interface
 */
export interface UnifiedTransaction {
  id: string;
  chain: BlockchainType;
  network: NetworkType;
  from: string;
  to: string;
  amount: string;
  asset: AssetInfo;
  fee: TransactionFee;
  status: TransactionStatus;
  timestamp: number;
  hash?: string;
  confirmations?: number;
  blockNumber?: number;
  metadata?: Record<string, any>;
}

/**
 * Asset/token information
 */
export interface AssetInfo {
  type: AssetType;
  symbol: string;
  name: string;
  decimals: number;
  chain: BlockchainType;
  contractAddress?: string;
  logoUrl?: string;
  verified?: boolean;
}

/**
 * Balance information
 */
export interface Balance {
  asset: AssetInfo;
  amount: string;
  usdValue?: string;
}

/**
 * Transaction fee information
 */
export interface TransactionFee {
  amount: string;
  asset: AssetInfo;
  usdValue?: string;
  gasLimit?: string;
  gasPrice?: string;
}

/**
 * Send transaction parameters
 */
export interface SendTransactionParams {
  from: string;
  to: string;
  amount: string;
  asset?: AssetInfo;
  memo?: string;
  gasLimit?: string;
  gasPrice?: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  transaction?: UnifiedTransaction;
}

/**
 * Swap/Bridge parameters
 */
export interface SwapParams {
  fromChain: BlockchainType;
  toChain: BlockchainType;
  fromAsset: AssetInfo;
  toAsset: AssetInfo;
  amount: string;
  fromAddress: string;
  toAddress: string;
  slippage?: number;
}

/**
 * Swap quote
 */
export interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: string;
  fee: TransactionFee;
  estimatedTime: number;
  route?: string[];
}

/**
 * Chain configuration
 */
export interface ChainConfig {
  chain: BlockchainType;
  network: NetworkType;
  rpcUrl: string;
  explorerUrl: string;
  nativeAsset: AssetInfo;
  chainId?: number | string;
  enabled: boolean;
  supportsTokens: boolean;
  supportsNFTs: boolean;
}
