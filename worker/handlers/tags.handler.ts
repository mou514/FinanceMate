import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { success, error, json } from '../utils/response';
import { z } from 'zod';

type Variables = {
    userId: string;
};

const tagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().optional(),
});

export async function getTags(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);
    const tags = await dbService.getTags(userId);
    return json(success(tags));
}

export async function createTag(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);
    const body = await c.req.json();

    const validation = tagSchema.safeParse(body);
    if (!validation.success) {
        return error(validation.error.issues[0].message, 400);
    }

    try {
        const tag = await dbService.createTag(userId, validation.data.name, validation.data.color);
        return json(success(tag), 201);
    } catch (e: any) {
        if (e.message.includes('UNIQUE')) {
            return error('Tag with this name already exists', 409);
        }
        return error('Failed to create tag');
    }
}

export async function deleteTag(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const tagId = c.req.param('id');
    const dbService = new DBService(env.DB);

    await dbService.deleteTag(tagId, userId);
    return json(success({ message: 'Tag deleted' }));
}

// Logic for attaching tags to expense could be here or in updateExpense
