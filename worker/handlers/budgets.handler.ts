import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { success, error, json } from '../utils/response';
import { z } from 'zod';
import { validateRequest } from '../utils/validation';

type Variables = {
    userId: string;
    userEmail: string;
    token: string;
};

const budgetSchema = z.object({
    category: z.string().min(1),
    limitAmount: z.number().min(0),
    currency: z.string().length(3),
});

/**
 * GET /api/budgets
 * Get all budgets for the current user
 */
export async function getBudgets(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    const budgets = await dbService.getBudgets(userId);

    return json(success(budgets));
}

/**
 * POST /api/budgets
 * Set or update a budget for a category
 */
export async function setBudget(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    // Validate request body
    const validation = await validateRequest(c.req.raw, budgetSchema);
    if (!validation.success) {
        return error(validation.error, 400);
    }

    const { category, limitAmount, currency } = validation.data;

    const budget = await dbService.upsertBudget(userId, category, limitAmount, currency);

    return json(success(budget));
}
