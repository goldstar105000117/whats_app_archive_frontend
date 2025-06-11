import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { whatsappService, messageService } from '../../services/whatsapp';
import QRCode from './QRCode';
import ChatList from './ChatList';
import MessageView from './MessageView';
import NotificationSetup from './NotificationSetup'; // Add this import
import {
    PhoneIcon,
    QrCodeIcon,
    ChatBubbleLeftRightIcon,
    ChartBarIcon,
    ArrowDownTrayIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { connected, qrCode, whatsappStatus } = useWebSocket();
    const [currentView, setCurrentView] = useState('setup');
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Add ref to track if session check has been completed
    const sessionCheckCompleted = useRef(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (whatsappStatus.connected) {
            setCurrentView('chats');
            loadChats();
            loadStats();
        }
    }, [whatsappStatus.connected]);

    // Check for existing session on component mount
    useEffect(() => {
        let abortController = new AbortController();
        let timeoutId;

        // Only run session check once and when connected
        if (connected && !sessionCheckCompleted.current) {
            console.log('WebSocket connected, checking existing session...');
            sessionCheckCompleted.current = true; // Mark as started

            const checkSession = async () => {
                if (!mounted.current || abortController.signal.aborted) return;

                console.log('Starting session check...');
                setInitializing(true);

                try {
                    console.log('Calling whatsappService.checkSession()...');

                    const sessionStatus = await whatsappService.checkSession(abortController.signal);

                    if (!mounted.current || abortController.signal.aborted) return;

                    console.log('Session status received:', sessionStatus);

                    if (sessionStatus.hasSession && sessionStatus.isActive && sessionStatus.connected) {
                        console.log('Active session found, loading data...');

                        // Update WhatsApp status to trigger view change
                        // Since we can't directly set whatsappStatus from useWebSocket, 
                        // we need to load the data and change view manually
                        await loadChats();
                        await loadStats();
                        setCurrentView('chats');

                        // Emit a fake 'ready' event to update whatsappStatus
                        if (window.whatsappStatus) {
                            window.whatsappStatus = {
                                connected: true,
                                phoneNumber: sessionStatus.phoneNumber,
                                lastUsed: new Date()
                            };
                        }

                        toast.success(`Welcome back! Connected as ${sessionStatus.phoneNumber}`);

                    } else if (sessionStatus.hasSession && !sessionStatus.isActive) {
                        console.log('Inactive session found, trying to reconnect...');
                        toast.info('Reconnecting to your WhatsApp session...');
                        await handleInitializeWhatsApp();
                    } else {
                        console.log('No session found, showing setup view...');
                        setCurrentView('setup');
                    }
                } catch (error) {
                    if (abortController.signal.aborted || !mounted.current) {
                        console.log('Session check was cancelled or component unmounted');
                        return;
                    }

                    console.error('Error checking session:', error);

                    // Fallback: Check if user has any chats (indicating previous usage)
                    try {
                        console.log('Fallback: Checking for existing chats...');
                        const chatsResponse = await messageService.getChats();
                        if (!mounted.current || abortController.signal.aborted) return;

                        if (chatsResponse.chats && chatsResponse.chats.length > 0) {
                            console.log('Found existing chats, user has used WhatsApp before');
                            setChats(chatsResponse.chats);
                            setCurrentView('chats');
                            toast.info('Found existing chat data. Please reconnect WhatsApp if needed.');
                            await loadStats();
                        } else {
                            setCurrentView('setup');
                        }
                    } catch (chatError) {
                        if (!mounted.current || abortController.signal.aborted) return;
                        console.error('Fallback also failed:', chatError);
                        setCurrentView('setup');
                    }
                } finally {
                    if (mounted.current && !abortController.signal.aborted) {
                        setInitializing(false);
                    }
                }
            };

            // Add a delay to prevent immediate duplicate calls
            timeoutId = setTimeout(checkSession, 200);
        } else if (!connected) {
            console.log('WebSocket not connected yet, waiting...');
            setInitializing(false);
            sessionCheckCompleted.current = false; // Reset for next connection
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            abortController.abort();
        };
    }, [connected]); // Only depend on connected state

    // Add this to your Dashboard component for real-time chat updates

    // In your Dashboard component, add this useEffect:
    useEffect(() => {
        // Listen for new messages and update chat list
        const handleNewMessage = (data) => {
            console.log('Real-time message update:', data);

            // Update the current chat if it's the active one
            if (selectedChat && selectedChat.chat_id === data.chatId) {
                setMessages(prevMessages => [data.message, ...prevMessages]);
            }

            // Update chat list to show latest message
            setChats(prevChats => {
                const updatedChats = prevChats.map(chat => {
                    if (chat.chat_id === data.chatId) {
                        return {
                            ...chat,
                            last_message_time: new Date().toISOString(),
                            message_count: parseInt(chat.message_count) + 1
                        };
                    }
                    return chat;
                });

                // Sort chats by last message time
                return updatedChats.sort((a, b) =>
                    new Date(b.last_message_time) - new Date(a.last_message_time)
                );
            });

            // Update stats
            if (stats) {
                setStats(prevStats => ({
                    ...prevStats,
                    total_messages: (parseInt(prevStats.total_messages) + 1).toString()
                }));
            }
        };

        // Add event listener if socket is available
        if (window.socket) {
            window.socket.on('new_message', handleNewMessage);

            return () => {
                window.socket.off('new_message', handleNewMessage);
            };
        }
    }, [selectedChat, stats]);

    // Also add this to clear page title when user focuses on the page:
    useEffect(() => {
        const handleFocus = () => {
            document.title = 'WhatsApp Archive';
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                document.title = 'WhatsApp Archive';
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const loadChats = async () => {
        try {
            const response = await messageService.getChats();
            setChats(response.chats);
        } catch (error) {
            console.error('Error loading chats:', error);
            toast.error('Failed to load chats');
        }
    };

    const loadStats = async () => {
        try {
            const response = await messageService.getStats();
            setStats(response.stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleInitializeWhatsApp = async () => {
        setLoading(true);
        try {
            await whatsappService.initialize();
            toast.success('WhatsApp initialization started');
        } catch (error) {
            toast.error('Failed to initialize WhatsApp');
        } finally {
            setLoading(false);
        }
    };

    const handleFetchMessages = async () => {
        setLoading(true);
        try {

            const response = await whatsappService.fetchMessages();

            if (response.status === 'processing') {
                toast.success('Message fetching started! You will be notified when complete.');
                // Keep loading state until WebSocket confirms completion
            } else {
                // Immediate completion (for small fetches)
                await loadChats();
                await loadStats();
                toast.success('Messages fetched successfully');
                setLoading(false);
            }

        } catch (error) {
            toast.error('Failed to start message fetching');
            setLoading(false);
        }
    };

    // const handleDisconnect = async () => {
    //     try {
    //         await whatsappService.disconnect();
    //         setCurrentView('setup');
    //         setChats([]);
    //         setSelectedChat(null);
    //         setMessages([]);
    //         toast.success('WhatsApp disconnected');
    //     } catch (error) {
    //         toast.error('Failed to disconnect');
    //     }
    // };

    const handleExportData = async () => {
        try {
            const response = await messageService.exportData('json');
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `whatsapp-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Data exported successfully');
        } catch (error) {
            toast.error('Failed to export data');
        }
    };

    const handleDeleteAllData = async () => {
        if (window.confirm('Are you sure you want to delete all chat data? This action cannot be undone.')) {
            try {
                await messageService.deleteAllData();
                setChats([]);
                setSelectedChat(null);
                setMessages([]);
                setStats(null);
                toast.success('All data deleted successfully');
            } catch (error) {
                toast.error('Failed to delete data');
            }
        }
    };

    const renderSetupView = () => {
        if (initializing) {
            return (
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="mx-auto h-16 w-16 bg-whatsapp-green rounded-full flex items-center justify-center mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checking WhatsApp Connection</h1>
                        <p className="text-gray-600">
                            Please wait while we check for existing sessions...
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-whatsapp-green rounded-full flex items-center justify-center mb-4">
                        <PhoneIcon className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect WhatsApp</h1>
                    <p className="text-gray-600">
                        Connect your WhatsApp account to start archiving your messages
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="font-medium">WebSocket Connection</span>
                            </div>
                            <span className={`text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
                                {connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className={`h-3 w-3 rounded-full ${whatsappStatus.connected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <span className="font-medium">WhatsApp Status</span>
                            </div>
                            <span className={`text-sm ${whatsappStatus.connected ? 'text-green-600' : 'text-yellow-600'}`}>
                                {whatsappStatus.connected ? `Connected (${whatsappStatus.phoneNumber})` : 'Not Connected'}
                            </span>
                        </div>

                        {!whatsappStatus.connected && (
                            <div className="text-center">
                                <button
                                    onClick={handleInitializeWhatsApp}
                                    disabled={loading || !connected}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-whatsapp-green hover:bg-whatsapp-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-green disabled:opacity-50 disabled:cursor-not-allowed mr-4"
                                >
                                    <QrCodeIcon className="h-5 w-5 mr-2" />
                                    {loading ? 'Initializing...' : 'Generate QR Code'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {qrCode && <QRCode qrCode={qrCode} />}
            </div>
        );
    };

    const renderChatsView = () => (
        <div className="flex h-full">
            <div className="w-1/3 border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleFetchMessages()}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-2 border border-whatsapp-green text-sm font-medium rounded-md text-whatsapp-green bg-white hover:bg-whatsapp-green hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-green disabled:opacity-50"
                                title="Fetch ALL messages (may take a while)"
                            >
                                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                                {loading ? 'Fetching...' : 'Fetch All'}
                            </button>
                        </div>
                    </div>

                    {stats && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{stats.total_chats}</div>
                                <div className="text-sm text-blue-600">Total Chats</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{stats.total_messages}</div>
                                <div className="text-sm text-green-600">Total Messages</div>
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-2">
                        <button
                            onClick={handleExportData}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            Export
                        </button>
                        {/* <button
                            onClick={handleDeleteAllData}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete All
                        </button> */}
                    </div>
                </div>

                <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    onSelectChat={setSelectedChat}
                />
            </div>

            <div className="flex-1">
                <MessageView
                    chat={selectedChat}
                    messages={messages}
                    setMessages={setMessages}
                />
            </div>
        </div>
    );

    return (
        <div className="h-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Archive</h1>
                        {(whatsappStatus.connected || currentView === 'chats') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Connected
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {(whatsappStatus.connected || currentView === 'chats') ? renderChatsView() : renderSetupView()}
            </div>
        </div>
    );
};

export default Dashboard;