export const EXPENSE_CATEGORIES = [
    "Food & Drink",
    "Groceries",
    "Travel",
    "Shopping",
    "Utilities",
    "Entertainment",
    "Health & Fitness",
    "Housing",
    "Transportation",
    "Education",
    "Personal Care",
    "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
