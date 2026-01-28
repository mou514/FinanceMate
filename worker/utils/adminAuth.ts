import { Env } from '../types';

/**
 * Check if a user email matches the admin email
 * Returns false if ADMIN_EMAIL is not configured
 */
export function isAdmin(email: string, env: Env, userRole?: string): boolean {
    // Check environment variable (legacy/owner)
    const adminEmail = env.ADMIN_EMAIL;
    if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase()) {
        return true;
    }

    // Check database role if provided
    if (userRole === 'admin') {
        return true;
    }

    return false;
}