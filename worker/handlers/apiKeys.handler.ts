import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { generateApiKey } from '../utils/keys';
import { success, error, json } from '../utils/response';

type Variables = {
    userId: string;
    userEmail: string;
    token: string;
};

/**
 * GET /api/settings/currency
 * Get user's default currency
 */
export async function getCurrency(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    const apiKey = await dbService.getApiKey(userId);

    return json(
        success({
            defaultCurrency: apiKey?.default_currency || 'EGP',
        })
    );
}

/**
 * PUT /api/settings/currency
 * Update user's default currency
 */
export async function updateCurrency(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    try {
        const body = await c.req.json();
        const { defaultCurrency } = body;

        if (!defaultCurrency || typeof defaultCurrency !== 'string') {
            return error('Invalid currency', 400);
        }

        // Update only the currency field (won't affect ai_provider)
        await dbService.updateCurrency(userId, defaultCurrency);

        return json(success({ message: 'Currency updated successfully', defaultCurrency }));
    } catch (err) {
        return error('Invalid request body', 400);
    }
}

/**
 * GET /api/settings/ai-provider
 * Get user's preferred AI provider
 */
export async function getAIProvider(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    const settings = await dbService.getApiKey(userId);

    return json(
        success({
            aiProvider: settings?.ai_provider || 'gemini',
        })
    );
}

/**
 * PUT /api/settings/ai-provider
 * Update user's preferred AI provider
 */
export async function updateAIProvider(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);

    try {
        const body = await c.req.json();
        const { aiProvider } = body;

        // Validate provider
        if (!aiProvider || !['gemini', 'openai', 'nvidia', 'groq'].includes(aiProvider)) {
            return error('Invalid AI provider. Must be one of: gemini, openai, nvidia, groq', 400);
        }

        // Update provider
        await dbService.updateAIProvider(userId, aiProvider);

        return json(success({ message: 'AI provider updated successfully', aiProvider }));
    } catch (err) {
        console.error('[API Handler] updateAIProvider error:', err);
        return error('Invalid request body', 400);
    }
}

/**
 * POST /api/keys
 * Generate a new API key
 */
export const generateKey = async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const db = new DBService(c.env.DB);
    const userId = c.get('userId');
    const { name } = await c.req.json<{ name: string }>();

    if (!name) {
        return c.json({ success: false, error: 'Key name is required' }, 400);
    }

    const { key, hash, prefix } = await generateApiKey();
    const id = await db.createApiKey(userId, name, hash, prefix);

    return c.json({
        success: true,
        data: {
            id,
            name,
            prefix,
            key // Returned only once!
        }
    });
};

/**
 * GET /api/keys
 * List all API keys
 */
export const listKeys = async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const db = new DBService(c.env.DB);
    const userId = c.get('userId');
    const keys = await db.listApiKeys(userId);

    return c.json({
        success: true,
        data: keys
    });
};

/**
 * DELETE /api/keys/:id
 * Revoke an API key
 */
export const revokeKey = async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const db = new DBService(c.env.DB);
    const userId = c.get('userId');
    const keyId = c.req.param('id');

    await db.revokeApiKey(keyId, userId);

    return c.json({ success: true });
};
