/**
 * Device utility - Generate and retrieve device information
 */

export interface DeviceInfo {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastUsed: number;
}

/**
 * Generate a unique device ID based on browser characteristics
 * In production, consider using a more robust fingerprinting library
 */
export const getDeviceId = (): string => {
  const stored = localStorage.getItem('wonderwallet_device_id');
  if (stored) {
    return stored;
  }

  // Generate a simple unique ID based on random value + timestamp
  const id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('wonderwallet_device_id', id);
  return id;
};

/**
 * Get browser information
 */
export const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  
  // Check for specific browsers first, then fall back to generic Chrome
  if (ua.includes('Firefox')) {
    return 'Firefox';
  } else if (ua.includes('Edg')) {
    return 'Edge';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    return 'Opera';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return 'Safari';
  } else if (ua.includes('Chrome')) {
    // This catches Chrome and Chromium-based browsers
    return 'Chrome';
  }
  
  return 'Unknown Browser';
};

/**
 * Get operating system information
 */
export const getOSInfo = (): string => {
  const ua = navigator.userAgent;
  
  // Check mobile OSes first as they may contain Linux in UA
  if (ua.includes('Android')) {
    return 'Android';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    return 'iOS';
  } else if (ua.includes('Win')) {
    return 'Windows';
  } else if (ua.includes('Mac')) {
    return 'macOS';
  } else if (ua.includes('Linux')) {
    return 'Linux';
  }
  
  return 'Unknown OS';
};

/**
 * Get current device information
 */
export const getCurrentDeviceInfo = (): DeviceInfo => {
  const deviceId = getDeviceId();
  const browser = getBrowserInfo();
  const os = getOSInfo();
  
  return {
    id: deviceId,
    name: `${browser} on ${os}`,
    browser,
    os,
    lastUsed: Date.now(),
  };
};

/**
 * Format device name for display
 */
export const formatDeviceName = (device: DeviceInfo): string => {
  return device.name || `${device.browser} on ${device.os}`;
};

/**
 * Format last used timestamp
 */
export const formatLastUsed = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (days < 30) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};
