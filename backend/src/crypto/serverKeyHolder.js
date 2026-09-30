/**
 * serverKeyHolder.js
 *
 * Holds the server's RSA-2048 keypair, generated once on startup.
 *
 * In production the private key would live in an HSM or KMS (AWS KMS /
 * HashiCorp Vault). NEVER in source or the deployed bundle.
 *
 * The public key is exposed via /api/server-key so simulated sender devices
 * can cache it and encrypt offline payment packets.
 */

import forge from 'node-forge';

let _keyPair = null;

/**
 * Generate (or return the cached) RSA-2048 keypair.
 * node-forge is synchronous; for a server boot-time operation this is fine.
 */
export function getKeyPair() {
  if (!_keyPair) {
    console.log('[ServerKeyHolder] Generating RSA-2048 keypair...');
    _keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
    const pubDer = forge.asn1.toDer(forge.pki.publicKeyToAsn1(_keyPair.publicKey)).getBytes();
    const fingerprint = forge.util.encode64(pubDer).substring(0, 32);
    console.log(`[ServerKeyHolder] Keypair ready. Public-key prefix: ${fingerprint}...`);
  }
  return _keyPair;
}

export function getPublicKeyBase64() {
  const kp = getKeyPair();
  const der = forge.asn1.toDer(forge.pki.publicKeyToAsn1(kp.publicKey)).getBytes();
  return forge.util.encode64(der);
}
