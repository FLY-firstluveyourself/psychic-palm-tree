/**
 * SecurityMonitorService - Monitors device/account access and geo-location
 */

import { generateSecureRandom } from '../utils/crypto';

export interface DeviceInfo {
  id: string;
  name: string;
  userAgent: string;
  platform: string;
  browser: string;
  firstSeen: number;
  lastSeen: number;
  trusted: boolean;
}

export interface AccessLog {
  id: string;
  deviceId: string;
  timestamp: number;
  action: string;
  success: boolean;
  ipAddress?: string;
  location?: GeoLocation;
  suspicious: boolean;
}

export interface GeoLocation {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  accuracy?: number;
}

export interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'new_device' | 'location_change' | 'unusual_activity' | 'failed_attempts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  details?: any;
}

class SecurityMonitorService {
  private readonly DEVICES_KEY = 'wonderwallet_devices';
  private readonly ACCESS_LOG_KEY = 'wonderwallet_access_logs';
  private readonly ALERTS_KEY = 'wonderwallet_security_alerts';
  private readonly MAX_LOGS = 100; // Keep last 100 access logs

  /**
   * Get current device information
   */
  getCurrentDeviceInfo(): Omit<DeviceInfo, 'id' | 'firstSeen' | 'lastSeen' | 'trusted'> {
    const ua = navigator.userAgent;
    const platform = navigator.platform || 'Unknown';
    
    // Simple browser detection
    let browser = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return {
      name: `${browser} on ${platform}`,
      userAgent: ua,
      platform,
      browser,
    };
  }

  /**
   * Register current device
   */
  async registerDevice(): Promise<DeviceInfo> {
    try {
      const devices = await this.getAllDevices();
      const deviceInfo = this.getCurrentDeviceInfo();
      
      // Check if device already exists (by user agent)
      const existing = devices.find(d => d.userAgent === deviceInfo.userAgent);
      
      if (existing) {
        existing.lastSeen = Date.now();
        await this.saveDevices(devices);
        return existing;
      }

      // Create new device entry
      const newDevice: DeviceInfo = {
        ...deviceInfo,
        id: generateSecureRandom(16),
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        trusted: devices.length === 0, // First device is automatically trusted
      };

      devices.push(newDevice);
      await this.saveDevices(devices);

      // Alert for new device (except first one)
      if (devices.length > 1) {
        await this.createAlert({
          type: 'new_device',
          severity: 'medium',
          message: `New device detected: ${newDevice.name}`,
          details: newDevice,
        });
      }

      return newDevice;
    } catch (error) {
      console.error('Failed to register device');
      throw new Error('Failed to register device');
    }
  }

