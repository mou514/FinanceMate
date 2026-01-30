
const API_BASE_URL = '/api';

export interface Category {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    type: 'default' | 'custom';
    created_at: number;
}

export interface CategoryStatistic {
    category: string;
    count: number;
    isCustom: boolean;
}

// Helper to get auth headers
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

class CategoryService {
    /**
     * Get all categories (defaults + custom)
     */
    async getCategories(): Promise<{ success: boolean; data?: { defaults: string[]; custom: Category[] }; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to retrieve categories',
                };
            }

            return { success: true, data: result.data };
        } catch (error: any) {
            console.error('Failed to get categories:', error);
            return { success: false, error: error.message || 'Failed to retrieve categories.' };
        }
    }

    /**
     * Create a new custom category
     */
    async createCategory(name: string, icon?: string, color?: string): Promise<{ success: boolean; data?: Category; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ name, icon, color }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to create category',
                };
            }

            return { success: true, data: result.data };
        } catch (error: any) {
            console.error('Failed to create category:', error);
            return { success: false, error: error.message || 'Failed to create category.' };
        }
    }

    /**
     * Delete a custom category
     */
    async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to delete category',
                };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete category:', error);
            return { success: false, error: error.message || 'Failed to delete category.' };
        }
    }

    /**
     * Update a custom category
     */
    async updateCategory(id: string, updates: { name?: string; icon?: string; color?: string }): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(updates),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to update category',
                };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Failed to update category:', error);
            return { success: false, error: error.message || 'Failed to update category.' };
        }
    }

    /**
     * Get category statistics
     */
    async getCategoryStatistics(): Promise<{ success: boolean; data?: CategoryStatistic[]; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/statistics`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to get statistics',
                };
            }

            return { success: true, data: result.data };
        } catch (error: any) {
            console.error('Failed to get statistics:', error);
            return { success: false, error: error.message || 'Failed to get statistics.' };
        }
    }

    /**
     * Merge categories
     */
    async mergeCategories(sourceIds: string[], targetName: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/merge`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ sourceIds, targetName }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to merge categories',
                };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Failed to merge categories:', error);
            return { success: false, error: error.message || 'Failed to merge categories.' };
        }
    }

    /**
     * Bulk delete categories
     */
    async bulkDeleteCategories(ids: string[]): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/bulk-delete`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ ids }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to delete categories',
                };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete categories:', error);
            return { success: false, error: error.message || 'Failed to delete categories.' };
        }
    }
}

export const categoryService = new CategoryService();
