import { Hono } from 'hono';
import { Env } from './types';
import { authMiddleware } from './middleware/auth';
import { rateLimit, byUserId, byEmail, byIP } from './middleware/rateLimit';
import * as authHandler from './handlers/auth.handler';
import * as expensesHandler from './handlers/expenses.handler';
import * as apiKeysHandler from './handlers/apiKeys.handler';
import * as receiptsHandler from './handlers/receipts.handler';
import * as errorsHandler from './handlers/errors.handler';
import * as adminHandler from './handlers/admin.handler';
import * as budgetsHandler from './handlers/budgets.handler';
import * as analyticsHandler from './handlers/analytics.handler';
import * as categoriesHandler from './handlers/categories.handler';
import * as tagsHandler from './handlers/tags.handler';
import * as notificationsHandler from './handlers/notifications.handler';

type Variables = {
    userId: string;
    userEmail: string;
    token: string;
};

/**
 * API Router for Focal Finance Tracker
 */
export function createRouter() {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();

    // ============ AUTHENTICATION ROUTES ============
    console.log('[Router] AuthHandler check:', !!authHandler, !!authHandler?.login);
    app.get('/test-debug', async (c) => {
        console.log('[Debug] Hit test endpoint');
        try {
            const env = c.env;
            console.log('[Debug] Env check:', !!env.DB, !!env.JWT_SECRET);

            const { AuthService } = await import('./services/auth.service');
            const authService = new AuthService(env.JWT_SECRET);
            console.log('[Debug] AuthService created');

            const hash = await authService.hashPassword('test');
            console.log('[Debug] Password hashed:', hash);

            return c.json({ success: true, message: 'Debug OK' });
        } catch (e) {
            console.error('[Debug] Error:', e);
            return c.json({ success: false, error: String(e) }, 500);
        }
    });

    const authLimiter = rateLimit(
        'auth-attempt',
        { limit: 10, window: 600 }, // 10 attempts per 10 minutes per IP
        byIP
    );

    app.post('/auth/signup', authLimiter, authHandler.signup);
    app.post('/auth/login', authLimiter, authHandler.login);
    app.post('/auth/logout', authMiddleware, authHandler.logout);
    app.get('/auth/me', authMiddleware, authHandler.me);
    app.get('/auth/verify/:token', authHandler.verifyEmail);
    // Rate limit: 3 requests per 15 minutes
    const resendVerificationLimiter = rateLimit(
        'resend-verification',
        { limit: 3, window: 900 },
        byUserId
    );
    app.post('/auth/resend-verification', resendVerificationLimiter, authMiddleware, authHandler.resendVerification);

    // Rate limit: 3 requests per 15 minutes
    const forgotPasswordLimiter = rateLimit(
        'forgot-password',
        { limit: 3, window: 900 },
        byEmail
    );
    app.post('/auth/forgot-password', forgotPasswordLimiter, authHandler.forgotPassword);
    app.post('/auth/reset-password', authHandler.resetPassword);

    // ============ EXPENSE ROUTES (Protected) ============
    app.get('/expenses', authMiddleware, expensesHandler.getExpenses);
    app.get('/expenses/:id', authMiddleware, expensesHandler.getExpenseById);
    app.post('/expenses', authMiddleware, expensesHandler.createExpense);
    app.put('/expenses/:id', authMiddleware, expensesHandler.updateExpense);
    app.delete('/expenses/:id', authMiddleware, expensesHandler.deleteExpense);

    // ============ RECEIPT PROCESSING ROUTES (Protected) ============
    app.post('/receipts/process', authMiddleware, receiptsHandler.processReceipt);
    app.post('/receipts/process-audio', authMiddleware, receiptsHandler.processAudioReceipt);
    app.get('/receipts/quota', authMiddleware, receiptsHandler.getAIQuota);

    // ============ SETTINGS ROUTES (Protected) ============
    app.get('/settings/currency', authMiddleware, apiKeysHandler.getCurrency);
    app.put('/settings/currency', authMiddleware, apiKeysHandler.updateCurrency);
    app.get('/settings/ai-provider', authMiddleware, apiKeysHandler.getAIProvider);
    app.put('/settings/ai-provider', authMiddleware, apiKeysHandler.updateAIProvider);

    // API Keys Management
    app.post('/keys', authMiddleware, apiKeysHandler.generateKey);
    app.get('/keys', authMiddleware, apiKeysHandler.listKeys);
    app.delete('/keys/:id', authMiddleware, apiKeysHandler.revokeKey);

    // ============ BUDGET ROUTES (Protected) ============
    app.get('/budgets', authMiddleware, budgetsHandler.getBudgets);
    app.post('/budgets', authMiddleware, budgetsHandler.upsertBudget);

    // ============ ANALYTICS ROUTES (Protected) ============
    // ============ CATEGORY ROUTES (Protected) ============
    app.get('/categories/statistics', authMiddleware, categoriesHandler.getCategoryStatistics);
    app.get('/categories', authMiddleware, categoriesHandler.getCategories);
    app.post('/categories', authMiddleware, categoriesHandler.addCategory);
    app.patch('/categories/:id', authMiddleware, categoriesHandler.updateCategory);
    app.delete('/categories/:id', authMiddleware, categoriesHandler.deleteCategory);
    app.post('/categories/merge', authMiddleware, categoriesHandler.mergeCategories);
    app.post('/categories/bulk-delete', authMiddleware, categoriesHandler.bulkDeleteCategories);

    // ============ TAGS ROUTES (Protected) ============
    app.get('/tags', authMiddleware, tagsHandler.getTags);
    app.post('/tags', authMiddleware, tagsHandler.createTag);
    app.delete('/tags/:id', authMiddleware, tagsHandler.deleteTag);

    // ============ NOTIFICATIONS ROUTES (Protected) ============
    app.get('/notifications', authMiddleware, notificationsHandler.getNotifications);
    app.get('/notifications/unread-count', authMiddleware, notificationsHandler.getUnreadCount);
    app.put('/notifications/:id/read', authMiddleware, notificationsHandler.markRead);
    app.put('/notifications/read-all', authMiddleware, notificationsHandler.markAllRead);

    // ============ ANALYTICS ROUTES (Protected) ============
    app.get('/analytics/user', authMiddleware, analyticsHandler.getUserAnalytics);
    app.get('/analytics/history', authMiddleware, analyticsHandler.getHistory);
    app.get('/analytics/forecast', authMiddleware, analyticsHandler.getForecast);
    app.get('/analytics/trends', authMiddleware, analyticsHandler.getTrends);

    // ============ ERROR LOGGING ROUTES ============
    app.post('/client-errors', errorsHandler.logClientError);

    // ============ ADMIN ROUTES (Protected + Admin Check) ============
    // Note: Admin check happens inside each handler (returns 404 for non-admins)
    app.get('/admin/check', authMiddleware, adminHandler.checkAdmin);
    app.get('/admin/stats', authMiddleware, adminHandler.getStats);
    app.get('/admin/users', authMiddleware, adminHandler.getUsers);
    app.get('/admin/user/:email/expenses', authMiddleware, adminHandler.getUserExpenses);
    app.post('/admin/users/:userId/status', authMiddleware, adminHandler.toggleUserStatus);
    app.put('/admin/users/:userId/role', authMiddleware, adminHandler.setUserRole);
    app.delete('/admin/users/:userId', authMiddleware, adminHandler.deleteUser);
    app.get('/admin/logs', authMiddleware, adminHandler.getSystemLogs);

    return app;
}