  /**
   * Get all registered devices
   */
  async getAllDevices(): Promise<DeviceInfo[]> {
    try {
      const data = localStorage.getItem(this.DEVICES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve devices');
      return [];
    }
  }

  /**
   * Trust a device
   */
  async trustDevice(deviceId: string): Promise<void> {
    try {
      const devices = await this.getAllDevices();
      const device = devices.find(d => d.id === deviceId);
      
      if (device) {
        device.trusted = true;
        await this.saveDevices(devices);
      }
    } catch (error) {
      console.error('Failed to trust device');
      throw new Error('Failed to trust device');
    }
  }

  /**
   * Remove a device
   */
  async removeDevice(deviceId: string): Promise<void> {
    try {
      const devices = await this.getAllDevices();
      const filtered = devices.filter(d => d.id !== deviceId);
      await this.saveDevices(filtered);
    } catch (error) {
      console.error('Failed to remove device');
      throw new Error('Failed to remove device');
    }
  }

  /**
   * Log access attempt
   */
  async logAccess(action: string, success: boolean, suspicious: boolean = false): Promise<void> {
    try {
      const logs = await this.getAllAccessLogs();
      const device = await this.registerDevice();
      const location = await this.getCurrentLocation();

      const log: AccessLog = {
        id: generateSecureRandom(16),
        deviceId: device.id,
        timestamp: Date.now(),
        action,
        success,
        location,
        suspicious,
      };

      logs.unshift(log); // Add to beginning

      // Keep only last MAX_LOGS entries
      const trimmedLogs = logs.slice(0, this.MAX_LOGS);
      await this.saveAccessLogs(trimmedLogs);

      // Create alert if suspicious
      if (suspicious) {
        await this.createAlert({
          type: 'suspicious_login',
          severity: 'high',
          message: `Suspicious activity detected: ${action}`,
          details: log,
        });
      }
    } catch (error) {
      console.error('Failed to log access');
    }
  }

  /**
   * Get all access logs
   */
  async getAllAccessLogs(): Promise<AccessLog[]> {
    try {
      const data = localStorage.getItem(this.ACCESS_LOG_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve access logs');
      return [];
    }
  }

  /**
   * Get recent access logs
   */
  async getRecentAccessLogs(limit: number = 20): Promise<AccessLog[]> {
    const logs = await this.getAllAccessLogs();
    return logs.slice(0, limit);
  }

  /**
   * Get suspicious access logs
   */
  async getSuspiciousAccessLogs(): Promise<AccessLog[]> {
    const logs = await this.getAllAccessLogs();
    return logs.filter(log => log.suspicious);
  }

  /**
   * Get current geo-location (requires user permission)
   */
  async getCurrentLocation(): Promise<GeoLocation | undefined> {
    if (!navigator.geolocation) {
      return undefined;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        () => {
          resolve(undefined);
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  /**
   * Create security alert
   */
  async createAlert(
    alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged'>
  ): Promise<SecurityAlert> {
    try {
      const alerts = await this.getAllAlerts();
      
      const newAlert: SecurityAlert = {
        ...alert,
        id: generateSecureRandom(16),
        timestamp: Date.now(),
        acknowledged: false,
      };

      alerts.unshift(newAlert);
      await this.saveAlerts(alerts);

      return newAlert;
    } catch (error) {
      console.error('Failed to create alert');
      throw new Error('Failed to create alert');
    }
  }

  /**
   * Get all security alerts
   */
  async getAllAlerts(): Promise<SecurityAlert[]> {
    try {
      const data = localStorage.getItem(this.ALERTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve alerts');
      return [];
    }
  }

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledgedAlerts(): Promise<SecurityAlert[]> {
    const alerts = await this.getAllAlerts();
    return alerts.filter(a => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const alerts = await this.getAllAlerts();
      const alert = alerts.find(a => a.id === alertId);
      
      if (alert) {
        alert.acknowledged = true;
        await this.saveAlerts(alerts);
      }
    } catch (error) {
      console.error('Failed to acknowledge alert');
      throw new Error('Failed to acknowledge alert');
    }
  }

  /**
   * Clear all alerts
   */
  async clearAllAlerts(): Promise<void> {
    localStorage.removeItem(this.ALERTS_KEY);
  }

  /**
   * Analyze access pattern for suspicious activity
   */
  async analyzeSuspiciousActivity(): Promise<boolean> {
    const logs = await this.getRecentAccessLogs(10);
    
    // Check for rapid failed attempts
    const recentFailed = logs.filter(
      log => !log.success && Date.now() - log.timestamp < 5 * 60 * 1000
    );
    
    if (recentFailed.length >= 3) {
      await this.createAlert({
        type: 'failed_attempts',
        severity: 'critical',
        message: `Multiple failed login attempts detected (${recentFailed.length})`,
        details: { attempts: recentFailed.length },
      });
      return true;
    }

    return false;
  }

  /**
   * Save devices to storage
   */
  private async saveDevices(devices: DeviceInfo[]): Promise<void> {
    localStorage.setItem(this.DEVICES_KEY, JSON.stringify(devices));
  }

  /**
   * Save access logs to storage
   */
  private async saveAccessLogs(logs: AccessLog[]): Promise<void> {
    localStorage.setItem(this.ACCESS_LOG_KEY, JSON.stringify(logs));
  }

  /**
   * Save alerts to storage
   */
  private async saveAlerts(alerts: SecurityAlert[]): Promise<void> {
    localStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts));
  }
}

export default new SecurityMonitorService();
