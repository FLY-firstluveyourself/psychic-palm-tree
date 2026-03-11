/**
 * BackupScreen - Comprehensive backup management interface
 * Handles backup creation, export, and verification
 */

import { useState, useEffect } from 'react';
import BackupService from '../services/BackupService';
import PINInput from '../components/PINInput';
import './BackupScreen.css';

function BackupScreen({ onBack }) {
  const [step, setStep] = useState('main'); // main, create, verify, success
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [usePassphrase, setUsePassphrase] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [backupStats, setBackupStats] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [lastBackupInfo, setLastBackupInfo] = useState(null);

  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    try {
      const stats = await BackupService.getBackupStats();
      const history = await BackupService.getBackupHistory();
      const isNeeded = await BackupService.isBackupNeeded(7);
      
      setBackupStats({ ...stats, isNeeded });
      setBackupHistory(history);
    } catch (error) {
      console.error('Failed to load backup info:', error);
    }
  };

  const handleCreateBackup = async () => {
    setError('');

    // Validate passphrase if used
    if (usePassphrase) {
      if (!backupPassphrase || backupPassphrase.length < 8) {
        setError('Backup passphrase must be at least 8 characters');
        return;
      }

      if (backupPassphrase !== confirmPassphrase) {
        setError('Passphrases do not match');
        return;
      }
    }

    setIsCreating(true);

    try {
      // Create and export backup
      await BackupService.exportBackup(
        usePassphrase ? backupPassphrase : undefined,
        undefined
      );

      setLastBackupInfo({
        timestamp: Date.now(),
        hasPassphrase: usePassphrase,
      });

      setStep('success');
      await loadBackupInfo();
    } catch (error) {
      console.error('Backup creation failed:', error);
      setError('Failed to create backup: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickBackup = async () => {
    setIsCreating(true);
    setError('');

    try {
      await BackupService.exportBackup(undefined, undefined);
      setLastBackupInfo({
        timestamp: Date.now(),
        hasPassphrase: false,
      });
      setStep('success');
      await loadBackupInfo();
    } catch (error) {
      console.error('Quick backup failed:', error);
      setError('Failed to create backup: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
  };

  if (step === 'success') {
    return (
      <div className="backup-screen">
        <div className="backup-container">
          <div className="success-animation">
            <div className="checkmark">✓</div>
          </div>

          <h2>Backup Created Successfully</h2>
          
          <div className="success-info">
            <p className="success-message">
              Your wallet data has been encrypted and backed up securely.
            </p>
            
            {lastBackupInfo && (
              <div className="backup-details">
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{formatDate(lastBackupInfo.timestamp)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Protection:</span>
                  <span className="detail-value">
                    {lastBackupInfo.hasPassphrase ? 'Passphrase Protected' : 'Standard Encryption'}
                  </span>
                </div>
              </div>
            )}

            <div className="security-notice">
              <div className="notice-icon">🔒</div>
              <div className="notice-content">
                <h4>Important Security Notes:</h4>
                <ul>
                  <li>Store your backup file in a secure location</li>
                  {lastBackupInfo?.hasPassphrase && (
                    <li>Remember your backup passphrase - it cannot be recovered</li>
                  )}
                  <li>Never share your backup file with anyone</li>
                  <li>Keep multiple copies in different secure locations</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button className="btn-primary" onClick={() => setStep('main')}>
              Back to Backup Manager
            </button>
            <button className="btn-secondary" onClick={onBack}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="backup-screen">
        <div className="backup-container">
          <button className="back-button" onClick={() => setStep('main')}>
            ← Back
          </button>

          <h2>Create Encrypted Backup</h2>

          <div className="backup-options">
            <div className="option-section">
              <h3>Backup Protection</h3>
              <div className="option-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={usePassphrase}
                    onChange={(e) => setUsePassphrase(e.target.checked)}
                  />
                  <span>Use backup passphrase (recommended)</span>
                </label>
                <p className="option-description">
                  Add an extra layer of security with a separate passphrase for your backup file.
                </p>
              </div>

              {usePassphrase && (
                <div className="passphrase-inputs">
                  <div className="input-group">
                    <label>Backup Passphrase</label>
                    <input
                      type="password"
                      value={backupPassphrase}
                      onChange={(e) => setBackupPassphrase(e.target.value)}
                      placeholder="At least 8 characters"
                      className="passphrase-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Confirm Passphrase</label>
                    <input
                      type="password"
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
                      placeholder="Re-enter passphrase"
                      className="passphrase-input"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="option-section">
              <h3>Backup Contents</h3>
              <div className="option-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeSettings}
                    onChange={(e) => setIncludeSettings(e.target.checked)}
                  />
                  <span>Include app settings</span>
                </label>
                <p className="option-description">
                  Backup your preferences, theme, and other settings along with wallet data.
                </p>
              </div>
            </div>

            <div className="info-section">
              <div className="info-icon">ℹ️</div>
              <div className="info-content">
                <h4>What gets backed up:</h4>
                <ul>
                  <li>All wallet addresses and encrypted mnemonics</li>
                  <li>Wallet names and metadata</li>
                  {includeSettings && <li>App settings and preferences</li>}
                </ul>
                <p className="note">
                  Your PIN is never included in backups. You'll set a new PIN when restoring.
                </p>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button
                className="btn-primary"
                onClick={handleCreateBackup}
                disabled={isCreating}
              >
                {isCreating ? 'Creating Backup...' : 'Create & Download Backup'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setStep('main')}
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main backup screen
  return (
    <div className="backup-screen">
      <div className="backup-container">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>

        <h2>Backup Manager</h2>

        {backupStats && (
          <div className="backup-status">
            <div className="status-card">
              <div className="status-icon">
                {backupStats.isNeeded ? '⚠️' : '✓'}
              </div>
              <div className="status-content">
                <h3>Backup Status</h3>
                {backupStats.lastBackup ? (
                  <>
                    <p className="status-text">
                      Last backup: {formatTimeAgo(backupStats.lastBackup)}
                    </p>
                    {backupStats.isNeeded && (
                      <p className="warning-text">
                        Your backup is more than 7 days old. Create a new backup to ensure your latest data is protected.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="warning-text">
                    No backup found. Create your first backup to protect your wallet data.
                  </p>
                )}
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{backupStats.totalBackups}</div>
                <div className="stat-label">Total Backups</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{formatSize(backupStats.totalSize)}</div>
                <div className="stat-label">Total Size</div>
              </div>
            </div>
          </div>
        )}

        <div className="backup-actions">
          <h3>Backup Actions</h3>
          <div className="action-buttons">
            <button className="action-card" onClick={() => setStep('create')}>
              <div className="action-icon">🔐</div>
              <div className="action-content">
                <h4>Create Secure Backup</h4>
                <p>Encrypted backup with optional passphrase protection</p>
              </div>
            </button>

            <button className="action-card" onClick={handleQuickBackup} disabled={isCreating}>
              <div className="action-icon">⚡</div>
              <div className="action-content">
                <h4>Quick Backup</h4>
                <p>Fast backup without additional passphrase</p>
              </div>
            </button>
          </div>
        </div>

        {backupHistory.length > 0 && (
          <div className="backup-history">
            <h3>Recent Backups</h3>
            <div className="history-list">
              {backupHistory.map((backup) => (
                <div key={backup.backupId} className="history-item">
                  <div className="history-icon">📦</div>
                  <div className="history-info">
                    <div className="history-date">{formatDate(backup.timestamp)}</div>
                    <div className="history-details">
                      {backup.walletCount} wallet{backup.walletCount !== 1 ? 's' : ''} • {formatSize(backup.size)} • {backup.location}
                    </div>
                  </div>
                  <div className="history-checksum" title={backup.checksum}>
                    {backup.checksum.slice(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="security-tips">
          <h3>Backup Best Practices</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">🔄</div>
              <h4>Regular Backups</h4>
              <p>Create a new backup after adding wallets or making significant changes</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🗄️</div>
              <h4>Multiple Copies</h4>
              <p>Store backups in multiple secure locations (external drive, cloud storage)</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🔑</div>
              <h4>Strong Passphrase</h4>
              <p>Use a unique, strong passphrase that you can remember but others can't guess</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">✅</div>
              <h4>Test Restore</h4>
              <p>Periodically verify your backup by testing the restore process</p>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default BackupScreen;
