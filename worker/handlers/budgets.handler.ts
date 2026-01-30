
import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { success, error, json } from '../utils/response';
import { z } from 'zod';
import { validateRequest } from '../utils/validation';

/**
 * GET /api/budgets
 * Get all budgets for the current user
 */
export async function getBudgets(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const db = new DBService(c.env.DB);

    try {
        const budgets = await db.getBudgets(userId);
        return json(success(budgets));
    } catch (e: any) {
        console.error('Get budgets error:', e);
        return error('Failed to fetch budgets', 500);
    }
}

const budgetSchema = z.object({
    category: z.string().min(1),
    limit_amount: z.number().min(0),
    currency: z.string().min(3).max(3).optional().default('USD'),
    alert_threshold: z.number().min(0).max(100).optional().default(80)
});

/**
 * POST /api/budgets
 * Create or update a budget
 */
export async function upsertBudget(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const db = new DBService(c.env.DB);

    const validation = await validateRequest(c.req.raw, budgetSchema);
    if (!validation.success) {
        return error(validation.error, 400);
    }

    const { category, limit_amount, currency, alert_threshold } = validation.data;

    try {
        const budget = await db.upsertBudget(userId, category, limit_amount, currency, alert_threshold);
        return json(success(budget));
    } catch (e: any) {
        console.error('Upsert budget error:', e);
        return error('Failed to save budget', 500);
    }
}
