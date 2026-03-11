/**
 * MultiChainDashboard - Unified dashboard for all chains
 * 
 * Displays aggregated portfolio across all supported blockchains
 */

import React, { useState, useEffect } from 'react';
import MultiChainWalletService from '../services/MultiChainWalletService';
import AssetService from '../services/AssetService';
import type { MultiChainWallet, Portfolio } from '../services/MultiChainWalletService';
import type { Asset, ChainSummary } from '../services/AssetService';
import './MultiChainDashboard.css';

interface MultiChainDashboardProps {
  wallet: MultiChainWallet;
  pin: string;
  onLogout: () => void;
  onSettings: () => void;
}

const MultiChainDashboard: React.FC<MultiChainDashboardProps> = ({
  wallet,
  pin,
  onLogout,
  onSettings
}) => {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolio();
  }, [wallet]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError('');

      // Get portfolio from MultiChainWalletService
      const portfolioData = await MultiChainWalletService.getPortfolio(wallet);

      // Build assets array
      const assets: Asset[] = portfolioData.assets.map(asset => ({
        id: `${asset.chain}:native`,
        symbol: asset.symbol,
        name: asset.chainName,
        balance: asset.balance,
        decimals: 18,
        chain: asset.chain,
        chainName: asset.chainName,
        type: 'native' as const,
        address: asset.address
      }));

      // Build portfolio summary
      const summary = await AssetService.buildPortfolioSummary(assets);
      setPortfolio(summary);
    } catch (err: any) {
      console.error('Failed to load portfolio:', err);
      setError(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPortfolio();
  };

  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId);
  };

  const getFilteredAssets = (): Asset[] => {
    if (!portfolio) return [];
    
    if (selectedChain === 'all') {
      return portfolio.assets;
    }
    
    return AssetService.filterByChain(portfolio.assets, selectedChain);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  if (loading) {
    return (
      <div className="multichain-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="multichain-dashboard error">
        <h2>Error Loading Portfolio</h2>
        <p>{error}</p>
        <button onClick={handleRefresh} className="btn-refresh">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="multichain-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Future Unity</h1>
          <span className="tagline">Multi-Chain Wallet</span>
        </div>
        <div className="header-right">
          <button onClick={handleRefresh} className="btn-icon" title="Refresh">
            🔄
          </button>
          <button onClick={onSettings} className="btn-icon" title="Settings">
            ⚙️
          </button>
          <button onClick={onLogout} className="btn-icon" title="Logout">
            🚪
          </button>
        </div>
      </header>

      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="total-value">
          <span className="label">Total Portfolio Value</span>
          <span className="value">
            {AssetService.formatValue(portfolio?.totalValue || '0')}
          </span>
          <span className="currency">USD</span>
        </div>
        <div className="portfolio-stats">
          <div className="stat">
            <span className="stat-label">Chains</span>
            <span className="stat-value">{wallet.enabledChains.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Assets</span>
            <span className="stat-value">{portfolio?.assets.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="chain-selector">
        <button
          className={`chain-btn ${selectedChain === 'all' ? 'active' : ''}`}
          onClick={() => handleChainSelect('all')}
        >
          All Chains
        </button>
        {wallet.enabledChains.map(chainId => {
          const adapter = MultiChainWalletService.getAdapter(chainId);
          return (
            <button
              key={chainId}
              className={`chain-btn ${selectedChain === chainId ? 'active' : ''}`}
              onClick={() => handleChainSelect(chainId)}
            >
              {adapter?.symbol || chainId.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Chain Summaries */}
      {portfolio?.chainSummaries && portfolio.chainSummaries.length > 0 && (
        <div className="chain-summaries">
          <h2>Chains Overview</h2>
          <div className="chain-cards">
            {portfolio.chainSummaries.map((summary: ChainSummary) => (
              <div key={summary.chainId} className="chain-card">
                <div className="chain-card-header">
                  <span className="chain-name">{summary.name}</span>
                  <span className="chain-symbol">{summary.symbol}</span>
                </div>
                <div className="chain-card-body">
                  <div className="chain-balance">
                    {AssetService.formatBalance(summary.nativeBalance)} {summary.symbol}
                  </div>
                  <div className="chain-value">
                    {AssetService.formatValue(summary.totalValue)}
                  </div>
                </div>
                <div className="chain-card-footer">
                  <span className="asset-count">{summary.assetCount} assets</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="assets-section">
        <h2>
          {selectedChain === 'all' ? 'All Assets' : `${selectedChain.toUpperCase()} Assets`}
        </h2>
        {getFilteredAssets().length === 0 ? (
          <div className="no-assets">
            <p>No assets found</p>
          </div>
        ) : (
          <div className="assets-list">
            {getFilteredAssets().map(asset => (
              <div key={asset.id} className="asset-item">
                <div className="asset-icon">
                  <div className="icon-placeholder">
                    {asset.symbol.charAt(0)}
                  </div>
                </div>
                <div className="asset-info">
                  <div className="asset-name">
                    {asset.symbol}
                    <span className="asset-chain-badge">{asset.chainName}</span>
                  </div>
                  <div className="asset-address">
                    {asset.address ? (
                      <>
                        {asset.address.slice(0, 10)}...{asset.address.slice(-8)}
                        <button
                          className="btn-copy-small"
                          onClick={() => copyToClipboard(asset.address)}
                          title="Copy address"
                        >
                          📋
                        </button>
                      </>
                    ) : (
                      <span className="no-address">No address</span>
                    )}
                  </div>
                </div>
                <div className="asset-balance">
                  <div className="balance-amount">
                    {AssetService.formatBalance(asset.balance)} {asset.symbol}
                  </div>
                  {asset.value && (
                    <div className="balance-value">
                      {AssetService.formatValue(asset.value)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn" disabled>
          <span className="action-icon">💱</span>
          <span className="action-label">Swap</span>
          <span className="coming-soon">Soon</span>
        </button>
        <button className="action-btn" disabled>
          <span className="action-icon">🌉</span>
          <span className="action-label">Bridge</span>
          <span className="coming-soon">Soon</span>
        </button>
        <button className="action-btn" disabled>
          <span className="action-icon">📜</span>
          <span className="action-label">History</span>
          <span className="coming-soon">Soon</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="dashboard-footer">
        <p className="update-time">
          Last updated: {new Date(portfolio?.lastUpdated || Date.now()).toLocaleTimeString()}
        </p>
        <p className="wallet-id">Wallet ID: {wallet.id.slice(0, 8)}...</p>
      </div>
    </div>
  );
};

export default MultiChainDashboard;
