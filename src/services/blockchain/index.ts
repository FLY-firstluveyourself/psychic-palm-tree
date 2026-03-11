/**
 * Blockchain Integration - Unified Multi-Chain Support
 * 
 * This module provides a complete multi-chain integration engine with:
 * - Support for Ethereum, BSC, Polygon, and other EVM chains
 * - Bitcoin and Solana adapters (framework ready)
 * - Unified transaction abstraction layer
 * - Cross-chain bridge and swap support
 * - Extensible adapter system for easy addition of new chains
 */

// Core types
export * from './types';

// Chain configurations
export * from './chainConfigs';

// Blockchain adapter base class
export { default as BlockchainAdapter } from './BlockchainAdapter';

// Specific blockchain adapters
export { EthereumAdapter } from './adapters/EthereumAdapter';
export { BitcoinAdapter } from './adapters/BitcoinAdapter';
export { SolanaAdapter } from './adapters/SolanaAdapter';

// Core services
export { default as chainRegistry } from './ChainRegistry';
export { default as multiChainWalletService } from './MultiChainWalletService';
export { default as crossChainBridge } from './CrossChainBridge';
export type { BridgeProvider } from './CrossChainBridge';

/**
 * Quick Start Guide:
 * 
 * 1. Generate a multi-chain wallet:
 *    const { mnemonic, wallet } = await multiChainWalletService.generateMultiChainWallet();
 * 
 * 2. Get balances across all chains:
 *    const balances = await multiChainWalletService.getAllBalances(wallet);
 * 
 * 3. Send a transaction on a specific chain:
 *    const account = wallet.accounts.find(a => a.chain === BlockchainType.ETHEREUM);
 *    const result = await multiChainWalletService.sendTransaction(account, params, mnemonic);
 * 
 * 4. Get a cross-chain swap quote:
 *    const bestQuote = await crossChainBridge.getBestQuote(swapParams);
 * 
 * 5. Add support for a new blockchain:
 *    - Create a new adapter class extending BlockchainAdapter
 *    - Add chain configuration to chainConfigs.ts
 *    - Register in ChainRegistry.createAdapter()
 */
