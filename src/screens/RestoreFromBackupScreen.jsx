/**
 * RestoreFromBackupScreen - Secure wallet restoration from backup files
 * Handles file upload, validation, and conflict resolution
 */

import { useState } from 'react';
import BackupService from '../services/BackupService';
import './RestoreFromBackupScreen.css';

function RestoreFromBackupScreen({ onBack, onRestoreComplete }) {
  const [step, setStep] = useState('upload'); // upload, verify, restore, success
  const [selectedFile, setSelectedFile] = useState(null);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [hasPassphrase, setHasPassphrase] = useState(false);
  const [mergeStrategy, setMergeStrategy] = useState('skip');
  const [backupInfo, setBackupInfo] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.wbk')) {
        setError('Invalid file format. Please select a .wbk backup file.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleVerifyBackup = async () => {
    if (!selectedFile) {
      setError('Please select a backup file');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Read file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = e.target.result;
          
          // Try to parse backup metadata (basic validation)
          // In production, you'd want to parse more carefully
          const fileSize = (selectedFile.size / 1024).toFixed(2);
          
          setBackupInfo({
            filename: selectedFile.name,
            size: fileSize + ' KB',
            timestamp: selectedFile.lastModified,
          });

          setStep('verify');
        } catch (error) {
          setError('Invalid backup file format');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read backup file');
        setIsProcessing(false);
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      setError('Failed to process backup file: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Note: userPIN is not currently used as wallets retain original encryption
      const result = await BackupService.restoreFromFile(
        selectedFile,
        hasPassphrase ? backupPassphrase : undefined,
        '', // PIN not used for now - wallets keep original encryption
        mergeStrategy
      );

      setRestoreResult(result);

      if (result.success) {
        setStep('success');
      } else {
        setError(result.errors.join(', '));
      }
    } catch (error) {
      console.error('Restore failed:', error);
      setError('Failed to restore backup: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (onRestoreComplete) {
      onRestoreComplete(restoreResult);
    } else {
      onBack();
    }
  };

  if (step === 'success') {
    return (
      <div className="restore-screen">
        <div className="restore-container">
          <div className="success-animation">
            <div className="checkmark">✓</div>
          </div>

          <h2>Restore Complete!</h2>

          <div className="success-info">
            <p className="success-message">
              Your wallet data has been successfully restored from backup.
            </p>

            {restoreResult && (
              <div className="restore-details">
                <div className="detail-row">
                  <span className="detail-label">Wallets Restored:</span>
                  <span className="detail-value">{restoreResult.walletsRestored}</span>
                </div>
                {restoreResult.conflictsResolved > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Conflicts Handled:</span>
                    <span className="detail-value">{restoreResult.conflictsResolved}</span>
                  </div>
                )}
                {restoreResult.errors.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Warnings:</span>
                    <span className="detail-value warning">{restoreResult.errors.length}</span>
                  </div>
                )}
              </div>
            )}

            <div className="next-steps">
              <h3>Next Steps:</h3>
              <ul>
                <li>Use your <strong>original wallet PINs</strong> to access each restored wallet</li>
                <li>Verify your restored wallet addresses</li>
                <li>Check your balance and transaction history</li>
                <li>Consider creating a fresh backup with current date</li>
              </ul>
              <div className="info-notice">
                <span className="notice-icon">ℹ️</span>
                <p>
                  <strong>Important:</strong> Restored wallets retain their original PIN encryption. 
                  You'll need to use the same PIN that was set for each wallet when it was backed up.
                </p>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button className="btn-primary" onClick={handleComplete}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'restore') {
    return (
      <div className="restore-screen">
        <div className="restore-container">
          <div className="processing-animation">
            <div className="spinner"></div>
          </div>

          <h2>Restoring Backup...</h2>

          <p className="processing-message">
            Please wait while we decrypt and restore your wallet data. This may take a moment.
          </p>

          {isProcessing && (
            <div className="progress-info">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="restore-screen">
        <div className="restore-container">
          <button className="back-button" onClick={() => setStep('upload')}>
            ← Back
          </button>

          <h2>Verify Backup</h2>

          {backupInfo && (
            <div className="backup-info-card">
              <h3>Backup File Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Filename:</span>
                  <span className="info-value">{backupInfo.filename}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">File Size:</span>
                  <span className="info-value">{backupInfo.size}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Modified:</span>
                  <span className="info-value">
                    {new Date(backupInfo.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="verification-section">
            <h3>Backup Protection</h3>
            <div className="option-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasPassphrase}
                  onChange={(e) => setHasPassphrase(e.target.checked)}
                />
                <span>This backup is protected with a passphrase</span>
              </label>
            </div>

            {hasPassphrase && (
              <div className="passphrase-input-section">
                <label>Backup Passphrase</label>
                <input
                  type="password"
                  value={backupPassphrase}
                  onChange={(e) => setBackupPassphrase(e.target.value)}
                  placeholder="Enter backup passphrase"
                  className="passphrase-input"
                />
              </div>
            )}
          </div>

          <div className="merge-strategy-section">
            <h3>Conflict Resolution</h3>
            <p className="section-description">
              Choose how to handle wallets that already exist on this device:
            </p>

            <div className="strategy-options">
              <label className="strategy-option">
                <input
                  type="radio"
                  name="strategy"
                  value="skip"
                  checked={mergeStrategy === 'skip'}
                  onChange={(e) => setMergeStrategy(e.target.value)}
                />
                <div className="strategy-content">
                  <h4>Skip Existing</h4>
                  <p>Keep current wallets, only add new ones from backup</p>
                </div>
              </label>

              <label className="strategy-option">
                <input
                  type="radio"
                  name="strategy"
                  value="replace"
                  checked={mergeStrategy === 'replace'}
                  onChange={(e) => setMergeStrategy(e.target.value)}
                />
                <div className="strategy-content">
                  <h4>Replace Existing</h4>
                  <p>Replace current wallets with backup versions</p>
                </div>
              </label>

              <label className="strategy-option">
                <input
                  type="radio"
                  name="strategy"
                  value="merge"
                  checked={mergeStrategy === 'merge'}
                  onChange={(e) => setMergeStrategy(e.target.value)}
                />
                <div className="strategy-content">
                  <h4>Merge All</h4>
                  <p>Keep all wallets from both sources</p>
                </div>
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              className="btn-primary"
              onClick={() => {
                setError('');
                setStep('restore');
                handleRestore();
              }}
              disabled={hasPassphrase && !backupPassphrase}
            >
              Restore Wallets
            </button>
            <button className="btn-secondary" onClick={() => setStep('upload')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upload step
  return (
    <div className="restore-screen">
      <div className="restore-container">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>

        <h2>Restore from Backup</h2>

        <div className="upload-section">
          <div className="upload-area">
            <div className="upload-icon">📁</div>
            <h3>Select Backup File</h3>
            <p className="upload-description">
              Choose a WonderWallet backup file (.wbk) to restore your wallet data
            </p>

            <label htmlFor="file-input" className="file-select-button">
              Choose File
            </label>
            <input
              id="file-input"
              type="file"
              accept=".wbk"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile && (
              <div className="selected-file">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="security-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Important Security Reminders:</h4>
              <ul>
                <li>Only restore backup files from trusted sources</li>
                <li>Never share your backup file with anyone</li>
                <li>Make sure you have the correct backup passphrase (if used)</li>
                <li>You'll set a new PIN for this device during restoration</li>
              </ul>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button
            className="btn-primary"
            onClick={handleVerifyBackup}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Continue'}
          </button>
          <button
            className="btn-secondary"
            onClick={onBack}
            disabled={isProcessing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RestoreFromBackupScreen;
