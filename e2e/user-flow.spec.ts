import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
    test('should allow user to login and see dashboard', async ({ page }) => {
        // Mock login API
        await page.route('**/api/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ token: 'fake-jwt-token', user: { id: 1, email: 'test@example.com' } }),
            });
        });

        // Mock expenses API (empty list initially)
        await page.route('**/api/expenses', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });

        // Mock User API if needed (often checked on load)
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ id: 1, email: 'test@example.com' }),
            });
        });

        await page.goto('/login');

        // Fill login form
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign in' }).click();

        // Verify redirect to dashboard
        await expect(page).toHaveURL('/');
        await expect(page.getByText('Current Balance')).toBeVisible();
    });

    test('should allow adding an expense', async ({ page }) => {
        // Mock APIs
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ id: 1, email: 'test@example.com' }),
            });
        });

        await page.route('**/api/expenses', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([]),
                });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 101, amount: 50, description: 'Lunch', date: new Date().toISOString() }),
                });
            }
        });

        // Bypass login by setting token (if app checks localstorage on load)
        // Or just re-login. Re-login is safer with mocks.
        await page.route('**/api/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ token: 'fake-jwt-token', user: { id: 1, email: 'test@example.com' } }),
            });
        });

        await page.goto('/login');
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL('/');

        // Add Expense interaction
        // Assuming there is a button to add expense.
        // I need to know the UI. Usually a "+" button or "Add Expense".
        // I will check the dashboard code or guess.
        // Based on README images, there's likely an "Add Expense" button.

        // For now, I'll pause there or look for the button.
        // Let's assume there is an "Add Expense" button text or label.
        // I'll wait for selector or just generic text.

        // Looking at AddExpenseMenu.tsx might help knowing the trigger.
        // But I'll write the test up to login for now and verify, then refine.
        // Actually, I should write the full test if possible.
        // I'll check AddExpenseMenu.tsx content quickly in next step if needed, but I'll write a basic check first.

        const addBtn = page.getByRole('button', { name: /add expense/i });
        await expect(addBtn).toBeVisible();
        await addBtn.click();

        // Choose Manual Entry
        await page.getByRole('button', { name: /manual entry/i }).click();

        // Fill form
        await page.locator('#merchant').fill('Coffee Shop');
        await page.locator('#total').fill('5.50');
        // Date defaults to today usually, but let's leave it or fill it if key

        // Select Category (shadcn select)
        await page.getByRole('combobox').click();
        await page.getByRole('option', { name: 'Food & Drink' }).click();

        // Mock Save API
        await page.route('**/api/expenses', async route => {
            // Handle both GET (refresh) and POST (save)
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{ id: 101, amount: 5.5, total: 5.5, merchant: 'Coffee Shop', category: 'Food & Drink', date: new Date().toISOString(), currency: 'USD' }]),
                });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, data: { id: 101 } }),
                });
            }
        });

        // Click Save
        await page.getByRole('button', { name: /save expense/i }).click();

        // Verify expense appears (via GET mock)
        await expect(page.getByText('Coffee Shop')).toBeVisible();
        await expect(page.getByText('$5.50')).toBeVisible();
    });
});
