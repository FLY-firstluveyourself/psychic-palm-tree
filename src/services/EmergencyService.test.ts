import { expect, test, describe, beforeEach } from 'vitest';
import EmergencyService from './EmergencyService';

describe('EmergencyService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('should get kill switch config', async () => {
    const config = await EmergencyService.getKillSwitchConfig();
    
    expect(config).toBeDefined();
    expect(config.enabled).toBe(true);
    expect(config.requiresConfirmation).toBe(true);
  });

  test('should update kill switch config', async () => {
    await EmergencyService.updateKillSwitchConfig({
      gracePeriod: 10,
      autoAlertGuardians: false,
    });
    
    const config = await EmergencyService.getKillSwitchConfig();
    expect(config.gracePeriod).toBe(10);
    expect(config.autoAlertGuardians).toBe(false);
  });

  test('should freeze transactions', async () => {
    await EmergencyService.freezeTransactions('Test freeze');
    
    const isFrozen = await EmergencyService.areTransactionsFrozen();
    expect(isFrozen).toBe(true);
  });

  test('should unfreeze transactions', async () => {
    await EmergencyService.freezeTransactions('Test freeze');
    await EmergencyService.unfreezeTransactions();
    
    const isFrozen = await EmergencyService.areTransactionsFrozen();
    expect(isFrozen).toBe(false);
  });

  test('should record emergency action', async () => {
    await EmergencyService.freezeTransactions('Test emergency');
    
    const actions = await EmergencyService.getAllEmergencyActions();
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe('freeze_transactions');
  });

  test('should get recent emergency actions', async () => {
    await EmergencyService.freezeTransactions('Action 1');
    await EmergencyService.alertGuardians('Action 2');
    
    const actions = await EmergencyService.getRecentEmergencyActions(5);
    expect(actions.length).toBe(2);
  });

  test('should check emergency mode', async () => {
    let isEmergency = await EmergencyService.isEmergencyMode();
    expect(isEmergency).toBe(false);
    
    await EmergencyService.freezeTransactions('Test');
    
    isEmergency = await EmergencyService.isEmergencyMode();
    expect(isEmergency).toBe(true);
  });
});
