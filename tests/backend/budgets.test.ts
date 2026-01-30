import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DBService } from '../../worker/services/db.service';

// Mock types for D1
const mockStmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
};

const mockDb = {
    prepare: vi.fn().mockReturnValue(mockStmt),
    batch: vi.fn(),
    dump: vi.fn(),
    exec: vi.fn(),
} as unknown as D1Database;

describe('DBService - Budgets', () => {
    let service: DBService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DBService(mockDb);
    });

    describe('upsertBudget', () => {
        it('should create a new budget if one does not exist', async () => {
            const userId = 'user123';
            const category = 'Food';
            const limit = 500;
            const currency = 'USD';

            // Mock check for existing budget (return null)
            mockStmt.first.mockResolvedValueOnce(null);

            const result = await service.upsertBudget(userId, category, limit, currency);

            // Expect INSERT query to be called
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO budgets'));
            expect(mockStmt.run).toHaveBeenCalled();

            expect(result.category).toBe(category);
            expect(result.limit_amount).toBe(limit);
            expect(result.period).toBe('monthly');
        });

        it('should update an existing budget if found', async () => {
            const userId = 'user123';
            const category = 'Food';
            const newLimit = 800;
            const currency = 'USD';
            const existingId = 'budget-abc-123';

            // Mock check returning existing budget
            mockStmt.first.mockResolvedValueOnce({
                id: existingId,
                user_id: userId,
                category: 'Food',
                limit_amount: 500,
                created_at: 12345
            });

            const result = await service.upsertBudget(userId, category, newLimit, currency);

            // Expect UPDATE query to be called
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE budgets'));
            expect(mockStmt.run).toHaveBeenCalled();

            expect(result.id).toBe(existingId);
            expect(result.limit_amount).toBe(newLimit);
        });

        it('should correctly save and retrieve category with special characters', async () => {
            const userId = 'user_special_chars';
            const category = 'Food & Drink';
            const limit = 150.50;
            const currency = 'USD';

            // 1. Create (Upsert)
            // Mock get returning null (new)
            mockStmt.first.mockResolvedValueOnce(null);

            await service.upsertBudget(userId, category, limit, currency);

            // 2. Retrieve (GetBudgets)
            // Mock all returning the inserted budget
            mockStmt.all.mockResolvedValueOnce({
                results: [{
                    id: 'new-id',
                    user_id: userId,
                    category: category,
                    limit_amount: limit,
                    currency: currency,
                    period: 'monthly',
                    created_at: 12345,
                    updated_at: 12345
                }]
            });

            const budgets = await service.getBudgets(userId);

            expect(budgets).toHaveLength(1);
            expect(budgets[0].category).toBe('Food & Drink');
            expect(budgets[0].limit_amount).toBe(150.50);
        });
    });
});
