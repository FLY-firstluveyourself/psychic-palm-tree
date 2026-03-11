/**
 * BiometricService - Handles biometric authentication using WebAuthn API
 * Provides fingerprint, face recognition, and other platform authenticators
 */

export interface BiometricCredential {
  id: string;
  publicKey: string;
  counter: number;
  createdAt: number;
}

export interface BiometricAuthResult {
  success: boolean;
  credentialId?: string;
  message?: string;
}

class BiometricService {
  private readonly CREDENTIAL_KEY = 'wonderwallet_biometric_credential';
  private readonly RP_NAME = 'WonderWallet';
  private readonly RP_ID = window.location.hostname;

  /**
   * Check if biometric authentication is available on this device
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        return false;
      }
      
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Error checking biometric availability');
      return false;
    }
  }

  /**
   * Register biometric credential for the user
   * @param userId - Unique user identifier
   * @param userName - User display name
   */
  async registerBiometric(userId: string, userName: string): Promise<BiometricAuthResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return { success: false, message: 'Biometric authentication not available on this device' };
      }

      // Generate challenge
      const challenge = this.generateChallenge();

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: this.RP_NAME,
          id: this.RP_ID,
        },
        user: {
          id: this.stringToBuffer(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        return { success: false, message: 'Failed to create biometric credential' };
      }

      // Store credential info
      const credentialData: BiometricCredential = {
        id: credential.id,
        publicKey: this.bufferToBase64(credential.rawId),
        counter: 0,
        createdAt: Date.now(),
      };

      localStorage.setItem(this.CREDENTIAL_KEY, JSON.stringify(credentialData));

      return { success: true, credentialId: credential.id };
    } catch (error) {
      console.error('Biometric registration error');
      if (error instanceof Error) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Failed to register biometric authentication' };
    }
  }

  /**
   * Authenticate using biometric
   */
  async authenticate(): Promise<BiometricAuthResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return { success: false, message: 'Biometric authentication not available' };
      }

      // Get stored credential
      const storedCredential = this.getStoredCredential();
      if (!storedCredential) {
        return { success: false, message: 'No biometric credential registered' };
      }

      // Generate challenge
      const challenge = this.generateChallenge();

      // Create authentication options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        rpId: this.RP_ID,
        allowCredentials: [
          {
            id: this.base64ToBuffer(storedCredential.publicKey),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      };

      // Get credential (triggers biometric prompt)
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        return { success: false, message: 'Biometric authentication failed' };
      }

      // Verify the assertion (in production, this would be done server-side)
      // For local-only wallet, we trust the WebAuthn API verification
      return { success: true, credentialId: assertion.id };
    } catch (error) {
      console.error('Biometric authentication error');
      if (error instanceof Error) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Biometric authentication failed' };
    }
  }

  /**
   * Remove registered biometric credential
   */
  async removeBiometric(): Promise<boolean> {
    try {
      localStorage.removeItem(this.CREDENTIAL_KEY);
      return true;
    } catch (error) {
      console.error('Failed to remove biometric credential');
      return false;
    }
  }

  /**
   * Check if biometric is registered
   */
  isBiometricRegistered(): boolean {
    return localStorage.getItem(this.CREDENTIAL_KEY) !== null;
  }

  /**
   * Get stored credential
   */
  private getStoredCredential(): BiometricCredential | null {
    try {
      const data = localStorage.getItem(this.CREDENTIAL_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate cryptographically secure challenge
   */
  private generateChallenge(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  /**
   * Convert string to ArrayBuffer
   */
  private stringToBuffer(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Get biometric type (generic)
   * Note: WebAuthn does not expose specific biometric type for security reasons
   */
  async getBiometricType(): Promise<string> {
    const available = await this.isAvailable();
    if (!available) return 'none';

    // Return generic type - WebAuthn API doesn't expose specific biometric method
    // This is intentional for user privacy and security
    return 'biometric';
  }
}

export default new BiometricService();
