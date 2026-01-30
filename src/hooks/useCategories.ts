
import { useState, useEffect, useCallback } from 'react';
import { categoryService, Category } from '@/lib/category-service';
import { toast } from 'sonner';
import { EXPENSE_CATEGORIES } from '@/constants'; // Fallback

export const useCategories = () => {
    const [categories, setCategories] = useState<string[]>([...EXPENSE_CATEGORIES]);
    const [customCategoriesWithIds, setCustomCategoriesWithIds] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const { success, data, error: apiError } = await categoryService.getCategories();

            if (success && data) {
                // API returns { defaults: string[], custom: Category[] }
                // Merge them into a flat string array
                const allCategories = [...data.defaults, ...data.custom.map((c: any) => c.name)];
                setCategories(allCategories);
                setCustomCategoriesWithIds(data.custom);
                setError(null);
            } else {
                console.error('Failed to fetch categories:', apiError);
                setError(apiError || 'Failed to load categories');
            }
        } catch (err: any) {
            console.error('Error in useCategories:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const addCategory = async (name: string, icon?: string, color?: string): Promise<boolean> => {
        const { success, error } = await categoryService.createCategory(name, icon, color);
        if (success) {
            toast.success('Category created');
            await fetchCategories();
            return true;
        } else {
            toast.error(error || 'Failed to create category');
            return false;
        }
    };

    const deleteCategory = async (id: string): Promise<boolean> => {
        const { success, error } = await categoryService.deleteCategory(id);
        if (success) {
            toast.success('Category deleted');
            await fetchCategories();
            return true;
        } else {
            toast.error(error || 'Failed to delete category');
            return false;
        }
    };

    return {
        categories,
        customCategoriesWithIds,
        loading,
        error,
        refreshCategories: fetchCategories,
        addCategory,
        deleteCategory
    };
};
