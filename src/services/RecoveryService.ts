/**
 * RecoveryService - Social recovery and guardian system
 * Enables wallet recovery through trusted guardians without exposing seed phrase
 */

import { encrypt, decrypt, hashData, generateSecureRandom } from '../utils/crypto';
import AlertService from './AlertService';

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone?: string;
  publicKey?: string; // For encrypted communication
  status: 'pending' | 'accepted' | 'revoked';
  addedAt: number;
  lastContact?: number;
}

export interface RecoveryRequest {
  id: string;
  initiatedAt: number;
  requester: string;
  guardianApprovals: Array<{
    guardianId: string;
    approved: boolean;
    approvedAt: number;
    signature?: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  expiresAt: number;
  requiredApprovals: number;
  recoveryShards: string[]; // Encrypted shards of recovery key
}

export interface RecoveryConfig {
  enabled: boolean;
  requiredApprovals: number; // M of N (e.g., 3 of 5)
  totalGuardians: number;
  recoveryDelay: number; // Delay in hours before recovery is processed
  guardians: Guardian[];
}

class RecoveryService {
  private readonly RECOVERY_CONFIG_KEY = 'wonderwallet_recovery_config';
  private readonly RECOVERY_REQUESTS_KEY = 'wonderwallet_recovery_requests';
  private readonly DEFAULT_RECOVERY_DELAY = 48; // 48 hours

  /**
   * Initialize recovery system
   * @param requiredApprovals - Number of guardian approvals required (M)
   * @param totalGuardians - Total number of guardians (N)
   */
  async initializeRecovery(requiredApprovals: number, totalGuardians: number): Promise<boolean> {
    try {
      if (requiredApprovals > totalGuardians) {
        throw new Error('Required approvals cannot exceed total guardians');
      }

      if (requiredApprovals < 2) {
        throw new Error('At least 2 guardian approvals required');
      }

      const config: RecoveryConfig = {
        enabled: true,
        requiredApprovals,
        totalGuardians,
        recoveryDelay: this.DEFAULT_RECOVERY_DELAY,
        guardians: [],
      };

      localStorage.setItem(this.RECOVERY_CONFIG_KEY, JSON.stringify(config));
      
      await AlertService.logSecurityEvent(
        'settings-changed',
        'medium',
        `Recovery system initialized: ${requiredApprovals} of ${totalGuardians} guardians required`
      );

      return true;
    } catch (error) {
      console.error('Failed to initialize recovery system');
      return false;
    }
  }

  /**
   * Add guardian to recovery system
   * @param guardian - Guardian information
   */
  async addGuardian(guardian: Omit<Guardian, 'id' | 'status' | 'addedAt'>): Promise<string> {
    try {
      const config = this.getRecoveryConfig();
      
      if (!config.enabled) {
        throw new Error('Recovery system not initialized');
      }

      if (config.guardians.length >= config.totalGuardians) {
        throw new Error('Maximum number of guardians reached');
      }

      const newGuardian: Guardian = {
        ...guardian,
        id: generateSecureRandom(16),
        status: 'pending',
        addedAt: Date.now(),
      };

      config.guardians.push(newGuardian);
      localStorage.setItem(this.RECOVERY_CONFIG_KEY, JSON.stringify(config));

      // In production: send invitation email/SMS to guardian
      console.log(`Would send guardian invitation to ${guardian.email}`);

      await AlertService.logSecurityEvent(
        'settings-changed',
        'medium',
        `New guardian added: ${guardian.name}`
      );

      return newGuardian.id;
    } catch (error) {
      console.error('Failed to add guardian');
      throw error;
    }
  }

  /**
   * Remove guardian
   */
  async removeGuardian(guardianId: string): Promise<boolean> {
    try {
      const config = this.getRecoveryConfig();
      
      const index = config.guardians.findIndex(g => g.id === guardianId);
      if (index === -1) {
        return false;
      }

      const guardian = config.guardians[index];
      guardian.status = 'revoked';

      localStorage.setItem(this.RECOVERY_CONFIG_KEY, JSON.stringify(config));

      await AlertService.logSecurityEvent(
        'settings-changed',
        'medium',
        `Guardian removed: ${guardian.name}`
      );

      return true;
    } catch (error) {
      console.error('Failed to remove guardian');
      return false;
    }
  }

