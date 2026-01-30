
import { Context } from 'hono';
import { Env } from '../types';
import { DBService } from '../services/db.service';
import { success, error, json } from '../utils/response';
import { z } from 'zod';
import { validateRequest } from '../utils/validation';

import { DEFAULT_CATEGORIES } from '../constants';

const categorySchema = z.object({
    name: z.string().min(1).max(50),
    icon: z.string().optional(),
    color: z.string().optional(),
});

const updateCategorySchema = z.object({
    name: z.string().min(1).max(50).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
});

const mergeCategoriesSchema = z.object({
    sourceIds: z.array(z.string()).min(1),
    targetName: z.string().min(1).max(50),
});

const bulkDeleteSchema = z.object({
    ids: z.array(z.string()).min(1),
});

/**
 * GET /api/categories
 * Returns both default and custom categories
 */
export async function getCategories(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const db = new DBService(c.env.DB);

    try {
        const customCategories = await db.getCustomCategories(userId);

        // Merge default and custom categories
        // We return objects to differentiate them if needed, or just a flat list of names
        // Ideally, frontend expects strings for the dropdown.
        // But for management, we need IDs for custom ones.

        const response = {
            defaults: DEFAULT_CATEGORIES,
            custom: customCategories
        };

        return json(success(response));
    } catch (e: any) {
        console.error('Get categories error:', e);
        return error('Failed to fetch categories', 500);
    }
}

/**
 * POST /api/categories
 * Add a new custom category
 */
export async function addCategory(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const db = new DBService(c.env.DB);

    const validation = await validateRequest(c.req.raw, categorySchema);
    if (!validation.success) {
        return error(validation.error, 400);
    }

    const { name, icon, color } = validation.data;

    // Prevent duplicates with defaults
    if (DEFAULT_CATEGORIES.includes(name)) {
        return error('This category already exists as a default.', 400);
    }

    try {
        const category = await db.addCustomCategory(userId, name, icon, color);
        return json(success(category));
    } catch (e: any) {
        if (e.message && e.message.includes('UNIQUE constraint failed')) {
            return error('Category already exists', 409);
        }
        console.error('Add category error:', e);
        return error('Failed to add category', 500);
    }
}

/**
 * DELETE /api/categories/:id
 * Delete a custom category
 */
export async function deleteCategory(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const categoryId = c.req.param('id');
    const db = new DBService(c.env.DB);

    try {
        const deleted = await db.deleteCustomCategory(userId, categoryId);
        if (!deleted) {
            return error('Category not found or could not be deleted', 404);
        }
        return json(success({ deleted: true }));
    } catch (e: any) {
        console.error('Delete category error:', e);
        return error('Failed to delete category', 500);
    }
}

/**
 * PATCH /api/categories/:id
 * Update a custom category (name, icon, or color)
 */
export async function updateCategory(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const categoryId = c.req.param('id');
    const db = new DBService(c.env.DB);

    const validation = await validateRequest(c.req.raw, updateCategorySchema);
    if (!validation.success) {
        return error(validation.error, 400);
    }

    const updates = validation.data;

    try {
        const updated = await db.updateCustomCategory(userId, categoryId, updates);
        if (!updated) {
            return error('Category not found or could not be updated', 404);
        }
        return json(success({ updated: true }));
    } catch (e: any) {
        console.error('Update category error:', e);
        return error('Failed to update category', 500);
    }
}

/**
 * GET /api/categories/statistics
 * Get usage statistics for all categories
 */
export async function getCategoryStatistics(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const db = new DBService(c.env.DB);

    try {
        const statistics = await db.getCategoryStatistics(userId);
        return json(success(statistics));
    } catch (e: any) {
        console.error('Get category statistics error:', e);
        return error('Failed to fetch category statistics', 500);
    }
}

/**
 * POST /api/categories/merge
 * Merge multiple categories into one
 */
export async function mergeCategories(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const db = new DBService(c.env.DB);

    const validation = await validateRequest(c.req.raw, mergeCategoriesSchema);
    if (!validation.success) {
        return error(validation.error, 400);
    }

    const { sourceIds, targetName } = validation.data;

    try {
        const merged = await db.mergeCategories(userId, sourceIds, targetName);
        if (!merged) {
            return error('Failed to merge categories', 400);
        }
        return json(success({ merged: true }));
    } catch (e: any) {
        console.error('Merge categories error:', e);
        return error('Failed to merge categories', 500);
    }
}

/**
 * POST /api/categories/bulk-delete
 * Delete multiple categories at once
 */
export async function bulkDeleteCategories(c: Context<{ Bindings: Env }>) {
    const userId = c.get('userId');
    const db = new DBService(c.env.DB);

    const validation = await validateRequest(c.req.raw, bulkDeleteSchema);
    if (!validation.success) {
        return error(validation.error, 400);
    }

    const { ids } = validation.data;

    try {
        const deleted = await db.bulkDeleteCategories(userId, ids);
        if (!deleted) {
            return error('Failed to delete categories', 400);
        }
        return json(success({ deleted: true, count: ids.length }));
    } catch (e: any) {
        console.error('Bulk delete categories error:', e);
        return error('Failed to delete categories', 500);
    }
}
