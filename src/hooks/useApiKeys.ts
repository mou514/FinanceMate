import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = '/api';

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export interface DataType {
    id: string;
    name: string;
    prefix: string;
    created_at: number;
    last_used_at?: number;
    key?: string; // Only present immediately after creation
}

export const useApiKeys = () => {
    const [keys, setKeys] = useState<DataType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createdKey, setCreatedKey] = useState<DataType | null>(null);

    const fetchKeys = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/keys`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setKeys(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const createKey = async (name: string) => {
        setIsCreating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/keys`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                const data = await response.json();
                setCreatedKey(data.data); // Contains full key once
                await fetchKeys(); // Refresh list
                return { success: true, key: data.data.key };
            }
            return { success: false, error: 'Failed to create key' };
        } catch (error) {
            return { success: false, error: 'Failed to create key' };
        } finally {
            setIsCreating(false);
        }
    };

    const revokeKey = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/keys/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                await fetchKeys(); // Refresh list
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to revoke API key:', error);
            return false;
        }
    };

    return {
        keys,
        isLoading,
        isCreating,
        createKey,
        revokeKey,
        createdKey,
        clearCreatedKey: () => setCreatedKey(null),
    };
};
