import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

/**
 * Authentication service for password hashing and JWT operations
 */
export class AuthService {
    private jwtSecret: string;
    private saltRounds = 10;
    private jwtExpiresIn = '7d'; // 7 days

    constructor(jwtSecret: string) {
        this.jwtSecret = jwtSecret;
    }

    /**
     * Hash a password using bcrypt
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Verify a password against a hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate a JWT token
     */
    generateToken(payload: JWTPayload): string {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
        } as jwt.SignOptions);
    }

    /**
     * Verify and decode a JWT token
     */
    verifyToken(token: string): JWTPayload | null {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
            return decoded;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get token expiration timestamp
     */
    getTokenExpiration(): number {
        // 7 days from now in milliseconds
        return Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    /**
     * Generate a secure verification token
     */
    generateVerificationToken(): string {
        // Generate a random token using crypto
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate a 6-digit verification code
     */
    generateVerificationCode(): string {
        const min = 100000;
        const max = 999999;
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        // Use modulo to get a number in range, then add min to ensure 6 digits
        // Note: subtle bias with modulo but acceptable for 6-digit OTPs
        const randomNum = (array[0] % (max - min + 1)) + min;
        return randomNum.toString();
    }
}
