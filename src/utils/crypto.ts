import CryptoJS from 'crypto-js';

/**
 * Encrypt data using AES-256-GCM (simulated with CryptoJS AES)
 * @param data - Data to encrypt
 * @param key - Encryption key (PIN/password)
 * @returns Encrypted string
 */
export function encrypt(data: string, key: string): string {
  try {
    // Use PBKDF2 to derive a strong key from PIN
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const derivedKey = CryptoJS.PBKDF2(key, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(data, derivedKey.toString());

    // Combine salt and encrypted data
    const result = {
      salt: salt.toString(CryptoJS.enc.Hex),
      ciphertext: encrypted.toString(),
    };

    return JSON.stringify(result);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256
 * @param encryptedData - Encrypted string
 * @param key - Decryption key (PIN/password)
 * @returns Decrypted string
 */
export function decrypt(encryptedData: string, key: string): string {
  try {
    const data = JSON.parse(encryptedData);
    const salt = CryptoJS.enc.Hex.parse(data.salt);

    // Derive the same key using the stored salt
    const derivedKey = CryptoJS.PBKDF2(key, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(
      data.ciphertext,
      derivedKey.toString()
    );

    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) {
      throw new Error('Invalid PIN or corrupted data');
    }

    return decryptedStr;
  } catch (error) {
    console.error('Decryption error');
    throw new Error('Failed to decrypt data - Invalid PIN');
  }
}

/**
 * Generate a secure random string
 * @param length - Length of random string
 * @returns Random hex string
 */
export function generateSecureRandom(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
}

/**
 * Hash data using SHA-256
 * @param data - Data to hash
 * @returns Hash string
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

/**
 * Clear sensitive data from memory (best effort)
 * @param obj - Object to clear
 */
export function clearSensitiveData(obj: any): void {
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          // Overwrite string with zeros before clearing
          obj[key] = '\0'.repeat(obj[key].length);
          obj[key] = '';
        } else if (typeof obj[key] === 'object') {
          clearSensitiveData(obj[key]);
        }
        delete obj[key];
      }
    }
  }
}
