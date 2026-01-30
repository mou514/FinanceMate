import { Context, Next } from 'hono';

/**
 * Middleware to integrity and security headers
 */
export async function secureHeaders(c: Context, next: Next) {
    await next();

    // HSTS - Force HTTPS
    // Max-age: 1 year (31536000), includeSubDomains, preload
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Prevent MIME-type sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    c.header('X-Frame-Options', 'DENY');

    // Cross-Site Scripting (XSS) Filter (Old browsers, but good practice)
    c.header('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy (Basic)
    // Adjust this based on your needs (e.g. valid image sources, scripts)
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cloudflareinsights.com", // Allow 'unsafe-inline' for React (if needed) & 'unsafe-eval' for some libs
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https: ws:",
        "font-src 'self' data: https:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
    ].join('; ');

    c.header('Content-Security-Policy', csp);
}
