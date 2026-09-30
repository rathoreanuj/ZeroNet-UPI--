/**
 * hybridCrypto.js
 *
 * Hybrid encryption — RSA-OAEP (SHA-256) + AES-256-GCM.
 *
 * Why hybrid?
 *   RSA-2048 can only encrypt ~245 bytes directly. A payment JSON is already
 *   ~300 bytes before any extras. Solution: generate a one-time 256-bit AES
 *   key, AES-GCM-encrypt the payload (fast + authenticated), then RSA-OAEP-
 *   encrypt just the AES key.
 *
 * Wire format (base64 of):
 *   [ 256 bytes RSA-encrypted AES key ][ 12 bytes GCM IV ][ ciphertext + 16-byte tag ]
 *
 * AES-GCM is authenticated encryption: a single tampered bit causes decryption
 * to throw, which is what makes it safe to route through untrusted intermediates.
 *
 * This mirrors the Java HybridCryptoService exactly so the frontend demo
 * (which encrypts) and the backend (which decrypts) stay in sync.
 */

import forge from 'node-forge';
import crypto from 'crypto';
import { getKeyPair } from './serverKeyHolder.js';

const RSA_ENCRYPTED_KEY_BYTES = 256; // 2048-bit RSA → 256-byte output
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16; // 128-bit tag

// ─── Encrypt (used by DemoService to simulate the sender's phone) ────────────

/**
 * @param {object} paymentInstruction - Plain JS object matching PaymentInstruction shape
 * @param {forge.pki.rsa.PublicKey} serverPublicKey - RSA public key (forge object)
 * @returns {string} base64-encoded hybrid ciphertext
 */
export function encrypt(paymentInstruction, serverPublicKey) {
  const plaintext = Buffer.from(JSON.stringify(paymentInstruction), 'utf8');

  // 1. Generate a one-time AES-256 key
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(GCM_IV_BYTES);

  // 2. AES-256-GCM encrypt the payload
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16-byte authentication tag

  // 3. RSA-OAEP-SHA256 encrypt the AES key
  const aesKeyBytes = forge.util.createBuffer(aesKey.toString('binary'));
  const encryptedAesKey = serverPublicKey.encrypt(
    aesKeyBytes.getBytes(),
    'RSA-OAEP',
    { md: forge.md.sha256.create(), mgf1: { md: forge.md.sha256.create() } }
  );

  // 4. Pack: [RSA-enc AES key][IV][AES ciphertext + GCM tag]
  const encKeyBuf = Buffer.from(encryptedAesKey, 'binary');
  const result = Buffer.concat([encKeyBuf, iv, encrypted, tag]);
  return result.toString('base64');
}

// ─── Decrypt (server-side, called by BridgeIngestionService) ─────────────────

/**
 * @param {string} base64Ciphertext - base64-encoded hybrid ciphertext
 * @returns {object} Decrypted PaymentInstruction as a plain JS object
 * @throws if tampering is detected or keys don't match
 */
export function decrypt(base64Ciphertext) {
  const all = Buffer.from(base64Ciphertext, 'base64');

  if (all.length < RSA_ENCRYPTED_KEY_BYTES + GCM_IV_BYTES + GCM_TAG_BYTES) {
    throw new Error('Ciphertext too short');
  }

  // Unpack
  let offset = 0;
  const encryptedAesKey = all.subarray(offset, offset + RSA_ENCRYPTED_KEY_BYTES);
  offset += RSA_ENCRYPTED_KEY_BYTES;
  const iv = all.subarray(offset, offset + GCM_IV_BYTES);
  offset += GCM_IV_BYTES;
  const tag = all.subarray(all.length - GCM_TAG_BYTES);
  const aesCiphertext = all.subarray(offset, all.length - GCM_TAG_BYTES);

  // 1. RSA-OAEP decrypt the AES key
  const { privateKey } = getKeyPair();
  const aesKeyBinary = privateKey.decrypt(
    encryptedAesKey.toString('binary'),
    'RSA-OAEP',
    { md: forge.md.sha256.create(), mgf1: { md: forge.md.sha256.create() } }
  );
  const aesKey = Buffer.from(aesKeyBinary, 'binary');

  // 2. AES-256-GCM decrypt + verify tag
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(aesCiphertext), decipher.final()]);

  return JSON.parse(plaintext.toString('utf8'));
}

// ─── Hash (idempotency key) ───────────────────────────────────────────────────

/**
 * SHA-256 of the raw ciphertext string. This is the idempotency key.
 *
 * Why ciphertext and not packetId?
 *   Intermediates can rewrite packetId (it's in the clear). They cannot forge
 *   a valid ciphertext for a different payload. Two delivered copies of the
 *   same packet have identical ciphertexts → identical hashes → caught as duplicate.
 *
 * @param {string} base64Ciphertext
 * @returns {string} lowercase hex SHA-256
 */
export function hashCiphertext(base64Ciphertext) {
  return crypto.createHash('sha256').update(base64Ciphertext, 'utf8').digest('hex');
}
