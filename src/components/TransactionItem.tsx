import React from 'react';
import './TransactionItem.css';
import { truncateAddress } from '../utils/validation';

interface TransactionItemProps {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  type: 'sent' | 'received';
  status?: 'pending' | 'confirmed' | 'failed';
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  hash,
  from,
  to,
  amount,
  timestamp,
  type,
  status = 'confirmed',
}) => {
  const formatDate = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return '#00ff41';
      case 'pending':
        return '#ffaa00';
      case 'failed':
        return '#ff4444';
      default:
        return '#00ff41';
    }
  };

  return (
    <div className={`transaction-item ${type}`}>
      <div className="transaction-icon">
        {type === 'sent' ? '↗️' : '↙️'}
      </div>
      
      <div className="transaction-details">
        <div className="transaction-header">
          <span className={`transaction-type ${type}`}>
            {type === 'sent' ? 'Sent' : 'Received'}
          </span>
          <span className="transaction-status" style={{ color: getStatusColor() }}>
            {status}
          </span>
        </div>
        
        <div className="transaction-addresses">
          <div className="address-row">
            <span className="address-label">From:</span>
            <span className="address-value">{truncateAddress(from)}</span>
          </div>
          <div className="address-row">
            <span className="address-label">To:</span>
            <span className="address-value">{truncateAddress(to)}</span>
          </div>
        </div>
        
        <div className="transaction-footer">
          <span className="transaction-date">{formatDate(timestamp)}</span>
          <a
            href={`https://etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transaction-link"
          >
            View on Etherscan →
          </a>
        </div>
      </div>
      
      <div className={`transaction-amount ${type}`}>
        <span className="amount-prefix">{type === 'sent' ? '-' : '+'}</span>
        {amount} ETH
      </div>
    </div>
  );
};

export default TransactionItem;
