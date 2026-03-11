import { expect, test, describe, beforeEach } from 'vitest';
import PoliceNetworkService from './PoliceNetworkService';

describe('PoliceNetworkService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('should report compromised wallet', async () => {
    const report = await PoliceNetworkService.reportCompromised({
      walletAddress: '0x1234567890abcdef',
      reportType: 'stolen',
      description: 'Wallet was stolen from my device',
    });
    
    expect(report).toBeDefined();
    expect(report.walletAddress).toBe('0x1234567890abcdef');
    expect(report.reportType).toBe('stolen');
    expect(report.status).toBe('reported');
  });

  test('should get all reports', async () => {
    await PoliceNetworkService.reportCompromised({
      walletAddress: '0xabc123',
      reportType: 'compromised',
      description: 'Account hacked',
    });
    
    const reports = await PoliceNetworkService.getAllReports();
    expect(reports.length).toBe(1);
  });

  test('should get reports for specific wallet', async () => {
    const address = '0xtest123';
    
    await PoliceNetworkService.reportCompromised({
      walletAddress: address,
      reportType: 'stolen',
      description: 'Test report',
    });
    
    await PoliceNetworkService.reportCompromised({
      walletAddress: '0xother',
      reportType: 'suspicious',
      description: 'Other report',
    });
    
    const walletReports = await PoliceNetworkService.getWalletReports(address);
    expect(walletReports.length).toBe(1);
    expect(walletReports[0].walletAddress).toBe(address);
  });

  test('should update report status', async () => {
    const report = await PoliceNetworkService.reportCompromised({
      walletAddress: '0xabc',
      reportType: 'suspicious',
      description: 'Suspicious activity',
    });
    
    await PoliceNetworkService.updateReportStatus(report.id, 'investigating', 'Under review');
    
    const updated = await PoliceNetworkService.getReport(report.id);
    expect(updated?.status).toBe('investigating');
  });

  test('should broadcast network alert', async () => {
    const alert = await PoliceNetworkService.broadcastNetworkAlert({
      walletAddress: '0xdanger',
      alertType: 'critical',
      message: 'Known scammer address',
      verified: true,
    });
    
    expect(alert).toBeDefined();
    expect(alert.alertType).toBe('critical');
  });

  test('should check if address is flagged', async () => {
    const address = '0xflagged';
    
    await PoliceNetworkService.broadcastNetworkAlert({
      walletAddress: address,
      alertType: 'danger',
      message: 'Flagged address',
      verified: true,
    });
    
    const flagged = await PoliceNetworkService.isAddressFlagged(address);
    expect(flagged).toBeDefined();
    expect(flagged?.walletAddress).toBe(address);
  });

  test('should manage watchlist', async () => {
    const address = '0xwatch';
    
    await PoliceNetworkService.addToWatchlist(address, 'Suspicious transactions');
    
    const watchlist = await PoliceNetworkService.getWatchlist();
    expect(watchlist.length).toBe(1);
    expect(watchlist[0].address).toBe(address);
    
    await PoliceNetworkService.removeFromWatchlist(address);
    const updatedWatchlist = await PoliceNetworkService.getWatchlist();
    expect(updatedWatchlist.length).toBe(0);
  });

  test('should get report statistics', async () => {
    await PoliceNetworkService.reportCompromised({
      walletAddress: '0x1',
      reportType: 'stolen',
      description: 'Test 1',
    });
    
    await PoliceNetworkService.reportCompromised({
      walletAddress: '0x2',
      reportType: 'compromised',
      description: 'Test 2',
    });
    
    const stats = await PoliceNetworkService.getReportStatistics();
    expect(stats.total).toBe(2);
    expect(stats.byType.stolen).toBe(1);
    expect(stats.byType.compromised).toBe(1);
  });
});
