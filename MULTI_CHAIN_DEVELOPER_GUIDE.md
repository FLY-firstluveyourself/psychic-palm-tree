# Multi-Chain Integration Engine - Developer Guide

## Overview

The Multi-Chain Integration Engine provides a unified backend for managing multiple blockchain networks. This guide explains the architecture and how to add support for new blockchains.

## Architecture

### Core Components

1. **BlockchainAdapter** - Abstract base class that defines the interface all blockchain adapters must implement
2. **ChainRegistry** - Central registry that manages all blockchain adapters
3. **MultiChainWalletService** - Unified wallet service for multi-chain operations
4. **CrossChainBridge** - Interface for cross-chain swaps and bridges

### Type System

All blockchain operations use unified types defined in `types.ts`:

- `BlockchainType` - Enumeration of supported blockchains
- `UnifiedTransaction` - Standardized transaction format across all chains
- `ChainAccount` - Account representation for a specific blockchain
- `Balance` - Balance information with asset details
- `AssetInfo` - Token/asset metadata

## Adding a New Blockchain

### Step 1: Add Blockchain Type

Edit `src/services/blockchain/types.ts`:

```typescript
export enum BlockchainType {
  // ... existing chains
  YOUR_CHAIN = 'your-chain',
}
```

### Step 2: Create Chain Configuration

Edit `src/services/blockchain/chainConfigs.ts`:

```typescript
export const YOUR_CHAIN_MAINNET: ChainConfig = {
  chain: BlockchainType.YOUR_CHAIN,
  network: NetworkType.MAINNET,
  rpcUrl: 'https://your-chain-rpc-url.com',
  explorerUrl: 'https://your-chain-explorer.com',
  chainId: 12345, // Optional, for EVM chains
  nativeAsset: {
    type: AssetType.NATIVE,
    symbol: 'YCH',
    name: 'Your Chain Token',
    decimals: 18,
    chain: BlockchainType.YOUR_CHAIN,
    verified: true,
  },
  enabled: true,
  supportsTokens: true,
  supportsNFTs: false,
};

// Add to CHAIN_CONFIGS array
export const CHAIN_CONFIGS: ChainConfig[] = [
  // ... existing configs
  YOUR_CHAIN_MAINNET,
];
```

### Step 3: Create Blockchain Adapter

Create `src/services/blockchain/adapters/YourChainAdapter.ts`:

