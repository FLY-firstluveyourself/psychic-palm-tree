import React, { useState } from 'react';
import './SearchFilter.css';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  placeholder?: string;
}

export interface FilterOptions {
  chain?: string;
  assetType?: string;
  walletId?: string;
  sortBy?: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onFilterChange,
  placeholder = 'Search wallets, addresses, transactions...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    chain: 'all',
    assetType: 'all',
    walletId: 'all',
    sortBy: 'recent',
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      chain: 'all',
      assetType: 'all',
      walletId: 'all',
      sortBy: 'recent',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== 'all' && v !== 'recent');

  return (
    <div className="search-filter">
      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
            >
              ✕
            </button>
          )}
        </div>
        
        <button
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="filter-icon">⚙️</span>
          <span className="filter-text">Filters</span>
          {hasActiveFilters && <span className="filter-badge"></span>}
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label className="filter-label">Chain</label>
            <select
              className="filter-select"
              value={filters.chain}
              onChange={(e) => handleFilterChange('chain', e.target.value)}
            >
              <option value="all">All Chains</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
              <option value="arbitrum">Arbitrum</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Asset Type</label>
            <select
              className="filter-select"
              value={filters.assetType}
              onChange={(e) => handleFilterChange('assetType', e.target.value)}
            >
              <option value="all">All Assets</option>
              <option value="native">Native Tokens</option>
              <option value="erc20">ERC-20</option>
              <option value="nft">NFTs</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <select
              className="filter-select"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="balance-high">Balance: High to Low</option>
              <option value="balance-low">Balance: Low to High</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
