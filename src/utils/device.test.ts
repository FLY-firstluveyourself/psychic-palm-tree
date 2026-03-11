import { expect, test, describe, beforeEach, vi } from 'vitest';
import {
  getDeviceId,
  getBrowserInfo,
  getOSInfo,
  getCurrentDeviceInfo,
  formatDeviceName,
  formatLastUsed,
} from './device';

describe('Device Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getDeviceId', () => {
    test('generates a device ID', () => {
      const deviceId = getDeviceId();
      expect(deviceId).toBeDefined();
      expect(deviceId).toContain('device_');
    });

    test('returns same ID on subsequent calls', () => {
      const deviceId1 = getDeviceId();
      const deviceId2 = getDeviceId();
      expect(deviceId1).toBe(deviceId2);
    });

    test('persists device ID in localStorage', () => {
      const deviceId = getDeviceId();
      const stored = localStorage.getItem('wonderwallet_device_id');
      expect(stored).toBe(deviceId);
    });
  });

  describe('getBrowserInfo', () => {
    test('detects browser from user agent', () => {
      const browser = getBrowserInfo();
      expect(browser).toBeDefined();
      expect(typeof browser).toBe('string');
    });
  });

  describe('getOSInfo', () => {
    test('detects OS from user agent', () => {
      const os = getOSInfo();
      expect(os).toBeDefined();
      expect(typeof os).toBe('string');
    });
  });

  describe('getCurrentDeviceInfo', () => {
    test('returns complete device info', () => {
      const deviceInfo = getCurrentDeviceInfo();
      expect(deviceInfo).toBeDefined();
      expect(deviceInfo.id).toBeDefined();
      expect(deviceInfo.name).toBeDefined();
      expect(deviceInfo.browser).toBeDefined();
      expect(deviceInfo.os).toBeDefined();
      expect(deviceInfo.lastUsed).toBeDefined();
      expect(typeof deviceInfo.lastUsed).toBe('number');
    });

    test('device name includes browser and OS', () => {
      const deviceInfo = getCurrentDeviceInfo();
      expect(deviceInfo.name).toContain(deviceInfo.browser);
      expect(deviceInfo.name).toContain(deviceInfo.os);
    });
  });

  describe('formatDeviceName', () => {
    test('formats device name correctly', () => {
      const device = {
        id: 'test-id',
        name: 'Chrome on Windows',
        browser: 'Chrome',
        os: 'Windows',
        lastUsed: Date.now(),
      };
      const formatted = formatDeviceName(device);
      expect(formatted).toBe('Chrome on Windows');
    });

    test('falls back to browser and OS if name is empty', () => {
      const device = {
        id: 'test-id',
        name: '',
        browser: 'Firefox',
        os: 'Linux',
        lastUsed: Date.now(),
      };
      const formatted = formatDeviceName(device);
      expect(formatted).toBe('Firefox on Linux');
    });
  });

  describe('formatLastUsed', () => {
    test('returns "Just now" for recent timestamps', () => {
      const timestamp = Date.now();
      const formatted = formatLastUsed(timestamp);
      expect(formatted).toBe('Just now');
    });

    test('returns minutes for timestamps less than 1 hour old', () => {
      const timestamp = Date.now() - 30 * 60 * 1000; // 30 minutes ago
      const formatted = formatLastUsed(timestamp);
      expect(formatted).toContain('minute');
    });

    test('returns hours for timestamps less than 24 hours old', () => {
      const timestamp = Date.now() - 5 * 60 * 60 * 1000; // 5 hours ago
      const formatted = formatLastUsed(timestamp);
      expect(formatted).toContain('hour');
    });

    test('returns days for timestamps less than 30 days old', () => {
      const timestamp = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      const formatted = formatLastUsed(timestamp);
      expect(formatted).toContain('day');
    });

    test('returns date for timestamps more than 30 days old', () => {
      const timestamp = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 days ago
      const formatted = formatLastUsed(timestamp);
      // Should be a date string
      expect(formatted).toMatch(/\d+\/\d+\/\d+/);
    });
  });
});
