import { Notification } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export const notificationService = {
    async getNotifications(limit = 20, offset = 0): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications?limit=${limit}&offset=${offset}`, {
                headers: getAuthHeaders(),
            });
            const result = await response.json();
            return { success: result.success, data: result.data, error: result.error };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async getUnreadCount(): Promise<{ success: boolean; count?: number; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
                headers: getAuthHeaders(),
            });
            const result = await response.json();
            return { success: result.success, count: result.data.count, error: result.error };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async markRead(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });
            const result = await response.json();
            return { success: result.success, error: result.error };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async markAllRead(): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });
            const result = await response.json();
            return { success: result.success, error: result.error };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
