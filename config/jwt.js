import crypto from 'crypto';

/**
 * Simple JWT token generator and verifier using crypto
 * Format: header.payload.signature
 */

const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
const ALGORITHM = 'sha256';

/**
 * Generate a JWT token
 * @param {Object} payload - The data to encode in the token
 * @param {number} expiresIn - Expiration time in seconds (default: 86400 = 1 day)
 * @returns {string} JWT token
 */
export function generateToken(payload, expiresIn = 86400) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const headerEncoded = btoa(JSON.stringify(header));
  const payloadEncoded = btoa(JSON.stringify(claims));

  const message = `${headerEncoded}.${payloadEncoded}`;
  const signature = crypto
    .createHmac(ALGORITHM, JWT_SECRET)
    .update(message)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${message}.${signature}`;
}

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} Decoded payload if valid, null if invalid
 */
export function verifyToken(token) {
  try {
    const [headerEncoded, payloadEncoded, signature] = token.split('.');

    if (!headerEncoded || !payloadEncoded || !signature) {
      return null;
    }
    
    // Verify signature
    const message = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = crypto
      .createHmac(ALGORITHM, JWT_SECRET)
      .update(message)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(atob(payloadEncoded));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}
