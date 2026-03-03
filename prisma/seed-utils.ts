import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY || '';
// Default to fallback key if missing/invalid in dev, but warn
const KEY = (KEY_HEX && KEY_HEX.length === 64) 
  ? Buffer.from(KEY_HEX, 'hex') 
  : Buffer.alloc(32, 'a'); // Mock key for invalid env (don't use in prod)

export const SeedEncryption = {
  encrypt: (text: string): string => {
    if (!KEY_HEX || KEY_HEX.length !== 64) {
      console.warn('Invalid ENCRYPTION_KEY length (need 64 hex chars). using mock key');
    }
    try {
      // IV is 12 bytes for GCM
      const iv = randomBytes(12);
      const cipher = createCipheriv(ALGORITHM, KEY, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      return text;
    }
  },

  decrypt: (text: string): string => {
    try {
      const parts = text.split(':');
      if (parts.length !== 3) return text;
      const [ivHex, authTagHex, encryptedHex] = parts;
      const decipher = createDecipheriv(
        ALGORITHM,
        KEY,
        Buffer.from(ivHex, 'hex')
      );
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      return text;
    }
  }
};
