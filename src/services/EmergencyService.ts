/**
 * EmergencyService - Handles emergency lock and kill-switch functionality
 */

import { generateSecureRandom } from '../utils/crypto';
import StorageService from './StorageService';
import SecurityMonitorService from './SecurityMonitorService';

export interface EmergencyAction {
  id: string;
  type: 'lock' | 'wipe' | 'freeze_transactions' | 'alert_guardians';
  triggeredBy: string; // User or automatic
  timestamp: number;
  reason?: string;
  reversible: boolean;
  completed: boolean;
}

export interface KillSwitchConfig {
  enabled: boolean;
  requiresConfirmation: boolean;
  gracePeriod: number; // Minutes before irreversible
  autoAlertGuardians: boolean;
  wipeData: boolean;
}

class EmergencyService {
  private readonly EMERGENCY_KEY = 'wonderwallet_emergency_actions';
  private readonly KILL_SWITCH_KEY = 'wonderwallet_kill_switch';
  private readonly FROZEN_KEY = 'wonderwallet_frozen';

  /**
   * Emergency lock - immediately lock all wallets
   */
  async emergencyLock(reason?: string): Promise<EmergencyAction> {
    try {
      await StorageService.lockApp();

      const action = await this.recordEmergencyAction({
        type: 'lock',
        triggeredBy: 'user',
        reason: reason || 'Emergency lock activated',
        reversible: true,
        completed: true,
      });

      await SecurityMonitorService.createAlert({
        type: 'unusual_activity',
        severity: 'critical',
        message: 'Emergency lock activated',
        details: { action },
      });

      return action;
    } catch (error) {
      console.error('Failed to execute emergency lock');
      throw new Error('Failed to execute emergency lock');
    }
  }

  /**
   * Freeze all transactions - prevent any outgoing transactions
   */
  async freezeTransactions(reason?: string): Promise<EmergencyAction> {
    try {
      localStorage.setItem(this.FROZEN_KEY, 'true');

      const action = await this.recordEmergencyAction({
        type: 'freeze_transactions',
        triggeredBy: 'user',
        reason: reason || 'Transactions frozen',
        reversible: true,
        completed: true,
      });

      await SecurityMonitorService.createAlert({
        type: 'unusual_activity',
        severity: 'high',
        message: 'All transactions have been frozen',
        details: { action },
      });

      return action;
    } catch (error) {
      console.error('Failed to freeze transactions');
      throw new Error('Failed to freeze transactions');
    }
  }

  /**
   * Unfreeze transactions
   */
  async unfreezeTransactions(): Promise<void> {
    localStorage.removeItem(this.FROZEN_KEY);
  }

  /**
   * Check if transactions are frozen
   */
  async areTransactionsFrozen(): Promise<boolean> {
    return localStorage.getItem(this.FROZEN_KEY) === 'true';
  }

  /**
   * Alert all guardians of emergency
   */
  async alertGuardians(reason: string): Promise<EmergencyAction> {
    try {
      const action = await this.recordEmergencyAction({
        type: 'alert_guardians',
        triggeredBy: 'user',
        reason,
        reversible: false,
        completed: true,
      });

      // In production, this would send actual notifications via email/SMS
      console.log('Guardians alerted:', reason);

      await SecurityMonitorService.createAlert({
        type: 'unusual_activity',
        severity: 'critical',
        message: 'Guardians have been alerted',
        details: { action, reason },
      });

      return action;
    } catch (error) {
      console.error('Failed to alert guardians');
      throw new Error('Failed to alert guardians');
    }
  }

