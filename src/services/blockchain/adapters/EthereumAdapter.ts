/**
 * EthereumAdapter - Ethereum blockchain integration
 * Supports Ethereum, BSC, Polygon, and other EVM-compatible chains
 */

import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import BlockchainAdapter from '../BlockchainAdapter';
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
  AssetType,
  TransactionFee,
  TransactionStatus,
} from '../types';

export class EthereumAdapter extends BlockchainAdapter {
  private provider: ethers.JsonRpcProvider;

  constructor(config: ChainConfig) {
    super(config);
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  /**
   * Generate a new Ethereum account from mnemonic
   */
  async generateAccount(
    mnemonic: string,
    derivationPath?: string
  ): Promise<ChainAccount> {
    try {
      // Default Ethereum derivation path: m/44'/60'/0'/0/0
      const path = derivationPath || "m/44'/60'/0'/0/0";
      const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);

      return {
        chain: this.chain,
        network: this.network,
        address: wallet.address,
        publicKey: wallet.publicKey,
        derivationPath: path,
        // Note: Private key should be encrypted before storage
      };
    } catch (error: any) {
      console.error('Failed to generate Ethereum account:', error);
      throw new Error(`Failed to generate Ethereum account: ${error.message}`);
    }
  }

  /**
   * Import account from private key
   */
  async importAccount(privateKey: string): Promise<ChainAccount> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      
      return {
        chain: this.chain,
        network: this.network,
        address: wallet.address,
        publicKey: wallet.publicKey,
      };
    } catch (error) {
      console.error('Failed to import Ethereum account:', error);
      throw new Error('Invalid private key');
    }
  }

  /**
   * Validate Ethereum address
   */
  validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Get native balance (ETH, BNB, MATIC, etc.)
   */
  async getBalance(address: string): Promise<Balance> {
    try {
      const balance = await this.provider.getBalance(address);
      const formatted = ethers.formatEther(balance);

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

  /**
   * Get all balances (native + tokens)
   */
  async getAllBalances(address: string): Promise<Balance[]> {
    try {
      const balances: Balance[] = [];
      
      // Get native balance
      const nativeBalance = await this.getBalance(address);
      balances.push(nativeBalance);

      // Get token balances
      const tokens = await this.detectTokens(address);
      for (const token of tokens) {
        if (token.contractAddress) {
          try {
            const tokenBalance = await this.getTokenBalance(
              address,
              token.contractAddress
            );
            if (parseFloat(tokenBalance.amount) > 0) {
              balances.push(tokenBalance);
            }
          } catch (error) {
            console.error(`Failed to get balance for token ${token.symbol}:`, error);
          }
        }
      }

      return balances;
    } catch (error) {
      console.error('Failed to get all balances:', error);
      return [];
    }
  }

  /**
   * Get ERC-20 token balance
   */
  async getTokenBalance(
    address: string,
    tokenAddress: string
  ): Promise<Balance> {
    try {
      // ERC-20 ABI for balanceOf and decimals
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function name() view returns (string)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      
      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol(),
        contract.name(),
      ]);

      const formatted = this.formatAmount(balance.toString(), decimals);

      const asset: AssetInfo = {
        type: AssetType.TOKEN,
        symbol,
        name,
        decimals,
        chain: this.chain,
        contractAddress: tokenAddress,
      };

      return {
        asset,
        amount: formatted,
      };
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
      throw new Error('Failed to fetch token balance');
    }
  }

  /**
   * Send transaction (native or token)
   */
  async sendTransaction(
    params: SendTransactionParams,
    privateKey: string
  ): Promise<TransactionResult> {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);

      let tx;
      
      if (params.asset && params.asset.type === AssetType.TOKEN && params.asset.contractAddress) {
        // Send ERC-20 token
        const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const contract = new ethers.Contract(
          params.asset.contractAddress,
          erc20Abi,
          wallet
        );

        const amount = this.parseAmount(params.amount, params.asset.decimals);
        tx = await contract.transfer(params.to, amount);
      } else {
        // Send native currency
        const txParams: any = {
          to: params.to,
          value: ethers.parseEther(params.amount),
        };

        if (params.gasLimit) {
          txParams.gasLimit = params.gasLimit;
        }
        if (params.gasPrice) {
          txParams.gasPrice = ethers.parseUnits(params.gasPrice, 'gwei');
        }

        tx = await wallet.sendTransaction(txParams);
      }

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      const unifiedTx: UnifiedTransaction = {
        id: tx.hash,
        chain: this.chain,
        network: this.network,
        from: params.from,
        to: params.to,
        amount: params.amount,
        asset: params.asset || this.getNativeAsset(),
        fee: {
          amount: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
          asset: this.getNativeAsset(),
        },
        status: receipt.status === 1 ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED,
        timestamp: Date.now(),
        hash: tx.hash,
        confirmations: 1,
        blockNumber: receipt.blockNumber,
      };

      return {
        success: receipt.status === 1,
        hash: tx.hash,
        transaction: unifiedTx,
      };
    } catch (error: any) {
      console.error('Transaction failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(params: SendTransactionParams): Promise<TransactionFee> {
    try {
      let gasLimit: bigint;

      if (params.asset && params.asset.type === AssetType.TOKEN && params.asset.contractAddress) {
        // Estimate gas for ERC-20 transfer
        const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const contract = new ethers.Contract(
          params.asset.contractAddress,
          erc20Abi,
          this.provider
        );
        const amount = this.parseAmount(params.amount, params.asset.decimals);
        gasLimit = await contract.transfer.estimateGas(params.to, amount);
      } else {
        // Estimate gas for native transfer
        gasLimit = await this.provider.estimateGas({
          to: params.to,
          value: ethers.parseEther(params.amount),
          from: params.from,
        });
      }

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      const totalFee = gasLimit * gasPrice;

      return {
        amount: ethers.formatEther(totalFee),
        asset: this.getNativeAsset(),
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
      };
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      // Return default estimate
      return {
        amount: '0.001',
        asset: this.getNativeAsset(),
        gasLimit: '21000',
        gasPrice: '20',
      };
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<UnifiedTransaction | null> {
    try {
      const tx = await this.provider.getTransaction(hash);
      if (!tx) return null;

      const receipt = await this.provider.getTransactionReceipt(hash);
      
      const unifiedTx: UnifiedTransaction = {
        id: hash,
        chain: this.chain,
        network: this.network,
        from: tx.from,
        to: tx.to || '',
        amount: ethers.formatEther(tx.value),
        asset: this.getNativeAsset(),
        fee: receipt ? {
          amount: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
          asset: this.getNativeAsset(),
        } : {
          amount: '0',
          asset: this.getNativeAsset(),
        },
        status: receipt 
          ? (receipt.status === 1 ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED)
          : TransactionStatus.PENDING,
        timestamp: Date.now(),
        hash,
        confirmations: receipt?.confirmations || 0,
        blockNumber: tx.blockNumber || undefined,
      };

      return unifiedTx;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }

  /**
   * Get transaction history (requires indexer in production)
   */
  async getTransactionHistory(
    address: string,
    limit: number = 50
  ): Promise<UnifiedTransaction[]> {
    // In production, you would use Etherscan API, Alchemy, or similar
    // For now, return empty array
    console.warn('Transaction history requires external indexer API');
    return [];
  }

  /**
   * Detect tokens held by an address (requires indexer)
   */
  async detectTokens(address: string): Promise<AssetInfo[]> {
    // In production, you would use token list or indexer API
    // For now, return empty array
    console.warn('Token detection requires external API');
    return [];
  }

  /**
   * Get asset information for a token
   */
  async getAssetInfo(contractAddress: string): Promise<AssetInfo | null> {
    try {
      const erc20Abi = [
        'function symbol() view returns (string)',
        'function name() view returns (string)',
        'function decimals() view returns (uint8)',
      ];

      const contract = new ethers.Contract(contractAddress, erc20Abi, this.provider);
      
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol(),
        contract.name(),
        contract.decimals(),
      ]);

      return {
        type: AssetType.TOKEN,
        symbol,
        name,
        decimals,
        chain: this.chain,
        contractAddress,
      };
    } catch (error) {
      console.error('Failed to get asset info:', error);
      return null;
    }
  }
}

export default EthereumAdapter;
