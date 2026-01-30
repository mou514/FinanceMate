import { Context, Next } from 'hono';
import { Env, JWTPayload } from '../types';
import { AuthService } from '../services/auth.service';
import { DBService } from '../services/db.service';

type Variables = {
    userId: string;
    userEmail: string;
    token: string;
    userRole?: string;
};

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header or cookie
 */
export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
    const env = c.env;
    const authService = new AuthService(env.JWT_SECRET);
    const dbService = new DBService(env.DB);

    // Get token from Authorization header or cookie
    let token: string | null = null;

    // Check for explicit API Key header
    const apiKeyHeader = c.req.header('X-API-Key');
    if (apiKeyHeader) {
        token = apiKeyHeader;
    }

    // Try Authorization header
    if (!token) {
        const authHeader = c.req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    // Fall back to cookie
    if (!token) {
        const cookieHeader = c.req.header('Cookie');
        if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);
            token = cookies['auth_token'];
        }
    }

    if (!token) {
        return c.json({ success: false, error: 'Unauthorized - No token provided' }, 401);
    }

    // Check if it's an API Key (starts with focal_)
    if (token.startsWith('focal_')) {
        const { hashApiKey } = await import('../utils/keys');
        const hash = await hashApiKey(token);
        const apiKey = await dbService.getApiKeyByHash(hash);

        if (!apiKey) {
            return c.json({ success: false, error: 'Unauthorized - Invalid API Key' }, 401);
        }

        // Attach user info
        const user = await dbService.getUserById(apiKey.user_id);
        if (!user) {
            return c.json({ success: false, error: 'Unauthorized - User not found' }, 401);
        }

        c.set('userId', user.id);
        c.set('userEmail', user.email);
        c.set('token', token);
        if (user.role) {
            c.set('userRole', user.role);
        }

        // Update last used asynchronously
        c.executionCtx.waitUntil(dbService.touchApiKey(apiKey.id));

        await next();
        return;
    }

    // Verify JWT token
    const payload = authService.verifyToken(token);
    if (!payload) {
        return c.json({ success: false, error: 'Unauthorized - Invalid token' }, 401);
    }

    // Check if session exists and is not expired
    const session = await dbService.getSessionByToken(token);
    if (!session) {
        return c.json({ success: false, error: 'Unauthorized - Session not found' }, 401);
    }

    if (session.expires_at < Date.now()) {
        await dbService.deleteSession(token);
        return c.json({ success: false, error: 'Unauthorized - Session expired' }, 401);
    }

    // Check if email is verified (optional - can be enforced per route)
    const user = await dbService.getUserById(payload.userId);
    if (!user) {
        return c.json({ success: false, error: 'Unauthorized - User not found' }, 401);
    }

    // Check if user is banned
    if (user.is_active === 0) {
        // Invalidate session to prevent further checks
        await dbService.deleteSession(token);
        const reason = user.ban_reason ? `: ${user.ban_reason}` : '';
        return c.json({ success: false, error: `Unauthorized - Account has been suspended${reason}` }, 403);
    }

    // Check email verification status
    if (env.BREVO_API_KEY && user.email_verified !== 1) {
        // Only enforce verification if Brevo is configured
        const path = new URL(c.req.url).pathname;

        // Allow access to certain routes even without verification
        const allowedPaths = [
            '/api/auth/me',
            '/api/auth/logout',
            '/api/auth/resend-verification',
            '/api/auth/verify'
        ];

        const isAllowed = allowedPaths.some(p => path.startsWith(p));

        if (!isAllowed) {
            return c.json({
                success: false,
                error: 'Email verification required',
                code: 'EMAIL_NOT_VERIFIED'
            }, 403);
        }
    }

    // Attach user info to context
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    c.set('token', token);

    // Attach role if available
    if (user && user.role) {
        c.set('userRole', user.role);
    }

    // Update last active timestamp asynchronously
    c.executionCtx.waitUntil(dbService.updateUserLastActive(payload.userId));

    await next();
}

/**
 * Optional authentication middleware
 * Allows requests without auth but attaches user info if present
 */
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
    try {
        await authMiddleware(c, next);
    } catch {
        await next();
    }
}
