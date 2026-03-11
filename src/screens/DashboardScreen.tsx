import React, { useState, useEffect } from 'react';
import './DashboardScreen.css';
import WalletService from '../services/WalletService';
import StorageService from '../services/StorageService';
import WalletCard from '../components/WalletCard';
import TransactionItem from '../components/TransactionItem';

interface DashboardScreenProps {
  walletId: string;
  onLogout: () => void;
  onSettings: () => void;
  onSetupDecoy: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  walletId,
  onLogout,
  onSettings,
  onSetupDecoy,
}) => {
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.0000');
  const [walletName, setWalletName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allWallets, setAllWallets] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
    loadAllWallets();
  }, [walletId]);

  const loadWalletData = async () => {
    try {
      const wallet = await StorageService.getWallet(walletId);
      if (wallet) {
        setAddress(wallet.address);
        setWalletName(wallet.name);
        
        // Fetch balance
        const balanceData = await WalletService.getBalance(wallet.address);
        setBalance(balanceData.eth);
        
        // Fetch transactions (placeholder for now)
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
      setAllWallets(wallets);
    } catch (error) {
      console.error('Failed to load wallets');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="dashboard-screen">
        <div className="loading-container">
          <div className="loading-spinner">Loading your wallet...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-screen">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">🔐 WonderWallet</h1>
            <div className="header-actions">
              <button className="icon-btn" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? '⟳' : '🔄'}
              </button>
              <button className="icon-btn" onClick={onSettings}>
                ⚙️
              </button>
              <button className="icon-btn" onClick={onLogout}>
                🚪
              </button>
            </div>
          </div>
        </header>

        <div className="main-wallet-section">
          <WalletCard
            address={address}
            balance={balance}
            name={walletName}
            isActive={true}
          />

          <div className="quick-actions">
            <button className="action-btn" onClick={copyAddress}>
              <span className="action-icon">📋</span>
              <span className="action-label">Copy Address</span>
            </button>
            <button className="action-btn disabled" title="Coming soon">
              <span className="action-icon">💸</span>
              <span className="action-label">Send</span>
            </button>
            <button className="action-btn disabled" title="Coming soon">
              <span className="action-icon">📥</span>
              <span className="action-label">Receive</span>
            </button>
          </div>
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

        {allWallets.length > 1 && (
          <div className="other-wallets-section">
            <h3 className="section-title">All Wallets</h3>
            <div className="wallets-grid">
              {allWallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  address={wallet.address}
                  name={wallet.name}
                  isActive={wallet.id === walletId}
                />
              ))}
            </div>
          </div>
        )}

        <div className="transactions-section">
          <h3 className="section-title">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No transactions yet</p>
              <p className="empty-hint">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx) => (
                <TransactionItem key={tx.hash} {...tx} />
              ))}
            </div>
          )}
        </div>

        <div className="info-banner">
          <p>💡 <strong>Security Tip:</strong> Never share your seed phrase or PIN with anyone.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
