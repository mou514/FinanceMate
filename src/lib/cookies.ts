/**
 * Cookie Management Utility
 * Provides secure cookie operations with TypeScript support
 */

export interface CookieOptions {
    maxAge?: number; // in seconds
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface CookieConsent {
    essential: boolean;
    functional: boolean;
    analytics: boolean;
    timestamp: number;
}

/**
 * Set a cookie with secure defaults
 */
export function setCookie(
    name: string,
    value: string,
    options: CookieOptions = {}
): void {
    const {
        maxAge = 31536000, // 1 year default
        path = '/',
        secure = window.location.protocol === 'https:',
        sameSite = 'Strict',
    } = options;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (maxAge) {
        cookieString += `; max-age=${maxAge}`;
    }

    if (path) {
        cookieString += `; path=${path}`;
    }

    if (secure) {
        cookieString += '; Secure';
    }

    if (sameSite) {
        cookieString += `; SameSite=${sameSite}`;
    }

    document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }

    return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, path: string = '/'): void {
    document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=${path}`;
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    const cookieArray = document.cookie.split(';');

    for (const cookie of cookieArray) {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[decodeURIComponent(name)] = decodeURIComponent(value);
        }
    }

    return cookies;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
    return getCookie(name) !== null;
}

// Cookie Consent Management

const CONSENT_COOKIE_NAME = 'cookie_consent';

/**
 * Get current cookie consent preferences
 */
export function getCookieConsent(): CookieConsent | null {
    const consentStr = getCookie(CONSENT_COOKIE_NAME);
    if (!consentStr) return null;

    try {
        return JSON.parse(consentStr);
    } catch {
        return null;
    }
}

/**
 * Set cookie consent preferences
 */
export function setCookieConsent(consent: Omit<CookieConsent, 'timestamp'>): void {
    const consentWithTimestamp: CookieConsent = {
        ...consent,
        timestamp: Date.now(),
    };

    setCookie(CONSENT_COOKIE_NAME, JSON.stringify(consentWithTimestamp), {
        maxAge: 31536000, // 1 year
        path: '/',
    });
}

/**
 * Check if user has given consent for a specific cookie category
 */
export function hasConsentFor(category: keyof Omit<CookieConsent, 'timestamp'>): boolean {
    const consent = getCookieConsent();
    if (!consent) return false;
    return consent[category];
}

/**
 * Clear all non-essential cookies
 */
export function clearNonEssentialCookies(): void {
    const consent = getCookieConsent();
    if (!consent) return;

    const allCookies = getAllCookies();
    const essentialCookies = ['auth_token', 'csrf_token', CONSENT_COOKIE_NAME];

    for (const cookieName of Object.keys(allCookies)) {
        if (!essentialCookies.includes(cookieName)) {
            deleteCookie(cookieName);
        }
    }
}

// User Preferences

/**
 * Save user preference
 */
export function savePreference(key: string, value: string): void {
    if (hasConsentFor('functional')) {
        setCookie(`pref_${key}`, value, { maxAge: 31536000 });
    }
}

/**
 * Get user preference
 */
export function getPreference(key: string): string | null {
    return getCookie(`pref_${key}`);
}

/**
 * Delete user preference
 */
export function deletePreference(key: string): void {
    deleteCookie(`pref_${key}`);
}
