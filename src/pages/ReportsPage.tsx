import React, { useEffect, useState, useMemo } from "react";
import { Loader, TrendingUp, DollarSign, CreditCard, PieChart as PieChartIcon, Calendar } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { expenseService } from "@/lib/expense-service";
import { getCurrencySymbol } from "@/lib/currency-utils";
import { useUserSettings } from "@/hooks/useUserSettings";

interface UserStats {
    categoryBreakdown: { category: string; count: number; total: number }[];
    monthlySpending: { month: string; total: number }[];
    forecast: {
        currentMonthTotal: number;
        forecastTotal: number;
        totalBudget: number;
        status: 'on_track' | 'at_risk' | 'over_budget';
    } | null;
}

const COLORS = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
];

export const ReportsPage: React.FC = () => {
    const { defaultCurrency } = useUserSettings();
    const currencySymbol = getCurrencySymbol(defaultCurrency);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [trends, setTrends] = useState<{ topCategory: string; currentAmount: number; previousAmount: number; percentageChange: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processData = async () => {
            try {
                // Fetch expenses for category breakdown (still client-side for now)
                const expensesResponse = await expenseService.getExpenses();

                // Fetch backend analytics
                const historyResponse = await expenseService.getAnalyticsHistory();
                const forecastResponse = await expenseService.getSpendingForecast();
                const trendsResponse = await expenseService.getTrends();

                if (expensesResponse.success && expensesResponse.data &&
                    historyResponse.success && historyResponse.data &&
                    forecastResponse.success && forecastResponse.data) {

                    const expenses = expensesResponse.data;

                    // 1. Category Breakdown (Client-side)
                    const categoryMap = new Map<string, { count: number; total: number }>();
                    expenses.forEach(exp => {
                        const cat = exp.category || 'Uncategorized';
                        const current = categoryMap.get(cat) || { count: 0, total: 0 };
                        categoryMap.set(cat, {
                            count: current.count + 1,
                            total: current.total + exp.total
                        });
                    });

                    const categoryBreakdown = Array.from(categoryMap.entries())
                        .map(([category, data]) => ({ category, ...data }))
                        .sort((a, b) => b.total - a.total);

                    // 2. Monthly Spending (Server-side)
                    const monthlySpending = historyResponse.data;

                    // 3. Forecast (Server-side)
                    const forecast = forecastResponse.data;

                    setStats({ categoryBreakdown, monthlySpending, forecast });

                    if (trendsResponse.success && trendsResponse.data) {
                        setTrends(trendsResponse.data);
                    }
                } else {
                    setError(expensesResponse.error || historyResponse.error || forecastResponse.error || "Failed to fetch data");
                }
            } catch (err: any) {
                console.error("Reports Page Error:", err);
                setError(`An error occurred: ${err.message || String(err)}`);
            } finally {
                setIsLoading(false);
            }
        };

        processData();
    }, []);

    const summary = useMemo(() => {
        if (!stats) return null;

        const totalSpend = stats.categoryBreakdown.reduce((acc, curr) => acc + curr.total, 0);
        const totalTx = stats.categoryBreakdown.reduce((acc, curr) => acc + curr.count, 0);
        const avgTx = totalTx > 0 ? totalSpend / totalTx : 0;
        // Use trends for top category if available, otherwise fallback
        const topCategory = trends ? { category: trends.topCategory, total: trends.currentAmount } : (stats.categoryBreakdown.length > 0 ? stats.categoryBreakdown[0] : null);

        return { totalSpend, totalTx, avgTx, topCategory };
    }, [stats, trends]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="h-10 w-10 animate-spin text-focal-blue-500" />
                    <p className="text-muted-foreground animate-pulse">Loading insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <TrendingUp className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-lg font-medium text-destructive">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-sm underline text-muted-foreground hover:text-foreground"
                >
                    Try Refreshing
                </button>
            </div>
        );
    }

    if (!stats || (stats.categoryBreakdown.length === 0 && stats.monthlySpending.length === 0)) {
        return (
            <div className="container max-w-7xl mx-auto py-12 px-4 text-center">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="bg-muted p-6 rounded-2xl inline-flex">
                        <PieChartIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold">No data available yet</h2>
                    <p className="text-muted-foreground">
                        Start scanning receipts or adding expenses to visualize your spending habits here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-focal-blue-500 to-purple-600 rounded-lg text-white">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    Financial Insights
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Track your spending patterns and financial health.
                </p>
            </header>

            {/* Forecast Card */}
            {stats.forecast && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className={`shadow-md hover:shadow-lg transition-shadow border-l-4 ${stats.forecast.status === 'on_track' ? 'border-l-emerald-500' :
                        stats.forecast.status === 'at_risk' ? 'border-l-amber-500' :
                            'border-l-destructive'
                        }`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Spending Forecast</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currencySymbol}{stats.forecast.forecastTotal.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.forecast.status === 'on_track' ? 'On track regarding budget' :
                                    stats.forecast.status === 'at_risk' ? 'Projected to exceed budget' :
                                        'Already over budget'}
                            </p>
                        </CardContent>
                    </Card>

                    {summary && (
                        <>
                            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-focal-blue-500">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{currencySymbol}{summary.totalSpend.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Across {summary.totalTx} transactions
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{currencySymbol}{summary.avgTx.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Per expense entry
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Top Category (Monthly)</CardTitle>
                                    <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold truncate">
                                        {summary.topCategory ? summary.topCategory.category : "N/A"}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {summary.topCategory ? `${currencySymbol}${summary.topCategory.total.toFixed(2)} spent` : "No data"}
                                    </div>
                                    {trends && (
                                        <div className={`text-xs mt-2 font-medium ${trends.percentageChange > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                            {trends.percentageChange > 0 ? (
                                                <>Spending {trends.percentageChange.toFixed(0)}% more than last month</>
                                            ) : trends.percentageChange < 0 ? (
                                                <>Spending {Math.abs(trends.percentageChange).toFixed(0)}% less than last month</>
                                            ) : (
                                                <>Same spending as last month</>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <Card className="col-span-1 shadow-md">
                    <CardHeader>
                        <CardTitle>Spending by Category</CardTitle>
                        <CardDescription>Where your money goes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.categoryBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="total"
                                    >
                                        {stats.categoryBreakdown.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Trend */}
                <Card className="col-span-1 shadow-md">
                    <CardHeader>
                        <CardTitle>Monthly Trend</CardTitle>
                        <CardDescription>Spending over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.monthlySpending} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', opacity: 0.7 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', opacity: 0.7 }}
                                        tickFormatter={(value) => `${currencySymbol}${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                        formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Total Spent']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar
                                        dataKey="total"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                        barSize={40}
                                    >
                                        {stats.monthlySpending.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[0]} /> // Use consistent blue or varying if desired
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
