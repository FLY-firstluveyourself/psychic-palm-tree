/**
 * Multi-Chain Integration Examples
 * 
 * This file demonstrates common usage patterns for the multi-chain integration engine.
 */

import multiChainWalletService from './services/blockchain/MultiChainWalletService';
import chainRegistry from './services/blockchain/ChainRegistry';
import crossChainBridge from './services/blockchain/CrossChainBridge';
import { BlockchainType, NetworkType, AssetType } from './services/blockchain/types';

/**
 * Example 1: Generate a multi-chain wallet
 */
async function exampleGenerateWallet() {
  console.log('=== Example 1: Generate Multi-Chain Wallet ===\n');

  // Generate wallet for all enabled chains
  const { mnemonic, wallet } = await multiChainWalletService.generateMultiChainWallet();

  console.log('Mnemonic:', mnemonic);
  console.log('Wallet ID:', wallet.id);
  console.log('Accounts generated:', wallet.accounts.length);

  // Display each account
  for (const account of wallet.accounts) {
    console.log(`\n${account.chain.toUpperCase()}:`);
    console.log(`  Address: ${account.address}`);
    console.log(`  Network: ${account.network}`);
  }

  return { mnemonic, wallet };
}

/**
 * Example 2: Generate wallet for specific chains only
 */
async function exampleGenerateSpecificChains() {
  console.log('\n=== Example 2: Generate Wallet for Specific Chains ===\n');

  const chains = [
    BlockchainType.ETHEREUM,
    BlockchainType.BSC,
    BlockchainType.POLYGON,
  ];

  const { mnemonic, wallet } = await multiChainWalletService.generateMultiChainWallet(chains);

  console.log('Generated accounts for:', chains.join(', '));
  console.log('Total accounts:', wallet.accounts.length);

  return { mnemonic, wallet };
}

/**
 * Example 3: Restore wallet from mnemonic
 */
async function exampleRestoreWallet() {
  console.log('\n=== Example 3: Restore Wallet from Mnemonic ===\n');

  const existingMnemonic = 'test walk nut penalty hip pave soap entry language right filter choice';

  const wallet = await multiChainWalletService.restoreMultiChainWallet(existingMnemonic);

  console.log('Wallet restored successfully');
  console.log('Accounts restored:', wallet.accounts.length);

  return wallet;
}

/**
 * Example 4: Save and retrieve wallet
 */
async function exampleSaveAndRetrieveWallet() {
  console.log('\n=== Example 4: Save and Retrieve Wallet ===\n');

  const { mnemonic, wallet } = await multiChainWalletService.generateMultiChainWallet();
  const pin = '123456';

  // Save wallet
  await multiChainWalletService.saveMultiChainWallet(wallet, mnemonic, pin);
  console.log('Wallet saved with PIN encryption');

  // Retrieve wallet
  const retrieved = await multiChainWalletService.getMultiChainWallet(wallet.id, pin);

  if (retrieved) {
    console.log('Wallet retrieved successfully');
    console.log('Mnemonic decrypted:', retrieved.mnemonic === mnemonic);
  }
}

/**
 * Example 5: Get balances across all chains
 */
async function exampleGetBalances(wallet) {
  console.log('\n=== Example 5: Get Balances Across All Chains ===\n');

  const balances = await multiChainWalletService.getAllBalances(wallet);

  for (const [chain, chainBalances] of balances.entries()) {
    console.log(`\n${chain.toUpperCase()}:`);
    for (const balance of chainBalances) {
      console.log(`  ${balance.amount} ${balance.asset.symbol}`);
      if (balance.usdValue) {
        console.log(`  USD Value: $${balance.usdValue}`);
      }
    }
  }
}

/**
 * Example 6: Get balance for specific account
 */
async function exampleGetAccountBalance(wallet) {
  console.log('\n=== Example 6: Get Balance for Specific Account ===\n');

  const ethAccount = multiChainWalletService.getAccountForChain(
    wallet,
    BlockchainType.ETHEREUM
  );

  if (ethAccount) {
    const balance = await multiChainWalletService.getAccountBalance(ethAccount);
    
    if (balance) {
      console.log('Ethereum Balance:');
      console.log(`  ${balance.amount} ${balance.asset.symbol}`);
    }
  }
}

