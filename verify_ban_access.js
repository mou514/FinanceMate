
const BASE_URL = 'http://127.0.0.1:8787/api';

async function test() {
    console.log('Starting Access Verification...');

    const fs = await import('fs');
    const context = JSON.parse(fs.readFileSync('temp_context.json', 'utf8'));
    const { token } = context;

    console.log('\nVerifying Access with Token...');
    const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 200) {
        console.log('✅ Access granted (User is NOT banned or check is missing).');
        // If we expect the user to be banned, this is a failure of the security check (which confirms the bug).
    } else if (res.status === 403 || res.status === 401) {
        console.log(`❌ Access denied: ${res.status} (User is banned).`);
    } else {
        console.log(`⚠️  Unexpected status: ${res.status}`);
        const text = await res.text();
        console.log(text);
    }
}

test().catch(err => console.error(err));
