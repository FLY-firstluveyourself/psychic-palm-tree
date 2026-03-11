/**
 * Security Services Index
 * Central export for all security-related services
 */

// Core Services
export { default as WalletService } from './WalletService';
export { default as SecurityService } from './SecurityService';
export { default as StorageService } from './StorageService';
export { default as DecoyService } from './DecoyService';

// Enhanced Security Services
export { default as BiometricService } from './BiometricService';
export { default as HardwareWalletService } from './HardwareWalletService';
export { default as AirGapService } from './AirGapService';
export { default as CloudBackupService } from './CloudBackupService';
export { default as AlertService } from './AlertService';
export { default as RecoveryService } from './RecoveryService';

// Type exports
export type { WalletData, WalletBalance } from './WalletService';
export type { AuthResult } from './SecurityService';
export type { StoredWallet, AppSettings } from './StorageService';
export type { DecoyConfig } from './DecoyService';
export type { BiometricCredential, BiometricAuthResult } from './BiometricService';
export type { HardwareWalletInfo, HardwareWalletConnection } from './HardwareWalletService';
export type { AirGapTransaction, SignedTransaction, QRCodeData } from './AirGapService';
export type { BackupData, EncryptedBackup, BackupResult } from './CloudBackupService';
export type { SecurityEvent, DeviceInfo, AlertConfig, EmergencyContact } from './AlertService';
export type { Guardian, RecoveryRequest, RecoveryConfig } from './RecoveryService';