```typescript
import BlockchainAdapter from '../BlockchainAdapter';
import {
  ChainConfig,
  ChainAccount,
  Balance,
  UnifiedTransaction,
  SendTransactionParams,
  TransactionResult,
  AssetInfo,
  TransactionFee,
} from '../types';

export class YourChainAdapter extends BlockchainAdapter {
  private provider: any; // Your chain's provider/client

  constructor(config: ChainConfig) {
    super(config);
    // Initialize your chain's provider
    this.provider = new YourChainProvider(config.rpcUrl);
  }

  async generateAccount(
    mnemonic: string,
    derivationPath?: string
  ): Promise<ChainAccount> {
    // Implement account generation from BIP39 mnemonic
    // Use your chain's derivation path (e.g., m/44'/COIN_TYPE'/0'/0/0)
    const path = derivationPath || "m/44'/YOUR_COIN_TYPE'/0'/0/0";
    
    // Generate keypair from mnemonic
    const keypair = yourChainGenerateKeypair(mnemonic, path);
    
    return {
      chain: this.chain,
      network: this.network,
      address: keypair.address,
      publicKey: keypair.publicKey,
      derivationPath: path,
    };
  }

  async importAccount(privateKey: string): Promise<ChainAccount> {
    // Import account from private key
    const account = yourChainImportPrivateKey(privateKey);
    
    return {
      chain: this.chain,
      network: this.network,
      address: account.address,
      publicKey: account.publicKey,
    };
  }

  validateAddress(address: string): boolean {
    // Implement address validation for your chain
    return yourChainValidateAddress(address);
  }

  async getBalance(address: string): Promise<Balance> {
    try {
      const balance = await this.provider.getBalance(address);
      const formatted = this.formatAmount(balance, this.config.nativeAsset.decimals);

      return {
        asset: this.getNativeAsset(),
        amount: formatted,
      };
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return {
        asset: this.getNativeAsset(),
        amount: '0',
      };
    }
  }

  async getAllBalances(address: string): Promise<Balance[]> {
    const balances: Balance[] = [];
    
    // Get native balance
    const nativeBalance = await this.getBalance(address);
    balances.push(nativeBalance);

    // Get token balances if supported
    if (this.supportsTokens()) {
      const tokens = await this.detectTokens(address);
      for (const token of tokens) {
        if (token.contractAddress) {
          const tokenBalance = await this.getTokenBalance(address, token.contractAddress);
          if (parseFloat(tokenBalance.amount) > 0) {
            balances.push(tokenBalance);
          }
        }
      }
    }

    return balances;
  }

  async getTokenBalance(
    address: string,
    tokenAddress: string
  ): Promise<Balance> {
    // Implement token balance fetching
    // This depends on your chain's token standard
    throw new Error('Token balance not implemented');
  }

  async sendTransaction(
    params: SendTransactionParams,
    privateKey: string
  ): Promise<TransactionResult> {
    try {
      // Build and sign transaction
      const tx = await this.buildTransaction(params, privateKey);
      
      // Send transaction
      const hash = await this.provider.sendTransaction(tx);
      
      // Wait for confirmation
      const receipt = await this.provider.waitForTransaction(hash);

      const unifiedTx: UnifiedTransaction = {
        id: hash,
        chain: this.chain,
        network: this.network,
        from: params.from,
        to: params.to,
        amount: params.amount,
        asset: params.asset || this.getNativeAsset(),
        fee: {
          amount: receipt.fee,
          asset: this.getNativeAsset(),
        },
        status: receipt.success ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED,
        timestamp: Date.now(),
        hash,
        confirmations: 1,
      };

      return {
        success: receipt.success,
        hash,
        transaction: unifiedTx,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  async estimateFee(params: SendTransactionParams): Promise<TransactionFee> {
    // Estimate transaction fee
    const fee = await this.provider.estimateFee(params);
    
    return {
      amount: this.formatAmount(fee, this.config.nativeAsset.decimals),
      asset: this.getNativeAsset(),
    };
  }

  async getTransaction(hash: string): Promise<UnifiedTransaction | null> {
    // Get transaction by hash and convert to unified format
    const tx = await this.provider.getTransaction(hash);
    if (!tx) return null;

    return {
      id: hash,
      chain: this.chain,
      network: this.network,
      from: tx.from,
      to: tx.to,
      amount: this.formatAmount(tx.amount, this.config.nativeAsset.decimals),
      asset: this.getNativeAsset(),
      fee: {
        amount: this.formatAmount(tx.fee, this.config.nativeAsset.decimals),
        asset: this.getNativeAsset(),
      },
      status: tx.status,
      timestamp: tx.timestamp,
      hash,
      confirmations: tx.confirmations,
    };
  }

  async getTransactionHistory(
    address: string,
    limit: number = 50
  ): Promise<UnifiedTransaction[]> {
    // Get transaction history from blockchain explorer API or indexer
    const txs = await this.provider.getTransactionHistory(address, limit);
    
    return txs.map(tx => this.convertToUnifiedTransaction(tx));
  }

  async detectTokens(address: string): Promise<AssetInfo[]> {
    // Detect tokens held by address
    // Use blockchain explorer API or indexer
    return [];
  }

  async getAssetInfo(assetIdentifier: string): Promise<AssetInfo | null> {
    // Get token/asset metadata
    return null;
  }
}

export default YourChainAdapter;
```

### Step 4: Register Adapter in ChainRegistry

Edit `src/services/blockchain/ChainRegistry.ts`:

```typescript
import YourChainAdapter from './adapters/YourChainAdapter';

class ChainRegistry {
  // ... existing code

  private createAdapter(config: ChainConfig): BlockchainAdapter | null {
    switch (config.chain) {
      // ... existing cases
      
      case BlockchainType.YOUR_CHAIN:
        return new YourChainAdapter(config);

      default:
        console.warn(`No adapter implementation for ${config.chain}`);
        return null;
    }
  }
}
```

