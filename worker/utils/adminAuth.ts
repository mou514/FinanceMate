import { Env } from '../types';

/**
 * Check if a user is an admin
 * Checks both SUPER_ADMIN_EMAIL environment variable and database role
 */
export function isAdmin(email: string, env: Env, userRole?: string): boolean {
    // Check SUPER_ADMIN_EMAIL environment variable
    const superAdminEmail = env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail && email.toLowerCase() === superAdminEmail.toLowerCase()) {
        return true;
    }

    // Check database role if provided
    if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
    }

    return false;
}