/**
 * Example 7: Send transaction
 */
async function exampleSendTransaction(wallet, mnemonic) {
  console.log('\n=== Example 7: Send Transaction ===\n');

  const ethAccount = multiChainWalletService.getAccountForChain(
    wallet,
    BlockchainType.ETHEREUM
  );

  if (!ethAccount) {
    console.log('No Ethereum account found');
    return;
  }

  // Estimate fee first
  const fee = await multiChainWalletService.estimateFee(ethAccount, {
    from: ethAccount.address,
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    amount: '0.01',
  });

  if (fee) {
    console.log(`Estimated fee: ${fee.amount} ${fee.asset.symbol}`);
  }

  // Send transaction (commented out to prevent accidental execution)
  /*
  const result = await multiChainWalletService.sendTransaction(
    ethAccount,
    {
      from: ethAccount.address,
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      amount: '0.01',
    },
    mnemonic
  );

  if (result.success) {
    console.log('Transaction sent!');
    console.log('Hash:', result.hash);
  } else {
    console.log('Transaction failed:', result.error);
  }
  */
}

/**
 * Example 8: Send ERC-20 token
 */
async function exampleSendToken(wallet, mnemonic) {
  console.log('\n=== Example 8: Send ERC-20 Token ===\n');

  const ethAccount = multiChainWalletService.getAccountForChain(
    wallet,
    BlockchainType.ETHEREUM
  );

  if (!ethAccount) return;

  const usdtAsset = {
    type: AssetType.TOKEN,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chain: BlockchainType.ETHEREUM,
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  };

  // Estimate fee
  const fee = await multiChainWalletService.estimateFee(ethAccount, {
    from: ethAccount.address,
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    amount: '10',
    asset: usdtAsset,
  });

  if (fee) {
    console.log(`Estimated gas fee: ${fee.amount} ${fee.asset.symbol}`);
  }

  // Send token (commented out)
  /*
  const result = await multiChainWalletService.sendTransaction(
    ethAccount,
    {
      from: ethAccount.address,
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      amount: '10',
      asset: usdtAsset,
    },
    mnemonic
  );
  */
}

/**
 * Example 9: Get transaction history
 */
async function exampleGetTransactionHistory(wallet) {
  console.log('\n=== Example 9: Get Transaction History ===\n');

  const ethAccount = multiChainWalletService.getAccountForChain(
    wallet,
    BlockchainType.ETHEREUM
  );

  if (!ethAccount) return;

  const transactions = await multiChainWalletService.getTransactionHistory(
    ethAccount,
    10
  );

  console.log(`Found ${transactions.length} transactions`);

  for (const tx of transactions) {
    console.log(`\nHash: ${tx.hash}`);
    console.log(`From: ${tx.from}`);
    console.log(`To: ${tx.to}`);
    console.log(`Amount: ${tx.amount} ${tx.asset.symbol}`);
    console.log(`Status: ${tx.status}`);
  }
}

/**
 * Example 10: Detect tokens
 */
async function exampleDetectTokens(wallet) {
  console.log('\n=== Example 10: Detect Tokens ===\n');

  const ethAccount = multiChainWalletService.getAccountForChain(
    wallet,
    BlockchainType.ETHEREUM
  );

  if (!ethAccount) return;

  const tokens = await multiChainWalletService.detectTokens(ethAccount);

  console.log(`Found ${tokens.length} tokens`);

  for (const token of tokens) {
    console.log(`\n${token.name} (${token.symbol})`);
    console.log(`  Contract: ${token.contractAddress}`);
    console.log(`  Decimals: ${token.decimals}`);
  }
}

/**
 * Example 11: Get cross-chain swap quote
 */