  /**
   * Guardian accepts invitation
   */
  async acceptGuardianInvitation(guardianId: string): Promise<boolean> {
    try {
      const config = this.getRecoveryConfig();
      
      const guardian = config.guardians.find(g => g.id === guardianId);
      if (!guardian) {
        return false;
      }

      guardian.status = 'accepted';
      guardian.lastContact = Date.now();

      localStorage.setItem(this.RECOVERY_CONFIG_KEY, JSON.stringify(config));

      await AlertService.logSecurityEvent(
        'settings-changed',
        'low',
        `Guardian accepted invitation: ${guardian.name}`
      );

      return true;
    } catch (error) {
      console.error('Failed to accept guardian invitation');
      return false;
    }
  }

  /**
   * Initiate recovery request
   * @param requesterInfo - Information about person requesting recovery
   */
  async initiateRecovery(requesterInfo: string): Promise<string> {
    try {
      const config = this.getRecoveryConfig();
      
      if (!config.enabled) {
        throw new Error('Recovery system not enabled');
      }

      const activeGuardians = config.guardians.filter(g => g.status === 'accepted');
      if (activeGuardians.length < config.requiredApprovals) {
        throw new Error('Not enough active guardians for recovery');
      }

      const request: RecoveryRequest = {
        id: generateSecureRandom(16),
        initiatedAt: Date.now(),
        requester: requesterInfo,
        guardianApprovals: activeGuardians.map(g => ({
          guardianId: g.id,
          approved: false,
          approvedAt: 0,
        })),
        status: 'pending',
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        requiredApprovals: config.requiredApprovals,
        recoveryShards: [],
      };

      const requests = this.getRecoveryRequests();
      requests.push(request);
      localStorage.setItem(this.RECOVERY_REQUESTS_KEY, JSON.stringify(requests));

      // Notify all guardians
      console.log('Would notify guardians about recovery request');
      for (const guardian of activeGuardians) {
        console.log(`Notify ${guardian.name} at ${guardian.email}`);
      }

      await AlertService.logSecurityEvent(
        'settings-changed',
        'critical',
        'Recovery request initiated'
      );

      return request.id;
    } catch (error) {
      console.error('Failed to initiate recovery');
      throw error;
    }
  }

  /**
   * Guardian approves recovery request
   * @param requestId - Recovery request ID
   * @param guardianId - Guardian ID
   * @param recoveryShard - Encrypted shard of recovery key
   */
  async approveRecovery(
    requestId: string,
    guardianId: string,
    recoveryShard: string
  ): Promise<boolean> {
    try {
      const requests = this.getRecoveryRequests();
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Recovery request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Recovery request is no longer pending');
      }

      const approval = request.guardianApprovals.find(a => a.guardianId === guardianId);
      if (!approval) {
        throw new Error('Guardian not authorized for this request');
      }

      if (approval.approved) {
        throw new Error('Guardian already approved');
      }

      // Record approval
      approval.approved = true;
      approval.approvedAt = Date.now();
      request.recoveryShards.push(recoveryShard);

      // Check if enough approvals
      const approvedCount = request.guardianApprovals.filter(a => a.approved).length;
      if (approvedCount >= request.requiredApprovals) {
        request.status = 'approved';
        
        await AlertService.logSecurityEvent(
          'settings-changed',
          'critical',
          `Recovery request approved by ${approvedCount} guardians`
        );
      }

      localStorage.setItem(this.RECOVERY_REQUESTS_KEY, JSON.stringify(requests));

      return true;
    } catch (error) {
      console.error('Failed to approve recovery');
      return false;
    }
  }

