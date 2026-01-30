import type { APIResponse } from '../../worker/types';

const API_BASE_URL = '/api';

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    limit_amount: number;
    currency: string;
    alert_threshold?: number;
    created_at: number;
    updated_at: number;
}

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

class BudgetService {
    async getBudgets(): Promise<{ success: boolean; data?: Budget[]; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/budgets`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            const result: APIResponse<Budget[]> = await response.json();
            return { success: result.success, data: result.data, error: result.error };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async setBudget(category: string, limitAmount: number, currency: string, alertThreshold: number): Promise<{ success: boolean; data?: Budget; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/budgets`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ category, limit_amount: limitAmount, currency, alert_threshold: alertThreshold }),
            });
            const result: APIResponse<Budget> = await response.json();
            return { success: result.success, data: result.data, error: result.error };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

}

export const budgetService = new BudgetService();
