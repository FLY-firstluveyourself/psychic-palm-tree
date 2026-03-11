import React, { useState } from 'react';
import './DecoySetupScreen.css';
import DecoyService from '../services/DecoyService';
import PINInput from '../components/PINInput';

interface DecoySetupScreenProps {
  mainWalletId: string;
  mainPIN: string;
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'intro' | 'configure' | 'creating' | 'success';

const DecoySetupScreen: React.FC<DecoySetupScreenProps> = ({
  mainWalletId,
  mainPIN,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>('intro');
  const [numDecoys, setNumDecoys] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [createdWallets, setCreatedWallets] = useState<string[]>([]);

  const handleCreateDecoys = async () => {
    setLoading(true);
    setError('');
    setStep('creating');

    try {
      const decoyIds = await DecoyService.createDecoySystem(mainWalletId, mainPIN, numDecoys);
      setCreatedWallets(decoyIds);
      setStep('success');
    } catch (err) {
      setError('Failed to create decoy wallets. Please try again.');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="decoy-setup-screen">
      <div className="decoy-setup-container">
        {step === 'intro' && (
          <div className="step-content">
            <div className="intro-icon">🛡️</div>
            <h2>Decoy Wallet System</h2>
            <p className="step-description">
              Protect your crypto with revolutionary security
            </p>

            <div className="benefits-list">
              <div className="benefit-item">
                <span className="benefit-icon">🎭</span>
                <div className="benefit-text">
                  <h4>Multiple Wallets</h4>
                  <p>Create 4-9 decoy wallets that look identical to your main wallet</p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon">🔒</span>
                <div className="benefit-text">
                  <h4>Unique PINs</h4>
                  <p>Each wallet gets its own PIN - even you won't know which is real!</p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon">⚠️</span>
                <div className="benefit-text">
                  <h4>Duress Mode</h4>
                  <p>Set a special PIN to open a decoy wallet in threatening situations</p>
                </div>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon">👁️</span>
                <div className="benefit-text">
                  <h4>Master View</h4>
                  <p>Use biometric auth to reveal which wallet is your main one</p>
                </div>
              </div>
            </div>

            <div className="warning-box">
              <span className="warning-icon">⚠️</span>
              <p>
                <strong>Important:</strong> You'll need to remember your main wallet's PIN to access decoy features.
                Each decoy will get a randomly generated PIN.
              </p>
            </div>

            <div className="button-group">
              <button className="secondary-btn" onClick={onCancel}>
                Maybe Later
              </button>
              <button className="primary-btn" onClick={() => setStep('configure')}>
                Set Up Now
              </button>
            </div>
          </div>
        )}

        {step === 'configure' && (
          <div className="step-content">
            <h2>Configure Decoy System</h2>
            <p className="step-description">
              Choose how many decoy wallets to create
            </p>

            <div className="slider-container">
              <label>Number of Decoy Wallets: <strong>{numDecoys}</strong></label>
              <input
                type="range"
                min="4"
                max="9"
                value={numDecoys}
                onChange={(e) => setNumDecoys(parseInt(e.target.value))}
                className="decoy-slider"
              />
              <div className="slider-labels">
                <span>4 (Faster)</span>
                <span>9 (More Secure)</span>
              </div>
            </div>

            <div className="info-box">
              <p>💡 More decoys = better security but slower wallet switching</p>
              <p>🎯 We recommend 5-7 decoys for optimal balance</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button className="secondary-btn" onClick={() => setStep('intro')}>
                Back
              </button>
              <button
                className="primary-btn"
                onClick={handleCreateDecoys}
                disabled={loading}
              >
                Create Decoy Wallets
              </button>
            </div>
          </div>
        )}

        {step === 'creating' && (
          <div className="step-content">
            <div className="loading-icon">⏳</div>
            <h2>Creating Decoy Wallets...</h2>
            <p className="step-description">
              Generating {numDecoys} secure decoy wallets
            </p>

            <div className="progress-info">
              <p>This may take a few moments...</p>
              <div className="progress-animation">
                <div className="progress-dot"></div>
                <div className="progress-dot"></div>
                <div className="progress-dot"></div>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="step-content">
            <div className="success-icon">✅</div>
            <h2>Decoy System Active!</h2>
            <p className="step-description">
              Successfully created {numDecoys} decoy wallets
            </p>

            <div className="success-stats">
              <div className="stat-item">
                <div className="stat-value">{numDecoys + 1}</div>
                <div className="stat-label">Total Wallets</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">1</div>
                <div className="stat-label">Main Wallet</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{numDecoys}</div>
                <div className="stat-label">Decoys</div>
              </div>
            </div>

            <div className="info-box">
              <p>🎭 All wallets appear identical in the interface</p>
              <p>🔒 Each has a unique PIN for access</p>
              <p>💰 Consider funding decoys with small amounts for authenticity</p>
            </div>

            <button className="primary-btn large" onClick={onComplete}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecoySetupScreen;
