/**
 * Chain Configurations - Predefined blockchain configurations
 */

import {
  BlockchainType,
  NetworkType,
  ChainConfig,
  AssetType,
} from './types';

/**
 * Ethereum Mainnet Configuration
 */
export const ETHEREUM_MAINNET: ChainConfig = {
  chain: BlockchainType.ETHEREUM,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://eth.llamarpc.com',
  explorerUrl: 'https://etherscan.io',
  chainId: 1,
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chain: BlockchainType.ETHEREUM,
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    verified: true,
  },
  enabled: true,
  supportsTokens: true,
  supportsNFTs: true,
};

/**
 * BSC (Binance Smart Chain) Mainnet Configuration
 */
export const BSC_MAINNET: ChainConfig = {
  chain: BlockchainType.BSC,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://bsc-dataseed.binance.org',
  explorerUrl: 'https://bscscan.com',
  chainId: 56,
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    chain: BlockchainType.BSC,
    logoUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    verified: true,
  },
  enabled: true,
  supportsTokens: true,
  supportsNFTs: true,
};

/**
 * Polygon Mainnet Configuration
 */
export const POLYGON_MAINNET: ChainConfig = {
  chain: BlockchainType.POLYGON,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://polygon-rpc.com',
  explorerUrl: 'https://polygonscan.com',
  chainId: 137,
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    chain: BlockchainType.POLYGON,
    logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    verified: true,
  },
  enabled: true,
  supportsTokens: true,
  supportsNFTs: true,
};

/**
 * Avalanche C-Chain Mainnet Configuration
 */
export const AVALANCHE_MAINNET: ChainConfig = {
  chain: BlockchainType.AVALANCHE,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  explorerUrl: 'https://snowtrace.io',
  chainId: 43114,
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    chain: BlockchainType.AVALANCHE,
    logoUrl: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    verified: true,
  },
  enabled: true,
  supportsTokens: true,
  supportsNFTs: true,
};

/**
 * Arbitrum One Mainnet Configuration
 */
export const ARBITRUM_MAINNET: ChainConfig = {
  chain: BlockchainType.ARBITRUM,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  explorerUrl: 'https://arbiscan.io',
  chainId: 42161,
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chain: BlockchainType.ARBITRUM,
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    verified: true,
  },
  enabled: true,
  supportsTokens: true,
  supportsNFTs: true,
};

/**
 * Optimism Mainnet Configuration
 */
export const OPTIMISM_MAINNET: ChainConfig = {
  chain: BlockchainType.OPTIMISM,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://mainnet.optimism.io',
  explorerUrl: 'https://optimistic.etherscan.io',
  chainId: 10,
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chain: BlockchainType.OPTIMISM,
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    verified: true,
  },
  enabled: true,
  supportsTokens: true,
  supportsNFTs: true,
};

/**
 * Bitcoin Mainnet Configuration
 */
export const BITCOIN_MAINNET: ChainConfig = {
  chain: BlockchainType.BITCOIN,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://blockstream.info/api', // Placeholder
  explorerUrl: 'https://blockstream.info',
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    chain: BlockchainType.BITCOIN,
    logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    verified: true,
  },
  enabled: false, // Disabled by default until full implementation
  supportsTokens: false,
  supportsNFTs: false,
};

/**
 * Solana Mainnet Configuration
 */
export const SOLANA_MAINNET: ChainConfig = {
  chain: BlockchainType.SOLANA,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  explorerUrl: 'https://explorer.solana.com',
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    chain: BlockchainType.SOLANA,
    logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    verified: true,
  },
  enabled: false, // Disabled by default until full implementation
  supportsTokens: true,
  supportsNFTs: true,
};

/**
 * All available chain configurations
 */
export const CHAIN_CONFIGS: ChainConfig[] = [
  ETHEREUM_MAINNET,
  BSC_MAINNET,
  POLYGON_MAINNET,
  AVALANCHE_MAINNET,
  ARBITRUM_MAINNET,
  OPTIMISM_MAINNET,
  BITCOIN_MAINNET,
  SOLANA_MAINNET,
];

/**
 * Get chain configuration by blockchain type
 */
export function getChainConfig(
  chain: BlockchainType,
  network: NetworkType = NetworkType.MAINNET
): ChainConfig | undefined {
  return CHAIN_CONFIGS.find(
    (config) => config.chain === chain && config.network === network
  );
}

/**
 * Get all enabled chains
 */
export function getEnabledChains(): ChainConfig[] {
  return CHAIN_CONFIGS.filter((config) => config.enabled);
}
