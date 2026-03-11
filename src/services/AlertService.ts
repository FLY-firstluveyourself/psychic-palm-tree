/**
 * AlertService - Security and device alerts
 * Handles notifications for suspicious activity, new devices, and security events
 */

import { hashData } from '../utils/crypto';

export interface SecurityEvent {
  id: string;
  type: 'login' | 'new-device' | 'failed-auth' | 'wallet-created' | 'transaction' | 'backup' | 'settings-changed' | 'duress-activated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  deviceInfo?: DeviceInfo;
  timestamp: number;
  acknowledged: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  browser: string;
  os: string;
  ip?: string;
  location?: string;
}

export interface AlertConfig {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  email?: string;
  phone?: string;
  emergencyContacts: EmergencyContact[];
}

export interface EmergencyContact {
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
}

class AlertService {
  private readonly EVENTS_KEY = 'wonderwallet_security_events';
  private readonly ALERT_CONFIG_KEY = 'wonderwallet_alert_config';
  private readonly DEVICE_ID_KEY = 'wonderwallet_device_id';
  private readonly KNOWN_DEVICES_KEY = 'wonderwallet_known_devices';

  /**
   * Initialize device tracking
   */
  async initializeDevice(): Promise<DeviceInfo> {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID
      const userAgent = navigator.userAgent;
      const timestamp = Date.now();
      deviceId = hashData(`${userAgent}-${timestamp}`);
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
      
      // Log new device
      await this.logSecurityEvent('new-device', 'medium', 'New device detected');
    }

