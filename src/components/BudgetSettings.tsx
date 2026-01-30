import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetService, Budget } from '@/lib/budget-service';
import { toast } from 'sonner';
import { Loader, Save } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';

import { useCategories } from '@/hooks/useCategories';

export const BudgetSettings: React.FC = () => {
    const { defaultCurrency } = useUserSettings();
    const { categories } = useCategories();
    const [budgets, setBudgets] = useState<Record<string, Budget>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // Category being saved

    // Local state for inputs to allow editing before saving
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [thresholdInputs, setThresholdInputs] = useState<Record<string, string>>({});

    useEffect(() => {
        loadBudgets();
    }, []);

    const loadBudgets = async () => {
        setLoading(true);
        const response = await budgetService.getBudgets();
        if (response.success && response.data) {
            const budgetMap: Record<string, Budget> = {};
            const inputMap: Record<string, string> = {};
            const thresholdMap: Record<string, string> = {};
            response.data.forEach(b => {
                budgetMap[b.category] = b;
                inputMap[b.category] = b.limit_amount === 0 ? '' : b.limit_amount.toString();
                thresholdMap[b.category] = b.alert_threshold !== undefined ? b.alert_threshold.toString() : '80';
            });
            setBudgets(budgetMap);
            setInputs(inputMap);
            setThresholdInputs(thresholdMap);
        } else {
            toast.error('Failed to load budgets');
        }
        setLoading(false);
    };

    const handleInputChange = (category: string, value: string) => {
        setInputs(prev => ({ ...prev, [category]: value }));
    };

    const handleThresholdChange = (category: string, value: string) => {
        setThresholdInputs(prev => ({ ...prev, [category]: value }));
    };

    const handleSave = async (category: string) => {
        const amountStr = inputs[category];
        const thresholdStr = thresholdInputs[category] || '80';
        const amount = parseFloat(amountStr);
        const threshold = parseFloat(thresholdStr);

        if (isNaN(amount) || amount < 0) {
            toast.error('Invalid amount');
            return;
        }
        if (isNaN(threshold) || threshold < 0 || threshold > 100) {
            toast.error('Invalid threshold (0-100)');
            return;
        }

        setSaving(category);
        const response = await budgetService.setBudget(category, amount, defaultCurrency, threshold);

        if (response.success && response.data) {
            const newBudget = response.data;
            setBudgets(prev => ({ ...prev, [category]: newBudget }));
            toast.success(`Budget for ${category} updated`);
        } else {
            toast.error('Failed to save budget');
        }
        setSaving(null);
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader className="animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Budget Limits</CardTitle>
                <CardDescription>Set monthly spending limits and alert thresholds for each category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {categories.map(category => (
                    <div key={category} className="flex items-center gap-4">
                        <Label className="w-1/4">{category}</Label>
                        <div className="flex-1 flex items-center gap-2">
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={inputs[category] || ''}
                                        onChange={(e) => handleInputChange(category, e.target.value)}
                                        placeholder="Limit"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{defaultCurrency}</span>
                                </div>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={thresholdInputs[category] || '80'}
                                        onChange={(e) => handleThresholdChange(category, e.target.value)}
                                        placeholder="Alert %"
                                        min="0"
                                        max="100"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">% Alert</span>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleSave(category)}
                                disabled={saving === category}
                            >
                                {saving === category ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
