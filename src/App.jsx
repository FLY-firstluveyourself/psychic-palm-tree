import React, { useState, useEffect } from 'react';
import './App.css';
import CreateWalletScreen from './screens/CreateWalletScreen';
import RestoreWalletScreen from './screens/RestoreWalletScreen';
import DashboardScreen from './screens/DashboardScreen';
import DecoySetupScreen from './screens/DecoySetupScreen';
import SettingsScreen from './screens/SettingsScreen';
import PINInput from './components/PINInput';
import StorageService from './services/StorageService';
import SecurityService from './services/SecurityService';

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeWalletId, setActiveWalletId] = useState('');
  const [mainPIN, setMainPIN] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    checkExistingWallet();
  }, []);

  const checkExistingWallet = async () => {
    const wallets = await StorageService.getAllWallets();
    const locked = await StorageService.isAppLocked();
    
    if (locked) {
      setIsLocked(true);
    }
    
    if (wallets.length > 0) {
      setCurrentScreen('auth');
    } else {
      setCurrentScreen('create');
    }
  };

  const handleAuthentication = async (pin) => {
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
  };

  const handleWalletCreated = (walletId) => {
    setActiveWalletId(walletId);
    setCurrentScreen('dashboard');
  };

  const handleWalletRestored = async (walletId) => {
    setActiveWalletId(walletId);
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    setActiveWalletId('');
    setMainPIN('');
    setCurrentScreen('auth');
  };

  const handleClearAllData = async () => {
    await StorageService.clearAll();
    setActiveWalletId('');
    setMainPIN('');
    setCurrentScreen('create');
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
          <h1 className="splash-title">🔐 WonderWallet</h1>
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
          <h1 className="auth-title">🔐 WonderWallet</h1>
          <p className="auth-subtitle">Enter your PIN to unlock</p>
          <PINInput onComplete={handleAuthentication} error={authError} />
          <button className="text-btn" onClick={() => setCurrentScreen('restore')}>
            Restore a different wallet
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

  if (currentScreen === 'restore') {
    return (
      <RestoreWalletScreen
        onComplete={handleWalletRestored}
        onCancel={async () => {
          const wallets = await StorageService.getAllWallets();
          setCurrentScreen(wallets.length > 0 ? 'auth' : 'create');
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
        onBack={() => setCurrentScreen('dashboard')}
        onClearData={handleClearAllData}
      />
    );
  }

  return null;
}

export default App;
