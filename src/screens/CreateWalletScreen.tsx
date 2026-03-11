import React, { useState, useEffect } from 'react';
import './CreateWalletScreen.css';
import WalletService from '../services/WalletService';
import SeedPhraseDisplay from '../components/SeedPhraseDisplay';
import PINInput from '../components/PINInput';
import { validatePIN } from '../utils/validation';

interface CreateWalletScreenProps {
  onComplete: (walletId: string) => void;
}

type Step = 'welcome' | 'generate' | 'verify' | 'pin' | 'confirm-pin' | 'success';

const CreateWalletScreen: React.FC<CreateWalletScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [address, setAddress] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [pin, setPIN] = useState<string>('');
  const [verificationIndices, setVerificationIndices] = useState<number[]>([]);
  const [verificationInput, setVerificationInput] = useState<string[]>(['', '', '']);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const generateNewWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      const wallet = await WalletService.generateWallet();
      setMnemonic(wallet.mnemonic.split(' '));
      setAddress(wallet.address);
      setWalletId(wallet.id);
      setStep('generate');
    } catch (err) {
      setError('Failed to generate wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startVerification = () => {
    // Pick 3 random word indices for verification
    const indices: number[] = [];
    while (indices.length < 3) {
      const randomIndex = Math.floor(Math.random() * 12);
      if (!indices.includes(randomIndex)) {
        indices.push(randomIndex);
      }
    }
    setVerificationIndices(indices.sort((a, b) => a - b));
    setStep('verify');
  };

  const verifyWords = () => {
    const isValid = verificationIndices.every((index, i) => {
      return mnemonic[index].toLowerCase() === verificationInput[i].toLowerCase().trim();
    });

    if (isValid) {
      setError('');
      setStep('pin');
    } else {
      setError('Words do not match. Please try again.');
      setVerificationInput(['', '', '']);
    }
  };

  const handlePINComplete = (enteredPIN: string) => {
    if (!validatePIN(enteredPIN)) {
      setError('PIN must be 4-6 digits');
      return;
    }
    setPIN(enteredPIN);
    setError('');
    setStep('confirm-pin');
  };

  const handleConfirmPINComplete = async (confirmedPIN: string) => {
    if (confirmedPIN !== pin) {
      setError('PINs do not match. Please try again.');
      setStep('pin');
      setPIN('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await WalletService.saveWallet(
        { id: walletId, address, mnemonic: mnemonic.join(' '), privateKey: '' },
        pin,
        'My Wallet',
        true // This is the main wallet
      );
      setStep('success');
    } catch (err) {
      setError('Failed to save wallet. Please try again.');
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete(walletId);
  };

  return (
    <div className="create-wallet-screen">
      <div className="create-wallet-container">
        {step === 'welcome' && (
          <div className="step-content">
            <h1 className="app-title">🔐 WonderWallet</h1>
            <p className="app-subtitle">Your Secure Multi-Chain Crypto Wallet</p>
            
            <div className="welcome-actions">
              <button
                className="primary-btn large"
                onClick={generateNewWallet}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Create New Wallet'}
              </button>
              
              <button
                className="secondary-btn large"
                onClick={() => window.location.href = '#restore'}
              >
                Restore from Seed Phrase
              </button>
            </div>

            <div className="info-box">
              <p>💡 Your wallet will be encrypted with a PIN that only you know.</p>
              <p>📝 You'll receive a 12-word seed phrase - write it down and store it safely!</p>
            </div>
          </div>
        )}

        {step === 'generate' && (
          <div className="step-content">
            <h2>Your Secret Recovery Phrase</h2>
            <p className="step-description">
              Write down these 12 words in order. You'll need them to recover your wallet.
            </p>

            <SeedPhraseDisplay words={mnemonic} showWarning={true} />

            <div className="address-display">
              <label>Your Ethereum Address:</label>
              <div className="address-box">{address}</div>
            </div>

            <button className="primary-btn" onClick={startVerification}>
              I've Written It Down
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="step-content">
            <h2>Verify Your Seed Phrase</h2>
            <p className="step-description">
              To ensure you wrote it down correctly, please enter the following words:
            </p>

            <div className="verification-inputs">
              {verificationIndices.map((index, i) => (
                <div key={index} className="verification-input-group">
                  <label>Word #{index + 1}</label>
                  <input
                    type="text"
                    value={verificationInput[i]}
                    onChange={(e) => {
                      const newInput = [...verificationInput];
                      newInput[i] = e.target.value;
                      setVerificationInput(newInput);
                    }}
                    className="word-input"
                    placeholder="Enter word"
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button className="secondary-btn" onClick={() => setStep('generate')}>
                Back
              </button>
              <button
                className="primary-btn"
                onClick={verifyWords}
                disabled={verificationInput.some((w) => !w)}
              >
                Verify
              </button>
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div className="step-content">
            <h2>Set Your PIN</h2>
            <p className="step-description">
              Create a 4-6 digit PIN to secure your wallet
            </p>

            <PINInput onComplete={handlePINComplete} error={error} />

            <div className="info-box small">
              <p>💡 Choose a PIN you'll remember but others can't guess</p>
            </div>
          </div>
        )}

        {step === 'confirm-pin' && (
          <div className="step-content">
            <h2>Confirm Your PIN</h2>
            <p className="step-description">
              Enter your PIN again to confirm
            </p>

            <PINInput onComplete={handleConfirmPINComplete} error={error} disabled={loading} />

            {loading && <div className="loading-spinner">Creating your wallet...</div>}
          </div>
        )}

        {step === 'success' && (
          <div className="step-content">
            <div className="success-icon">✅</div>
            <h2>Wallet Created Successfully!</h2>
            <p className="step-description">
              Your wallet is now ready to use. Keep your seed phrase safe!
            </p>

            <div className="success-info">
              <p><strong>Address:</strong></p>
              <div className="address-box">{address}</div>
            </div>

            <button className="primary-btn large" onClick={handleComplete}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateWalletScreen;
