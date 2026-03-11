/**
 * CreateMultiChainWallet - Multi-chain wallet creation flow
 * 
 * Extends the existing CreateWalletScreen to support multiple chains
 */

import React, { useState } from 'react';
import MultiChainWalletService from '../services/MultiChainWalletService';
import SeedPhraseDisplay from '../components/SeedPhraseDisplay';
import PINInput from '../components/PINInput';
import './CreateMultiChainWallet.css';

interface CreateMultiChainWalletProps {
  onComplete: (walletId: string, pin: string) => void;
  onBack?: () => void;
}

type Step = 'chains' | 'generate' | 'verify' | 'pin' | 'confirm' | 'success';

const CreateMultiChainWallet: React.FC<CreateMultiChainWalletProps> = ({
  onComplete,
  onBack
}) => {
  const [step, setStep] = useState<Step>('chains');
  const [selectedChains, setSelectedChains] = useState<string[]>(['ethereum']);
  const [mnemonic, setMnemonic] = useState('');
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [verifyWords, setVerifyWords] = useState<string[]>(['', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState<any>(null);

  const allChains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: '🔷' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', icon: '🟣' },
    { id: 'bsc', name: 'Binance Smart Chain', symbol: 'BNB', icon: '🟡' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', icon: '🔵' },
    { id: 'optimism', name: 'Optimism', symbol: 'ETH', icon: '🔴' },
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '🟠', disabled: true }
  ];

  const toggleChain = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      // Keep at least one chain selected
      if (selectedChains.length > 1) {
        setSelectedChains(selectedChains.filter(id => id !== chainId));
      }
    } else {
      setSelectedChains([...selectedChains, chainId]);
    }
  };

  const handleGenerateWallet = () => {
    try {
      const newMnemonic = MultiChainWalletService.generateMnemonic();
      setMnemonic(newMnemonic);
      
      // Select 3 random words for verification
      const indices: number[] = [];
      while (indices.length < 3) {
        const idx = Math.floor(Math.random() * 12);
        if (!indices.includes(idx)) {
          indices.push(idx);
        }
      }
      setVerifyIndices(indices.sort((a, b) => a - b));
      
      setStep('generate');
    } catch (err: any) {
      setError(err.message || 'Failed to generate wallet');
    }
  };

  const handleVerify = () => {
    const mnemonicWords = mnemonic.split(' ');
    
    for (let i = 0; i < 3; i++) {
      const expectedWord = mnemonicWords[verifyIndices[i]];
      const enteredWord = verifyWords[i].trim().toLowerCase();
      
      if (expectedWord !== enteredWord) {
        setError(`Word #${verifyIndices[i] + 1} is incorrect`);
        return;
      }
    }
    
    setError('');
    setStep('pin');
  };

  const handleSetPIN = (pinValue: string) => {
    if (pinValue.length < 4 || pinValue.length > 6) {
      setError('PIN must be 4-6 digits');
      return;
    }
    
    setPin(pinValue);
    setError('');
    setStep('confirm');
  };

  const handleConfirmPIN = async (confirmValue: string) => {
    if (confirmValue !== pin) {
      setError('PINs do not match');
      return;
    }
    
    try {
      setError('');
      
      // Generate multi-chain wallet
      const multiWallet = await MultiChainWalletService.generateMultiChainWallet(
        mnemonic,
        selectedChains
      );
      
      // Save wallet with encryption
      await MultiChainWalletService.saveMultiChainWallet(multiWallet, pin);
      
      setWallet(multiWallet);
      setStep('success');
      
      // Complete after a short delay
      setTimeout(() => {
        onComplete(multiWallet.id, pin);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    }
  };

  // Step 1: Chain Selection
  if (step === 'chains') {
    return (
      <div className="create-multichain-wallet">
        <div className="wallet-container">
          <h1>Select Chains</h1>
          <p className="subtitle">
            Choose which blockchains you want to use with your wallet.
            You can add more chains later.
          </p>

          <div className="chain-selection">
            {allChains.map(chain => (
              <button
                key={chain.id}
                className={`chain-option ${selectedChains.includes(chain.id) ? 'selected' : ''} ${chain.disabled ? 'disabled' : ''}`}
                onClick={() => !chain.disabled && toggleChain(chain.id)}
                disabled={chain.disabled}
              >
                <span className="chain-icon">{chain.icon}</span>
                <div className="chain-info">
                  <span className="chain-name">{chain.name}</span>
                  <span className="chain-symbol">{chain.symbol}</span>
                </div>
                {selectedChains.includes(chain.id) && (
                  <span className="checkmark">✓</span>
                )}
                {chain.disabled && (
                  <span className="coming-soon-badge">Soon</span>
                )}
              </button>
            ))}
          </div>

          <div className="selected-summary">
            <p>Selected chains: <strong>{selectedChains.length}</strong></p>
            <p className="note">
              ℹ️ All chains will use the same recovery phrase for easy backup
            </p>
          </div>

          <div className="button-group">
            {onBack && (
              <button onClick={onBack} className="btn-secondary">
                Back
              </button>
            )}
            <button onClick={handleGenerateWallet} className="btn-primary">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Display Seed Phrase
  if (step === 'generate') {
    return (
      <div className="create-multichain-wallet">
        <div className="wallet-container">
          <h1>Your Recovery Phrase</h1>
          <p className="subtitle">
            Write down these 12 words in order. You'll need them to recover your wallet.
          </p>

          <SeedPhraseDisplay mnemonic={mnemonic} />

          <div className="warning-box">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>Never share your recovery phrase with anyone</li>
              <li>Store it securely offline</li>
              <li>This phrase controls <strong>ALL</strong> your selected chains</li>
              <li>Lost phrase = Lost access to all funds</li>
            </ul>
          </div>

          <button onClick={() => setStep('verify')} className="btn-primary">
            I've Written It Down
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Verify Seed Phrase
  if (step === 'verify') {
    return (
      <div className="create-multichain-wallet">
        <div className="wallet-container">
          <h1>Verify Recovery Phrase</h1>
          <p className="subtitle">
            Enter the following words from your recovery phrase:
          </p>

          <div className="verify-words">
            {verifyIndices.map((idx, i) => (
              <div key={idx} className="word-input-group">
                <label>Word #{idx + 1}</label>
                <input
                  type="text"
                  value={verifyWords[i]}
                  onChange={(e) => {
                    const newWords = [...verifyWords];
                    newWords[i] = e.target.value;
                    setVerifyWords(newWords);
                  }}
                  placeholder={`Enter word #${idx + 1}`}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button onClick={() => setStep('generate')} className="btn-secondary">
              Back
            </button>
            <button onClick={handleVerify} className="btn-primary">
              Verify
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Set PIN
  if (step === 'pin') {
    return (
      <div className="create-multichain-wallet">
        <div className="wallet-container">
          <h1>Set Your PIN</h1>
          <p className="subtitle">
            Create a 4-6 digit PIN to secure your wallet
          </p>

          <PINInput
            length={6}
            onComplete={handleSetPIN}
            error={error}
          />

          <p className="note">
            Your PIN encrypts your recovery phrase on this device
          </p>
        </div>
      </div>
    );
  }

  // Step 5: Confirm PIN
  if (step === 'confirm') {
    return (
      <div className="create-multichain-wallet">
        <div className="wallet-container">
          <h1>Confirm Your PIN</h1>
          <p className="subtitle">
            Re-enter your PIN to confirm
          </p>

          <PINInput
            length={6}
            onComplete={handleConfirmPIN}
            error={error}
          />
        </div>
      </div>
    );
  }

  // Step 6: Success
  if (step === 'success') {
    return (
      <div className="create-multichain-wallet">
        <div className="wallet-container success">
          <div className="success-icon">✓</div>
          <h1>Wallet Created!</h1>
          <p className="subtitle">
            Your multi-chain wallet has been created successfully
          </p>

          <div className="success-details">
            <p><strong>{selectedChains.length}</strong> chains enabled</p>
            <div className="enabled-chains">
              {selectedChains.map(chainId => {
                const chain = allChains.find(c => c.id === chainId);
                return (
                  <span key={chainId} className="chain-badge">
                    {chain?.icon} {chain?.symbol}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default CreateMultiChainWallet;
