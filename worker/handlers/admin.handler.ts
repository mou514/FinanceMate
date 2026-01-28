import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { isAdmin } from '../utils/adminAuth';

type Variables = {
    userId: string;
    userEmail: string;
    token: string;
    userRole?: string;
};

// Use 'any' for the context path param to be compatible with router
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HonoContext = Context<{ Bindings: Env; Variables: Variables }, any>;

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
export async function getStats(c: HonoContext) {
    const userEmail = c.get('userEmail');
    const userRole = c.get('userRole');
    if (!userEmail || !isAdmin(userEmail, c.env, userRole)) {
        return c.notFound();
    }

    try {
        const db = new DBService(c.env.DB);
        const stats = await db.getAdminStats();

        return c.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        console.error('Admin stats error:', error);
        return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
    }
}

/**
 * Get all users with their stats
 * GET /api/admin/users
 */
export async function getUsers(c: HonoContext) {
    const userEmail = c.get('userEmail');
    const userRole = c.get('userRole');
    if (!userEmail || !isAdmin(userEmail, c.env, userRole)) {
        return c.notFound();
    }

    try {
        const db = new DBService(c.env.DB);
        const users = await db.getAllUsersWithStats();

        return c.json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        console.error('Admin users error:', error);
        return c.json({ success: false, error: 'Failed to fetch users' }, 500);
    }
}

/**
 * Get expenses for a specific user by email
 * GET /api/admin/user/:email/expenses
 */
export async function getUserExpenses(c: HonoContext) {
    const userEmail = c.get('userEmail');
    const userRole = c.get('userRole');
    if (!userEmail || !isAdmin(userEmail, c.env, userRole)) {
        return c.notFound();
    }

    try {
        const email = c.req.param('email');
        if (!email) {
            return c.json({ success: false, error: 'Email is required' }, 400);
        }

        const db = new DBService(c.env.DB);
        const expenses = await db.getExpensesByUserEmail(decodeURIComponent(email));

        return c.json({
            success: true,
            data: expenses,
        });
    } catch (error: any) {
        console.error('Admin user expenses error:', error);
        return c.json({ success: false, error: 'Failed to fetch user expenses' }, 500);
    }
}

/**
 * Check if current user is admin
 * GET /api/admin/check
 */
export async function checkAdmin(c: HonoContext) {
    const userEmail = c.get('userEmail');
    const userRole = c.get('userRole');
    if (!userEmail) {
        return c.notFound();
    }

    const adminStatus = isAdmin(userEmail, c.env, userRole);
    if (!adminStatus) {
        return c.notFound();
    }

    return c.json({
        success: true,
        data: { isAdmin: true },
    });
}

/**
 * Toggle user active status (Ban/Unban)
 * POST /api/admin/users/:userId/status
 */
export async function toggleUserStatus(c: HonoContext) {
    const userEmail = c.get('userEmail');
    const userRole = c.get('userRole'); // Now available from auth middleware

    // Double check admin status (env or DB)
    if (!userEmail || !isAdmin(userEmail, c.env, userRole)) {
        return c.notFound();
    }

    try {
        const userId = c.req.param('userId');
        const body = await c.req.json();
        const { isActive } = body;

        if (typeof isActive !== 'boolean') {
            return c.json({ success: false, error: 'isActive boolean is required' }, 400);
        }

        const db = new DBService(c.env.DB);

        // Prevent banning self
        if (userId === c.get('userId')) {
            return c.json({ success: false, error: 'Cannot change your own status' }, 400);
        }

        await db.updateUserStatus(userId, isActive);

        return c.json({
            success: true,
            data: { userId, isActive },
        });
    } catch (error: any) {
        console.error('Admin user status error:', error);
        return c.json({ success: false, error: 'Failed to update user status' }, 500);
    }
}

/**
 * Get system logs
 * GET /api/admin/logs
 */
export async function getSystemLogs(c: HonoContext) {
    const userEmail = c.get('userEmail');
    const userRole = c.get('userRole');

    if (!userEmail || !isAdmin(userEmail, c.env, userRole)) {
        return c.notFound();
    }

    try {
        const db = new DBService(c.env.DB);
        const limit = Number(c.req.query('limit')) || 100;
        const logs = await db.getSystemLogs(limit);

        return c.json({
            success: true,
            data: logs,
        });
    } catch (error: any) {
        console.error('Admin logs error:', error);
        return c.json({ success: false, error: 'Failed to fetch logs' }, 500);
    }
}
