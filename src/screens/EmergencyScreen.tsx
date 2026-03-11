import React, { useState, useEffect } from 'react';
import './EmergencyScreen.css';
import EmergencyService, { EmergencyAction, KillSwitchConfig } from '../services/EmergencyService';

interface EmergencyScreenProps {
  onBack: () => void;
}

const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ onBack }) => {
  const [emergencyActions, setEmergencyActions] = useState<EmergencyAction[]>([]);
  const [killSwitchConfig, setKillSwitchConfig] = useState<KillSwitchConfig | null>(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [showKillSwitch, setShowKillSwitch] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const loadEmergencyData = async () => {
    try {
      setLoading(true);
      const [actions, config, emergencyMode, frozen] = await Promise.all([
        EmergencyService.getRecentEmergencyActions(),
        EmergencyService.getKillSwitchConfig(),
        EmergencyService.isEmergencyMode(),
        EmergencyService.areTransactionsFrozen(),
      ]);
      
      setEmergencyActions(actions);
      setKillSwitchConfig(config);
      setIsEmergencyMode(emergencyMode);
      setIsFrozen(frozen);
    } catch (err) {
      console.error('Failed to load emergency data');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyLock = async () => {
    if (!window.confirm('Lock the wallet immediately? You will need to unlock it to access your funds.')) {
      return;
    }

    try {
      await EmergencyService.emergencyLock('User initiated emergency lock');
      await loadEmergencyData();
      alert('Emergency lock activated successfully');
    } catch (err) {
      alert('Failed to activate emergency lock');
    }
  };

  const handleFreezeTransactions = async () => {
    if (!window.confirm('Freeze all transactions? This will prevent any outgoing transactions.')) {
      return;
    }

    try {
      await EmergencyService.freezeTransactions('User initiated transaction freeze');
      await loadEmergencyData();
      alert('Transactions frozen successfully');
    } catch (err) {
      alert('Failed to freeze transactions');
    }
  };

  const handleUnfreezeTransactions = async () => {
    if (!window.confirm('Unfreeze transactions? This will allow transactions again.')) {
      return;
    }

    try {
      await EmergencyService.unfreezeTransactions();
      await loadEmergencyData();
      alert('Transactions unfrozen successfully');
    } catch (err) {
      alert('Failed to unfreeze transactions');
    }
  };

  const handleAlertGuardians = async () => {
    const reason = window.prompt('Enter reason for alerting guardians:');
    if (!reason) return;

    try {
      await EmergencyService.alertGuardians(reason);
      await loadEmergencyData();
      alert('Guardians alerted successfully');
    } catch (err) {
      alert('Failed to alert guardians');
    }
  };

  const handleKillSwitch = async () => {
    if (confirmationText !== 'WIPE ALL DATA') {
      alert('Please type "WIPE ALL DATA" to confirm');
      return;
    }

    try {
      await EmergencyService.activateKillSwitch(confirmationText);
      alert('Kill switch activated. Data will be wiped according to your configuration.');
      setShowKillSwitch(false);
      setConfirmationText('');
    } catch (err: any) {
      alert(`Failed to activate kill switch: ${err.message}`);
    }
  };

  const handleExitEmergencyMode = async () => {
    if (!window.confirm('Exit emergency mode and restore normal operation?')) {
      return;
    }

    try {
      await EmergencyService.exitEmergencyMode();
      await loadEmergencyData();
      alert('Emergency mode deactivated');
    } catch (err) {
      alert('Failed to exit emergency mode');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="emergency-screen">
      <div className="emergency-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Emergency Controls</h1>
      </div>

      <div className="emergency-content">
        {isEmergencyMode && (
          <div className="emergency-banner">
            <div className="banner-icon">🚨</div>
            <div className="banner-text">
              <h3>Emergency Mode Active</h3>
              <p>Your wallet is in emergency mode. Some features may be restricted.</p>
            </div>
            <button className="banner-btn" onClick={handleExitEmergencyMode}>
              Exit Emergency Mode
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading emergency controls...</div>
        ) : (
          <>
            <div className="emergency-actions-grid">
              <div className="action-card lock-card">
                <div className="action-icon">🔒</div>
                <h3>Emergency Lock</h3>
                <p>Immediately lock all wallet access. Requires PIN to unlock.</p>
                <button className="action-btn danger-btn" onClick={handleEmergencyLock}>
                  Lock Wallet
                </button>
              </div>

              <div className="action-card freeze-card">
                <div className="action-icon">❄️</div>
                <h3>Freeze Transactions</h3>
                <p>Block all outgoing transactions. Balance remains safe.</p>
                {isFrozen ? (
                  <button className="action-btn success-btn" onClick={handleUnfreezeTransactions}>
                    Unfreeze
                  </button>
                ) : (
                  <button className="action-btn warning-btn" onClick={handleFreezeTransactions}>
                    Freeze
                  </button>
                )}
              </div>

              <div className="action-card alert-card">
                <div className="action-icon">📢</div>
                <h3>Alert Guardians</h3>
                <p>Notify your recovery contacts about an emergency.</p>
                <button className="action-btn info-btn" onClick={handleAlertGuardians}>
                  Send Alert
                </button>
              </div>

              <div className="action-card kill-card">
                <div className="action-icon">💀</div>
                <h3>Kill Switch</h3>
                <p>Permanently wipe all wallet data. IRREVERSIBLE!</p>
                <button
                  className="action-btn critical-btn"
                  onClick={() => setShowKillSwitch(true)}
                >
                  Activate
                </button>
              </div>
            </div>

            {showKillSwitch && (
              <div className="kill-switch-modal">
                <div className="modal-content">
                  <h2>⚠️ Kill Switch Activation</h2>
                  <div className="kill-warning">
                    <p><strong>WARNING:</strong> This action is IRREVERSIBLE!</p>
                    <p>All wallet data, including private keys and recovery phrases, will be permanently deleted.</p>
                    <p>Grace period: {killSwitchConfig?.gracePeriod || 0} minutes</p>
                  </div>
                  
                  <div className="kill-form">
                    <label>Type "WIPE ALL DATA" to confirm:</label>
                    <input
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="WIPE ALL DATA"
                      autoFocus
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      className="confirm-kill-btn"
                      onClick={handleKillSwitch}
                      disabled={confirmationText !== 'WIPE ALL DATA'}
                    >
                      Confirm Kill Switch
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        setShowKillSwitch(false);
                        setConfirmationText('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="emergency-history">
              <h2>Emergency Action History</h2>
              {emergencyActions.length === 0 ? (
                <div className="empty-state">No emergency actions recorded</div>
              ) : (
                <div className="actions-list">
                  {emergencyActions.map((action) => (
                    <div key={action.id} className="history-card">
                      <div className="history-header">
                        <div className="history-type">
                          {action.type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        {action.reversible ? (
                          <span className="reversible-badge">Reversible</span>
                        ) : (
                          <span className="irreversible-badge">Irreversible</span>
                        )}
                      </div>
                      <p className="history-reason">{action.reason}</p>
                      <p className="history-timestamp">
                        {formatTimestamp(action.timestamp)}
                      </p>
                      <p className="history-status">
                        Status: {action.completed ? '✓ Completed' : '⏳ Pending'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmergencyScreen;
