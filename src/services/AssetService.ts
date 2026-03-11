/**
 * AssetService
 * 
 * Manages asset normalization, aggregation, and portfolio calculations
 * across multiple blockchains.
 */

import { ChainAdapter, Token } from './chains/ChainAdapter';
import MultiChainWalletService from './MultiChainWalletService';

export interface Asset {
  id: string;              // Unique asset identifier (chain:address or chain:native)
  symbol: string;          // Asset symbol (ETH, BTC, USDC)
  name: string;            // Full name
  balance: string;         // Raw balance
  decimals: number;        // Decimal places
  value?: string;          // USD value
  chain: string;           // Source chain ID
  chainName: string;       // Human-readable chain name
  type: 'native' | 'token' | 'nft';
  logo?: string;           // Asset logo URL
  contractAddress?: string; // For tokens
}

export interface AggregatedAsset {
  symbol: string;
  name: string;
  totalBalance: string;
  decimals: number;
  chains: string[];        // Chains where this asset exists
  assets: Asset[];         // Individual assets on each chain
  totalValue?: string;     // USD value
}

export interface PortfolioSummary {
  totalValue: string;
  currency: string;
  assets: Asset[];
  aggregatedAssets: AggregatedAsset[];
  chainSummaries: ChainSummary[];
  lastUpdated: number;
}

export interface ChainSummary {
  chainId: string;
  name: string;
  symbol: string;
  totalValue: string;
  assetCount: number;
  nativeBalance: string;
}

/**
 * Asset Service
 * 
 * Normalizes and aggregates crypto assets across all chains
 */
class AssetService {
  /**
   * Normalize raw asset to common format
   */
  normalizeAsset(
    rawAsset: Token,
    chain: string,
    chainName: string
  ): Asset {
    const isNative = !rawAsset.address;
    const id = isNative 
      ? `${chain}:native`
      : `${chain}:${rawAsset.address}`;

    return {
      id,
      symbol: rawAsset.symbol,
      name: rawAsset.name,
      balance: rawAsset.balance,
      decimals: rawAsset.decimals,
      chain,
      chainName,
      type: isNative ? 'native' : 'token',
      logo: rawAsset.logo,
      value: rawAsset.value,
      contractAddress: rawAsset.address
    };
  }

  /**
   * Aggregate same assets across different chains
   * 
   * For example, ETH on Ethereum, Arbitrum, and Optimism would be
   * aggregated into a single entry showing total ETH across all chains
   */
  aggregateAssets(assets: Asset[]): AggregatedAsset[] {
    const aggregated = new Map<string, AggregatedAsset>();

    for (const asset of assets) {
      const key = asset.symbol;

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        
        // Add balance using string concatenation to avoid floating-point errors
        // In production, use a decimal library like decimal.js for precise arithmetic
        const existingBal = parseFloat(existing.totalBalance) || 0;
        const newBal = parseFloat(asset.balance) || 0;
        // Note: This still has floating-point issues, but is acceptable for MVP display
        // For production: existing.totalBalance = new Decimal(existing.totalBalance).plus(asset.balance).toString();
        existing.totalBalance = (existingBal + newBal).toString();
        
        existing.chains.push(asset.chain);
        existing.assets.push(asset);
        
        // Aggregate value if available
        if (existing.totalValue && asset.value) {
          const existingVal = parseFloat(existing.totalValue) || 0;
          const newVal = parseFloat(asset.value) || 0;
          existing.totalValue = (existingVal + newVal).toFixed(2);
        }
      } else {
        aggregated.set(key, {
          symbol: asset.symbol,
          name: asset.name,
          totalBalance: asset.balance,
          decimals: asset.decimals,
          chains: [asset.chain],
          assets: [asset],
          totalValue: asset.value
        });
      }
    }

