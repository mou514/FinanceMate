import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/useCategories';
import { categoryService, type CategoryStatistic } from '@/lib/category-service';
import { toast } from 'sonner';
import { Loader, Plus, Trash2, Edit2, Check, X, BarChart3 } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '@/constants';
import { AVAILABLE_ICONS, getIconByName } from '@/lib/category-icons';
import { CATEGORY_COLORS, getColorByValue } from '@/lib/category-colors';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export const CategoryManager: React.FC = () => {
    const { categories, customCategoriesWithIds, loading, refreshCategories, deleteCategory } = useCategories();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Sparkles');
    const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[10].value);
    const [adding, setAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [editColor, setEditColor] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [statistics, setStatistics] = useState<CategoryStatistic[]>([]);
    const [showStatistics, setShowStatistics] = useState(false);

    useEffect(() => {
        if (showStatistics) {
            loadStatistics();
        }
    }, [showStatistics]);

    const loadStatistics = async () => {
        const { success, data } = await categoryService.getCategoryStatistics();
        if (success && data) {
            setStatistics(data);
        }
    };

    const handleAdd = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        setAdding(true);
        const { success, error } = await categoryService.createCategory(
            newCategoryName.trim(),
            selectedIcon,
            selectedColor
        );

        if (success) {
            toast.success('Category added');
            setNewCategoryName('');
            setSelectedIcon('Sparkles');
            setSelectedColor(CATEGORY_COLORS[10].value);
            await refreshCategories();
        } else {
            toast.error(error || 'Failed to add category');
        }
        setAdding(false);
    };

    const handleDelete = async (categoryId: string) => {
        setDeletingId(categoryId);
        await deleteCategory(categoryId);
        setDeletingId(null);
    };

    const startEdit = (category: any) => {
        setEditingId(category.id);
        setEditName(category.name);
        setEditIcon(category.icon || 'Sparkles');
        setEditColor(category.color || CATEGORY_COLORS[10].value);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditIcon('');
        setEditColor('');
    };

    const saveEdit = async (categoryId: string) => {
        const { success, error } = await categoryService.updateCategory(categoryId, {
            name: editName,
            icon: editIcon,
            color: editColor,
        });

        if (success) {
            toast.success('Category updated');
            await refreshCategories();
            cancelEdit();
        } else {
            toast.error(error || 'Failed to update category');
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        const { success, error } = await categoryService.bulkDeleteCategories(Array.from(selectedIds));
        if (success) {
            toast.success(`Deleted ${selectedIds.size} categories`);
            setSelectedIds(new Set());
            await refreshCategories();
        } else {
            toast.error(error || 'Failed to delete categories');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center p-8">
                    <Loader className="animate-spin" />
                </CardContent>
            </Card>
        );
    }

    const IconComponent = getIconByName(selectedIcon);
    const colorObj = getColorByValue(selectedColor);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Custom Categories</CardTitle>
                        <CardDescription>
                            Add your own expense categories with icons and colors.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStatistics(!showStatistics)}
                    >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {showStatistics ? 'Hide' : 'Show'} Stats
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statistics */}
                {showStatistics && statistics.length > 0 && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <h4 className="text-sm font-medium mb-3">Category Usage</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {statistics.map((stat) => (
                                <div key={stat.category} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                        {stat.category}
                                        {stat.isCustom && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                Custom
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-muted-foreground">{stat.count} expenses</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add New Category */}
                <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="text-sm font-medium">Add New Category</h4>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            disabled={adding}
                            className="flex-1"
                        />
                        <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_ICONS.map((icon) => {
                                    const Icon = icon.icon;
                                    return (
                                        <SelectItem key={icon.name} value={icon.name}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                <span className="text-xs">{icon.label}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <Select value={selectedColor} onValueChange={setSelectedColor}>
                            <SelectTrigger className="w-[100px]">
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded ${colorObj.tw}`} />
                                    <span className="text-xs">{colorObj.name}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORY_COLORS.map((color) => (
                                    <SelectItem key={color.value} value={color.value}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded ${color.tw}`} />
                                            <span>{color.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAdd} disabled={adding || !newCategoryName.trim()}>
                            {adding ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Preview:</span>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card">
                            <div className={`w-2 h-2 rounded-full ${colorObj.tw}`} />
                            <IconComponent className="h-4 w-4" />
                            <span>{newCategoryName || 'Category Name'}</span>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">{selectedIds.size} selected</span>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                        </Button>
                    </div>
                )}

                {/* Custom Categories List */}
                {customCategoriesWithIds.length > 0 ? (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            Your Custom Categories ({customCategoriesWithIds.length})
                        </h4>
                        <div className="space-y-1">
                            {customCategoriesWithIds.map((category) => {
                                const Icon = getIconByName(category.icon);
                                const color = getColorByValue(category.color);
                                const isEditing = editingId === category.id;

                                return (
                                    <div
                                        key={category.id}
                                        className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <Checkbox
                                            checked={selectedIds.has(category.id)}
                                            onCheckedChange={() => toggleSelection(category.id)}
                                        />
                                        {isEditing ? (
                                            <>
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-8 flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => saveEdit(category.id)}
                                                >
                                                    <Check className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={cancelEdit}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`w-2 h-2 rounded-full ${color.tw} flex-shrink-0`} />
                                                <Icon className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm flex-1">{category.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => startEdit(category)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDelete(category.id)}
                                                    disabled={deletingId === category.id}
                                                >
                                                    {deletingId === category.id ? (
                                                        <Loader className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No custom categories yet. Add one above!
                    </p>
                )}

                {/* Default Categories Info */}
                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Default Categories ({EXPENSE_CATEGORIES.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <span
                                key={cat}
                                className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
