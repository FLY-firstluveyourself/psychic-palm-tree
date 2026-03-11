# Multi-Chain Integration Engine - API Reference

## Table of Contents

1. [Core Services](#core-services)
2. [Chain Registry](#chain-registry)
3. [Multi-Chain Wallet Service](#multi-chain-wallet-service)
4. [Cross-Chain Bridge](#cross-chain-bridge)
5. [Blockchain Adapters](#blockchain-adapters)
6. [Type Definitions](#type-definitions)

## Core Services

### Importing

```typescript
import {
  chainRegistry,
  multiChainWalletService,
  crossChainBridge,
  BlockchainType,
  NetworkType,
} from './services/blockchain';
```

## Chain Registry

Central registry for managing blockchain adapters.

### Methods

#### `getAdapter(chain, network?)`

Get adapter for a specific blockchain.

```typescript
const adapter = chainRegistry.getAdapter(
  BlockchainType.ETHEREUM,
  NetworkType.MAINNET
);
```

**Parameters:**
- `chain: BlockchainType` - The blockchain type
- `network?: NetworkType` - Network type (default: MAINNET)

**Returns:** `BlockchainAdapter | null`

#### `isChainSupported(chain, network?)`

Check if a blockchain is supported.

```typescript
const isSupported = chainRegistry.isChainSupported(BlockchainType.ETHEREUM);
```

**Returns:** `boolean`

#### `getSupportedChains()`

Get all supported chain configurations.

```typescript
const chains = chainRegistry.getSupportedChains();
```

**Returns:** `ChainConfig[]`

#### `getChainConfig(chain, network?)`

Get configuration for a specific chain.

```typescript
const config = chainRegistry.getChainConfig(BlockchainType.ETHEREUM);
```

**Returns:** `ChainConfig | undefined`

#### `enableChain(chain, network?)`

Enable a blockchain adapter.

```typescript
const success = chainRegistry.enableChain(BlockchainType.BITCOIN);
```

**Returns:** `boolean`

#### `disableChain(chain, network?)`

Disable a blockchain adapter.

```typescript
chainRegistry.disableChain(BlockchainType.BITCOIN);
```

#### `validateAddress(address, chain?)`

Validate an address for any supported chain.

```typescript
const result = chainRegistry.validateAddress(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  BlockchainType.ETHEREUM
);
// Returns: { valid: boolean, chain?: BlockchainType }
```

## Multi-Chain Wallet Service

Unified wallet service for multi-chain operations.

### Methods

#### `generateMultiChainWallet(chains?)`

Generate a new multi-chain wallet.

```typescript
const { mnemonic, wallet } = await multiChainWalletService.generateMultiChainWallet([
  BlockchainType.ETHEREUM,
  BlockchainType.BSC,
  BlockchainType.POLYGON,
]);
```

**Parameters:**
- `chains?: BlockchainType[]` - Specific chains to generate (default: all enabled)

**Returns:** `Promise<{ mnemonic: string, wallet: UnifiedWallet }>`

#### `restoreMultiChainWallet(mnemonic, chains?)`

Restore wallet from mnemonic.

```typescript
const wallet = await multiChainWalletService.restoreMultiChainWallet(
  'your twelve word seed phrase here...',
  [BlockchainType.ETHEREUM]
);
```

**Parameters:**
- `mnemonic: string` - BIP39 seed phrase
- `chains?: BlockchainType[]` - Chains to restore (default: all enabled)

**Returns:** `Promise<UnifiedWallet>`

#### `saveMultiChainWallet(wallet, mnemonic, pin)`

Save wallet to encrypted storage.

```typescript
await multiChainWalletService.saveMultiChainWallet(
  wallet,
  mnemonic,
  '123456'
);
```

**Parameters:**
- `wallet: UnifiedWallet` - Wallet to save
- `mnemonic: string` - Seed phrase (will be encrypted)
- `pin: string` - PIN for encryption

**Returns:** `Promise<void>`

#### `getMultiChainWallet(walletId, pin)`

Retrieve wallet from storage.

```typescript
const result = await multiChainWalletService.getMultiChainWallet(
  walletId,
  '123456'
);

if (result) {
  const { wallet, mnemonic } = result;
}
```

**Parameters:**
- `walletId: string` - Wallet identifier
- `pin: string` - Decryption PIN

**Returns:** `Promise<{ wallet: UnifiedWallet, mnemonic: string } | null>`

#### `getAccountBalance(account)`

Get balance for a specific chain account.

```typescript
const balance = await multiChainWalletService.getAccountBalance(account);
console.log(`${balance.amount} ${balance.asset.symbol}`);
```

**Parameters:**
- `account: ChainAccount` - The account to check

**Returns:** `Promise<Balance | null>`

#### `getAllBalances(wallet)`

Get balances across all chains.

```typescript
const balances = await multiChainWalletService.getAllBalances(wallet);

for (const [chain, chainBalances] of balances.entries()) {
  console.log(`${chain}:`);
  for (const balance of chainBalances) {
    console.log(`  ${balance.amount} ${balance.asset.symbol}`);
  }
}
```

**Parameters:**
- `wallet: UnifiedWallet` - Multi-chain wallet

**Returns:** `Promise<Map<BlockchainType, Balance[]>>`

#### `sendTransaction(account, params, mnemonic)`

Send transaction on a specific chain.

```typescript
const result = await multiChainWalletService.sendTransaction(
  ethAccount,
  {
    from: ethAccount.address,
    to: '0x...',
    amount: '0.1',
    asset: ethAsset, // Optional, defaults to native
  },
  mnemonic
);

if (result.success) {
  console.log('Transaction hash:', result.hash);
}
```

**Parameters:**
- `account: ChainAccount` - Account to send from
- `params: SendTransactionParams` - Transaction parameters
- `mnemonic: string` - Seed phrase for signing

**Returns:** `Promise<TransactionResult>`

#### `estimateFee(account, params)`

Estimate transaction fee.

```typescript
const fee = await multiChainWalletService.estimateFee(ethAccount, {
  from: ethAccount.address,
  to: '0x...',
  amount: '0.1',
});

console.log(`Estimated fee: ${fee.amount} ${fee.asset.symbol}`);
```

**Parameters:**
- `account: ChainAccount` - Account for the transaction
- `params: SendTransactionParams` - Transaction parameters

**Returns:** `Promise<TransactionFee | null>`

#### `getTransactionHistory(account, limit?)`

Get transaction history for an account.

```typescript
const txs = await multiChainWalletService.getTransactionHistory(
  ethAccount,
  50
);
```

**Parameters:**
- `account: ChainAccount` - Account to query
- `limit?: number` - Max transactions (default: 50)

**Returns:** `Promise<UnifiedTransaction[]>`

#### `detectTokens(account)`

Detect tokens held by an account.

```typescript
const tokens = await multiChainWalletService.detectTokens(ethAccount);

for (const token of tokens) {
  console.log(`${token.name} (${token.symbol})`);
}
```

**Parameters:**
- `account: ChainAccount` - Account to scan

**Returns:** `Promise<AssetInfo[]>`

#### `getAccountForChain(wallet, chain, network?)`

Get account for a specific chain from wallet.

```typescript
const ethAccount = multiChainWalletService.getAccountForChain(
  wallet,
  BlockchainType.ETHEREUM
);
```

**Parameters:**
- `wallet: UnifiedWallet` - Multi-chain wallet
- `chain: BlockchainType` - Chain to get account for
- `network?: NetworkType` - Network type (default: MAINNET)

**Returns:** `ChainAccount | null`

#### `validateAddress(address, chain?)`

Validate an address.

```typescript
const isValid = multiChainWalletService.validateAddress(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  BlockchainType.ETHEREUM
);
```

**Parameters:**
- `address: string` - Address to validate
- `chain?: BlockchainType` - Specific chain (optional)

**Returns:** `boolean`

## Cross-Chain Bridge

Interface for cross-chain swaps and bridges.

### Methods

#### `getBestQuote(params)`

Get best swap quote from all providers.

```typescript
const result = await crossChainBridge.getBestQuote({
  fromChain: BlockchainType.ETHEREUM,
  toChain: BlockchainType.BSC,
  fromAsset: ethAsset,
  toAsset: bnbAsset,
  amount: '1.0',
  fromAddress: ethAccount.address,
  toAddress: bscAccount.address,
  slippage: 0.5, // 0.5%
});

if (result) {
  const { quote, provider } = result;
  console.log(`Best rate from ${provider}: ${quote.rate}`);
}
```

**Parameters:**
- `params: SwapParams` - Swap parameters

**Returns:** `Promise<{ quote: SwapQuote, provider: string } | null>`

#### `executeSwap(params, privateKey, providerName, quote)`

Execute a cross-chain swap.

```typescript
const result = await crossChainBridge.executeSwap(
  swapParams,
  privateKey,
  'MockDEX',
  quote
);
```

**Parameters:**
- `params: SwapParams` - Swap parameters
- `privateKey: string` - Private key for signing
- `providerName: string` - Provider to use
- `quote: SwapQuote` - Quote from getBestQuote

**Returns:** `Promise<TransactionResult>`

#### `isRouteSupported(fromChain, toChain, fromAsset, toAsset)`

Check if a swap route is supported.

```typescript
const supported = await crossChainBridge.isRouteSupported(
  BlockchainType.ETHEREUM,
  BlockchainType.BSC,
  ethAsset,
  bnbAsset
);
```

**Returns:** `Promise<boolean>`

#### `registerProvider(provider)`

Register a custom bridge provider.

```typescript
class MyDEXProvider implements BridgeProvider {
  name = 'MyDEX';
  supportedChains = [BlockchainType.ETHEREUM, BlockchainType.BSC];
  
  async getQuote(params: SwapParams): Promise<SwapQuote | null> {
    // Implementation
  }
  
  // ... other methods
}

crossChainBridge.registerProvider(new MyDEXProvider());
```

## Blockchain Adapters

### Common Methods (All Adapters)

Each blockchain adapter implements these methods:

#### `generateAccount(mnemonic, derivationPath?)`

Generate account from mnemonic.

```typescript
const adapter = chainRegistry.getAdapter(BlockchainType.ETHEREUM);
const account = await adapter.generateAccount(mnemonic);
```

#### `importAccount(privateKey)`

Import account from private key.

```typescript
const account = await adapter.importAccount(privateKey);
```

#### `validateAddress(address)`

Validate address format.

```typescript
const isValid = adapter.validateAddress('0x...');
```

#### `getBalance(address)`

Get native balance.

```typescript
const balance = await adapter.getBalance(address);
```

#### `getAllBalances(address)`

Get all balances (native + tokens).

```typescript
const balances = await adapter.getAllBalances(address);
```

#### `getTokenBalance(address, tokenAddress)`

Get specific token balance.

```typescript
const balance = await adapter.getTokenBalance(
  userAddress,
  tokenContractAddress
);
```

#### `sendTransaction(params, privateKey)`

Send transaction.

```typescript
const result = await adapter.sendTransaction(params, privateKey);
```

#### `estimateFee(params)`

Estimate transaction fee.

```typescript
const fee = await adapter.estimateFee(params);
```

#### `getTransaction(hash)`

Get transaction by hash.

```typescript
const tx = await adapter.getTransaction(txHash);
```

#### `getTransactionHistory(address, limit?)`

Get transaction history.

```typescript
const txs = await adapter.getTransactionHistory(address, 50);
```

#### `detectTokens(address)`

Detect tokens held by address.

```typescript
const tokens = await adapter.detectTokens(address);
```

#### `getAssetInfo(assetIdentifier)`

Get asset/token information.

```typescript
const info = await adapter.getAssetInfo(tokenAddress);
```

## Type Definitions

### BlockchainType

```typescript
enum BlockchainType {
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
  SOLANA = 'solana',
  BSC = 'bsc',
  POLYGON = 'polygon',
  AVALANCHE = 'avalanche',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
}
```

### NetworkType

```typescript
enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
}
```

### UnifiedWallet

```typescript
interface UnifiedWallet {
  id: string;
  name: string;
  accounts: ChainAccount[];
  createdAt: number;
  isMain: boolean;
}
```

### ChainAccount

```typescript
interface ChainAccount {
  chain: BlockchainType;
  network: NetworkType;
  address: string;
  publicKey?: string;
  derivationPath?: string;
  encryptedPrivateKey?: string;
}
```

### Balance

```typescript
interface Balance {
  asset: AssetInfo;
  amount: string;
  usdValue?: string;
}
```

### AssetInfo

```typescript
interface AssetInfo {
  type: AssetType;
  symbol: string;
  name: string;
  decimals: number;
  chain: BlockchainType;
  contractAddress?: string;
  logoUrl?: string;
  verified?: boolean;
}
```

### SendTransactionParams

```typescript
interface SendTransactionParams {
  from: string;
  to: string;
  amount: string;
  asset?: AssetInfo;
  memo?: string;
  gasLimit?: string;
  gasPrice?: string;
  priority?: 'low' | 'medium' | 'high';
}
```

### TransactionResult

```typescript
interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  transaction?: UnifiedTransaction;
}
```

### UnifiedTransaction

```typescript
interface UnifiedTransaction {
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
```

### SwapParams

```typescript
interface SwapParams {
  fromChain: BlockchainType;
  toChain: BlockchainType;
  fromAsset: AssetInfo;
  toAsset: AssetInfo;
  amount: string;
  fromAddress: string;
  toAddress: string;
  slippage?: number;
}
```

### SwapQuote

```typescript
interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: string;
  fee: TransactionFee;
  estimatedTime: number;
  route?: string[];
}
```

## Error Handling

All async methods can throw errors. Always use try-catch:

```typescript
try {
  const result = await multiChainWalletService.sendTransaction(
    account,
    params,
    mnemonic
  );
  
  if (!result.success) {
    console.error('Transaction failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Best Practices

1. **Always validate addresses** before sending transactions
2. **Estimate fees** before executing transactions
3. **Handle errors gracefully** with try-catch blocks
4. **Never log sensitive data** (private keys, mnemonics)
5. **Use appropriate networks** (testnet for testing)
6. **Cache data** when appropriate to reduce RPC calls
7. **Implement rate limiting** for RPC endpoints

## Examples

See [MULTI_CHAIN_DEVELOPER_GUIDE.md](./MULTI_CHAIN_DEVELOPER_GUIDE.md) for comprehensive examples and integration patterns.
