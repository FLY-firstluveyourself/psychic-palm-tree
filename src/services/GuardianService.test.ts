import { expect, test, describe, beforeEach } from 'vitest';
import GuardianService from './GuardianService';

describe('GuardianService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('should add a guardian', async () => {
    const guardian = await GuardianService.addGuardian({
      name: 'John Doe',
      email: 'john@example.com',
      relationship: 'Friend',
    });

    expect(guardian).toBeDefined();
    expect(guardian.name).toBe('John Doe');
    expect(guardian.email).toBe('john@example.com');
    expect(guardian.verified).toBe(false);
  });

  test('should get all guardians', async () => {
    await GuardianService.addGuardian({
      name: 'Jane Doe',
      email: 'jane@example.com',
      relationship: 'Family',
    });

    const guardians = await GuardianService.getAllGuardians();
    expect(guardians.length).toBe(1);
    expect(guardians[0].name).toBe('Jane Doe');
  });

  test('should verify a guardian', async () => {
    const guardian = await GuardianService.addGuardian({
      name: 'Test Guardian',
      email: 'test@example.com',
      relationship: 'Friend',
    });

    await GuardianService.verifyGuardian(guardian.id);
    
    const updated = await GuardianService.getGuardian(guardian.id);
    expect(updated?.verified).toBe(true);
  });

  test('should remove a guardian', async () => {
    const guardian = await GuardianService.addGuardian({
      name: 'Remove Me',
      email: 'remove@example.com',
      relationship: 'Friend',
    });

    await GuardianService.removeGuardian(guardian.id);
    
    const guardians = await GuardianService.getAllGuardians();
    expect(guardians.length).toBe(0);
  });

  test('should initiate recovery request', async () => {
    // Add verified guardians first
    const guardian1 = await GuardianService.addGuardian({
      name: 'Guardian 1',
      email: 'g1@example.com',
      relationship: 'Friend',
    });
    await GuardianService.verifyGuardian(guardian1.id);

    const guardian2 = await GuardianService.addGuardian({
      name: 'Guardian 2',
      email: 'g2@example.com',
      relationship: 'Family',
    });
    await GuardianService.verifyGuardian(guardian2.id);

    const request = await GuardianService.initiateRecovery('test-wallet-id', 2);
    
    expect(request).toBeDefined();
    expect(request.status).toBe('pending');
    expect(request.requiredApprovals).toBe(2);
  });

  test('should approve recovery request', async () => {
    // Setup
    const guardian1 = await GuardianService.addGuardian({
      name: 'Guardian 1',
      email: 'g1@example.com',
      relationship: 'Friend',
    });
    await GuardianService.verifyGuardian(guardian1.id);

    const guardian2 = await GuardianService.addGuardian({
      name: 'Guardian 2',
      email: 'g2@example.com',
      relationship: 'Family',
    });
    await GuardianService.verifyGuardian(guardian2.id);

    const request = await GuardianService.initiateRecovery('test-wallet-id', 2);

    // Approve with first guardian
    await GuardianService.approveRecovery(request.id, guardian1.id);
    let updatedRequest = await GuardianService.getAllRecoveryRequests();
    expect(updatedRequest[0].approvals.length).toBe(1);

    // Approve with second guardian - should change status to approved
    await GuardianService.approveRecovery(request.id, guardian2.id);
    updatedRequest = await GuardianService.getAllRecoveryRequests();
    expect(updatedRequest[0].status).toBe('approved');
  });
});
