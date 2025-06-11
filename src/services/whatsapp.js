import api from './api';

// Global request tracking to prevent duplicate requests
let activeCheckSessionRequest = null;

export const whatsappService = {
    // New method to check existing session with proper cancellation
    checkSession: async (abortSignal = null) => {
        // Cancel any existing request
        if (activeCheckSessionRequest) {
            console.log('Cancelling existing check-session request');
            activeCheckSessionRequest.abort();
        }

        // Create new abort controller if none provided
        const controller = abortSignal ? { signal: abortSignal } : new AbortController();
        const signal = controller.signal || controller;

        activeCheckSessionRequest = controller;

        try {
            console.log('Making check-session request...');

            const response = await api.get('/whatsapp/check-session', {
                signal,
                timeout: 10000 // 10 second timeout
            });

            console.log('Check-session request completed successfully');
            activeCheckSessionRequest = null;
            return response.data;

        } catch (error) {
            activeCheckSessionRequest = null;

            if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                console.log('Check-session request was cancelled');
                throw new Error('Request cancelled');
            }

            console.error('Check-session request failed:', error);
            throw error;
        }
    },

    initialize: async () => {
        const response = await api.post('/whatsapp/initialize');
        return response.data;
    },

    getQRCode: async () => {
        const response = await api.get('/whatsapp/qr');
        return response.data;
    },

    // Updated to support unlimited fetching with background processing
    fetchMessages: async () => {

        const response = await api.post('/whatsapp/fetch-messages', {}, {
        });
        return response.data;
    },

    getStatus: async () => {
        const response = await api.get('/whatsapp/status');
        return response.data;
    },

    disconnect: async () => {
        const response = await api.post('/whatsapp/disconnect');
        return response.data;
    },

    deleteSession: async () => {
        const response = await api.delete('/whatsapp/session');
        return response.data;
    }
};

export const messageService = {
    getChats: async () => {
        const response = await api.get('/messages/chats');
        return response.data;
    },

    getChatMessages: async (chatId) => {
        const response = await api.get(`/messages/chats/${chatId}/messages`, {
        });
        return response.data;
    },

    searchMessages: async (searchTerm, limit = 20) => {
        const response = await api.get('/messages/search', {
            params: { q: searchTerm, limit }
        });
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/messages/stats');
        return response.data;
    },

    exportData: async (format = 'json') => {
        const response = await api.get('/messages/export', {
            params: { format },
            responseType: 'blob'
        });
        return response;
    },

    deleteAllData: async () => {
        const response = await api.delete('/messages/all');
        return response.data;
    }
};