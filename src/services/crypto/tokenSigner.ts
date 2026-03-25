/**
 * @file tokenSigner.ts
 * @description JWT token signing and verification for authentication
 *              and authorization in the Deterministic Execution Layer.
 */

import jwt from 'jsonwebtoken';
import { logger } from '../logger/logger';

/** JWT payload structure */
export interface TokenPayload {
  sub: string;
  email?: string;
  roles?: string[];
  type?: 'access' | 'refresh' | 'api';
  [key: string]: unknown;
}

/** Token verification result */
export interface VerifiedToken {
  payload: TokenPayload;
  iat: number;
  exp: number;
  jti?: string;
}

/** Token configuration */
export interface TokenConfig {
  secret: string;
  accessTokenTtl?: string;
  refreshTokenTtl?: string;
  issuer?: string;
  audience?: string;
}

let tokenConfig: TokenConfig = { secret: 'change-in-production' };

/**
 * Configures the token signer.
 * @param config - Token configuration
 */
export function configureTokenSigner(config: TokenConfig): void {
  tokenConfig = config;
  logger.info('Token signer configured');
}

/**
 * Signs a JWT access token.
 * @param payload - Token payload
 * @param options - Override options
 * @returns Signed JWT string
 */
export function signAccessToken(payload: TokenPayload, options: jwt.SignOptions = {}): string {
  return jwt.sign(payload, tokenConfig.secret, {
    expiresIn: (tokenConfig.accessTokenTtl ?? '15m') as jwt.SignOptions['expiresIn'],
    issuer: tokenConfig.issuer,
    audience: tokenConfig.audience,
    jwtid: require('crypto').randomUUID(),
    ...options,
  });
}

/**
 * Signs a JWT refresh token.
 * @param userId - User ID
 * @param options - Override options
 * @returns Signed refresh JWT
 */
export function signRefreshToken(userId: string, options: jwt.SignOptions = {}): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, tokenConfig.secret, {
    expiresIn: (tokenConfig.refreshTokenTtl ?? '7d') as jwt.SignOptions['expiresIn'],
    issuer: tokenConfig.issuer,
    ...options,
  });
}

/**
 * Verifies and decodes a JWT token.
 * @param token - JWT string
 * @param options - Verification options
 * @returns Verified token data
 * @throws JsonWebTokenError if invalid
 */
export function verifyToken(token: string, options: jwt.VerifyOptions = {}): VerifiedToken {
  const decoded = jwt.verify(token, tokenConfig.secret, {
    issuer: tokenConfig.issuer,
    audience: tokenConfig.audience,
    ...options,
  }) as jwt.JwtPayload;

  return {
    payload: decoded as TokenPayload,
    iat: decoded.iat ?? 0,
    exp: decoded.exp ?? 0,
    jti: decoded.jti,
  };
}

/**
 * Decodes a JWT without verification (for inspection only).
 * @param token - JWT string
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): TokenPayload | null {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string') return null;
  return decoded as TokenPayload;
}

/**
 * Checks if a token is expired without throwing.
 * @param token - JWT string
 * @returns True if expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    verifyToken(token);
    return false;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return true;
    return false;
  }
}

export default { configureTokenSigner, signAccessToken, signRefreshToken, verifyToken, decodeToken, isTokenExpired };
