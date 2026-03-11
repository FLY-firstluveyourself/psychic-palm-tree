import React, { useState, useEffect } from 'react';
import './SecurityMonitorScreen.css';
import SecurityMonitorService, { 
  DeviceInfo, 
  AccessLog, 
  SecurityAlert 
} from '../services/SecurityMonitorService';

interface SecurityMonitorScreenProps {
  onBack: () => void;
}

const SecurityMonitorScreen: React.FC<SecurityMonitorScreenProps> = ({ onBack }) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'devices' | 'logs' | 'alerts'>('devices');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [devicesData, logsData, alertsData] = await Promise.all([
        SecurityMonitorService.getAllDevices(),
        SecurityMonitorService.getRecentAccessLogs(20),
        SecurityMonitorService.getAllAlerts(),
      ]);
      
      setDevices(devicesData);
      setAccessLogs(logsData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    try {
      await SecurityMonitorService.trustDevice(deviceId);
      await loadSecurityData();
    } catch (err) {
      console.error('Failed to trust device');
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!window.confirm('Remove this device? It will need to re-authenticate on next login.')) {
      return;
    }

    try {
      await SecurityMonitorService.removeDevice(deviceId);
      await loadSecurityData();
    } catch (err) {
      console.error('Failed to remove device');
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await SecurityMonitorService.acknowledgeAlert(alertId);
      await loadSecurityData();
    } catch (err) {
      console.error('Failed to acknowledge alert');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffa500';
      case 'low': return '#ffff00';
      default: return '#00ff00';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="security-monitor-screen">
      <div className="monitor-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Security Monitor</h1>
      </div>

      <div className="monitor-content">
        <div className="monitor-tabs">
          <button
            className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            🖥️ Devices ({devices.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📋 Access Logs ({accessLogs.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            🚨 Alerts ({alerts.filter(a => !a.acknowledged).length})
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading security data...</div>
        ) : (
          <>
            {activeTab === 'devices' && (
              <div className="devices-section">
                <div className="section-header">
                  <h2>Registered Devices</h2>
                  <p>Manage devices that have accessed your wallet</p>
                </div>

                {devices.length === 0 ? (
                  <div className="empty-state">No devices registered</div>
                ) : (
                  <div className="devices-list">
                    {devices.map((device) => (
                      <div key={device.id} className="device-card">
                        <div className="device-info">
                          <div className="device-header">
                            <h3>{device.name}</h3>
                            {device.trusted ? (
                              <span className="trusted-badge">✓ Trusted</span>
                            ) : (
                              <span className="untrusted-badge">⚠ Untrusted</span>
                            )}
                          </div>
                          <p className="device-detail">Platform: {device.platform}</p>
                          <p className="device-detail">Browser: {device.browser}</p>
                          <p className="device-date">
                            First seen: {formatTimestamp(device.firstSeen)}
                          </p>
                          <p className="device-date">
                            Last seen: {formatTimestamp(device.lastSeen)}
                          </p>
                        </div>
                        <div className="device-actions">
                          {!device.trusted && (
                            <button
                              className="trust-btn"
                              onClick={() => handleTrustDevice(device.id)}
                            >
                              Trust
                            </button>
                          )}
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveDevice(device.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="logs-section">
                <div className="section-header">
                  <h2>Access Logs</h2>
                  <p>Recent access attempts and activities</p>
                </div>

                {accessLogs.length === 0 ? (
                  <div className="empty-state">No access logs</div>
                ) : (
                  <div className="logs-list">
                    {accessLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`log-card ${log.suspicious ? 'suspicious' : ''} ${!log.success ? 'failed' : ''}`}
                      >
                        <div className="log-icon">
                          {log.success ? '✓' : '✗'}
                        </div>
                        <div className="log-info">
                          <div className="log-action">{log.action}</div>
                          <div className="log-timestamp">
                            {formatTimestamp(log.timestamp)}
                          </div>
                          {log.location && (
                            <div className="log-location">
                              📍 {log.location.city || 'Unknown'}, {log.location.country || 'Unknown'}
                            </div>
                          )}
                        </div>
                        <div className="log-status">
                          {log.suspicious && (
                            <span className="suspicious-badge">⚠ Suspicious</span>
                          )}
                          {!log.success && (
                            <span className="failed-badge">Failed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="alerts-section">
                <div className="section-header">
                  <h2>Security Alerts</h2>
                  <p>Important security notifications and warnings</p>
                </div>

                {alerts.length === 0 ? (
                  <div className="empty-state">No security alerts</div>
                ) : (
                  <div className="alerts-list">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`alert-card ${alert.acknowledged ? 'acknowledged' : ''}`}
                        style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                      >
                        <div className="alert-header">
                          <div className="alert-type">
                            {alert.type.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div
                            className="alert-severity"
                            style={{ color: getSeverityColor(alert.severity) }}
                          >
                            {alert.severity.toUpperCase()}
                          </div>
                        </div>
                        <div className="alert-message">{alert.message}</div>
                        <div className="alert-timestamp">
                          {formatTimestamp(alert.timestamp)}
                        </div>
                        {!alert.acknowledged && (
                          <button
                            className="acknowledge-btn"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityMonitorScreen;