async function exampleGetSwapQuote(wallet) {
  console.log('\n=== Example 11: Get Cross-Chain Swap Quote ===\n');

  const ethAccount = multiChainWalletService.getAccountForChain(
    wallet,
    BlockchainType.ETHEREUM
  );
  const bscAccount = multiChainWalletService.getAccountForChain(
    wallet,
    BlockchainType.BSC
  );

  if (!ethAccount || !bscAccount) return;

  const ethAdapter = chainRegistry.getAdapter(BlockchainType.ETHEREUM);
  const bscAdapter = chainRegistry.getAdapter(BlockchainType.BSC);

  if (!ethAdapter || !bscAdapter) return;

  const swapParams = {
    fromChain: BlockchainType.ETHEREUM,
    toChain: BlockchainType.BSC,
    fromAsset: ethAdapter.getNativeAsset(),
    toAsset: bscAdapter.getNativeAsset(),
    amount: '1.0',
    fromAddress: ethAccount.address,
    toAddress: bscAccount.address,
    slippage: 0.5,
  };

  const result = await crossChainBridge.getBestQuote(swapParams);

  if (result) {
    const { quote, provider } = result;
    console.log(`Best quote from: ${provider}`);
    console.log(`Rate: ${quote.rate}`);
    console.log(`You send: ${quote.fromAmount} ETH`);
    console.log(`You receive: ${quote.toAmount} BNB`);
    console.log(`Fee: ${quote.fee.amount} ${quote.fee.asset.symbol}`);
    console.log(`Estimated time: ${quote.estimatedTime} seconds`);
  }
}

/**
 * Example 12: Validate addresses
 */
async function exampleValidateAddresses() {
  console.log('\n=== Example 12: Validate Addresses ===\n');

  const addresses = [
    { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', chain: BlockchainType.ETHEREUM },
    { address: 'not-a-valid-address', chain: BlockchainType.ETHEREUM },
    { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', chain: BlockchainType.BITCOIN },
  ];

  for (const { address, chain } of addresses) {
    const isValid = multiChainWalletService.validateAddress(address, chain);
    console.log(`${address.substring(0, 20)}... on ${chain}: ${isValid ? '✓' : '✗'}`);
  }
}

/**
 * Example 13: Working with chain registry
 */
async function exampleChainRegistry() {
  console.log('\n=== Example 13: Working with Chain Registry ===\n');

  // Get all supported chains
  const supportedChains = chainRegistry.getSupportedChains();
  console.log('Supported chains:', supportedChains.map(c => c.chain).join(', '));

  // Check if specific chain is supported
  console.log('\nIs Ethereum supported?', chainRegistry.isChainSupported(BlockchainType.ETHEREUM));
  console.log('Is Bitcoin supported?', chainRegistry.isChainSupported(BlockchainType.BITCOIN));

  // Get chain configuration
  const ethConfig = chainRegistry.getChainConfig(BlockchainType.ETHEREUM);
  if (ethConfig) {
    console.log('\nEthereum Configuration:');
    console.log('  RPC URL:', ethConfig.rpcUrl);
    console.log('  Explorer:', ethConfig.explorerUrl);
    console.log('  Native Asset:', ethConfig.nativeAsset.symbol);
    console.log('  Supports Tokens:', ethConfig.supportsTokens);
  }

  // Get adapter
  const ethAdapter = chainRegistry.getAdapter(BlockchainType.ETHEREUM);
  if (ethAdapter) {
    console.log('\nEthereum Adapter:');
    console.log('  Chain:', ethAdapter.getChain());
    console.log('  Supports Tokens:', ethAdapter.supportsTokens());
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Generate a wallet for examples
    const { mnemonic, wallet } = await exampleGenerateWallet();

    // Run other examples
    await exampleGenerateSpecificChains();
    await exampleRestoreWallet();
    await exampleSaveAndRetrieveWallet();
    await exampleGetBalances(wallet);
    await exampleGetAccountBalance(wallet);
    await exampleSendTransaction(wallet, mnemonic);
    await exampleSendToken(wallet, mnemonic);
    await exampleGetTransactionHistory(wallet);
    await exampleDetectTokens(wallet);
    await exampleGetSwapQuote(wallet);
    await exampleValidateAddresses();
    await exampleChainRegistry();

    console.log('\n=== All Examples Completed ===\n');
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Export examples for use in other modules
export {
  exampleGenerateWallet,
  exampleGenerateSpecificChains,
  exampleRestoreWallet,
  exampleSaveAndRetrieveWallet,
  exampleGetBalances,
  exampleGetAccountBalance,
  exampleSendTransaction,
  exampleSendToken,
  exampleGetTransactionHistory,
  exampleDetectTokens,
  exampleGetSwapQuote,
  exampleValidateAddresses,
  exampleChainRegistry,
  runAllExamples,
};

// Uncomment to run examples when importing this file
// runAllExamples();
