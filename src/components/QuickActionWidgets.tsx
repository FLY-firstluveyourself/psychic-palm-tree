import React, { useState } from 'react';
import './QuickActionWidgets.css';

interface SendWidgetProps {
  onSend: (to: string, amount: string) => void;
  onCancel: () => void;
}

export const SendWidget: React.FC<SendWidgetProps> = ({ onSend, onCancel }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSend = () => {
    setError('');
    
    if (!recipient) {
      setError('Please enter a recipient address');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    onSend(recipient, amount);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="quick-action-widget" onClick={(e) => e.stopPropagation()}>
        <div className="widget-header">
          <h3 className="widget-title">💸 Send ETH</h3>
          <button className="widget-close" onClick={onCancel}>✕</button>
        </div>

        <div className="widget-content">
          <div className="input-group">
            <label className="input-label">Recipient Address</label>
            <input
              type="text"
              className="widget-input"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Amount (ETH)</label>
            <input
              type="number"
              className="widget-input"
              placeholder="0.0"
              step="0.0001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {error && <div className="widget-error">{error}</div>}

          <div className="widget-info">
            <p>⚠️ Double-check the recipient address before sending.</p>
          </div>

          <div className="widget-actions">
            <button className="widget-btn secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="widget-btn primary" onClick={handleSend}>
              Send Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReceiveWidgetProps {
  address: string;
  onClose: () => void;
}

export const ReceiveWidget: React.FC<ReceiveWidgetProps> = ({ address, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    try {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      // Fallback: could use document.execCommand or show error message
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quick-action-widget" onClick={(e) => e.stopPropagation()}>
        <div className="widget-header">
          <h3 className="widget-title">📥 Receive ETH</h3>
          <button className="widget-close" onClick={onClose}>✕</button>
        </div>

        <div className="widget-content">
          <div className="qr-placeholder">
            <div className="qr-icon">📱</div>
            <p className="qr-text">QR Code</p>
            <p className="qr-hint">(Coming soon)</p>
          </div>

          <div className="address-section">
            <label className="input-label">Your Address</label>
            <div className="address-display">
              <div className="address-text">{address}</div>
            </div>
            <button 
              className={`copy-address-btn ${copied ? 'copied' : ''}`}
              onClick={copyAddress}
            >
              {copied ? '✓ Copied!' : '📋 Copy Address'}
            </button>
          </div>

          <div className="widget-info">
            <p>💡 Share this address to receive ETH and ERC-20 tokens.</p>
          </div>

          <div className="widget-actions">
            <button className="widget-btn primary full-width" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SwapWidgetProps {
  onClose: () => void;
}

export const SwapWidget: React.FC<SwapWidgetProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quick-action-widget" onClick={(e) => e.stopPropagation()}>
        <div className="widget-header">
          <h3 className="widget-title">🔄 Swap Tokens</h3>
          <button className="widget-close" onClick={onClose}>✕</button>
        </div>

        <div className="widget-content">
          <div className="coming-soon-section">
            <div className="coming-soon-icon">🚧</div>
            <h4 className="coming-soon-title">Coming Soon</h4>
            <p className="coming-soon-text">
              Token swapping will be available in the next update.
              We'll integrate with popular DEX protocols like Uniswap.
            </p>
          </div>

          <div className="widget-actions">
            <button className="widget-btn primary full-width" onClick={onClose}>
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