### Step 5: Test Your Adapter

Create tests in `src/services/blockchain/__tests__/YourChainAdapter.test.ts`:

```typescript
import { expect, test, describe } from 'vitest';
import chainRegistry from '../ChainRegistry';
import { BlockchainType } from '../types';

describe('YourChain Adapter', () => {
  test('should be registered in chain registry', () => {
    const adapter = chainRegistry.getAdapter(BlockchainType.YOUR_CHAIN);
    expect(adapter).toBeDefined();
  });

  test('should validate addresses', () => {
    const adapter = chainRegistry.getAdapter(BlockchainType.YOUR_CHAIN);
    expect(adapter?.validateAddress('valid-address')).toBe(true);
    expect(adapter?.validateAddress('invalid')).toBe(false);
  });

  test('should generate account from mnemonic', async () => {
    const adapter = chainRegistry.getAdapter(BlockchainType.YOUR_CHAIN);
    const mnemonic = 'test walk nut penalty hip pave soap entry language right filter choice';
    
    const account = await adapter?.generateAccount(mnemonic);
    expect(account).toBeDefined();
    expect(account?.address).toBeDefined();
  });
});
```

## Integration Patterns

### Using with MultiChainWalletService

```typescript
import multiChainWalletService from './services/blockchain/MultiChainWalletService';
import { BlockchainType } from './services/blockchain/types';

// Generate wallet with your chain
const { mnemonic, wallet } = await multiChainWalletService.generateMultiChainWallet([
  BlockchainType.ETHEREUM,
  BlockchainType.YOUR_CHAIN,
]);

// Get account for your chain
const account = multiChainWalletService.getAccountForChain(
  wallet,
  BlockchainType.YOUR_CHAIN
);

// Get balance
const balance = await multiChainWalletService.getAccountBalance(account);

// Send transaction
const result = await multiChainWalletService.sendTransaction(
  account,
  {
    from: account.address,
    to: 'recipient-address',
    amount: '1.0',
  },
  mnemonic
);
```

## Best Practices

1. **Error Handling**: Always wrap blockchain calls in try-catch blocks
2. **Rate Limiting**: Implement rate limiting for RPC calls
3. **Caching**: Cache frequently accessed data (balances, token lists)
4. **Testing**: Write comprehensive tests for all adapter methods
5. **Documentation**: Document chain-specific quirks and limitations
6. **Security**: Never log private keys or mnemonics
7. **Validation**: Always validate addresses and amounts before transactions

## Common Pitfalls

1. **Derivation Paths**: Each chain has its own BIP44 coin type number
2. **Decimal Places**: Different chains use different decimal places (8 for BTC, 18 for ETH, 9 for SOL)
3. **Transaction Formats**: Each chain has its own transaction structure
4. **Fee Calculation**: Fee models vary significantly between chains
5. **Address Formats**: Validate addresses according to chain-specific rules

## External Dependencies

When adding support for a new chain, you'll likely need:

1. **SDK/Library**: The official JavaScript SDK for the blockchain
2. **RPC Provider**: Access to RPC nodes (public or private)
3. **Explorer API**: For transaction history and token detection
4. **Derivation Library**: For generating keys from mnemonics (typically bip39 + chain-specific library)

## Example: Adding Cardano Support

```bash
# Install Cardano dependencies
npm install @emurgo/cardano-serialization-lib-browser

# Create adapter
# src/services/blockchain/adapters/CardanoAdapter.ts

# Add configuration
# src/services/blockchain/chainConfigs.ts

# Register in ChainRegistry
# src/services/blockchain/ChainRegistry.ts

# Test
npm test -- blockchain.test.ts
```

## Support

For questions or issues:
1. Check existing adapter implementations (EthereumAdapter is the most complete)
2. Review the BlockchainAdapter abstract class for required methods
3. Consult blockchain-specific documentation for integration details

## Resources

- [BIP39 Spec](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP44 Spec](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [Ethereum JSON-RPC](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [Bitcoin RPC](https://developer.bitcoin.org/reference/rpc/)
- [Solana RPC](https://docs.solana.com/api)
