/**
 * CrossChainBridge - Interface for cross-chain swaps and bridges
 * 
 * This provides the foundation for integrating with DEX aggregators
 * and cross-chain bridge protocols like Li.Fi, Stargate, etc.
 */

import {
  BlockchainType,
  SwapParams,
  SwapQuote,
  TransactionResult,
  AssetInfo,
  TransactionFee,
} from './types';
import chainRegistry from './ChainRegistry';

/**
 * Bridge provider interface
 */
export interface BridgeProvider {
  name: string;
  supportedChains: BlockchainType[];
  
  /**
   * Get quote for a cross-chain swap
   */
  getQuote(params: SwapParams): Promise<SwapQuote | null>;
  
  /**
   * Execute a cross-chain swap
   */
  executeSwap(
    params: SwapParams,
    fromPrivateKey: string,
    quote: SwapQuote
  ): Promise<TransactionResult>;
  
  /**
   * Check if a swap route is supported
   */
  isRouteSupported(
    fromChain: BlockchainType,
    toChain: BlockchainType,
    fromAsset: AssetInfo,
    toAsset: AssetInfo
  ): Promise<boolean>;
}

/**
 * CrossChainBridge service
 */
class CrossChainBridge {
  private providers: Map<string, BridgeProvider>;

  constructor() {
    this.providers = new Map();
  }

  /**
   * Register a bridge provider
   */
  registerProvider(provider: BridgeProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get all registered providers
   */
  getProviders(): BridgeProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get quote from all providers and return the best one
   */
  async getBestQuote(params: SwapParams): Promise<{
    quote: SwapQuote;
    provider: string;
  } | null> {
    const quotes: Array<{ quote: SwapQuote; provider: string }> = [];

    // Get quotes from all providers in parallel
    const quotePromises = Array.from(this.providers.entries()).map(
      async ([name, provider]) => {
        try {
          const quote = await provider.getQuote(params);
          if (quote) {
            return { quote, provider: name };
          }
        } catch (error) {
          console.error(`Failed to get quote from ${name}:`, error);
        }
        return null;
      }
    );

    const results = await Promise.all(quotePromises);
    quotes.push(...results.filter((r): r is { quote: SwapQuote; provider: string } => r !== null));

    if (quotes.length === 0) {
      return null;
    }

    // Find best quote (highest output amount)
    quotes.sort((a, b) => {
      const aAmount = parseFloat(a.quote.toAmount);
      const bAmount = parseFloat(b.quote.toAmount);
      return bAmount - aAmount;
    });

    return quotes[0];
  }

  /**
   * Execute swap using a specific provider
   */
  async executeSwap(
    params: SwapParams,
    fromPrivateKey: string,
    providerName: string,
    quote: SwapQuote
  ): Promise<TransactionResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return {
        success: false,
        error: `Provider ${providerName} not found`,
      };
    }

    try {
      return await provider.executeSwap(params, fromPrivateKey, quote);
    } catch (error: any) {
      console.error('Swap execution failed:', error);
      return {
        success: false,
        error: error.message || 'Swap execution failed',
      };
    }
  }

  /**
   * Check if a swap route is supported by any provider
   */
  async isRouteSupported(
    fromChain: BlockchainType,
    toChain: BlockchainType,
    fromAsset: AssetInfo,
    toAsset: AssetInfo
  ): Promise<boolean> {
    for (const provider of this.providers.values()) {
      try {
        const supported = await provider.isRouteSupported(
          fromChain,
          toChain,
          fromAsset,
          toAsset
        );
        if (supported) {
          return true;
        }
      } catch (error) {
        console.error(`Failed to check route support for ${provider.name}:`, error);
      }
    }
    return false;
  }

  /**
   * Get supported chains across all providers
   */
  getSupportedChains(): Set<BlockchainType> {
    const chains = new Set<BlockchainType>();
    
    for (const provider of this.providers.values()) {
      provider.supportedChains.forEach(chain => chains.add(chain));
    }
    
    return chains;
  }
}

/**
 * Mock DEX provider for demonstration
 * In production, this would integrate with Li.Fi, 1inch, etc.
 */
export class MockDEXProvider implements BridgeProvider {
  name = 'MockDEX';
  supportedChains = [
    BlockchainType.ETHEREUM,
    BlockchainType.BSC,
    BlockchainType.POLYGON,
  ];

  async getQuote(params: SwapParams): Promise<SwapQuote | null> {
    // Mock quote with 1% fee
    const inputAmount = parseFloat(params.amount);
    const outputAmount = (inputAmount * 0.99).toString();

    return {
      fromAmount: params.amount,
      toAmount: outputAmount,
      rate: '0.99',
      fee: {
        amount: (inputAmount * 0.01).toString(),
        asset: params.fromAsset,
      },
      estimatedTime: 300, // 5 minutes
      route: [params.fromChain, params.toChain],
    };
  }

  async executeSwap(
    params: SwapParams,
    fromPrivateKey: string,
    quote: SwapQuote
  ): Promise<TransactionResult> {
    // Mock implementation
    console.warn('MockDEXProvider: Swap execution not implemented');
    return {
      success: false,
      error: 'Mock provider - not implemented',
    };
  }

  async isRouteSupported(
    fromChain: BlockchainType,
    toChain: BlockchainType,
    fromAsset: AssetInfo,
    toAsset: AssetInfo
  ): Promise<boolean> {
    return (
      this.supportedChains.includes(fromChain) &&
      this.supportedChains.includes(toChain)
    );
  }
}

// Export singleton instance
const crossChainBridge = new CrossChainBridge();

// Register mock provider for demonstration
crossChainBridge.registerProvider(new MockDEXProvider());

export default crossChainBridge;
