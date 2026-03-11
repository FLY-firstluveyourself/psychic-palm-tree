import { expect, test, describe, beforeEach } from 'vitest';
import SecurityMonitorService from './SecurityMonitorService';

describe('SecurityMonitorService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('should get current device info', () => {
    const deviceInfo = SecurityMonitorService.getCurrentDeviceInfo();
    
    expect(deviceInfo).toBeDefined();
    expect(deviceInfo.name).toBeDefined();
    expect(deviceInfo.userAgent).toBeDefined();
    expect(deviceInfo.platform).toBeDefined();
  });

  test('should register a device', async () => {
    const device = await SecurityMonitorService.registerDevice();
    
    expect(device).toBeDefined();
    expect(device.id).toBeDefined();
    expect(device.trusted).toBe(true); // First device should be trusted
  });

  test('should get all devices', async () => {
    await SecurityMonitorService.registerDevice();
    const devices = await SecurityMonitorService.getAllDevices();
    
    expect(devices.length).toBe(1);
  });

  test('should trust a device', async () => {
    const device = await SecurityMonitorService.registerDevice();
    
    // Since first device is already trusted, let's manually untrust it first
    const devices = await SecurityMonitorService.getAllDevices();
    devices[0].trusted = false;
    localStorage.setItem('wonderwallet_devices', JSON.stringify(devices));
    
    await SecurityMonitorService.trustDevice(device.id);
    
    const updated = await SecurityMonitorService.getAllDevices();
    expect(updated[0].trusted).toBe(true);
  });

  test('should log access', async () => {
    await SecurityMonitorService.logAccess('Login', true, false);
    
    const logs = await SecurityMonitorService.getAllAccessLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('Login');
    expect(logs[0].success).toBe(true);
  });

  test('should get recent access logs', async () => {
    for (let i = 0; i < 5; i++) {
      await SecurityMonitorService.logAccess(`Action ${i}`, true, false);
    }
    
    const logs = await SecurityMonitorService.getRecentAccessLogs(3);
    expect(logs.length).toBe(3);
  });

  test('should create security alert', async () => {
    const alert = await SecurityMonitorService.createAlert({
      type: 'suspicious_login',
      severity: 'high',
      message: 'Test alert',
    });
    
    expect(alert).toBeDefined();
    expect(alert.type).toBe('suspicious_login');
    expect(alert.acknowledged).toBe(false);
  });

  test('should get unacknowledged alerts', async () => {
    await SecurityMonitorService.createAlert({
      type: 'new_device',
      severity: 'medium',
      message: 'Test alert 1',
    });
    
    const alert2 = await SecurityMonitorService.createAlert({
      type: 'failed_attempts',
      severity: 'critical',
      message: 'Test alert 2',
    });
    
    // Acknowledge one alert
    await SecurityMonitorService.acknowledgeAlert(alert2.id);
    
    const unacknowledged = await SecurityMonitorService.getUnacknowledgedAlerts();
    expect(unacknowledged.length).toBe(1);
  });

  test('should analyze suspicious activity', async () => {
    // Log multiple failed attempts
    for (let i = 0; i < 4; i++) {
      await SecurityMonitorService.logAccess('Login', false, false);
    }
    
    const suspicious = await SecurityMonitorService.analyzeSuspiciousActivity();
    expect(suspicious).toBe(true);
    
    // Should have created an alert
    const alerts = await SecurityMonitorService.getAllAlerts();
    expect(alerts.length).toBeGreaterThan(0);
  });
});
