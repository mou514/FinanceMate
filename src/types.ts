// Shared type definitions for the application

export interface LineItem {
    description: string;
    quantity: number;
    price: number;
}

export interface Expense {
    id: string;
    merchant: string;
    date: string;
    total: number;
    lineItems: LineItem[];
    currency: string;
    category: string;
    category_id?: string;
    isRecurring?: boolean;
    recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export type ExpenseData = Omit<Expense, 'id'>;

// Types for chat feature (if needed in future)
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    id: string;
    toolCalls?: ToolCall[];
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
}

export interface ChatState {
    messages: Message[];
    sessionId: string;
    isProcessing: boolean;
    model: string;
    streamingMessage?: string;
}

export interface SessionInfo {
    id: string;
    title: string;
    createdAt: number;
    lastActive: number;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface WeatherResult {
    location: string;
    temperature: number;
    condition: string;
    humidity: number;
}

export interface MCPResult {
    content: string;
}

export interface ErrorResult {
    error: string;
}

export interface Tag {
    id: string;
    user_id: string;
    name: string;
    color?: string | null;
    created_at: number;
}

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    is_read: number;
    data?: string | null;
    created_at: number;
}

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    limit_amount: number;
    currency: string;
    period: 'monthly' | 'yearly';
    year: number;
    month: number;
    alert_threshold?: number;
    created_at: number;
    updated_at: number;
}
