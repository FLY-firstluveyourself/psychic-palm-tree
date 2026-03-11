import React, { useState, useRef, useEffect } from 'react';
import './WalletSwitcher.css';
import { truncateAddress } from '../utils/validation';

interface Wallet {
  id: string;
  name: string;
  address: string;
  balance?: string;
}

interface WalletSwitcherProps {
  wallets: Wallet[];
  activeWalletId: string;
  onWalletSwitch: (walletId: string) => void;
}

const WalletSwitcher: React.FC<WalletSwitcherProps> = ({
  wallets,
  activeWalletId,
  onWalletSwitch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWallet = wallets.find(w => w.id === activeWalletId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleWalletSelect = (walletId: string) => {
    onWalletSwitch(walletId);
    setIsOpen(false);
  };

  if (wallets.length <= 1) {
    return null;
  }

  return (
    <div className="wallet-switcher" ref={dropdownRef}>
      <button
        className="wallet-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="current-wallet-info">
          <span className="wallet-icon">👛</span>
          <div className="wallet-details">
            <div className="wallet-name">{activeWallet?.name || 'Unknown Wallet'}</div>
            <div className="wallet-address-small">
              {activeWallet ? truncateAddress(activeWallet.address, 6) : ''}
            </div>
          </div>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="wallet-dropdown">
          <div className="dropdown-header">
            <span>Switch Wallet</span>
            <span className="wallet-count">{wallets.length} wallets</span>
          </div>
          <div className="wallet-list">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                className={`wallet-item ${wallet.id === activeWalletId ? 'active' : ''}`}
                onClick={() => handleWalletSelect(wallet.id)}
              >
                <div className="wallet-item-icon">👛</div>
                <div className="wallet-item-info">
                  <div className="wallet-item-name">{wallet.name}</div>
                  <div className="wallet-item-address">
                    {truncateAddress(wallet.address, 8)}
                  </div>
                </div>
                {wallet.balance && (
                  <div className="wallet-item-balance">
                    {parseFloat(wallet.balance).toFixed(4)} ETH
                  </div>
                )}
                {wallet.id === activeWalletId && (
                  <div className="active-checkmark">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletSwitcher;
