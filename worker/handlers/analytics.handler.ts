import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { success, json } from '../utils/response';

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
