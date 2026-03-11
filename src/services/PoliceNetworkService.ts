/**
 * PoliceNetworkService - Reporting and tracking compromised accounts
 */

import { generateSecureRandom } from '../utils/crypto';
import SecurityMonitorService from './SecurityMonitorService';

export interface CompromisedReport {
  id: string;
  walletAddress: string;
  reportType: 'stolen' | 'compromised' | 'suspicious' | 'lost_device';
  description: string;
  timestamp: number;
  reporterContact?: string;
  status: 'reported' | 'investigating' | 'resolved' | 'false_alarm';
  evidence?: ReportEvidence[];
  lastUpdated: number;
}

export interface ReportEvidence {
  type: 'screenshot' | 'transaction_hash' | 'address' | 'description';
  data: string;
  timestamp: number;
}

export interface NetworkAlert {
  id: string;
  walletAddress: string;
  alertType: 'warning' | 'danger' | 'critical';
  message: string;
  timestamp: number;
  expiresAt?: number;
  verified: boolean;
}

class PoliceNetworkService {
  private readonly REPORTS_KEY = 'wonderwallet_police_reports';
  private readonly NETWORK_ALERTS_KEY = 'wonderwallet_network_alerts';
  private readonly WATCHLIST_KEY = 'wonderwallet_watchlist';

  /**
   * Report wallet as stolen or compromised
   */
  async reportCompromised(
    report: Omit<CompromisedReport, 'id' | 'timestamp' | 'status' | 'lastUpdated'>
  ): Promise<CompromisedReport> {
    try {
      const reports = await this.getAllReports();
      
      const newReport: CompromisedReport = {
        ...report,
        id: generateSecureRandom(16),
        timestamp: Date.now(),
        status: 'reported',
        lastUpdated: Date.now(),
      };

      reports.unshift(newReport);
      await this.saveReports(reports);

      // Create network-wide alert
      await this.broadcastNetworkAlert({
        walletAddress: report.walletAddress,
        alertType: report.reportType === 'stolen' ? 'critical' : 'warning',
        message: `Wallet reported as ${report.reportType}`,
        verified: false,
      });

      // Create local security alert
      await SecurityMonitorService.createAlert({
        type: 'unusual_activity',
        severity: 'critical',
        message: `Wallet ${report.walletAddress.slice(0, 8)}... reported as ${report.reportType}`,
        details: newReport,
      });

      return newReport;
    } catch (error) {
      console.error('Failed to submit report');
      throw new Error('Failed to submit report');
    }
  }

