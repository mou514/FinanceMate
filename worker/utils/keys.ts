import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = webcrypto;
}

export async function generateApiKey() {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const key = 'focal_' + Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return {
        key, // The raw key (show this once)
        hash: await hashApiKey(key), // The hash to store
        prefix: key.substring(0, 10) // focal_ + first 4 chars
    };
}

export async function hashApiKey(key: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
