
const BASE_URL = 'http://127.0.0.1:8787/api';

async function test() {
    console.log('Starting Ban Enforcement Verification...');

    // Helper to parse JSON
    const parse = async (res) => {
        const text = await res.text();
        try {
            return { ok: res.ok, status: res.status, data: JSON.parse(text) };
        } catch (e) {
            return { ok: res.ok, status: res.status, error: text };
        }
    };

    // 1. Signup/Login
    const email = `ban_test_${Date.now()}@example.com`;
    console.log(`\n1. Creating user: ${email}`);

    let res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
    });

    let { ok, data } = await parse(res);
    let token = data?.data?.token || data?.token;
    let userId = data?.data?.user?.id || data?.user?.id;

    if (!token) {
        // Try login
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password123' })
        });
        const loginRes = await parse(res);
        token = loginRes.data?.data?.token;
        userId = loginRes.data?.data?.user?.id;
    }

    if (!token) {
        console.error('❌ Failed to get token.');
        process.exit(1);
    }
    console.log('✅ Logged in.');

    // 2. Verify Access (Pre-Ban)
    console.log('\n2. Verifying Access (Pre-Ban)...');
    res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 200) {
        console.log('✅ Access granted.');
    } else {
        console.error(`❌ Access denied unexpectedly: ${res.status}`);
        process.exit(1);
    }

    // 3. Save Context
    const fs = await import('fs');
    fs.writeFileSync('temp_context.json', JSON.stringify({ token, userId }));
    console.log(`\n3. Context saved to temp_context.json`);
    console.log(`USER_ID_TO_BAN:${userId}`);

    // 4. Verify Access (Post-Ban) - this part will be run in a second pass or I'll just keep the process alive?
    // Let's make this script simple: It does steps 1 & 2.
    // Then I will manually run the SQL.
    // Then I will run a script "verify_access.js" with the token.

    return token;
}

test().catch(err => console.error(err));
