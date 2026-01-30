// Tailwind color palette for categories
export const CATEGORY_COLORS = [
    { name: 'Red', value: 'rgb(239, 68, 68)', tw: 'bg-red-500' },
    { name: 'Orange', value: 'rgb(249, 115, 22)', tw: 'bg-orange-500' },
    { name: 'Amber', value: 'rgb(245, 158, 11)', tw: 'bg-amber-500' },
    { name: 'Yellow', value: 'rgb(234, 179, 8)', tw: 'bg-yellow-500' },
    { name: 'Lime', value: 'rgb(132, 204, 22)', tw: 'bg-lime-500' },
    { name: 'Green', value: 'rgb(34, 197, 94)', tw: 'bg-green-500' },
    { name: 'Emerald', value: 'rgb(16, 185, 129)', tw: 'bg-emerald-500' },
    { name: 'Teal', value: 'rgb(20, 184, 166)', tw: 'bg-teal-500' },
    { name: 'Cyan', value: 'rgb(6, 182, 212)', tw: 'bg-cyan-500' },
    { name: 'Sky', value: 'rgb(14, 165, 233)', tw: 'bg-sky-500' },
    { name: 'Blue', value: 'rgb(59, 130, 246)', tw: 'bg-blue-500' },
    { name: 'Indigo', value: 'rgb(99, 102, 241)', tw: 'bg-indigo-500' },
    { name: 'Violet', value: 'rgb(139, 92, 246)', tw: 'bg-violet-500' },
    { name: 'Purple', value: 'rgb(168, 85, 247)', tw: 'bg-purple-500' },
    { name: 'Fuchsia', value: 'rgb(217, 70, 239)', tw: 'bg-fuchsia-500' },
    { name: 'Pink', value: 'rgb(236, 72, 153)', tw: 'bg-pink-500' },
    { name: 'Rose', value: 'rgb(244, 63, 94)', tw: 'bg-rose-500' },
    { name: 'Slate', value: 'rgb(100, 116, 139)', tw: 'bg-slate-500' },
    { name: 'Gray', value: 'rgb(107, 114, 128)', tw: 'bg-gray-500' },
    { name: 'Zinc', value: 'rgb(113, 113, 122)', tw: 'bg-zinc-500' },
];

// Get color object by value
export function getColorByValue(colorValue?: string | null) {
    if (!colorValue) return CATEGORY_COLORS[10]; // Default to Blue
    return CATEGORY_COLORS.find(c => c.value === colorValue) || CATEGORY_COLORS[10];
}

// Get Tailwind class for color
export function getColorClass(colorValue?: string | null): string {
    const color = getColorByValue(colorValue);
    return color.tw;
}
