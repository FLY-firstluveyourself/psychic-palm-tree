import React, { useState, useEffect } from 'react';
import './ReportScreen.css';
import PoliceNetworkService, { CompromisedReport } from '../services/PoliceNetworkService';
import StorageService from '../services/StorageService';

interface ReportScreenProps {
  onBack: () => void;
  walletId?: string;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ onBack, walletId }) => {
  const [reports, setReports] = useState<CompromisedReport[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  
  // Form state
  const [walletAddress, setWalletAddress] = useState('');
  const [reportType, setReportType] = useState<'stolen' | 'compromised' | 'suspicious' | 'lost_device'>('stolen');
  const [description, setDescription] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
    loadStatistics();
    loadWalletAddress();
  }, [walletId]);

  const loadWalletAddress = async () => {
    if (walletId) {
      const wallet = await StorageService.getWallet(walletId);
      if (wallet) {
        setWalletAddress(wallet.address);
      }
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await PoliceNetworkService.getAllReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await PoliceNetworkService.getReportStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!walletAddress.trim()) {
      setError('Wallet address is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      await PoliceNetworkService.reportCompromised({
        walletAddress: walletAddress.trim(),
        reportType,
        description: description.trim(),
        reporterContact: reporterContact.trim() || undefined,
        evidence: [{
          type: 'description',
          data: description.trim(),
          timestamp: Date.now(),
        }],
      });

      // Reset form
      setDescription('');
      setReporterContact('');
      setShowReportForm(false);
      
      // Reload reports
      await loadReports();
      await loadStatistics();
      
      alert('Report submitted successfully. The network has been notified.');
    } catch (err) {
      setError('Failed to submit report');
    }
  };

  const handleRequestAid = async () => {
    if (!walletAddress) {
      alert('Please load a wallet first');
      return;
    }

    const message = window.prompt('Describe the assistance you need:');
    if (!message) return;

    try {
      await PoliceNetworkService.requestAid(walletAddress, message);
      await loadReports();
      alert('Aid request submitted to the network');
    } catch (err) {
      alert('Failed to request aid');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return '#ffa500';
      case 'investigating': return '#00bfff';
      case 'resolved': return '#00ff00';
      case 'false_alarm': return '#888888';
      default: return '#00ff00';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stolen': return '🚨';
      case 'compromised': return '⚠️';
      case 'suspicious': return '🔍';
      case 'lost_device': return '📱';
      default: return '❓';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="report-screen">
      <div className="report-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Police Network</h1>
      </div>

      <div className="report-content">
        <div className="report-info">
          <div className="info-icon">🚔</div>
          <h2>Report & Track Compromised Accounts</h2>
          <p>
            Report stolen or compromised wallets to protect the community. 
            Network-wide alerts help prevent fraudulent transactions and aid recovery.
          </p>
        </div>

        {statistics && (
          <div className="statistics-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.total}</div>
              <div className="stat-label">Total Reports</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.recentCount}</div>
              <div className="stat-label">Last 24 Hours</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {statistics.byStatus?.resolved || 0}
              </div>
              <div className="stat-label">Resolved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {statistics.byType?.stolen || 0}
              </div>
              <div className="stat-label">Stolen</div>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button className="primary-action-btn" onClick={() => setShowReportForm(true)}>
            🚨 Submit Report
          </button>
          <button className="secondary-action-btn" onClick={handleRequestAid}>
            📢 Request Aid
          </button>
        </div>

        {showReportForm && (
          <div className="report-form-modal">
            <div className="modal-content">
              <h2>Submit Report</h2>
              <form onSubmit={handleSubmitReport}>
                {error && <div className="form-error">{error}</div>}
                
                <div className="form-group">
                  <label>Wallet Address *</label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Report Type *</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    required
                  >
                    <option value="stolen">Stolen Wallet</option>
                    <option value="compromised">Compromised/Hacked</option>
                    <option value="suspicious">Suspicious Activity</option>
                    <option value="lost_device">Lost Device</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what happened in detail..."
                    rows={5}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Information (Optional)</label>
                  <input
                    type="text"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    placeholder="Email or phone for follow-up"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Submit Report
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowReportForm(false);
                      setError('');
                      setDescription('');
                      setReporterContact('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : (
          <div className="reports-section">
            <h2>Recent Reports</h2>
            {reports.length === 0 ? (
              <div className="empty-state">No reports submitted yet</div>
            ) : (
              <div className="reports-list">
                {reports.map((report) => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <div className="report-icon">
                        {getTypeIcon(report.reportType)}
                      </div>
                      <div className="report-title">
                        <h3>{report.reportType.replace(/_/g, ' ').toUpperCase()}</h3>
                        <p className="report-address">
                          {report.walletAddress.slice(0, 8)}...{report.walletAddress.slice(-6)}
                        </p>
                      </div>
                      <div
                        className="report-status"
                        style={{ color: getStatusColor(report.status) }}
                      >
                        {report.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="report-body">
                      <p className="report-description">{report.description}</p>
                      <div className="report-meta">
                        <span>Reported: {formatTimestamp(report.timestamp)}</span>
                        {report.evidence && (
                          <span>Evidence: {report.evidence.length} item(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportScreen;
