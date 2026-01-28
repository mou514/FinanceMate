import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DBService } from '../services/db.service';

// Mock D1 Database
const createMockD1 = () => {
    const runMock = vi.fn().mockResolvedValue({ success: true, meta: {} });
    const firstMock = vi.fn().mockResolvedValue(null);
    const allMock = vi.fn().mockResolvedValue({ results: [], success: true, meta: {} });

    const prepareMock = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runMock,
        first: firstMock,
        all: allMock,
    });

    return {
        prepare: prepareMock,
        runMock,
        firstMock,
        allMock,
    };
};

describe('DBService Admin Features', () => {
    let mockDb: ReturnType<typeof createMockD1>;
    let service: DBService;

    beforeEach(() => {
        mockDb = createMockD1();
        service = new DBService(mockDb as any);
    });

    describe('setUserRole', () => {
        it('should update user role', async () => {
            const userId = 'user-123';
            const role = 'admin';

            await service.setUserRole(userId, role);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET role = ?')
            );
            // Verify bindings: role, timestamp, userId
            const bindArgs = mockDb.prepare.mock.results[0].value.bind.mock.calls[0];
            expect(bindArgs[0]).toBe(role);
            expect(bindArgs[2]).toBe(userId);
        });
    });

    describe('updateUserStatus', () => {
        it('should ban user (is_active = 0)', async () => {
            const userId = 'user-123';
            await service.updateUserStatus(userId, false);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET is_active = ?')
            );
            const bindArgs = mockDb.prepare.mock.results[0].value.bind.mock.calls[0];
            expect(bindArgs[0]).toBe(0); // 0 for banned
            expect(bindArgs[2]).toBe(userId);
        });

        it('should unban user (is_active = 1)', async () => {
            const userId = 'user-123';
            await service.updateUserStatus(userId, true);

            const bindArgs = mockDb.prepare.mock.results[0].value.bind.mock.calls[0];
            expect(bindArgs[0]).toBe(1); // 1 for active
        });
    });

    describe('System Logs', () => {
        it('should add system log', async () => {
            const level = 'error';
            const message = 'Test error';
            const details = 'Stack trace...';

            await service.addSystemLog(level, message, details);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO system_logs')
            );
            const bindArgs = mockDb.prepare.mock.results[0].value.bind.mock.calls[0];
            expect(bindArgs[1]).toBe(level);
            expect(bindArgs[2]).toBe(message);
            expect(bindArgs[3]).toBe(details);
        });

        it('should get system logs', async () => {
            const mockLogs = [
                { id: '1', level: 'info', message: 'test', timestamp: 123 }
            ];
            mockDb.allMock.mockResolvedValueOnce({ results: mockLogs });

            const logs = await service.getSystemLogs(50);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM system_logs')
            );
            expect(logs).toEqual(mockLogs);
        });
    });

    describe('getAllUsersWithStats', () => {
        it('should return users with role and is_active defaults', async () => {
            const mockUsers = [
                { id: '1', email: 'a@b.com', role: null, is_active: null }
            ];
            mockDb.allMock.mockResolvedValueOnce({ results: mockUsers });

            // Mock getUserSettings to return null
            mockDb.firstMock.mockResolvedValue(null);

            const result = await service.getAllUsersWithStats();

            expect(result[0].role).toBe('user'); // Default
            expect(result[0].is_active).toBe(1); // Default
        });

        it('should return existing role and is_active', async () => {
            const mockUsers = [
                { id: '1', email: 'a@b.com', role: 'admin', is_active: 0 }
            ];
            mockDb.allMock.mockResolvedValueOnce({ results: mockUsers });
            mockDb.firstMock.mockResolvedValue(null);

            const result = await service.getAllUsersWithStats();

            expect(result[0].role).toBe('admin');
            expect(result[0].is_active).toBe(0);
        });
    });
});
