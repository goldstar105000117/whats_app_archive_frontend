import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

export const useWebSocket = () => {
    const { token, isAuthenticated } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [whatsappStatus, setWhatsappStatus] = useState({
        connected: false,
        phoneNumber: null,
        lastUsed: null
    });

    useEffect(() => {
        if (!isAuthenticated || !token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling']
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('Connected to WebSocket');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
            setConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            toast.error('Connection error. Please refresh the page.');
        });

        // WhatsApp events
        socket.on('qr', (data) => {
            console.log('QR code received');
            setQrCode(data.qr);
            toast.success('QR code generated! Please scan with your phone.');
        });

        socket.on('ready', (data) => {
            console.log('WhatsApp client ready:', data);
            setWhatsappStatus({
                connected: true,
                phoneNumber: data.phoneNumber,
                lastUsed: new Date()
            });
            setQrCode(null);
            toast.success(`WhatsApp connected! (${data.phoneNumber})`);
        });

        socket.on('authenticated', () => {
            console.log('WhatsApp authenticated');
            toast.success('WhatsApp authenticated successfully!');
        });

        socket.on('auth_failure', (data) => {
            console.error('WhatsApp authentication failed:', data);
            toast.error('WhatsApp authentication failed. Please try again.');
            setQrCode(null);
        });

        socket.on('disconnected', (data) => {
            console.log('WhatsApp disconnected:', data);
            setWhatsappStatus({
                connected: false,
                phoneNumber: null,
                lastUsed: null
            });
            setQrCode(null);
            toast.error('WhatsApp disconnected.');
        });

        socket.on('new_message', (data) => {
            console.log('New message received:', data);
            // Handle new message (you can add custom logic here)
        });

        // Enhanced new message notification handler
        socket.on('new_message_notification', (data) => {
            console.log('New message notification:', data);

            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
                const notification = new Notification(
                    `${data.sender.name}${data.chat.isGroup ? ` (${data.chat.name})` : ''}`,
                    {
                        body: data.preview,
                        icon: data.sender.profilePicUrl || '/whatsapp-icon.png',
                        badge: '/whatsapp-icon.png',
                        tag: `whatsapp-${data.chat.id}`, // Prevent duplicate notifications
                        requireInteraction: false,
                        silent: false
                    }
                );

                // Auto-close after 5 seconds
                setTimeout(() => notification.close(), 5000);

                // Handle notification click
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    // You could also navigate to the specific chat here
                };
            }

            // Show in-app toast notification
            toast.success(
                `💬 ${data.sender.name}${data.chat.isGroup ? ` (${data.chat.name})` : ''}: ${data.preview}`,
                {
                    duration: 4000,
                    style: {
                        background: '#075E54',
                        color: 'white',
                        borderRadius: '8px'
                    },
                    iconTheme: {
                        primary: '#25D366',
                        secondary: 'white'
                    }
                }
            );

            // Update page title to show unread count (optional)
            const currentTitle = document.title;
            if (!currentTitle.includes('(')) {
                document.title = `(1) ${currentTitle}`;
            } else {
                const match = currentTitle.match(/\((\d+)\)/);
                if (match) {
                    const count = parseInt(match[1]) + 1;
                    document.title = currentTitle.replace(/\(\d+\)/, `(${count})`);
                }
            }
        });

        // Add new event listeners for background message fetching
        socket.on('fetch_messages_complete', (data) => {
            console.log('Message fetching completed:', data);
            toast.success(`✅ ${data.message}`);
            // Reload the page data
            window.location.reload();
        });

        socket.on('fetch_messages_error', (data) => {
            console.error('Message fetching failed:', data);
            toast.error(`❌ ${data.error}: ${data.details}`);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            toast.error('An error occurred. Please try again.');
        });

        // Cleanup function
        return () => {
            if (socket) {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('connect_error');
                socket.off('qr');
                socket.off('ready');
                socket.off('authenticated');
                socket.off('auth_failure');
                socket.off('disconnected');
                socket.off('new_message');
                socket.off('new_message_notification');
                socket.off('fetch_messages_complete');
                socket.off('fetch_messages_error');
                socket.off('error');
                socket.disconnect();
            }
        };
    }, [token, isAuthenticated]);

    const emit = (event, data) => {
        if (socketRef.current && connected) {
            socketRef.current.emit(event, data);
        }
    };

    const joinRoom = (room) => {
        emit('join_room', room);
    };

    const leaveRoom = (room) => {
        emit('leave_room', room);
    };

    return {
        socket: socketRef.current,
        connected,
        qrCode,
        whatsappStatus,
        emit,
        joinRoom,
        leaveRoom,
        clearQrCode: () => setQrCode(null)
    };
};