    return this.getCurrentDeviceInfo(deviceId);
  }

  /**
   * Get current device information
   */
  private getCurrentDeviceInfo(deviceId: string): DeviceInfo {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edge')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return {
      deviceId,
      browser,
      os,
    };
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    message: string
  ): Promise<void> {
    try {
      const events = this.getSecurityEvents();
      const deviceInfo = await this.getCurrentDeviceInfo(localStorage.getItem(this.DEVICE_ID_KEY) || '');

      const event: SecurityEvent = {
        id: hashData(`${type}-${Date.now()}`),
        type,
        severity,
        message,
        deviceInfo,
        timestamp: Date.now(),
        acknowledged: false,
      };

      events.push(event);

      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }

      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));

      // Trigger alerts if configured
      if (severity === 'high' || severity === 'critical') {
        await this.sendAlert(event);
      }
    } catch (error) {
      console.error('Failed to log security event');
    }
  }

  /**
   * Get all security events
   */
  getSecurityEvents(limit?: number): SecurityEvent[] {
    try {
      const data = localStorage.getItem(this.EVENTS_KEY);
      const events = data ? JSON.parse(data) : [];
      
      if (limit) {
        return events.slice(-limit);
      }
      
      return events;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get unacknowledged events
   */
  getUnacknowledgedEvents(): SecurityEvent[] {
    const events = this.getSecurityEvents();
    return events.filter(e => !e.acknowledged);
  }

  /**
   * Acknowledge event
   */
  async acknowledgeEvent(eventId: string): Promise<boolean> {
    try {
      const events = this.getSecurityEvents();
      const event = events.find(e => e.id === eventId);
      
      if (event) {
        event.acknowledged = true;
        localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to acknowledge event');
      return false;
    }
  }

  /**
   * Clear old events (older than 30 days)
   */
  clearOldEvents(): number {
    try {
      const events = this.getSecurityEvents();
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const filtered = events.filter(e => e.timestamp > thirtyDaysAgo);
      const removed = events.length - filtered.length;
      
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(filtered));
      return removed;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get alert configuration
   */
  getAlertConfig(): AlertConfig {
    try {
      const data = localStorage.getItem(this.ALERT_CONFIG_KEY);
      return data ? JSON.parse(data) : {
        emailEnabled: false,
        smsEnabled: false,
        pushEnabled: false,
        emergencyContacts: [],
      };
    } catch (error) {
      return {
        emailEnabled: false,
        smsEnabled: false,
        pushEnabled: false,
        emergencyContacts: [],
      };
    }
  }

  /**
   * Update alert configuration
   */
  async updateAlertConfig(config: AlertConfig): Promise<boolean> {
    try {
      localStorage.setItem(this.ALERT_CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Failed to update alert config');
      return false;
    }
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(contact: EmergencyContact): Promise<boolean> {
    try {
      const config = this.getAlertConfig();
      config.emergencyContacts.push(contact);
      return await this.updateAlertConfig(config);
    } catch (error) {
      console.error('Failed to add emergency contact');
      return false;
    }
  }

  /**
   * Remove emergency contact
   */
  async removeEmergencyContact(index: number): Promise<boolean> {
    try {
      const config = this.getAlertConfig();
      if (index >= 0 && index < config.emergencyContacts.length) {
        config.emergencyContacts.splice(index, 1);
        return await this.updateAlertConfig(config);
      }
      return false;
    } catch (error) {
      console.error('Failed to remove emergency contact');
      return false;
    }
  }

  /**
   * Send alert (placeholder - needs integration with actual notification service)
   * TODO: Integrate with email service (SendGrid, AWS SES, Mailgun)
   * TODO: Integrate with SMS service (Twilio, AWS SNS, Nexmo)
   * TODO: Add webhook support for custom integrations
   */
  private async sendAlert(event: SecurityEvent): Promise<void> {
    try {
      const config = this.getAlertConfig();
      
      // Email notification (placeholder)
      if (config.emailEnabled && config.email) {
        // TODO: Integrate with email service
        console.log(`[TODO] Send email to ${config.email}: ${event.message}`);
        // Production: Use SendGrid, AWS SES, or similar
      }

      // SMS notification (placeholder)
      if (config.smsEnabled && config.phone) {
        // TODO: Integrate with SMS service
        console.log(`[TODO] Send SMS to ${config.phone}: ${event.message}`);
        // Production: Use Twilio, AWS SNS, or similar
      }

      // Push notification (if supported)
      if (config.pushEnabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('WonderWallet Security Alert', {
            body: event.message,
            icon: '/logo192.png',
            badge: '/logo192.png',
          });
        }
      }

      // Emergency contacts for critical events
      if (event.severity === 'critical' && config.emergencyContacts.length > 0) {
        // TODO: Notify emergency contacts via all available channels
        console.log('[TODO] Notify emergency contacts:', config.emergencyContacts);
        // Production: Send to all emergency contacts
      }
    } catch (error) {
      console.error('Failed to send alert');
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch (error) {
      console.error('Failed to request notification permission');
      return false;
    }
  }

  /**
   * Check if device is recognized
   */
  isKnownDevice(deviceId: string): boolean {
    try {
      const data = localStorage.getItem(this.KNOWN_DEVICES_KEY);
      const devices = data ? JSON.parse(data) : [];
      return devices.includes(deviceId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Add device to known devices
   */
  async addKnownDevice(deviceId: string): Promise<boolean> {
    try {
      const data = localStorage.getItem(this.KNOWN_DEVICES_KEY);
      const devices = data ? JSON.parse(data) : [];
      
      if (!devices.includes(deviceId)) {
        devices.push(deviceId);
        localStorage.setItem(this.KNOWN_DEVICES_KEY, JSON.stringify(devices));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to add known device');
      return false;
    }
  }

  /**
   * Trigger duress alert
   */
  async triggerDuressAlert(location?: string): Promise<void> {
    await this.logSecurityEvent(
      'duress-activated',
      'critical',
      `Duress mode activated${location ? ` at ${location}` : ''}`
    );

    // In production: immediately notify all emergency contacts
    const config = this.getAlertConfig();
    console.log('DURESS MODE ACTIVATED - Emergency contacts would be notified');
    console.log('Emergency contacts:', config.emergencyContacts);
  }
}

export default new AlertService();
