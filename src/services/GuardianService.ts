/**
 * GuardianService - Manages guardians and recovery contacts
 */

import { generateSecureRandom } from '../utils/crypto';
import StorageService from './StorageService';

export interface Guardian {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  addedAt: number;
  verified: boolean;
  publicKey?: string; // For encrypted communication
}

export interface RecoveryRequest {
  id: string;
  walletId: string;
  guardianId: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvals: string[]; // Guardian IDs who approved
  requiredApprovals: number;
  expiresAt: number;
}

class GuardianService {
  private readonly STORAGE_KEY = 'wonderwallet_guardians';
  private readonly RECOVERY_KEY = 'wonderwallet_recovery_requests';

  /**
   * Add a guardian/recovery contact
   */
  async addGuardian(guardian: Omit<Guardian, 'id' | 'addedAt' | 'verified'>): Promise<Guardian> {
    try {
      const guardians = await this.getAllGuardians();
      
      const newGuardian: Guardian = {
        ...guardian,
        id: generateSecureRandom(16),
        addedAt: Date.now(),
        verified: false,
      };

      guardians.push(newGuardian);
      await this.saveGuardians(guardians);
      
      return newGuardian;
    } catch (error) {
      console.error('Failed to add guardian');
      throw new Error('Failed to add guardian');
    }
  }

  /**
   * Get all guardians
   */
  async getAllGuardians(): Promise<Guardian[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve guardians');
      return [];
    }
  }

  /**
   * Get guardian by ID
   */
  async getGuardian(id: string): Promise<Guardian | null> {
    const guardians = await this.getAllGuardians();
    return guardians.find(g => g.id === id) || null;
  }

  /**
   * Update guardian information
   */
  async updateGuardian(id: string, updates: Partial<Guardian>): Promise<void> {
    try {
      const guardians = await this.getAllGuardians();
      const index = guardians.findIndex(g => g.id === id);
      
      if (index === -1) {
        throw new Error('Guardian not found');
      }

      guardians[index] = { ...guardians[index], ...updates };
      await this.saveGuardians(guardians);
    } catch (error) {
      console.error('Failed to update guardian');
      throw new Error('Failed to update guardian');
    }
  }

  /**
   * Remove a guardian
   */
  async removeGuardian(id: string): Promise<void> {
    try {
      const guardians = await this.getAllGuardians();
      const filtered = guardians.filter(g => g.id !== id);
      await this.saveGuardians(filtered);
    } catch (error) {
      console.error('Failed to remove guardian');
      throw new Error('Failed to remove guardian');
    }
  }

  /**
   * Verify guardian (e.g., after email/SMS confirmation)
   */
  async verifyGuardian(id: string): Promise<void> {
    await this.updateGuardian(id, { verified: true });
  }

  /**
   * Initiate recovery request requiring guardian approval
   */
  async initiateRecovery(walletId: string, requiredApprovals: number = 2): Promise<RecoveryRequest> {
    try {
      const guardians = await this.getAllGuardians();
      const verifiedGuardians = guardians.filter(g => g.verified);

      if (verifiedGuardians.length < requiredApprovals) {
        throw new Error('Not enough verified guardians for recovery');
      }

      const request: RecoveryRequest = {
        id: generateSecureRandom(16),
        walletId,
        guardianId: '', // Will be filled by specific guardian
        requestedAt: Date.now(),
        status: 'pending',
        approvals: [],
        requiredApprovals,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      const requests = await this.getAllRecoveryRequests();
      requests.push(request);
      await this.saveRecoveryRequests(requests);

      return request;
    } catch (error) {
      console.error('Failed to initiate recovery');
      throw new Error('Failed to initiate recovery');
    }
  }

  /**
   * Guardian approves recovery request
   */
  async approveRecovery(requestId: string, guardianId: string): Promise<RecoveryRequest> {
    try {
      const requests = await this.getAllRecoveryRequests();
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        throw new Error('Recovery request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Recovery request is no longer pending');
      }

      if (Date.now() > request.expiresAt) {
        request.status = 'rejected';
        await this.saveRecoveryRequests(requests);
        throw new Error('Recovery request has expired');
      }

      if (!request.approvals.includes(guardianId)) {
        request.approvals.push(guardianId);
      }

      if (request.approvals.length >= request.requiredApprovals) {
        request.status = 'approved';
      }

      await this.saveRecoveryRequests(requests);
      return request;
    } catch (error) {
      console.error('Failed to approve recovery');
      throw new Error('Failed to approve recovery');
    }
  }

  /**
   * Get all recovery requests
   */
  async getAllRecoveryRequests(): Promise<RecoveryRequest[]> {
    try {
      const data = localStorage.getItem(this.RECOVERY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve recovery requests');
      return [];
    }
  }

  /**
   * Get recovery requests for specific wallet
   */
  async getWalletRecoveryRequests(walletId: string): Promise<RecoveryRequest[]> {
    const requests = await this.getAllRecoveryRequests();
    return requests.filter(r => r.walletId === walletId);
  }

  /**
   * Get pending recovery requests
   */
  async getPendingRecoveryRequests(): Promise<RecoveryRequest[]> {
    const requests = await this.getAllRecoveryRequests();
    return requests.filter(r => r.status === 'pending' && Date.now() <= r.expiresAt);
  }

  /**
   * Complete recovery and mark as done
   */
  async completeRecovery(requestId: string): Promise<void> {
    try {
      const requests = await this.getAllRecoveryRequests();
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        throw new Error('Recovery request not found');
      }

      if (request.status !== 'approved') {
        throw new Error('Recovery request not approved');
      }

      request.status = 'completed';
      await this.saveRecoveryRequests(requests);
    } catch (error) {
      console.error('Failed to complete recovery');
      throw new Error('Failed to complete recovery');
    }
  }

  /**
   * Save guardians to storage
   */
  private async saveGuardians(guardians: Guardian[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(guardians));
  }

  /**
   * Save recovery requests to storage
   */
  private async saveRecoveryRequests(requests: RecoveryRequest[]): Promise<void> {
    localStorage.setItem(this.RECOVERY_KEY, JSON.stringify(requests));
  }
}

export default new GuardianService();