  /**
   * Get all reports
   */
  async getAllReports(): Promise<CompromisedReport[]> {
    try {
      const data = localStorage.getItem(this.REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve reports');
      return [];
    }
  }

  /**
   * Get report by ID
   */
  async getReport(id: string): Promise<CompromisedReport | null> {
    const reports = await this.getAllReports();
    return reports.find(r => r.id === id) || null;
  }

  /**
   * Get reports for specific wallet
   */
  async getWalletReports(walletAddress: string): Promise<CompromisedReport[]> {
    const reports = await this.getAllReports();
    return reports.filter(r => r.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  }

  /**
   * Update report status
   */
  async updateReportStatus(
    reportId: string,
    status: CompromisedReport['status'],
    note?: string
  ): Promise<void> {
    try {
      const reports = await this.getAllReports();
      const report = reports.find(r => r.id === reportId);
      
      if (!report) {
        throw new Error('Report not found');
      }

      report.status = status;
      report.lastUpdated = Date.now();
      
      if (note && report.evidence) {
        report.evidence.push({
          type: 'description',
          data: note,
          timestamp: Date.now(),
        });
      }

      await this.saveReports(reports);
    } catch (error) {
      console.error('Failed to update report status');
      throw new Error('Failed to update report status');
    }
  }

  /**
   * Add evidence to report
   */
  async addEvidence(reportId: string, evidence: ReportEvidence): Promise<void> {
    try {
      const reports = await this.getAllReports();
      const report = reports.find(r => r.id === reportId);
      
      if (!report) {
        throw new Error('Report not found');
      }

      if (!report.evidence) {
        report.evidence = [];
      }

      report.evidence.push(evidence);
      report.lastUpdated = Date.now();

      await this.saveReports(reports);
    } catch (error) {
      console.error('Failed to add evidence');
      throw new Error('Failed to add evidence');
    }
  }

  /**
   * Broadcast network-wide alert about compromised wallet
   */
  async broadcastNetworkAlert(
    alert: Omit<NetworkAlert, 'id' | 'timestamp'>
  ): Promise<NetworkAlert> {
    try {
      const alerts = await this.getAllNetworkAlerts();
      
      const newAlert: NetworkAlert = {
        ...alert,
        id: generateSecureRandom(16),
        timestamp: Date.now(),
        expiresAt: alert.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      };

      alerts.unshift(newAlert);
      await this.saveNetworkAlerts(alerts);

      return newAlert;
    } catch (error) {
      console.error('Failed to broadcast alert');
      throw new Error('Failed to broadcast alert');
    }
  }

  /**
   * Get all network alerts
   */
  async getAllNetworkAlerts(): Promise<NetworkAlert[]> {
    try {
      const data = localStorage.getItem(this.NETWORK_ALERTS_KEY);
      const alerts = data ? JSON.parse(data) : [];
      
      // Filter out expired alerts
      const now = Date.now();
      return alerts.filter((a: NetworkAlert) => !a.expiresAt || a.expiresAt > now);
    } catch (error) {
      console.error('Failed to retrieve network alerts');
      return [];
    }
  }

  /**
   * Check if address is flagged in network
   */
  async isAddressFlagged(address: string): Promise<NetworkAlert | null> {
    const alerts = await this.getAllNetworkAlerts();
    return alerts.find(a => 
      a.walletAddress.toLowerCase() === address.toLowerCase() && a.verified
    ) || null;
  }

  /**
   * Add address to personal watchlist
   */
  async addToWatchlist(address: string, note?: string): Promise<void> {
    try {
      const watchlist = await this.getWatchlist();
      
      if (!watchlist.find(w => w.address.toLowerCase() === address.toLowerCase())) {
        watchlist.push({
          address,
          note: note || '',
          addedAt: Date.now(),
        });
        
        localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(watchlist));
      }
    } catch (error) {
      console.error('Failed to add to watchlist');
      throw new Error('Failed to add to watchlist');
    }
  }

  /**
   * Get personal watchlist
   */
  async getWatchlist(): Promise<Array<{ address: string; note: string; addedAt: number }>> {
    try {
      const data = localStorage.getItem(this.WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve watchlist');
      return [];
    }
  }

  /**
   * Remove address from watchlist
   */
  async removeFromWatchlist(address: string): Promise<void> {
    try {
      const watchlist = await this.getWatchlist();
      const filtered = watchlist.filter(w => w.address.toLowerCase() !== address.toLowerCase());
      localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from watchlist');
      throw new Error('Failed to remove from watchlist');
    }
  }

  /**
   * Request aid from community
   */
  async requestAid(walletAddress: string, message: string): Promise<void> {
    try {
      // In production, this would integrate with a real police/community network
      // For now, we'll create a local report and alert
      await this.reportCompromised({
        walletAddress,
        reportType: 'suspicious',
        description: `Aid requested: ${message}`,
        evidence: [{
          type: 'description',
          data: message,
          timestamp: Date.now(),
        }],
      });

      await SecurityMonitorService.createAlert({
        type: 'unusual_activity',
        severity: 'high',
        message: 'Aid request submitted to network',
        details: { walletAddress, message },
      });
    } catch (error) {
      console.error('Failed to request aid');
      throw new Error('Failed to request aid');
    }
  }

  /**
   * Get statistics for reports
   */
  async getReportStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    recentCount: number;
  }> {
    const reports = await this.getAllReports();
    const last24h = Date.now() - 24 * 60 * 60 * 1000;

    return {
      total: reports.length,
      byType: reports.reduce((acc, r) => {
        acc[r.reportType] = (acc[r.reportType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: reports.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentCount: reports.filter(r => r.timestamp > last24h).length,
    };
  }

  /**
   * Save reports to storage
   */
  private async saveReports(reports: CompromisedReport[]): Promise<void> {
    localStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
  }

  /**
   * Save network alerts to storage
   */
  private async saveNetworkAlerts(alerts: NetworkAlert[]): Promise<void> {
    localStorage.setItem(this.NETWORK_ALERTS_KEY, JSON.stringify(alerts));
  }
}

export default new PoliceNetworkService();
