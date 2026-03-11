import React, { useState, useEffect } from 'react';
import './UnifiedDashboard.css';
import WalletService from '../services/WalletService';
import StorageService from '../services/StorageService';
import PortfolioSummary from '../components/PortfolioSummary';
import SearchFilter, { FilterOptions } from '../components/SearchFilter';
import WalletSwitcher from '../components/WalletSwitcher';
import WalletCard from '../components/WalletCard';
import TransactionItem from '../components/TransactionItem';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { SendWidget, ReceiveWidget, SwapWidget } from '../components/QuickActionWidgets';

interface UnifiedDashboardProps {
  walletId: string;
  onLogout: () => void;
  onSettings: () => void;
  onSetupDecoy: () => void;
  onWalletSwitch: (walletId: string) => void;
}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  walletId,
  onLogout,
  onSettings,
  onSetupDecoy,
  onWalletSwitch,
}) => {
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.0000');
  const [walletName, setWalletName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allWallets, setAllWallets] = useState<any[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<string>('0.0000');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadWalletData();
    loadAllWallets();
  }, [walletId]);

  useEffect(() => {
    calculateTotalPortfolio();
  }, [allWallets]);

  useEffect(() => {
    filterWallets();
  }, [searchQuery, filters, allWallets]);

  const loadWalletData = async () => {
    try {
      const wallet = await StorageService.getWallet(walletId);
      if (wallet) {
        setAddress(wallet.address);
        setWalletName(wallet.name);
        
        // Fetch balance
        const balanceData = await WalletService.getBalance(wallet.address);
        setBalance(balanceData.eth);
        
        // Fetch transactions
        const txs = await WalletService.getTransactionHistory(wallet.address);
        setTransactions(txs);
      }
    } catch (error) {
      console.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllWallets = async () => {
    try {
      const wallets = await StorageService.getAllWallets();
      
      // Load balance for each wallet
      const walletsWithBalance = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const balanceData = await WalletService.getBalance(wallet.address);
            return { ...wallet, balance: balanceData.eth };
          } catch {
            return { ...wallet, balance: '0.0' };
          }
        })
      );
      
      setAllWallets(walletsWithBalance);
    } catch (error) {
      console.error('Failed to load wallets');
    }
  };

  const calculateTotalPortfolio = () => {
    const total = allWallets.reduce((sum, wallet) => {
      return sum + parseFloat(wallet.balance || '0');
    }, 0);
    setTotalPortfolioValue(total.toFixed(4));
  };

  const filterWallets = () => {
    let filtered = [...allWallets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (wallet) =>
          wallet.name.toLowerCase().includes(query) ||
          wallet.address.toLowerCase().includes(query)
      );
    }

    // Apply sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'balance-high':
          filtered.sort((a, b) => parseFloat(b.balance || '0') - parseFloat(a.balance || '0'));
          break;
        case 'balance-low':
          filtered.sort((a, b) => parseFloat(a.balance || '0') - parseFloat(b.balance || '0'));
          break;
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'recent':
        default:
          filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          break;
      }
    }

    setFilteredWallets(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    await loadAllWallets();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleSend = (to: string, amount: string) => {
    // TODO: Implement actual send transaction using WalletService
    console.log('Send transaction:', { to, amount });
    // In production, this should use a toast notification system
    console.log('Transaction sending will be implemented in next version');
    setActiveWidget(null);
  };

  const copyAddress = () => {
    try {
      navigator.clipboard.writeText(address);
      // In production, this should use a toast notification system
      console.log('Address copied to clipboard');
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const exportPortfolio = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalValue: totalPortfolioValue,
      wallets: allWallets.map(w => ({
        name: w.name,
        address: w.address,
        balance: w.balance,
      })),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="unified-dashboard">
        <div className="loading-container">
          <div className="loading-spinner">Loading your portfolio...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="unified-dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">🔐 WonderWallet</h1>
            <WalletSwitcher
              wallets={allWallets}
              activeWalletId={walletId}
              onWalletSwitch={onWalletSwitch}
            />
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh">
              {refreshing ? '⟳' : '🔄'}
            </button>
            <button className="icon-btn" onClick={exportPortfolio} title="Export Portfolio">
              💾
            </button>
            <button className="icon-btn" onClick={onSettings} title="Settings">
              ⚙️
            </button>
            <button className="icon-btn" onClick={onLogout} title="Logout">
              🚪
            </button>
          </div>
        </header>

        <PortfolioSummary
          totalValue={totalPortfolioValue}
          totalWallets={allWallets.length}
          totalAssets={allWallets.length}
        />

        <div className="quick-actions-row">
          <button className="action-card" onClick={() => setActiveWidget('send')}>
            <span className="action-icon">💸</span>
            <span className="action-label">Send</span>
          </button>
          <button className="action-card" onClick={() => setActiveWidget('receive')}>
            <span className="action-icon">📥</span>
            <span className="action-label">Receive</span>
          </button>
          <button className="action-card" onClick={() => setActiveWidget('swap')}>
            <span className="action-icon">🔄</span>
            <span className="action-label">Swap</span>
          </button>
          <button className="action-card" onClick={copyAddress}>
            <span className="action-icon">📋</span>
            <span className="action-label">Copy</span>
          </button>
        </div>

        {allWallets.length === 1 && (
          <div className="decoy-setup-banner">
            <div className="banner-content">
              <div className="banner-icon">🛡️</div>
              <div className="banner-text">
                <h3>Enhance Your Security</h3>
                <p>Set up decoy wallets to protect your main wallet from theft</p>
              </div>
            </div>
            <button className="primary-btn" onClick={onSetupDecoy}>
              Setup Decoy System
            </button>
          </div>
        )}

        <div className="wallets-section">
          <div className="section-header">
            <h2 className="section-title">All Wallets</h2>
            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                ⊞
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                ☰
              </button>
            </div>
          </div>

          <SearchFilter
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            placeholder="Search wallets by name or address..."
          />

          <div className={`wallets-${viewMode}`}>
            {filteredWallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                address={wallet.address}
                balance={wallet.balance}
                name={wallet.name}
                isActive={wallet.id === walletId}
                onClick={() => onWalletSwitch(wallet.id)}
              />
            ))}
          </div>

          {filteredWallets.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No wallets found</p>
              <p className="empty-hint">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        <div className="transactions-section">
          <h2 className="section-title">Recent Activity</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No transactions yet</p>
              <p className="empty-hint">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div key={tx.hash} onClick={() => setSelectedTransaction(tx)}>
                  <TransactionItem
                    hash={tx.hash}
                    from={tx.from}
                    to={tx.to}
                    amount={tx.amount}
                    timestamp={tx.timestamp}
                    type={tx.type}
                    status={tx.status}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="info-banner">
          <p>💡 <strong>Pro Tip:</strong> Use the search and filters to quickly find specific wallets or transactions.</p>
        </div>
      </div>

      {/* Modals and Widgets */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {activeWidget === 'send' && (
        <SendWidget
          onSend={handleSend}
          onCancel={() => setActiveWidget(null)}
        />
      )}

      {activeWidget === 'receive' && (
        <ReceiveWidget
          address={address}
          onClose={() => setActiveWidget(null)}
        />
      )}

      {activeWidget === 'swap' && (
        <SwapWidget onClose={() => setActiveWidget(null)} />
      )}
    </div>
  );
};

export default UnifiedDashboard;
