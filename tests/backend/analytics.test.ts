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

describe('DBService - Analytics', () => {
    let service: DBService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DBService(mockDb);
    });

    describe('getSpendingForecast', () => {
        it('should return correct forecast and status when on track', async () => {
            const userId = 'user123';
            const currentMonthTotal = 500;
            const totalBudget = 2000;
            // Mock Date to a fixed day (e.g., 15th of month)
            const mockDate = new Date(2023, 0, 15); // Jan 15th (31 days total)
            vi.setSystemTime(mockDate);

            // Mock DB responses
            // 1. Current Month Spend
            mockStmt.first.mockResolvedValueOnce({ total: currentMonthTotal });
            // 2. Total Budget
            mockStmt.first.mockResolvedValueOnce({ total: totalBudget });

            const result = await service.getSpendingForecast(userId);

            // Calculation: 
            // Daily Avg = 500 / 15 = 33.33
            // Forecast = 33.33 * 31 = 1033.33
            // Status: 1033.33 < 2000 -> on_track

            expect(result.currentMonthTotal).toBe(currentMonthTotal);
            expect(result.totalBudget).toBe(totalBudget);
            expect(result.forecastTotal).toBeCloseTo(1033.33, 1);
            expect(result.status).toBe('on_track');

            vi.useRealTimers();
        });

        it('should return at_risk when forecast exceeds budget', async () => {
            const userId = 'user123';
            const currentMonthTotal = 1200; // High spending early
            const totalBudget = 2000;
            // Mock Date to a fixed day (e.g., 15th of month)
            const mockDate = new Date(2023, 0, 15);
            vi.setSystemTime(mockDate);

            // Mock DB responses
            mockStmt.first.mockResolvedValueOnce({ total: currentMonthTotal });
            mockStmt.first.mockResolvedValueOnce({ total: totalBudget });

            const result = await service.getSpendingForecast(userId);

            // Calculation:
            // Daily Avg = 1200 / 15 = 80
            // Forecast = 80 * 31 = 2480
            // Status: 2480 > 2000 -> at_risk

            expect(result.status).toBe('at_risk');
            expect(result.forecastTotal).toBe(2480);

            vi.useRealTimers();
        });

        it('should return over_budget when already exceeded', async () => {
            const userId = 'user123';
            const currentMonthTotal = 2100;
            const totalBudget = 2000;
            const mockDate = new Date(2023, 0, 15);
            vi.setSystemTime(mockDate);

            mockStmt.first.mockResolvedValueOnce({ total: currentMonthTotal });
            mockStmt.first.mockResolvedValueOnce({ total: totalBudget });

            const result = await service.getSpendingForecast(userId);

            expect(result.status).toBe('over_budget');
            expect(result.currentMonthTotal).toBe(2100);

            vi.useRealTimers();
        });
    });
});
