import React from 'react';
import './WalletCard.css';
import { truncateAddress, formatBalance } from '../utils/validation';

interface WalletCardProps {
  address: string;
  balance?: string;
  name?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({
  address,
  balance,
  name,
  isActive = false,
  onClick,
}) => {
  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    // Could add a toast notification here
    alert('Address copied to clipboard!');
  };

  return (
    <div
      className={`wallet-card ${isActive ? 'active' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="wallet-card-header">
        <div className="wallet-icon">👛</div>
        <div className="wallet-info">
          {name && <div className="wallet-name">{name}</div>}
          <div className="wallet-address" title={address}>
            {truncateAddress(address, 8)}
            <button className="copy-btn" onClick={copyToClipboard} title="Copy address">
              📋
            </button>
          </div>
        </div>
      </div>

      {balance !== undefined && (
        <div className="wallet-balance">
          <div className="balance-label">Balance</div>
          <div className="balance-amount">{formatBalance(balance)} ETH</div>
        </div>
      )}

      {isActive && <div className="active-indicator">● Active</div>}
    </div>
  );
};

export default WalletCard;