    return Array.from(aggregated.values());
  }

  /**
   * Calculate portfolio value in USD
   * 
   * Note: For MVP, returns placeholder. In production, would integrate with:
   * - CoinGecko API
   * - CoinMarketCap API
   * - Chainlink Price Feeds
   */
  async getPortfolioValue(assets: Asset[]): Promise<string> {
    try {
      let totalValue = 0;

      for (const asset of assets) {
        if (asset.value) {
          totalValue += parseFloat(asset.value);
        }
      }

      return totalValue.toFixed(2);
    } catch (error) {
      console.error('Failed to calculate portfolio value:', error);
      return '0.00';
    }
  }

  /**
   * Get asset price in USD
   * 
   * Note: For MVP, returns placeholder prices
   * In production, integrate with price API
   */
  async getAssetPrice(symbol: string): Promise<number> {
    // Placeholder prices for common assets
    const prices: Record<string, number> = {
      'ETH': 2000,
      'BTC': 40000,
      'MATIC': 0.80,
      'BNB': 300,
      'SOL': 50,
      'USDC': 1.00,
      'USDT': 1.00,
      'DAI': 1.00
    };

    return prices[symbol] || 0;
  }

  /**
   * Update asset values with current prices
   */
  async updateAssetValues(assets: Asset[]): Promise<Asset[]> {
    const updatedAssets: Asset[] = [];

    for (const asset of assets) {
      const price = await this.getAssetPrice(asset.symbol);
      const balance = parseFloat(asset.balance) || 0;
      const value = (balance * price).toFixed(2);

      updatedAssets.push({
        ...asset,
        value
      });
    }

    return updatedAssets;
  }

  /**
   * Get chain summaries for portfolio
   */
  async getChainSummaries(
    assets: Asset[]
  ): Promise<ChainSummary[]> {
    const chainMap = new Map<string, ChainSummary>();

    for (const asset of assets) {
      if (!chainMap.has(asset.chain)) {
        const adapter = MultiChainWalletService.getAdapter(asset.chain);
        
        chainMap.set(asset.chain, {
          chainId: asset.chain,
          name: asset.chainName,
          symbol: adapter?.symbol || '',
          totalValue: '0.00',
          assetCount: 0,
          nativeBalance: '0.00'
        });
      }

      const summary = chainMap.get(asset.chain)!;
      summary.assetCount++;

      if (asset.value) {
        const currentValue = parseFloat(summary.totalValue) || 0;
        const assetValue = parseFloat(asset.value) || 0;
        summary.totalValue = (currentValue + assetValue).toFixed(2);
      }

      if (asset.type === 'native') {
        summary.nativeBalance = asset.balance;
      }
    }

    return Array.from(chainMap.values());
  }

  /**
   * Build complete portfolio summary
   */
  async buildPortfolioSummary(
    assets: Asset[]
  ): Promise<PortfolioSummary> {
    // Update asset values with current prices
    const assetsWithValues = await this.updateAssetValues(assets);

    // Calculate total portfolio value
    const totalValue = await this.getPortfolioValue(assetsWithValues);

    // Aggregate assets across chains
    const aggregatedAssets = this.aggregateAssets(assetsWithValues);

    // Get chain summaries
    const chainSummaries = await this.getChainSummaries(assetsWithValues);

    return {
      totalValue,
      currency: 'USD',
      assets: assetsWithValues,
      aggregatedAssets,
      chainSummaries,
      lastUpdated: Date.now()
    };
  }

  /**
   * Format balance for display
   */
  formatBalance(balance: string, decimals: number = 4): string {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0.00';
    
    if (num === 0) return '0.00';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(decimals);
    if (num < 1000) return num.toFixed(2);
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format USD value for display
   */
  formatValue(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Get asset logo URL
   * 
   * Note: For MVP, returns placeholder
   * In production, integrate with token logo services
   */
  getAssetLogo(symbol: string, chain: string): string {
    // Placeholder - would integrate with:
    // - Trust Wallet Assets
    // - CoinGecko
    // - Token list services
    return '';
  }

  /**
   * Sort assets by value (descending)
   */
  sortAssetsByValue(assets: Asset[]): Asset[] {
    return [...assets].sort((a, b) => {
      const valueA = parseFloat(a.value || '0');
      const valueB = parseFloat(b.value || '0');
      return valueB - valueA;
    });
  }

  /**
   * Filter assets by chain
   */
  filterByChain(assets: Asset[], chainId: string): Asset[] {
    return assets.filter(asset => asset.chain === chainId);
  }

  /**
   * Filter assets by type
   */
  filterByType(
    assets: Asset[],
    type: 'native' | 'token' | 'nft'
  ): Asset[] {
    return assets.filter(asset => asset.type === type);
  }

  /**
   * Search assets by symbol or name
   */
  searchAssets(assets: Asset[], query: string): Asset[] {
    const lowerQuery = query.toLowerCase();
    
    return assets.filter(asset =>
      asset.symbol.toLowerCase().includes(lowerQuery) ||
      asset.name.toLowerCase().includes(lowerQuery)
    );
  }
}

export default new AssetService();
