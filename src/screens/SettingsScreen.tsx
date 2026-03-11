import React, { useState, useEffect } from 'react';
import './SettingsScreen.css';
import StorageService, { AppSettings } from '../services/StorageService';
import SecurityService from '../services/SecurityService';
import { DeviceInfo, formatDeviceName, formatLastUsed } from '../utils/device';

interface SettingsScreenProps {
  onBack: () => void;
  onClearData: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onClearData }) => {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    currency: 'USD',
    biometricEnabled: false,
    autoLockTimeout: 5,
  });
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  useEffect(() => {
    loadSettings();
    checkBiometricAvailability();
    loadDevices();
  }, []);

  const loadSettings = async () => {
    const currentSettings = await StorageService.getSettings();
    setSettings(currentSettings);
  };

  const checkBiometricAvailability = async () => {
    const available = await SecurityService.isBiometricAvailable();
    setBiometricAvailable(available);
  };

  const loadDevices = async () => {
    const allDevices = await StorageService.getAllDevices();
    setDevices(allDevices);
    const currentDevice = await StorageService.getCurrentDevice();
    setCurrentDeviceId(currentDevice.id);
  };

  const handleSettingChange = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await StorageService.setSettings(newSettings);
  };

  const handleClearDataConfirm = () => {
    setShowClearConfirm(false);
    onClearData();
  };

  return (
    <div className="settings-screen">
      <div className="settings-container">
        <header className="settings-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h2>Settings</h2>
          <div className="spacer"></div>
        </header>

        <div className="settings-content">
          <div className="settings-section">
            <h3 className="section-title">Appearance</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <label>Theme</label>
                <p className="setting-description">Choose your preferred color scheme</p>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="setting-select"
              >
                <option value="dark">Dark</option>
                <option value="light">Light (Coming Soon)</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Currency</label>
                <p className="setting-description">Display prices in your preferred currency</p>
              </div>
              <select
                value={settings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
                className="setting-select"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title">Security</h3>

            <div className="setting-item">
              <div className="setting-info">
                <label>Biometric Authentication</label>
                <p className="setting-description">
                  {biometricAvailable
                    ? 'Use fingerprint or face recognition to unlock'
                    : 'Not available on this device'}
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.biometricEnabled}
                  onChange={(e) => handleSettingChange('biometricEnabled', e.target.checked)}
                  disabled={!biometricAvailable}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Auto-Lock Timeout</label>
                <p className="setting-description">Lock app after period of inactivity</p>
              </div>
              <select
                value={settings.autoLockTimeout}
                onChange={(e) => handleSettingChange('autoLockTimeout', parseInt(e.target.value))}
                className="setting-select"
              >
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title">Devices</h3>
            
            <div className="devices-list">
              {devices.length === 0 ? (
                <div className="empty-state-small">
                  <p>No device information available</p>
                </div>
              ) : (
                devices.map((device) => (
                  <div key={device.id} className="device-item">
                    <div className="device-info">
                      <div className="device-name">
                        {formatDeviceName(device)}
                        {device.id === currentDeviceId && (
                          <span className="device-badge">This Device</span>
                        )}
                      </div>
                      <div className="device-details">
                        <span className="device-detail">{device.browser}</span>
                        <span className="device-separator">•</span>
                        <span className="device-detail">{device.os}</span>
                        <span className="device-separator">•</span>
                        <span className="device-detail">{formatLastUsed(device.lastUsed)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title">About</h3>

            <div className="info-item">
              <span className="info-label">Version</span>
              <span className="info-value">1.0.0 (MVP)</span>
            </div>

            <div className="info-item">
              <span className="info-label">Build</span>
              <span className="info-value">Dec 2024</span>
            </div>

            <div className="info-item">
              <span className="info-label">Blockchain</span>
              <span className="info-value">Ethereum Mainnet</span>
            </div>
          </div>

          <div className="settings-section danger-zone">
            <h3 className="section-title danger">Danger Zone</h3>

            <div className="danger-warning">
              <span className="warning-icon">⚠️</span>
              <p>
                Clearing app data will remove all wallets and settings. Make sure you have your
                seed phrases backed up before proceeding!
              </p>
            </div>

            <button
              className="danger-btn"
              onClick={() => setShowClearConfirm(true)}
            >
              Clear All Data
            </button>
          </div>
        </div>

        <div className="settings-footer">
          <p>🤫 Built with ❤️ - "No man left behind"</p>
          <p className="footer-note">WonderWallet is a non-custodial wallet. Only you control your keys.</p>
        </div>
      </div>

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Clear All Data?</h3>
            <p>
              This will permanently delete all wallets and settings from this device.
            </p>
            <p className="modal-warning">
              <strong>This action cannot be undone!</strong>
            </p>
            <p>
              Make sure you have backed up your seed phrases before continuing.
            </p>
            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button className="danger-btn" onClick={handleClearDataConfirm}>
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;
