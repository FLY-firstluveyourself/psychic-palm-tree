import React, { useState, useEffect } from 'react';
import './App.css';
import CreateWalletScreen from './screens/CreateWalletScreen';
import RestoreWalletScreen from './screens/RestoreWalletScreen';
import DashboardScreen from './screens/DashboardScreen';
import DecoySetupScreen from './screens/DecoySetupScreen';
import SettingsScreen from './screens/SettingsScreen';
import CreateMultiChainWallet from './screens/CreateMultiChainWallet';
import MultiChainDashboard from './screens/MultiChainDashboard';
import PINInput from './components/PINInput';
import StorageService from './services/StorageService';
import SecurityService from './services/SecurityService';
import MultiChainWalletService from './services/MultiChainWalletService';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="Octocat.png" className="App-logo" alt="logo" />
        <p>
          GitHub Codespaces <span className="heart">♥️</span> React
        </p>
        <p className="small">
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </p>
      </header>
    </div>
  );
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeWalletId, setActiveWalletId] = useState('');
  const [mainPIN, setMainPIN] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [walletMode, setWalletMode] = useState('single'); // 'single' or 'multi'
  const [multiChainWallet, setMultiChainWallet] = useState(null);

  useEffect(() => {
    checkExistingWallet();
  }, []);

  const checkExistingWallet = async () => {
    const wallets = await StorageService.getAllWallets();
    const hasMultiChain = await MultiChainWalletService.hasMultiChainWallet();
    const locked = await StorageService.isAppLocked();
    
    if (locked) {
      setIsLocked(true);
    }
    
    // Check if user has multi-chain wallet
    if (hasMultiChain) {
      setWalletMode('multi');
      setCurrentScreen('auth');
    } else if (wallets.length > 0) {
      setWalletMode('single');
      setCurrentScreen('auth');
    } else {
      setCurrentScreen('welcome');
    }
  };

  const handleAuthentication = async (pin) => {
    if (walletMode === 'multi') {
      // Authenticate multi-chain wallet
      try {
        const wallet = await MultiChainWalletService.loadMultiChainWallet(pin);
        if (wallet) {
          setMultiChainWallet(wallet);
          setMainPIN(pin);
          setAuthError('');
          setCurrentScreen('multichain-dashboard');
        } else {
          setAuthError('Incorrect PIN. Please try again.');
        }
      } catch (error) {
        setAuthError('Incorrect PIN. Please try again.');
      }
    } else {
      // Authenticate single-chain wallet
      const result = await SecurityService.authenticateWithPIN(pin);
      
      if (result.success && result.walletId) {
        setActiveWalletId(result.walletId);
        setMainPIN(pin);
        setAuthError('');
        setCurrentScreen('dashboard');
      } else {
        const remaining = await SecurityService.getRemainingAttempts();
        setAuthError(result.message || `Incorrect PIN. ${remaining} attempts remaining.`);
      }
    }
  };

  const handleWalletCreated = (walletId) => {
    setActiveWalletId(walletId);
    setWalletMode('single');
    setCurrentScreen('dashboard');
  };

  const handleMultiChainWalletCreated = (walletId, pin) => {
    setMainPIN(pin);
    setWalletMode('multi');
    // Wallet will be loaded when dashboard mounts
    setCurrentScreen('auth');
    // Immediately authenticate
    handleAuthentication(pin);
  };

  const handleWalletRestored = async (walletId) => {
    setActiveWalletId(walletId);
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    setActiveWalletId('');
    setMainPIN('');
    setMultiChainWallet(null);
    setCurrentScreen('auth');
  };

  const handleClearAllData = async () => {
    await StorageService.clearAll();
    await MultiChainWalletService.clearMultiChainWallet();
    setActiveWalletId('');
    setMainPIN('');
    setMultiChainWallet(null);
    setCurrentScreen('welcome');
  };

  const handleUnlock = async () => {
    await SecurityService.unlockApp();
    setIsLocked(false);
    setCurrentScreen('auth');
  };

  if (currentScreen === 'splash') {
    return (
      <div className="app-splash">
        <div className="splash-content">
          <h1 className="splash-title">🌐 Future Unity</h1>
          <p className="splash-tagline">Multi-Chain Crypto Wallet</p>
          <div className="splash-loader">Loading...</div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="app-locked">
        <div className="locked-content">
          <div className="locked-icon">🔒</div>
          <h2>App Locked</h2>
          <p>Too many failed PIN attempts</p>
          <p className="locked-hint">
            You can unlock the app, but note that this is a security feature to protect your wallet.
          </p>
          <button className="unlock-btn" onClick={handleUnlock}>
            Unlock App
          </button>
        </div>
      </div>
    );
  }

  if (currentScreen === 'auth') {
    return (
      <div className="app-auth">
        <div className="auth-content">
          <h1 className="auth-title">
            {walletMode === 'multi' ? '🌐 Future Unity' : '🔐 WonderWallet'}
          </h1>
          <p className="auth-subtitle">Enter your PIN to unlock</p>
          <PINInput onComplete={handleAuthentication} error={authError} />
          <button className="text-btn" onClick={() => setCurrentScreen('restore')}>
            Restore a different wallet
          </button>
        </div>
      </div>
    );
  }

  // Welcome screen for new users
  if (currentScreen === 'welcome') {
    return (
      <div className="app-welcome">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome to Future Unity</h1>
          <p className="welcome-subtitle">
            Choose how you want to set up your wallet
          </p>
          
          <div className="wallet-options">
            <button 
              className="wallet-option-btn featured"
              onClick={() => setCurrentScreen('create-multichain')}
            >
              <div className="option-icon">🌐</div>
              <div className="option-content">
                <h3>Multi-Chain Wallet</h3>
                <p>Manage assets across Ethereum, Bitcoin, Polygon, and more</p>
                <span className="badge-new">Recommended</span>
              </div>
            </button>

            <button 
              className="wallet-option-btn"
              onClick={() => {
                setWalletMode('single');
                setCurrentScreen('create');
              }}
            >
              <div className="option-icon">🔐</div>
              <div className="option-content">
                <h3>Single Chain Wallet</h3>
                <p>Simple Ethereum-only wallet with decoy security</p>
                <span className="badge">Classic WonderWallet</span>
              </div>
            </button>
          </div>

          <button 
            className="text-btn"
            onClick={() => setCurrentScreen('restore')}
          >
            Already have a wallet? Restore it
          </button>
        </div>
      </div>
    );
  }

  if (currentScreen === 'create') {
    return (
      <CreateWalletScreen
        onComplete={handleWalletCreated}
      />
    );
  }

  if (currentScreen === 'create-multichain') {
    return (
      <CreateMultiChainWallet
        onComplete={handleMultiChainWalletCreated}
        onBack={() => setCurrentScreen('welcome')}
      />
    );
  }

  if (currentScreen === 'restore') {
    return (
      <RestoreWalletScreen
        onComplete={handleWalletRestored}
        onCancel={async () => {
          const wallets = await StorageService.getAllWallets();
          const hasMultiChain = await MultiChainWalletService.hasMultiChainWallet();
          setCurrentScreen(wallets.length > 0 || hasMultiChain ? 'auth' : 'welcome');
        }}
      />
    );
  }

  if (currentScreen === 'dashboard') {
    return (
      <DashboardScreen
        walletId={activeWalletId}
        onLogout={handleLogout}
        onSettings={() => setCurrentScreen('settings')}
        onSetupDecoy={() => setCurrentScreen('decoy-setup')}
      />
    );
  }

  if (currentScreen === 'multichain-dashboard') {
    return (
      <MultiChainDashboard
        wallet={multiChainWallet}
        pin={mainPIN}
        onLogout={handleLogout}
        onSettings={() => setCurrentScreen('settings')}
      />
    );
  }

  if (currentScreen === 'decoy-setup') {
    return (
      <DecoySetupScreen
        mainWalletId={activeWalletId}
        mainPIN={mainPIN}
        onComplete={() => setCurrentScreen('dashboard')}
        onCancel={() => setCurrentScreen('dashboard')}
      />
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        onBack={() => setCurrentScreen(walletMode === 'multi' ? 'multichain-dashboard' : 'dashboard')}
        onClearData={handleClearAllData}
      />
    );
  }

  return null;
}

export default App;
