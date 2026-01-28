import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { budgetService, Budget } from '@/lib/budget-service';
import { expenseService, Expense } from '@/lib/expense-service';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useUserSettings } from '@/hooks/useUserSettings';

export const BudgetOverview: React.FC = () => {
    const { defaultCurrency } = useUserSettings();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [budgetRes, expenseRes] = await Promise.all([
                budgetService.getBudgets(),
                expenseService.getExpenses() // Fetches all, filter locally
            ]);

            if (budgetRes.success && budgetRes.data) {
                setBudgets(budgetRes.data);
            }
            if (expenseRes.success && expenseRes.data) {
                setExpenses(expenseRes.data);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to load budget data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader className="animate-spin" /></div>;
    }

    if (budgets.length === 0) {
        return null; // Don't show if no budgets set
    }

    // Filter expenses for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Aggregate by category
    const spentByCategory: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
        const amount = e.currency === defaultCurrency ? e.total : e.total; // Simplified: assuming same currency or ignoring conversion for MVP
        spentByCategory[e.category] = (spentByCategory[e.category] || 0) + amount;
    });

    return (
        <Card className="w-full max-w-2xl mx-auto mt-6">
            <CardHeader>
                <CardTitle>Monthly Budgets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {budgets.map(budget => {
                    const spent = spentByCategory[budget.category] || 0;
                    const percentage = Math.min((spent / budget.limit_amount) * 100, 100);
                    const isOver = spent > budget.limit_amount;

                    return (
                        <div key={budget.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{budget.category}</span>
                                <span>
                                    {spent.toFixed(2)} / {budget.limit_amount.toFixed(2)} {budget.currency}
                                </span>
                            </div>
                            <Progress value={percentage} className={`h-2 ${isOver ? 'bg-red-100' : ''}`} indicatorClassName={isOver ? 'bg-destructive' : ''} />
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};
