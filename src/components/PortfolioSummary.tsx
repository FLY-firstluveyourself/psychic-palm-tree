import React from 'react';
import './PortfolioSummary.css';

interface PortfolioSummaryProps {
  totalValue: string;
  totalWallets: number;
  totalAssets: number;
  change24h?: number;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  totalValue,
  totalWallets,
  totalAssets,
  change24h,
}) => {
  return (
    <div className="portfolio-summary">
      <div className="portfolio-header">
        <h2 className="portfolio-title">Total Portfolio Value</h2>
        {change24h !== undefined && (
          <div className={`portfolio-change ${change24h >= 0 ? 'positive' : 'negative'}`}>
            {change24h >= 0 ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
          </div>
        )}
      </div>
      
      <div className="portfolio-value">
        <span className="value-symbol">Ξ</span>
        <span className="value-amount">{totalValue}</span>
        <span className="value-unit">ETH</span>
      </div>

      <div className="portfolio-stats">
        <div className="stat-item">
          <div className="stat-icon">👛</div>
          <div className="stat-content">
            <div className="stat-value">{totalWallets}</div>
            <div className="stat-label">Wallets</div>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <div className="stat-value">{totalAssets}</div>
            <div className="stat-label">Assets</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
