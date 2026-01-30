
const BASE_URL = 'http://localhost:8787/api';

async function test() {
    console.log('Starting API Key Verification...');

    // Helper to parse JSON safely
    const parse = async (res) => {
        const text = await res.text();
        try {
            return { ok: res.ok, status: res.status, data: JSON.parse(text) };
        } catch (e) {
            return { ok: res.ok, status: res.status, error: text };
        }
    };

    // 1. Signup/Login
    const email = `integration_test_${Date.now()}@example.com`;
    console.log(`\n1. Creating user: ${email}`);

    let res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
    });

    let { ok, data } = await parse(res);
    // Correctly access token from nested data structure
    let token = data?.data?.token || data?.token;

    if (!token && !ok) {
        console.log(`Signup failed (${res.status}), trying login...`);
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password123' })
        });
        const loginRes = await parse(res);
        token = loginRes.data?.data?.token || loginRes.data?.token;
    }

    if (!token) {
        console.error('❌ Failed to get token. response:', JSON.stringify(data, null, 2));
        process.exit(1);
    }
    console.log('✅ Got JWT Token.');

    // 2. Generate API Key
    console.log('\n2. Generating API Key...');
    res = await fetch(`${BASE_URL}/keys`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'Integration Key' })
    });

    const keyRes = await parse(res);
    if (!keyRes.ok) {
        console.error('❌ Failed to generate key:', JSON.stringify(keyRes.data, null, 2));
        process.exit(1);
    }

    const apiKey = keyRes.data.data.key;
    const keyId = keyRes.data.data.id;
    console.log(`✅ Generated Key: ${apiKey.substring(0, 15)}... (ID: ${keyId})`);

    // 3. Test API Key Access (Header)
    console.log('\n3. Testing Access with X-API-Key Header...');
    res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'X-API-Key': apiKey }
    });

    if (res.status === 200) {
        console.log('✅ Access granted via Header');
    } else {
        console.error(`❌ Access denied via Header: ${res.status}`);
        process.exit(1);
    }

    // 4. Test API Key Access (Bearer)
    console.log('\n4. Testing Access with Bearer Token...');
    res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (res.status === 200) {
        console.log('✅ Access granted via Bearer');
    } else {
        console.error(`❌ Access denied via Bearer: ${res.status}`);
        process.exit(1);
    }

    // 5. Revoke Key
    console.log('\n5. Revoking Key...');
    res = await fetch(`${BASE_URL}/keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 200) {
        console.log('✅ Key revoked.');
    } else {
        console.error('❌ Failed to revoke key');
        process.exit(1);
    }

    // 6. Test Access After Revocation
    console.log('\n6. Testing Access after Revocation...');
    res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'X-API-Key': apiKey }
    });

    if (res.status === 401) {
        console.log('✅ Access denied (Expected)');
    } else {
        console.error(`❌ Access STILL granted (Unexpected): ${res.status}`);
        process.exit(1);
    }

    console.log('\n🎉 INTEGRATION VERIFICATION SUCCESSFUL!');
}

test().catch(err => console.error(err));
