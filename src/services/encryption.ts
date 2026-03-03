// import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Ensure key is 32 bytes (64 hex characters)
const KEY_HEX = process.env.ENCRYPTION_KEY || '';

// Fallback for dev environment if key is missing/invalid
const KEY = (KEY_HEX && KEY_HEX.length === 64) 
  ? Buffer.from(KEY_HEX, 'hex') 
  : (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string in production.');
      }
      console.warn('Warning: ENCRYPTION_KEY is not set or invalid. Using fallback mock key.');
      return Buffer.alloc(32, 'a');
    })();

export const EncryptionService = {
  /**
   * Encrypts a string using AES-256-GCM.
   * Returns format: iv:authTag:encryptedContent (all hex)
   */
  encrypt: (text: string): string => {
    try {
      // IV (Initialization Vector) - 12 bytes for GCM
      const iv = randomBytes(12);
      const cipher = createCipheriv(ALGORITHM, KEY, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      // Combine IV, AuthTag, and Encrypted Content
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('EncryptionService Error:', errorMessage);
      throw new Error('Failed to encrypt data');
    }
  },

  /**
   * Decrypts a string in format: iv:authTag:encryptedContent
   */
  decrypt: (text: string): string => {
    // Quick check for format: iv(hex):tag(hex):content(hex)
    // If not matching format, assume it's plain text (legacy or seeded)
    if (!text || typeof text !== 'string' || !text.includes(':')) {
      return text;
    }

    const parts = text.split(':');
    if (parts.length !== 3) {
      return text;
    }

    try {
      const [ivHex, authTagHex, encryptedHex] = parts;
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = createDecipheriv(ALGORITHM, KEY, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch {
      // Only log if it really looked like encrypted data but failed
      // console.warn('EncryptionService: Failed to decrypt data, returning original.');
      return text;
    }
  }
};
