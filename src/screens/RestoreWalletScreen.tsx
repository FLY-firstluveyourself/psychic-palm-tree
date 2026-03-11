import React, { useState } from 'react';
import './RestoreWalletScreen.css';
import WalletService from '../services/WalletService';
import PINInput from '../components/PINInput';
import { validateSeedPhraseFormat } from '../utils/validation';

interface RestoreWalletScreenProps {
  onComplete: (walletId: string) => void;
  onCancel: () => void;
}

type Step = 'input' | 'preview' | 'pin' | 'confirm-pin' | 'success';

const RestoreWalletScreen: React.FC<RestoreWalletScreenProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>('input');
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [pin, setPIN] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSeedPhraseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSeedPhrase(e.target.value);
    setError('');
  };

  const validateAndRestore = async () => {
    const trimmedPhrase = seedPhrase.trim().toLowerCase();
    
    if (!validateSeedPhraseFormat(trimmedPhrase)) {
      setError('Invalid seed phrase format. Please enter exactly 12 words separated by spaces.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const wallet = await WalletService.restoreWallet(trimmedPhrase);
      setAddress(wallet.address);
      setWalletId(wallet.id);
      setStep('preview');
    } catch (err) {
      setError('Failed to restore wallet. Please check your seed phrase and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePINComplete = (enteredPIN: string) => {
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
        { id: walletId, address, mnemonic: seedPhrase.trim().toLowerCase(), privateKey: '' },
        pin,
        'Restored Wallet',
        true
      );
      setStep('success');
    } catch (err) {
      setError('Failed to save wallet. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="restore-wallet-screen">
      <div className="restore-wallet-container">
        {step === 'input' && (
          <div className="step-content">
            <h2>Restore Your Wallet</h2>
            <p className="step-description">
              Enter your 12-word seed phrase to restore your wallet
            </p>

            <div className="seed-phrase-input-container">
              <label>Seed Phrase</label>
              <textarea
                className="seed-phrase-textarea"
                value={seedPhrase}
                onChange={handleSeedPhraseChange}
                placeholder="Enter your 12 words separated by spaces"
                rows={4}
                autoComplete="off"
                spellCheck={false}
              />
              <div className="input-hint">
                💡 Words should be lowercase and separated by spaces
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button className="secondary-btn" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={validateAndRestore}
                disabled={loading || !seedPhrase.trim()}
              >
                {loading ? 'Restoring...' : 'Restore Wallet'}
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="step-content">
            <h2>Wallet Recovered!</h2>
            <p className="step-description">
              Your wallet has been successfully recovered
            </p>

            <div className="recovered-address">
              <label>Recovered Address:</label>
              <div className="address-box">{address}</div>
            </div>

            <div className="info-box">
              <p>✅ This address matches your seed phrase</p>
              <p>🔒 Now set a PIN to secure this wallet</p>
            </div>

            <button className="primary-btn" onClick={() => setStep('pin')}>
              Continue
            </button>
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

            {loading && <div className="loading-spinner">Saving your wallet...</div>}
          </div>
        )}

        {step === 'success' && (
          <div className="step-content">
            <div className="success-icon">✅</div>
            <h2>Wallet Restored Successfully!</h2>
            <p className="step-description">
              Your wallet is now ready to use
            </p>

            <div className="success-info">
              <p><strong>Address:</strong></p>
              <div className="address-box">{address}</div>
            </div>

            <button className="primary-btn large" onClick={() => onComplete(walletId)}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestoreWalletScreen;
