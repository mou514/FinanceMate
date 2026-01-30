import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { success, error, json } from '../utils/response';

type Variables = {
    userId: string;
};

export async function getNotifications(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const limit = Number(c.req.query('limit')) || 20;
    const offset = Number(c.req.query('offset')) || 0;
    const dbService = new DBService(env.DB);
    const notifications = await dbService.getNotifications(userId, limit, offset);
    return json(success(notifications));
}

export async function markRead(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const id = c.req.param('id');
    const dbService = new DBService(env.DB);
    await dbService.markNotificationRead(id, userId);
    return json(success({ message: 'Notification marked as read' }));
}

export async function markAllRead(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);
    await dbService.markAllNotificationsRead(userId);
    return json(success({ message: 'All notifications marked as read' }));
}

export async function getUnreadCount(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const env = c.env;
    const userId = c.get('userId');
    const dbService = new DBService(env.DB);
    const count = await dbService.getUnreadNotificationCount(userId);
    return json(success({ count }));
}
