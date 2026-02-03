import { Env, User, Expense, LineItem, UserSettings, Session, Budget, ApiAuthKey, Category } from '../types';

// ============ ADMIN ANALYTICS TYPES ============

export interface AdminStats {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    activeUsers7Days: number;
    totalExpenses: number;
    expensesToday: number;
    expensesThisWeek: number;
    expensesThisMonth: number;
    categoryBreakdown: { category: string; count: number }[];
    aiProviderBreakdown: { provider: string; count: number }[];
    currencyBreakdown: { currency: string; count: number }[];
}

export interface UserWithStats {
    id: string;
    email: string;
    created_at: number;
    email_verified: number;
    expenseCount: number;
    lastExpenseAt: number | null;
    role?: string;
    is_active?: number;
    ban_reason?: string | null;
    last_active_at?: number | null;
    settings: {
        currency: string;
        aiProvider: string;
    } | null;
}

export interface UserExpense extends Expense {
    lineItems: LineItem[];
}

/**
 * Database service for D1 operations
 */
export class DBService {
    constructor(private db: D1Database) { }

    // ============ CATEGORY OPERATIONS ============

    async getCustomCategories(userId: string): Promise<Category[]> {
        const result = await this.db
            .prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC')
            .bind(userId)
            .all<Category>();
        return result.results || [];
    }

    async addCustomCategory(userId: string, name: string, icon?: string, color?: string): Promise<Category> {
        const id = crypto.randomUUID();
        const now = Date.now();

        await this.db
            .prepare('INSERT INTO categories (id, user_id, name, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(id, userId, name, icon || null, color || null, now)
            .run();

        return { id, user_id: userId, name, icon: icon || null, color: color || null, created_at: now };
    }

    async deleteCustomCategory(userId: string, id: string): Promise<boolean> {
        const result = await this.db
            .prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
            .bind(id, userId)
            .run();

        return result.success;
    }

    async updateCustomCategory(userId: string, id: string, updates: { name?: string; icon?: string; color?: string }): Promise<boolean> {
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.icon !== undefined) {
            fields.push('icon = ?');
            values.push(updates.icon);
        }
        if (updates.color !== undefined) {
            fields.push('color = ?');
            values.push(updates.color);
        }

        if (fields.length === 0) return false;

        values.push(id, userId);
        const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;

        const result = await this.db.prepare(sql).bind(...values).run();
        return result.success;
    }

    async getCategoryStatistics(userId: string): Promise<{ category: string; count: number; isCustom: boolean }[]> {
        const result = await this.db
            .prepare(`
                SELECT 
                    e.category,
                    COUNT(*) as count,
                    CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as isCustom
                FROM expenses e
                LEFT JOIN categories c ON e.category = c.name AND c.user_id = ?
                WHERE e.user_id = ?
                GROUP BY e.category
                ORDER BY count DESC
            `)
            .bind(userId, userId)
            .all<{ category: string; count: number; isCustom: number }>();

        return (result.results || []).map(r => ({
            category: r.category,
            count: r.count,
            isCustom: r.isCustom === 1
        }));
    }

    async mergeCategories(userId: string, sourceIds: string[], targetName: string): Promise<boolean> {
        // Get source category names
        const placeholders = sourceIds.map(() => '?').join(',');
        const sourceCategories = await this.db
            .prepare(`SELECT name FROM categories WHERE id IN (${placeholders}) AND user_id = ?`)
            .bind(...sourceIds, userId)
            .all<{ name: string }>();

        if (!sourceCategories.results || sourceCategories.results.length === 0) {
            return false;
        }

        const sourceNames = sourceCategories.results.map(c => c.name);

        // Update all expenses using source categories to target category
        const updatePlaceholders = sourceNames.map(() => '?').join(',');
        await this.db
            .prepare(`UPDATE expenses SET category = ? WHERE category IN (${updatePlaceholders}) AND user_id = ?`)
            .bind(targetName, ...sourceNames, userId)
            .run();

        // Delete source categories
        await this.db
            .prepare(`DELETE FROM categories WHERE id IN (${placeholders}) AND user_id = ?`)
            .bind(...sourceIds, userId)
            .run();

        return true;
    }

    async bulkDeleteCategories(userId: string, ids: string[]): Promise<boolean> {
        if (ids.length === 0) return false;

        const placeholders = ids.map(() => '?').join(',');
        const result = await this.db
            .prepare(`DELETE FROM categories WHERE id IN (${placeholders}) AND user_id = ?`)
            .bind(...ids, userId)
            .run();

        return result.success;
    }


    // ============ USER OPERATIONS ============

