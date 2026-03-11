import React from 'react';
import './TransactionDetailModal.css';
import { truncateAddress } from '../utils/validation';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  nonce?: number;
}

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      // In production, this should use a toast notification system
      console.log(`${label} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'confirmed':
        return '#00ff41';
      case 'pending':
        return '#ffaa00';
      case 'failed':
        return '#ff4141';
      default:
        return '#ffffff';
    }
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'confirmed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✕';
      default:
        return '?';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="transaction-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Transaction Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <div className="status-section" style={{ borderColor: getStatusColor() }}>
            <div className="status-icon" style={{ color: getStatusColor() }}>
              {getStatusIcon()}
            </div>
            <div className="status-text">
              <div className="status-label">Status</div>
              <div className="status-value" style={{ color: getStatusColor() }}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-row">
              <div className="detail-label">Transaction Hash</div>
              <div className="detail-value clickable" onClick={() => copyToClipboard(transaction.hash, 'Transaction hash')}>
                <span className="mono-text">{truncateAddress(transaction.hash, 12)}</span>
                <span className="copy-icon">📋</span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-label">From</div>
              <div className="detail-value clickable" onClick={() => copyToClipboard(transaction.from, 'From address')}>
                <span className="mono-text">{truncateAddress(transaction.from, 10)}</span>
                <span className="copy-icon">📋</span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-label">To</div>
              <div className="detail-value clickable" onClick={() => copyToClipboard(transaction.to, 'To address')}>
                <span className="mono-text">{truncateAddress(transaction.to, 10)}</span>
                <span className="copy-icon">📋</span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Value</div>
              <div className="detail-value highlight">
                {transaction.value} ETH
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Timestamp</div>
              <div className="detail-value">
                {formatDate(transaction.timestamp)}
              </div>
            </div>

            {transaction.blockNumber && (
              <div className="detail-row">
                <div className="detail-label">Block Number</div>
                <div className="detail-value">
                  #{transaction.blockNumber.toLocaleString()}
                </div>
              </div>
            )}

            {transaction.gasUsed && (
              <div className="detail-row">
                <div className="detail-label">Gas Used</div>
                <div className="detail-value">
                  {transaction.gasUsed}
                </div>
              </div>
            )}

            {transaction.gasPrice && (
              <div className="detail-row">
                <div className="detail-label">Gas Price</div>
                <div className="detail-value">
                  {transaction.gasPrice} Gwei
                </div>
              </div>
            )}

            {transaction.nonce !== undefined && (
              <div className="detail-row">
                <div className="detail-label">Nonce</div>
                <div className="detail-value">
                  {transaction.nonce}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <a
              href={`https://etherscan.io/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-explorer-btn"
            >
              View on Etherscan ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
