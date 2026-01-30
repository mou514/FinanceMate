import {
    ShoppingCart,
    Home,
    Zap,
    Car,
    Plane,
    Heart,
    Briefcase,
    GraduationCap,
    Smartphone,
    Shirt,
    Coffee,
    Film,
    Music,
    Dumbbell,
    Gift,
    Wrench,
    Sparkles,
    type LucideIcon
} from 'lucide-react';

// Map of category names to icons
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    // Default categories
    'Food & Drink': Coffee,
    'Transportation': Car,
    'Shopping': ShoppingCart,
    'Entertainment': Film,
    'Utilities': Zap,
    'Healthcare': Heart,
    'Travel': Plane,
    'Housing': Home,
    'Education': GraduationCap,
    'Personal Care': Sparkles,
    'Clothing': Shirt,
    'Technology': Smartphone,
    'Fitness': Dumbbell,
    'Gifts': Gift,
    'Business': Briefcase,
    'Maintenance': Wrench,
    'Music': Music,
    'Other': Sparkles,
};

// Available icons for selection
export const AVAILABLE_ICONS = [
    { name: 'Coffee', icon: Coffee, label: 'Food & Drink' },
    { name: 'ShoppingCart', icon: ShoppingCart, label: 'Shopping' },
    { name: 'Car', icon: Car, label: 'Transportation' },
    { name: 'Plane', icon: Plane, label: 'Travel' },
    { name: 'Home', icon: Home, label: 'Housing' },
    { name: 'Zap', icon: Zap, label: 'Utilities' },
    { name: 'Heart', icon: Heart, label: 'Healthcare' },
    { name: 'Briefcase', icon: Briefcase, label: 'Business' },
    { name: 'GraduationCap', icon: GraduationCap, label: 'Education' },
    { name: 'Smartphone', icon: Smartphone, label: 'Technology' },
    { name: 'Shirt', icon: Shirt, label: 'Clothing' },
    { name: 'Film', icon: Film, label: 'Entertainment' },
    { name: 'Music', icon: Music, label: 'Music' },
    { name: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
    { name: 'Gift', icon: Gift, label: 'Gifts' },
    { name: 'Wrench', icon: Wrench, label: 'Maintenance' },
    { name: 'Sparkles', icon: Sparkles, label: 'Other' },
];

// Get icon component by name
export function getIconByName(iconName?: string | null): LucideIcon {
    if (!iconName) return Sparkles;
    const iconEntry = AVAILABLE_ICONS.find(i => i.name === iconName);
    return iconEntry?.icon || Sparkles;
}

// Get icon for category (by name or default mapping)
export function getCategoryIcon(categoryName: string, customIcon?: string | null): LucideIcon {
    if (customIcon) {
        return getIconByName(customIcon);
    }
    return CATEGORY_ICONS[categoryName] || Sparkles;
}