  /**
   * Kill switch - wipe all sensitive data (IRREVERSIBLE)
   */
  async activateKillSwitch(confirmation: string): Promise<EmergencyAction> {
    try {
      // Require confirmation phrase
      if (confirmation !== 'WIPE ALL DATA') {
        throw new Error('Invalid confirmation phrase');
      }

      const config = await this.getKillSwitchConfig();
      
      if (config.requiresConfirmation && confirmation !== 'WIPE ALL DATA') {
        throw new Error('Confirmation required');
      }

      // Record action before wiping
      const action = await this.recordEmergencyAction({
        type: 'wipe',
        triggeredBy: 'user',
        reason: 'Kill switch activated',
        reversible: false,
        completed: false,
      });

      // Alert guardians if configured
      if (config.autoAlertGuardians) {
        await this.alertGuardians('Kill switch activated - data being wiped');
      }

      // Wait grace period if configured
      if (config.gracePeriod > 0) {
        await SecurityMonitorService.createAlert({
          type: 'unusual_activity',
          severity: 'critical',
          message: `Kill switch activated. Data will be wiped in ${config.gracePeriod} minutes.`,
          details: { action, gracePeriod: config.gracePeriod },
        });

        // In production, this would be handled with a background job
        // For now, we'll just log it
        console.warn(`Grace period: ${config.gracePeriod} minutes before wipe`);
      }

      // If no grace period or wipeData is true, wipe immediately
      if (config.gracePeriod === 0 && config.wipeData) {
        await this.executeKillSwitch();
      }

      return action;
    } catch (error) {
      console.error('Failed to activate kill switch');
      throw error;
    }
  }

  /**
   * Execute the actual kill switch (internal)
   */
  private async executeKillSwitch(): Promise<void> {
    // Clear all sensitive data
    await StorageService.clearAll();
    
    // Clear emergency actions and other security data
    localStorage.removeItem(this.EMERGENCY_KEY);
    localStorage.removeItem(this.KILL_SWITCH_KEY);
    
    // Mark as completed
    console.warn('Kill switch executed - all data wiped');
  }

  /**
   * Get kill switch configuration
   */
  async getKillSwitchConfig(): Promise<KillSwitchConfig> {
    try {
      const data = localStorage.getItem(this.KILL_SWITCH_KEY);
      return data ? JSON.parse(data) : {
        enabled: true,
        requiresConfirmation: true,
        gracePeriod: 5, // 5 minutes default
        autoAlertGuardians: true,
        wipeData: true,
      };
    } catch (error) {
      console.error('Failed to get kill switch config');
      return {
        enabled: true,
        requiresConfirmation: true,
        gracePeriod: 5,
        autoAlertGuardians: true,
        wipeData: true,
      };
    }
  }

  /**
   * Update kill switch configuration
   */
  async updateKillSwitchConfig(config: Partial<KillSwitchConfig>): Promise<void> {
    try {
      const current = await this.getKillSwitchConfig();
      const updated = { ...current, ...config };
      localStorage.setItem(this.KILL_SWITCH_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update kill switch config');
      throw new Error('Failed to update kill switch config');
    }
  }

  /**
   * Record emergency action
   */
  private async recordEmergencyAction(
    action: Omit<EmergencyAction, 'id' | 'timestamp'>
  ): Promise<EmergencyAction> {
    try {
      const actions = await this.getAllEmergencyActions();
      
      const newAction: EmergencyAction = {
        ...action,
        id: generateSecureRandom(16),
        timestamp: Date.now(),
      };

      actions.unshift(newAction);
      localStorage.setItem(this.EMERGENCY_KEY, JSON.stringify(actions));

      return newAction;
    } catch (error) {
      console.error('Failed to record emergency action');
      throw new Error('Failed to record emergency action');
    }
  }

  /**
   * Get all emergency actions
   */
  async getAllEmergencyActions(): Promise<EmergencyAction[]> {
    try {
      const data = localStorage.getItem(this.EMERGENCY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve emergency actions');
      return [];
    }
  }

  /**
   * Get recent emergency actions
   */
  async getRecentEmergencyActions(limit: number = 10): Promise<EmergencyAction[]> {
    const actions = await this.getAllEmergencyActions();
    return actions.slice(0, limit);
  }

  /**
   * Check if system is in emergency mode
   */
  async isEmergencyMode(): Promise<boolean> {
    const isLocked = await StorageService.isAppLocked();
    const isFrozen = await this.areTransactionsFrozen();
    return isLocked || isFrozen;
  }

  /**
   * Exit emergency mode (requires authorization)
   */
  async exitEmergencyMode(): Promise<void> {
    try {
      await StorageService.unlockApp();
      await this.unfreezeTransactions();

      await this.recordEmergencyAction({
        type: 'lock',
        triggeredBy: 'user',
        reason: 'Emergency mode deactivated',
        reversible: false,
        completed: true,
      });
    } catch (error) {
      console.error('Failed to exit emergency mode');
      throw new Error('Failed to exit emergency mode');
    }
  }
}

export default new EmergencyService();