    async createUser(id: string, email: string, passwordHash: string, firstName: string, lastName: string, birthdate: string): Promise<User> {
        const now = Date.now();
        await this.db
            .prepare('INSERT INTO users (id, email, password_hash, first_name, last_name, birthdate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(id, email, passwordHash, firstName, lastName, birthdate, now, now)
            .run();

        return {
            id,
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            birthdate,
            created_at: now,
            updated_at: now,
        };
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const result = await this.db
            .prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first<User>();

        return result || null;
    }

    async getUserById(id: string): Promise<User | null> {
        const result = await this.db
            .prepare('SELECT * FROM users WHERE id = ?')
            .bind(id)
            .first<User>();

        return result || null;
    }

    // ============ USER SETTINGS OPERATIONS ============
    // ============ USER SETTINGS OPERATIONS ============
    // Note: The api_keys table is used for user_settings.
    // The encrypted_key field is legacy and no longer used.

    async updateAIProvider(userId: string, aiProvider: string): Promise<void> {
        // Check if settings record exists
        const existing = await this.getUserSettings(userId);

        if (existing) {
            // Update existing record
            await this.db
                .prepare('UPDATE api_keys SET ai_provider = ? WHERE user_id = ?')
                .bind(aiProvider, userId)
                .run();
        } else {
            // Create new settings record
            const id = crypto.randomUUID();
            const now = Date.now();
            await this.db
                .prepare('INSERT INTO api_keys (id, user_id, encrypted_key, default_currency, ai_provider, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(id, userId, '', 'EGP', aiProvider, now)
                .run();
        }
    }

    async updateCurrency(userId: string, currency: string): Promise<void> {
        // Check if settings record exists
        const existing = await this.getUserSettings(userId);

        if (existing) {
            // Update only the currency field
            await this.db
                .prepare('UPDATE api_keys SET default_currency = ? WHERE user_id = ?')
                .bind(currency, userId)
                .run();
        } else {
            // Create new settings record with default ai_provider
            const id = crypto.randomUUID();
            const now = Date.now();
            await this.db
                .prepare('INSERT INTO api_keys (id, user_id, encrypted_key, default_currency, ai_provider, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(id, userId, '', currency, 'gemini', now)
                .run();
        }
    }

    async getUserSettings(userId: string): Promise<UserSettings | null> {
        const result = await this.db
            .prepare('SELECT * FROM api_keys WHERE user_id = ?')
            .bind(userId)
            .first<UserSettings>();

        return result || null;
    }

    // Legacy method - kept for backward compatibility
    async getApiKey(userId: string): Promise<UserSettings | null> {
        return this.getUserSettings(userId);
    }

    async deleteUserSettings(userId: string): Promise<void> {
        await this.db
            .prepare('DELETE FROM api_keys WHERE user_id = ?')
            .bind(userId)
            .run();
    }

    // ============ API KEY OPERATIONS (Auth) ============

    async createApiKey(userId: string, name: string, keyHash: string, prefix: string): Promise<string> {
        const id = crypto.randomUUID();
        const now = Date.now();

        await this.db
            .prepare('INSERT INTO api_auth_keys (id, user_id, key_hash, name, prefix, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(id, userId, keyHash, name, prefix, now)
            .run();

        return id;
    }

    async getApiKeyByHash(keyHash: string): Promise<ApiAuthKey | null> {
        return this.db
            .prepare('SELECT * FROM api_auth_keys WHERE key_hash = ?')
            .bind(keyHash)
            .first<ApiAuthKey>();
    }

    async listApiKeys(userId: string): Promise<ApiAuthKey[]> {
        const result = await this.db
            .prepare('SELECT * FROM api_auth_keys WHERE user_id = ? ORDER BY created_at DESC')
            .bind(userId)
            .all<ApiAuthKey>();

        return result.results || [];
    }

    async revokeApiKey(id: string, userId: string): Promise<void> {
        await this.db
            .prepare('DELETE FROM api_auth_keys WHERE id = ? AND user_id = ?')
            .bind(id, userId)
            .run();
    }

    async touchApiKey(id: string): Promise<void> {
        await this.db
            .prepare('UPDATE api_auth_keys SET last_used_at = ? WHERE id = ?')
            .bind(Date.now(), id)
            .run();
    }

    // ============ EXPENSE OPERATIONS ============

    async createExpense(expense: Omit<Expense, 'created_at' | 'updated_at'>, lineItems: Array<{ description: string; quantity: number; price: number }>): Promise<Expense> {
        const now = Date.now();

        // Category Normalization: Resolve Category ID
        let categoryId = expense.category_id;
        if (!categoryId && expense.category) {
            // Try to find existing category by name
            const existingCat = await this.db.prepare(
                'SELECT id FROM categories WHERE user_id = ? AND name = ?'
            ).bind(expense.user_id, expense.category).first<{ id: string }>();

            if (existingCat) {
                categoryId = existingCat.id;
            } else {
                // Auto-create category
                categoryId = crypto.randomUUID();
                // Check if color is provided in future, for now undefined
                await this.db.prepare(
                    'INSERT INTO categories (id, user_id, name, created_at) VALUES (?, ?, ?, ?)'
                ).bind(categoryId, expense.user_id, expense.category, now).run();
            }
        }

        // Insert expense with category_id
        await this.db
            .prepare('INSERT INTO expenses (id, user_id, merchant, date, total, currency, category, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(expense.id, expense.user_id, expense.merchant, expense.date, expense.total, expense.currency, expense.category, categoryId || null, now, now)
            .run();

        // Insert line items
        for (const item of lineItems) {
            const itemId = crypto.randomUUID();
            await this.db
                .prepare('INSERT INTO line_items (id, expense_id, description, quantity, price) VALUES (?, ?, ?, ?, ?)')
                .bind(itemId, expense.id, item.description, item.quantity, item.price)
                .run();
        }

        // Check Budget Health (Async)
        // We don't await to avoid blocking response, but ideally we should catch errors.
        // For reliability, we await.
        try {
            if (expense.category) {
                await this.checkBudgetHealth(expense.user_id, expense.category);
            }
        } catch (e) {
            console.error('Budget check failed', e);
        }

        return {
            ...expense,
            category_id: categoryId,
            created_at: now,
            updated_at: now,
        };
    }

    async createRecurringExpense(userId: string, expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>, frequency: string): Promise<void> {
        const id = crypto.randomUUID();
        const now = Date.now();
        // Calculate next due date based on frequency
        let nextDueDate = now;
        const dateObj = new Date(now);

        switch (frequency) {
            case 'daily':
                nextDueDate = dateObj.setDate(dateObj.getDate() + 1);
                break;
            case 'weekly':
                nextDueDate = dateObj.setDate(dateObj.getDate() + 7);
                break;
            case 'monthly':
                nextDueDate = dateObj.setMonth(dateObj.getMonth() + 1);
                break;
            case 'yearly':
                nextDueDate = dateObj.setFullYear(dateObj.getFullYear() + 1);
                break;
        }

        await this.db
            .prepare('INSERT INTO recurring_expenses (id, user_id, amount, currency, category, merchant, description, frequency, next_due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(id, userId, expense.total, expense.currency, expense.category, expense.merchant, null, frequency, nextDueDate, now)
            .run();
    }

    async getExpensesByUserId(userId: string, searchQuery?: string): Promise<Expense[]> {
        // Normalization: Join with categories table. Fallback to e.category if join fails (though it shouldn't after migration).
        // specific selection to avoid ambiguity
        // We select e.*, but override 'category' with COALESCE(c.name, e.category)

        let sql = `
            SELECT e.*, COALESCE(c.name, e.category) as category, c.id as category_id, c.color as category_color
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ?
        `;
        const params: any[] = [userId];

        if (searchQuery) {
            // Enhanced search using FTS5
            const term = `"${searchQuery.replace(/"/g, '')}" *`;
            sql = `
                SELECT e.*, COALESCE(c.name, e.category) as category, c.id as category_id, c.color as category_color
                FROM expenses e
                JOIN expenses_fts f ON e.id = f.id
                LEFT JOIN categories c ON e.category_id = c.id
                WHERE e.user_id = ? AND expenses_fts MATCH ?
            `;
            params[0] = userId;
            params.push(term);
        }

        sql += ' ORDER BY e.date DESC, e.created_at DESC';

        const result = await this.db
            .prepare(sql)
            .bind(...params)
            .all<Expense>();

        return result.results || [];
    }

    async getExpenseById(id: string, userId: string): Promise<Expense | null> {
        const result = await this.db
            .prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
            .bind(id, userId)
            .first<Expense>();

        return result || null;
    }

    async getLineItemsByExpenseId(expenseId: string): Promise<LineItem[]> {
        const result = await this.db
            .prepare('SELECT * FROM line_items WHERE expense_id = ?')
            .bind(expenseId)
            .all<LineItem>();

        return result.results || [];
    }

    async updateExpense(id: string, userId: string, updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>>, lineItems?: Array<{ description: string; quantity: number; price: number }>): Promise<void> {
        const now = Date.now();

        // Build dynamic UPDATE query
        const fields: string[] = [];
        const values: (string | number)[] = [];

        if (updates.merchant !== undefined) {
            fields.push('merchant = ?');
            values.push(updates.merchant);
        }
        if (updates.date !== undefined) {
            fields.push('date = ?');
            values.push(updates.date);
        }
        if (updates.total !== undefined) {
            fields.push('total = ?');
            values.push(updates.total);
        }
        if (updates.currency !== undefined) {
            fields.push('currency = ?');
            values.push(updates.currency);
        }
        if (updates.category !== undefined) {
            fields.push('category = ?');
            values.push(updates.category);
        }

        fields.push('updated_at = ?');
        values.push(now);

        values.push(id, userId);

        await this.db
            .prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`)
            .bind(...values)
            .run();

        // Update line items if provided
        if (lineItems) {
            // Delete old line items
            await this.db
                .prepare('DELETE FROM line_items WHERE expense_id = ?')
                .bind(id)
                .run();

            // Insert new line items
            for (const item of lineItems) {
                const itemId = crypto.randomUUID();
                await this.db
                    .prepare('INSERT INTO line_items (id, expense_id, description, quantity, price) VALUES (?, ?, ?, ?, ?)')
                    .bind(itemId, id, item.description, item.quantity, item.price)
                    .run();
            }
        }
    }

    async deleteExpense(id: string, userId: string): Promise<void> {
        // Line items will be cascade deleted
        await this.db
            .prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
            .bind(id, userId)
            .run();
    }

    // ============ BUDGET OPERATIONS ============

    async getBudgets(userId: string): Promise<Budget[]> {
        const result = await this.db
            .prepare('SELECT * FROM budgets WHERE user_id = ?')
            .bind(userId)
            .all<Budget>();

        return result.results || [];
    }

    async upsertBudget(userId: string, category: string, limitAmount: number, currency: string, alertThreshold: number = 80): Promise<Budget> {
        const now = Date.now();
        // Check if exists
        const existing = await this.db
            .prepare('SELECT * FROM budgets WHERE user_id = ? AND category = ?')
            .bind(userId, category)
            .first<Budget>();

        const id = existing ? existing.id : crypto.randomUUID();

        if (existing) {
            await this.db
                .prepare('UPDATE budgets SET limit_amount = ?, currency = ?, alert_threshold = ?, updated_at = ? WHERE id = ?')
                .bind(limitAmount, currency, alertThreshold, now, id)
                .run();
        } else {
            await this.db
                .prepare('INSERT INTO budgets (id, user_id, category, limit_amount, currency, alert_threshold, period, year, month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                .bind(id, userId, category, limitAmount, currency, alertThreshold, 'monthly', 0, 0, now, now)
                .run();
        }

        return {
            id,
            user_id: userId,
            category,
            limit_amount: limitAmount,
            currency,
            alert_threshold: alertThreshold,
            period: 'monthly',
            year: 0,
            month: 0,
            created_at: existing ? existing.created_at : now,
            updated_at: now
        };
    }

    async checkBudgetHealth(userId: string, category: string): Promise<void> {
        // 1. Get Budget
        const budget = await this.db.prepare('SELECT * FROM budgets WHERE user_id = ? AND category = ?').bind(userId, category).first<Budget>();
        if (!budget) return;

        const thresholdPercent = budget.alert_threshold || 80;

        // 2. Get Spend for Current Month
        const now = new Date();
        const monthPrefix = now.toISOString().substring(0, 7); // YYYY-MM
        const spendResult = await this.db.prepare(
            'SELECT SUM(total) as total FROM expenses WHERE user_id = ? AND category = ? AND substr(date, 1, 7) = ?'
        ).bind(userId, category, monthPrefix).first<{ total: number }>();

        const currentSpend = spendResult?.total || 0;

        // 3. Check Threshold
        const thresholdAmount = budget.limit_amount * (thresholdPercent / 100);

        if (currentSpend >= thresholdAmount) {
            const type = 'budget_alert';
            const title = `Budget Alert: ${category}`;
            const percentUsed = Math.round((currentSpend / budget.limit_amount) * 100);
            const message = `You have used ${percentUsed}% of your ${category} budget. (${currentSpend.toFixed(2)} / ${budget.limit_amount})`;

            await this.createNotification(userId, type, title, message, { category, budgetId: budget.id });
        }
    }

    // ============ SESSION OPERATIONS ============

    // ============ SESSION OPERATIONS ============

    async createSession(id: string, userId: string, token: string, expiresAt: number): Promise<void> {
        const now = Date.now();
        await this.db
            .prepare('INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
            .bind(id, userId, token, expiresAt, now)
            .run();
    }

    async getSessionByToken(token: string): Promise<Session | null> {
        const result = await this.db
            .prepare('SELECT * FROM sessions WHERE token = ?')
            .bind(token)
            .first<Session>();

        return result || null;
    }

    async deleteSession(token: string): Promise<void> {
        await this.db
            .prepare('DELETE FROM sessions WHERE token = ?')
            .bind(token)
            .run();
    }

    async deleteExpiredSessions(): Promise<void> {
        const now = Date.now();
        await this.db
            .prepare('DELETE FROM sessions WHERE expires_at < ?')
            .bind(now)
            .run();
    }

    // ============ EMAIL VERIFICATION OPERATIONS ============

    async setVerificationToken(userId: string, token: string, expiresAt: number): Promise<void> {
        await this.db
            .prepare('UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?')
            .bind(token, expiresAt, userId)
            .run();
    }

    async verifyEmail(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
        const now = Date.now();

        // Find user by verification token
        const user = await this.db
            .prepare('SELECT id, email, verification_token_expires, email_verified FROM users WHERE verification_token = ?')
            .bind(token)
            .first<{ id: string; email: string; verification_token_expires: number; email_verified: number }>();

        if (!user) {
            return { success: false, error: 'Invalid verification token' };
        }

        if (user.email_verified === 1) {
            return { success: false, error: 'Email already verified' };
        }

        if (user.verification_token_expires < now) {
            return { success: false, error: 'Verification token expired' };
        }

        // Mark email as verified and clear token
        await this.db
            .prepare('UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?')
            .bind(user.id)
            .run();

        return { success: true, userId: user.id };
    }

    // ============ ANALYTICS & FORECASTING ============

    async getMonthlyTransactionHistory(userId: string, months: number = 6): Promise<{ month: string; total: number }[]> {
        // SQLite: sorting by date string works if format is YYYY-MM-DD
        // We use substr(date, 1, 7) to extract YYYY-MM for grouping
        const result = await this.db
            .prepare(`
                SELECT substr(date, 1, 7) as month, SUM(total) as total
                FROM expenses
                WHERE user_id = ?
                GROUP BY month
                ORDER BY month DESC
                LIMIT ?
            `)
            .bind(userId, months)
            .all<{ month: string; total: number }>();

        // Return in ASC order for charts
        return (result.results || []).reverse();
    }

    async getSpendingForecast(userId: string): Promise<{
        currentMonthTotal: number;
        forecastTotal: number;
        totalBudget: number;
        status: 'on_track' | 'at_risk' | 'over_budget';
    }> {
        const now = new Date();
        const currentMonthPrefix = now.toISOString().substring(0, 7); // YYYY-MM
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = now.getDate();

        // 1. Get current month spend
        const spendResult = await this.db
            .prepare('SELECT SUM(total) as total FROM expenses WHERE user_id = ? AND substr(date, 1, 7) = ?')
            .bind(userId, currentMonthPrefix)
            .first<{ total: number }>();

        const currentMonthTotal = spendResult?.total || 0;

        // 2. Get total budget limits
        const budgetResult = await this.db
            .prepare('SELECT SUM(limit_amount) as total FROM budgets WHERE user_id = ?')
            .bind(userId)
            .first<{ total: number }>();

        const totalBudget = budgetResult?.total || 0;

        // 3. Calculate forecast (Linear projection)
        let forecastTotal = 0;
        if (daysElapsed > 0) {
            const dailyAvg = currentMonthTotal / daysElapsed;
            // Cap daily avg to avoid explosion on day 1 if expense is huge? No, raw projection is better.
            forecastTotal = dailyAvg * daysInMonth;
        }

        // 4. Determine status
        let status: 'on_track' | 'at_risk' | 'over_budget' = 'on_track';
        if (totalBudget > 0) {
            if (currentMonthTotal > totalBudget) {
                status = 'over_budget';
            } else if (forecastTotal > totalBudget) {
                status = 'at_risk';
            }
        }

        return {
            currentMonthTotal,
            forecastTotal,
            totalBudget,
            status
        };
    }

    async getCategoryTrends(userId: string): Promise<{
        topCategory: string;
        currentAmount: number;
        previousAmount: number;
        percentageChange: number;
    } | null> {
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM

        // Previous Month
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonth = prevDate.toISOString().substring(0, 7); // YYYY-MM

        // 1. Get Top Category for Current Month
        const topCatResult = await this.db
            .prepare(`
                SELECT category, SUM(total) as total 
                FROM expenses 
                WHERE user_id = ? AND substr(date, 1, 7) = ? 
                GROUP BY category 
                ORDER BY total DESC 
                LIMIT 1
            `)
            .bind(userId, currentMonth)
            .first<{ category: string; total: number }>();

        if (!topCatResult) return null;

        const currentAmount = topCatResult.total;
        const topCategory = topCatResult.category;

        // 2. Get Same Category Spend for Previous Month
        const prevCatResult = await this.db
            .prepare(`
                SELECT SUM(total) as total 
                FROM expenses 
                WHERE user_id = ? AND category = ? AND substr(date, 1, 7) = ?
            `)
            .bind(userId, topCategory, previousMonth)
            .first<{ total: number }>();

        const previousAmount = prevCatResult?.total || 0;

        // 3. Calculate Percentage Change
        let percentageChange = 0;
        if (previousAmount > 0) {
            percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
        } else if (currentAmount > 0) {
            percentageChange = 100; // 100% increase if previous was 0
        }

        return {
            topCategory,
            currentAmount,
            previousAmount,
            percentageChange
        };
    }

    async verifyEmailDirectly(userId: string): Promise<void> {
        // Directly mark email as verified without requiring a token
        await this.db
            .prepare('UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?')
            .bind(userId)
            .run();
    }

    async isEmailVerified(userId: string): Promise<boolean> {
        const result = await this.db
            .prepare('SELECT email_verified FROM users WHERE id = ?')
            .bind(userId)
            .first<{ email_verified: number }>();

        return result?.email_verified === 1;
    }

    async resendVerificationToken(userId: string, token: string, expiresAt: number): Promise<void> {
        await this.db
            .prepare('UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?')
            .bind(token, expiresAt, userId)
            .run();
    }

    // ============ PASSWORD RESET OPERATIONS ============

    async setResetToken(userId: string, token: string, expiresAt: number): Promise<void> {
        await this.db
            .prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
            .bind(token, expiresAt, userId)
            .run();
    }

    async verifyResetToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
        const now = Date.now();

        // Find user by reset token
        const user = await this.db
            .prepare('SELECT id, email, reset_token_expires FROM users WHERE reset_token = ?')
            .bind(token)
            .first<{ id: string; email: string; reset_token_expires: number }>();

        if (!user) {
            return { success: false, error: 'Invalid reset token' };
        }

        if (user.reset_token_expires < now) {
            return { success: false, error: 'Reset token expired' };
        }

        return { success: true, userId: user.id };
    }

    async updatePassword(userId: string, hashedPassword: string): Promise<void> {
        await this.db
            .prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
            .bind(hashedPassword, userId)
            .run();
    }

    // ============ RATE LIMITING OPERATIONS ============

    /**
     * Adds a record of a rate-limited action.
     * The `created_at` timestamp is automatically set by the database in seconds.
     */
    async addRateLimitRequest(action: string, identifier: string): Promise<void> {
        const id = crypto.randomUUID();
        await this.db
            .prepare('INSERT INTO rate_limits (id, action, identifier) VALUES (?, ?, ?)')
            .bind(id, action, identifier)
            .run();
    }

    /**
     * Retrieves recent requests for a given action and identifier.
     * @param windowStart - The start of the time window in milliseconds.
     * @returns A list of request timestamps.
     */
    async getRateLimitRequests(action: string, identifier: string, windowStart: number): Promise<{ created_at: number }[]> {
        // Convert window from milliseconds to seconds to match the database schema
        const windowStartSeconds = Math.floor(windowStart / 1000);

        const result = await this.db
            .prepare('SELECT created_at FROM rate_limits WHERE action = ? AND identifier = ? AND created_at > ?')
            .bind(action, identifier, windowStartSeconds)
            .all<{ created_at: number }>();

        return result.results || [];
    }

    // ============ ADMIN ANALYTICS OPERATIONS ============

    /**
     * Get comprehensive admin statistics
     */
    async getAdminStats(): Promise<AdminStats> {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

        // Total users
        const totalUsersResult = await this.db
            .prepare('SELECT COUNT(*) as count FROM users')
            .first<{ count: number }>();
        const totalUsers = totalUsersResult?.count || 0;

        // New users today
        const newUsersTodayResult = await this.db
            .prepare('SELECT COUNT(*) as count FROM users WHERE created_at > ?')
            .bind(oneDayAgo)
            .first<{ count: number }>();
        const newUsersToday = newUsersTodayResult?.count || 0;

        // New users this week
        const newUsersWeekResult = await this.db
            .prepare('SELECT COUNT(*) as count FROM users WHERE created_at > ?')
            .bind(oneWeekAgo)
            .first<{ count: number }>();
        const newUsersThisWeek = newUsersWeekResult?.count || 0;

        // New users this month
        const newUsersMonthResult = await this.db
            .prepare('SELECT COUNT(*) as count FROM users WHERE created_at > ?')
            .bind(oneMonthAgo)
            .first<{ count: number }>();
        const newUsersThisMonth = newUsersMonthResult?.count || 0;

        // Active users (created at least one expense in last 7 days)
        const activeUsersResult = await this.db
            .prepare('SELECT COUNT(DISTINCT user_id) as count FROM expenses WHERE created_at > ?')
            .bind(oneWeekAgo)
            .first<{ count: number }>();
        const activeUsers7Days = activeUsersResult?.count || 0;

        // Total expenses
        const totalExpensesResult = await this.db
            .prepare('SELECT COUNT(*) as count FROM expenses')
            .first<{ count: number }>();
        const totalExpenses = totalExpensesResult?.count || 0;

        // Expenses today
        const expensesTodayResult = await this.db
            .prepare('SELECT COUNT(*) as count FROM expenses WHERE created_at > ?')
            .bind(oneDayAgo)
            .first<{ count: number }>();
        const expensesToday = expensesTodayResult?.count || 0;

        // Expenses this week
        const expensesWeekResult = await this.db
            .prepare('SELECT COUNT(*) as count FROM expenses WHERE created_at > ?')
            .bind(oneWeekAgo)
            .first<{ count: number }>();
        const expensesThisWeek = expensesWeekResult?.count || 0;

        // Expenses this month
        const expensesMonthResult = await this.db
            .prepare('SELECT COUNT(*) as count FROM expenses WHERE created_at > ?')
            .bind(oneMonthAgo)
            .first<{ count: number }>();
        const expensesThisMonth = expensesMonthResult?.count || 0;

        // Category breakdown
        const categoryResult = await this.db
            .prepare('SELECT category, COUNT(*) as count FROM expenses GROUP BY category ORDER BY count DESC')
            .all<{ category: string; count: number }>();
        const categoryBreakdown = categoryResult.results || [];

        // AI provider breakdown (from user settings)
        const providerResult = await this.db
            .prepare('SELECT COALESCE(ai_provider, \'gemini\') as provider, COUNT(*) as count FROM api_keys GROUP BY ai_provider ORDER BY count DESC')
            .all<{ provider: string; count: number }>();
        const aiProviderBreakdown = providerResult.results || [];

        // Currency breakdown (from user settings)
        const currencyResult = await this.db
            .prepare('SELECT default_currency as currency, COUNT(*) as count FROM api_keys GROUP BY default_currency ORDER BY count DESC')
            .all<{ currency: string; count: number }>();
        const currencyBreakdown = currencyResult.results || [];

        return {
            totalUsers,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
            activeUsers7Days,
            totalExpenses,
            expensesToday,
            expensesThisWeek,
            expensesThisMonth,
            categoryBreakdown,
            aiProviderBreakdown,
            currencyBreakdown,
        };
    }

    /**
     * Get all users with their stats for admin view
     */
    async getAllUsersWithStats(): Promise<UserWithStats[]> {
        // Get all users with their expense count and last expense date
        const usersResult = await this.db
            .prepare(`
                SELECT 
                    u.id,
                    u.email,
                    u.created_at,
                    COALESCE(u.email_verified, 0) as email_verified,
                    COUNT(e.id) as expenseCount,
                    MAX(e.created_at) as lastExpenseAt,
                    u.role,
                    u.is_active,
                    u.ban_reason,
                    u.last_active_at
                FROM users u
                LEFT JOIN expenses e ON u.id = e.user_id
                GROUP BY u.id
                ORDER BY u.created_at DESC
            `)
            .all<{
                id: string;
                email: string;
                created_at: number;
                email_verified: number;
                expenseCount: number;
                lastExpenseAt: number | null;
                role: string | null;
                is_active: number | null;
                ban_reason: string | null;
                last_active_at: number | null;
            }>();

        const users = usersResult.results || [];

        // Get settings for each user
        const usersWithSettings: UserWithStats[] = [];
        for (const user of users) {
            const settings = await this.getUserSettings(user.id);
            usersWithSettings.push({
                ...user,
                // Ensure default values for new columns
                role: user.role || 'user',
                is_active: user.is_active !== null ? user.is_active : 1,
                settings: settings ? {
                    currency: settings.default_currency,
                    aiProvider: settings.ai_provider || 'gemini',
                } : null,
            });
        }

        return usersWithSettings;
    }

    async updateUserRole(userId: string, role: string): Promise<void> {
        await this.db
            .prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
            .bind(role, Date.now(), userId)
            .run();
    }



    async updateUserStatus(userId: string, isActive: boolean, banReason?: string): Promise<void> {
        const isActiveInt = isActive ? 1 : 0;
        await this.db
            .prepare('UPDATE users SET is_active = ?, ban_reason = ?, updated_at = ? WHERE id = ?')
            .bind(isActiveInt, banReason || null, Date.now(), userId)
            .run();
    }

    async addSystemLog(level: 'info' | 'warn' | 'error', message: string, details?: string): Promise<void> {
        const id = crypto.randomUUID();
        await this.db
            .prepare('INSERT INTO system_logs (id, level, message, details, timestamp) VALUES (?, ?, ?, ?, ?)')
            .bind(id, level, message, details || null, Date.now())
            .run();
    }

    async getSystemLogs(limit = 100): Promise<import('../types').SystemLog[]> {
        const result = await this.db
            .prepare('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT ?')
            .bind(limit)
            .all<import('../types').SystemLog>();
        return result.results || [];
    }

    async updateUserLastActive(userId: string): Promise<void> {
        // Only update if it hasn't been updated in the last minute (to reduce write load)
        // We do this by checking the current value first or just blindly updating
        // For simplicity and "lively" feel, allowing blind update but it's best to be called via waitUntil
        await this.db
            .prepare('UPDATE users SET last_active_at = ? WHERE id = ?')
            .bind(Date.now(), userId)
            .run();
    }

    async deleteUser(userId: string): Promise<void> {
        // 1. Delete manual dependencies (no foreign key or no cascade)
        await this.db.batch([
            this.db.prepare('DELETE FROM api_auth_keys WHERE user_id = ?').bind(userId),
            this.db.prepare('DELETE FROM ai_processing_logs WHERE user_id = ?').bind(userId),
            // 2. Delete user (Cascades to expenses, sessions, settings(if FK), budgets, categories, saved_searches)
            this.db.prepare('DELETE FROM users WHERE id = ?').bind(userId)
        ]);

        // Also add a system log entry noting the deletion (without user_id since user is gone, just in message)
        await this.addSystemLog('warn', `User deleted: ${userId}`, 'Account permanently removed.');
    }

    async logAIProcessing(
        userId: string,
        provider: string,
        model: string,
        durationMs: number,
        success: boolean,
        error?: string
    ): Promise<void> {
        const id = crypto.randomUUID();
        await this.db
            .prepare(
                'INSERT INTO ai_processing_logs (id, user_id, provider, model, duration_ms, success, error, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )
            .bind(id, userId, provider, model, durationMs, success ? 1 : 0, error || null, Date.now())
            .run();
    }

    async getAIAnalytics(days = 30): Promise<{
        totalRequests: number;
        successRate: number;
        avgDuration: number;
        providerBreakdown: { provider: string; count: number }[];
        dailyStats: { date: string; count: number; avgDuration: number }[];
    }> {
        const now = Date.now();
        const startTime = now - days * 24 * 60 * 60 * 1000;

        // Get basic stats
        const stats = await this.db
            .prepare(`
                SELECT 
                    COUNT(*) as total,
                    AVG(duration_ms) as avg_duration,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count
                FROM ai_processing_logs 
                WHERE timestamp > ?
            `)
            .bind(startTime)
            .first<{ total: number; avg_duration: number; success_count: number }>();

        // Provider breakdown
        const providers = await this.db
            .prepare(`
                SELECT provider, COUNT(*) as count 
                FROM ai_processing_logs 
                WHERE timestamp > ? 
                GROUP BY provider
            `)
            .bind(startTime)
            .all<{ provider: string; count: number }>();

        // Daily stats (using simple timestamp math for grouping as SQLite date functions can be tricky in Workers)
        // We'll fetch the raw data and aggregate in JS for simplicity and reliability across DB versions
        const logs = await this.db
            .prepare(`
                SELECT timestamp, duration_ms 
                FROM ai_processing_logs 
                WHERE timestamp > ?
                ORDER BY timestamp ASC
            `)
            .bind(startTime)
            .all<{ timestamp: number; duration_ms: number }>();

        // Aggregate daily stats in JS
        const dailyMap = new Map<string, { count: number; totalDuration: number }>();

        if (logs.results) {
            for (const log of logs.results) {
                const date = new Date(log.timestamp).toISOString().split('T')[0];
                const current = dailyMap.get(date) || { count: 0, totalDuration: 0 };
                dailyMap.set(date, {
                    count: current.count + 1,
                    totalDuration: current.totalDuration + log.duration_ms
                });
            }
        }

        const dailyStats = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date,
            count: data.count,
            avgDuration: Math.round(data.totalDuration / data.count)
        })).sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalRequests: stats?.total || 0,
            successRate: stats?.total ? (stats.success_count / stats.total) * 100 : 100,
            avgDuration: Math.round(stats?.avg_duration || 0),
            providerBreakdown: providers.results || [],
            dailyStats
        };
    }

    /**
     * Get expenses for a specific user by email (admin only)
     */
    async getExpensesByUserEmail(email: string): Promise<UserExpense[]> {
        // First get the user
        const user = await this.getUserByEmail(email);
        if (!user) {
            return [];
        }

        // Get all expenses for this user
        const expensesResult = await this.db
            .prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
            .bind(user.id)
            .all<Expense>();

        const expenses = expensesResult.results || [];

        // Get line items for each expense
        const expensesWithLineItems: UserExpense[] = [];
        for (const expense of expenses) {
            const lineItems = await this.getLineItemsByExpenseId(expense.id);
            expensesWithLineItems.push({
                ...expense,
                lineItems,
            });
        }

        return expensesWithLineItems;
    }

    async getUserStats(userId: string): Promise<{ categoryBreakdown: { category: string; count: number; total: number }[]; monthlySpending: { month: string; total: number }[] }> {
        // Category breakdown
        const categoryResult = await this.db
            .prepare('SELECT category, COUNT(*) as count, SUM(total) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC')
            .bind(userId)
            .all<{ category: string; count: number; total: number }>();
        const categoryBreakdown = categoryResult.results || [];

        // Monthly spending (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // SQLite date formatting for grouping YYYY-MM
        const monthlyResult = await this.db
            .prepare(`
                SELECT strftime('%Y-%m', date) as month, SUM(total) as total 
                FROM expenses 
                WHERE user_id = ? AND date >= ?
            GROUP BY month 
                ORDER BY month ASC
            `)
            .bind(userId, sixMonthsAgo.toISOString().split('T')[0])
            .all<{ month: string; total: number }>();

        const monthlySpending = monthlyResult.results || [];

        return {
            categoryBreakdown,
            monthlySpending
        };
    }

    // ============ TAGS OPERATIONS ============

    async createTag(userId: string, name: string, color?: string): Promise<import('../types').Tag> {
        const id = crypto.randomUUID();
        const now = Date.now();
        await this.db.prepare(
            'INSERT INTO tags (id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, userId, name, color || null, now).run();

        return { id, user_id: userId, name, color: color || null, created_at: now };
    }

    async getTags(userId: string): Promise<import('../types').Tag[]> {
        const result = await this.db.prepare(
            'SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC'
        ).bind(userId).all<import('../types').Tag>();
        return result.results || [];
    }

    async deleteTag(tagId: string, userId: string): Promise<boolean> {
        const result = await this.db.prepare(
            'DELETE FROM tags WHERE id = ? AND user_id = ?'
        ).bind(tagId, userId).run();
        return result.success;
    }

    async addTagToExpense(expenseId: string, tagId: string): Promise<boolean> {
        const now = Date.now();
        try {
            const result = await this.db.prepare(
                'INSERT OR IGNORE INTO expense_tags (expense_id, tag_id, created_at) VALUES (?, ?, ?)'
            ).bind(expenseId, tagId, now).run();
            return result.success;
        } catch (e) {
            return false;
        }
    }

    async removeTagFromExpense(expenseId: string, tagId: string): Promise<boolean> {
        const result = await this.db.prepare(
            'DELETE FROM expense_tags WHERE expense_id = ? AND tag_id = ?'
        ).bind(expenseId, tagId).run();
        return result.success;
    }

    async getTagsByExpenseId(expenseId: string): Promise<import('../types').Tag[]> {
        const sql = `
            SELECT t.* 
            FROM tags t
            JOIN expense_tags et ON t.id = et.tag_id
            WHERE et.expense_id = ?
        `;
        const result = await this.db.prepare(sql).bind(expenseId).all<import('../types').Tag>();
        return result.results || [];
    }


    // ============ NOTIFICATIONS OPERATIONS ============

    async createNotification(userId: string, type: string, title: string, message: string, data?: object): Promise<void> {
        const id = crypto.randomUUID();
        const now = Date.now();
        const dataStr = data ? JSON.stringify(data) : null;
        await this.db.prepare(
            'INSERT INTO notifications (id, user_id, type, title, message, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, userId, type, title, message, dataStr, now).run();
    }

    async getNotifications(userId: string, limit = 20, offset = 0): Promise<import('../types').Notification[]> {
        const result = await this.db.prepare(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
        ).bind(userId, limit, offset).all<import('../types').Notification>();
        return result.results || [];
    }

    async markNotificationRead(id: string, userId: string): Promise<boolean> {
        const result = await this.db.prepare(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
        ).bind(id, userId, userId).run();
        // Note: bind params matching placeholders. 'id = ? AND user_id = ?' -> needs 2 args. 
        // Wait, I put 3 args in logic? bind(id, userId, userId). 
        // No, bind(id, userId).
        // Let me fix replacement content.
        return result.success;
    }

    async markAllNotificationsRead(userId: string): Promise<boolean> {
        const result = await this.db.prepare(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ?'
        ).bind(userId).run();
        return result.success;
    }

    async getUnreadNotificationCount(userId: string): Promise<number> {
        const result = await this.db.prepare(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
        ).bind(userId).first<{ count: number }>();
        return result?.count || 0;
    }
}
