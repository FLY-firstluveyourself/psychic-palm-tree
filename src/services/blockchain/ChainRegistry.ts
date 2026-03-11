/**
 * ChainRegistry - Central registry for blockchain adapters
 * 
 * This service manages all blockchain adapters and provides a unified
 * interface for interacting with multiple blockchains.
 */

import BlockchainAdapter from './BlockchainAdapter';
import EthereumAdapter from './adapters/EthereumAdapter';
import BitcoinAdapter from './adapters/BitcoinAdapter';
import SolanaAdapter from './adapters/SolanaAdapter';
import {
  BlockchainType,
  NetworkType,
  ChainConfig,
} from './types';
import {
  CHAIN_CONFIGS,
  getChainConfig,
  getEnabledChains,
} from './chainConfigs';

class ChainRegistry {
  private adapters: Map<string, BlockchainAdapter>;

  constructor() {
    this.adapters = new Map();
    this.initializeAdapters();
  }

  /**
   * Initialize all blockchain adapters
   */
  private initializeAdapters(): void {
    // Initialize enabled chains
    const enabledChains = getEnabledChains();

    for (const config of enabledChains) {
      try {
        const adapter = this.createAdapter(config);
        if (adapter) {
          const key = this.getAdapterKey(config.chain, config.network);
          this.adapters.set(key, adapter);
        }
      } catch (error) {
        console.error(`Failed to initialize adapter for ${config.chain}:`, error);
      }
    }
  }

  /**
   * Create an adapter instance for a chain configuration
   */
  private createAdapter(config: ChainConfig): BlockchainAdapter | null {
    switch (config.chain) {
      case BlockchainType.ETHEREUM:
      case BlockchainType.BSC:
      case BlockchainType.POLYGON:
      case BlockchainType.AVALANCHE:
      case BlockchainType.ARBITRUM:
      case BlockchainType.OPTIMISM:
        return new EthereumAdapter(config);

      case BlockchainType.BITCOIN:
        return new BitcoinAdapter(config);

      case BlockchainType.SOLANA:
        return new SolanaAdapter(config);

      default:
        console.warn(`No adapter implementation for ${config.chain}`);
        return null;
    }
  }

  /**
   * Get adapter key for caching
   */
  private getAdapterKey(chain: BlockchainType, network: NetworkType): string {
    return `${chain}-${network}`;
  }

  /**
   * Get adapter for a specific blockchain
   */
  getAdapter(
    chain: BlockchainType,
    network: NetworkType = NetworkType.MAINNET
  ): BlockchainAdapter | null {
    const key = this.getAdapterKey(chain, network);
    return this.adapters.get(key) || null;
  }

  /**
   * Register a new adapter (for custom chains)
   */
  registerAdapter(
    config: ChainConfig,
    adapter: BlockchainAdapter
  ): void {
    const key = this.getAdapterKey(config.chain, config.network);
    this.adapters.set(key, adapter);
  }

  /**
   * Check if a chain is supported
   */
  isChainSupported(
    chain: BlockchainType,
    network: NetworkType = NetworkType.MAINNET
  ): boolean {
    const key = this.getAdapterKey(chain, network);
    return this.adapters.has(key);
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): ChainConfig[] {
    return Array.from(this.adapters.values()).map(adapter => adapter.getConfig());
  }

  /**
   * Get all enabled chain configurations
   */
  getEnabledChainConfigs(): ChainConfig[] {
    return getEnabledChains();
  }

  /**
   * Get configuration for a specific chain
   */
  getChainConfig(
    chain: BlockchainType,
    network: NetworkType = NetworkType.MAINNET
  ): ChainConfig | undefined {
    return getChainConfig(chain, network);
  }

  /**
   * Enable a blockchain adapter
   */
  enableChain(
    chain: BlockchainType,
    network: NetworkType = NetworkType.MAINNET
  ): boolean {
    const config = getChainConfig(chain, network);
    if (!config) {
      console.error(`Configuration not found for ${chain}`);
      return false;
    }

    // If already enabled, return true
    if (this.isChainSupported(chain, network)) {
      return true;
    }

    // Enable and initialize adapter
    config.enabled = true;
    const adapter = this.createAdapter(config);
    
    if (adapter) {
      const key = this.getAdapterKey(chain, network);
      this.adapters.set(key, adapter);
      return true;
    }

    return false;
  }

  /**
   * Disable a blockchain adapter
   */
  disableChain(
    chain: BlockchainType,
    network: NetworkType = NetworkType.MAINNET
  ): void {
    const key = this.getAdapterKey(chain, network);
    this.adapters.delete(key);

    const config = getChainConfig(chain, network);
    if (config) {
      config.enabled = false;
    }
  }

  /**
   * Get all blockchain types
   */
  getAllBlockchainTypes(): BlockchainType[] {
    return Object.values(BlockchainType);
  }

  /**
   * Validate address for any supported chain
   */
  validateAddress(address: string, chain?: BlockchainType): {
    valid: boolean;
    chain?: BlockchainType;
  } {
    if (chain) {
      // Validate for specific chain
      const adapter = this.getAdapter(chain);
      if (adapter) {
        return {
          valid: adapter.validateAddress(address),
          chain: chain,
        };
      }
      return { valid: false };
    }

    // Try to detect chain from address format
    for (const adapter of this.adapters.values()) {
      if (adapter.validateAddress(address)) {
        return {
          valid: true,
          chain: adapter.getChain(),
        };
      }
    }

    return { valid: false };
  }
}

// Export singleton instance
const chainRegistry = new ChainRegistry();
export default chainRegistry;