  /**
   * Complete recovery (after delay period)
   * @param requestId - Recovery request ID
   * @param newPin - New PIN for recovered wallet
   * WARNING: This is a placeholder - requires full Shamir's Secret Sharing implementation
   */
  async completeRecovery(requestId: string, newPin: string): Promise<string | null> {
    try {
      const requests = this.getRecoveryRequests();
      const request = requests.find(r => r.id === requestId);
      
      if (!request || request.status !== 'approved') {
        throw new Error('Recovery request not approved');
      }

      const config = this.getRecoveryConfig();
      const delayMs = config.recoveryDelay * 60 * 60 * 1000;
      const recoveryTime = request.initiatedAt + delayMs;

      if (Date.now() < recoveryTime) {
        const hoursRemaining = Math.ceil((recoveryTime - Date.now()) / (60 * 60 * 1000));
        throw new Error(`Recovery delay not elapsed. ${hoursRemaining} hours remaining.`);
      }

      // TODO: Implement actual Shamir's Secret Sharing reconstruction
      // This is critical security functionality that must be properly implemented
      // before production use. Current implementation is a placeholder only.
      console.error('CRITICAL: Shamir\'s Secret Sharing not implemented - recovery incomplete');
      console.log('Would reconstruct wallet from recovery shards');
      
      // DO NOT use in production without proper SSS implementation
      throw new Error('Recovery feature incomplete - requires Shamir\'s Secret Sharing implementation');

      // Placeholder code below (commented out to prevent misuse):
      /*
      request.status = 'completed';
      localStorage.setItem(this.RECOVERY_REQUESTS_KEY, JSON.stringify(requests));

      await AlertService.logSecurityEvent(
        'settings-changed',
        'critical',
        'Wallet recovery completed'
      );

      return 'recovered-wallet-id';
      */
    } catch (error) {
      console.error('Failed to complete recovery');
      throw error;
    }
  }

  /**
   * Cancel recovery request
   */
  async cancelRecovery(requestId: string): Promise<boolean> {
    try {
      const requests = this.getRecoveryRequests();
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        return false;
      }

      request.status = 'rejected';
      localStorage.setItem(this.RECOVERY_REQUESTS_KEY, JSON.stringify(requests));

      await AlertService.logSecurityEvent(
        'settings-changed',
        'high',
        'Recovery request cancelled'
      );

      return true;
    } catch (error) {
      console.error('Failed to cancel recovery');
      return false;
    }
  }

  /**
   * Get recovery configuration
   */
  getRecoveryConfig(): RecoveryConfig {
    try {
      const data = localStorage.getItem(this.RECOVERY_CONFIG_KEY);
      return data ? JSON.parse(data) : {
        enabled: false,
        requiredApprovals: 0,
        totalGuardians: 0,
        recoveryDelay: this.DEFAULT_RECOVERY_DELAY,
        guardians: [],
      };
    } catch (error) {
      return {
        enabled: false,
        requiredApprovals: 0,
        totalGuardians: 0,
        recoveryDelay: this.DEFAULT_RECOVERY_DELAY,
        guardians: [],
      };
    }
  }

  /**
   * Get all recovery requests
   */
  getRecoveryRequests(): RecoveryRequest[] {
    try {
      const data = localStorage.getItem(this.RECOVERY_REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get active recovery request
   */
  getActiveRecoveryRequest(): RecoveryRequest | null {
    const requests = this.getRecoveryRequests();
    return requests.find(r => r.status === 'pending' || r.status === 'approved') || null;
  }

  /**
   * Check if recovery is enabled
   */
  isRecoveryEnabled(): boolean {
    return this.getRecoveryConfig().enabled;
  }

  /**
   * Generate recovery phrase (alternative to guardians)
   * This is a backup recovery method using BIP39-compatible phrase
   * WARNING: This is a placeholder - use standard BIP39 implementation
   */
  generateRecoveryPhrase(): string {
    // TODO: Replace with proper BIP39 24-word phrase generation
    // Current implementation is non-standard and for development only
    console.warn('Using non-standard recovery phrase generation - not BIP39 compliant');
    
    const words: string[] = [];
    for (let i = 0; i < 24; i++) {
      const randomWord = generateSecureRandom(4);
      words.push(randomWord);
    }
    return words.join('-');
  }
}

export default new RecoveryService();
