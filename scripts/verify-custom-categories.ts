
import { randomUUID } from 'crypto';

const BASE_PORTS = [8787, 8788, 3000]; // Try Worker ports then potentially proxy
const EMAIL = `test_${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

async function getBaseUrl() {
    for (const port of BASE_PORTS) {
        try {
            const url = `http://127.0.0.1:${port}`;
            // Try to hit a known endpoint to check connectivity
            const res = await fetch(`${url}/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify({})
            }).catch(e => e);

            if (res && !(res instanceof Error) && (res.status !== undefined)) {
                console.log(`✅ Detected active API at port ${port}`);
                return `${url}/api`;
            }
        } catch (e) {
            // Ignore
        }
    }
    console.error('❌ Could not find active API server on ports', BASE_PORTS);
    process.exit(1);
}

async function main() {
    console.log('🚀 Starting Custom Categories Verification');

    const API_BASE = await getBaseUrl();
    console.log(`Targeting API: ${API_BASE}`);

    // 1. Register/Login to get Token
    console.log(`\n1. Registering user: ${EMAIL}`);
    const authRes = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    const authData = await authRes.json();
    if (!authRes.ok) {
        console.error('❌ Registration failed:', authData);
        process.exit(1);
    }

    const token = authData.token || authData.data?.token;

    if (!token) {
        console.error('❌ No token found in response:', authData);
        process.exit(1);
    }

    console.log('✅ User registered, token received.');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Add Custom Category
    const categoryName = `Test_Cat_${randomUUID().substring(0, 8)}`;
    console.log(`\n2. Creating category: ${categoryName}`);

    const createRes = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: categoryName })
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
        console.error('❌ Failed to create category:', createData);
        process.exit(1);
    }
    console.log('✅ Category created:', createData);
    const categoryId = createData.data.id;

    // 3. Fetch Categories
    console.log('\n3. Fetching all categories to verify...');
    const fetchRes = await fetch(`${API_BASE}/categories`, { headers });
    const fetchData = await fetchRes.json();

    if (!fetchRes.ok) {
        console.error('❌ Failed to fetch categories:', fetchData);
        process.exit(1);
    }

    const responseData = fetchData.data;
    const allCategories = [...responseData.defaults, ...responseData.custom.map((c: any) => c.name)];
    console.log(`Received ${allCategories.length} categories (${responseData.defaults.length} defaults + ${responseData.custom.length} custom).`);

    if (allCategories.includes(categoryName)) {
        console.log('✅ Custom category found in list!');
    } else {
        console.error(`❌ Custom category '${categoryName}' NOT found in list:`, allCategories);
        process.exit(1);
    }

    // 4. Delete Category
    console.log(`\n4. Deleting category ID: ${categoryId}`);
    const deleteRes = await fetch(`${API_BASE}/categories/${categoryId}`, {
        method: 'DELETE',
        headers
    });

    if (!deleteRes.ok) {
        console.error('❌ Failed to delete category:', await deleteRes.json());
        process.exit(1);
    }
    console.log('✅ Category deleted.');

    // 5. Verify Deletion
    const refetchRes = await fetch(`${API_BASE}/categories`, { headers });
    const refetchData = await refetchRes.json();
    const refetchResponseData = refetchData.data;
    const newCategories = [...refetchResponseData.defaults, ...refetchResponseData.custom.map((c: any) => c.name)];

    if (!newCategories.includes(categoryName)) {
        console.log('✅ Custom category successfully removed from list.');
    } else {
        console.error('❌ Category still exists after deletion!');
        process.exit(1);
    }

    console.log('\n🎉 Verification SUCCESS!');
}

main().catch(console.error);
