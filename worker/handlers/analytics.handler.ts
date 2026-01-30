import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { success, error, json } from '../utils/response';

type Variables = {
    userId: string;
    userEmail: string;
    token: string;
};

/**
 * GET /api/analytics/user
 * Get analytics for component user
 */
export async function getUserAnalytics(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    const stats = await dbService.getUserStats(userId);

    return json(success(stats));
}

/**
 * GET /api/analytics/history
 * Get monthly transaction history
 */
export async function getHistory(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);
    const months = Number(c.req.query('months')) || 6;

    try {
        const history = await dbService.getMonthlyTransactionHistory(userId, months);
        return json(success(history));
    } catch (e: any) {
        console.error('Get history error:', e);
        return error('Failed to fetch history', 500);
    }
}

/**
 * GET /api/analytics/forecast
 * Get spending forecast
 */
export async function getForecast(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    try {
        const forecast = await dbService.getSpendingForecast(userId);
        return json(success(forecast));
    } catch (e: any) {
        console.error('Get forecast error:', e);
        return error('Failed to fetch forecast', 500);
    }
}

/**
 * GET /api/analytics/trends
 * Get month-over-month category trends
 */
export async function getTrends(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    try {
        const trends = await dbService.getCategoryTrends(userId);
        return json(success(trends));
    } catch (e: any) {
        console.error('Get trends error:', e);
        return error('Failed to fetch trends', 500);
    }
}
