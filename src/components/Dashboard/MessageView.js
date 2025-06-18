import React, { useState, useEffect, useRef } from 'react';
import {
    MagnifyingGlassIcon,
    ChatBubbleLeftIcon,
    ArrowDownIcon,
    ClockIcon,
    UsersIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { messageService } from '../../services/whatsapp';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const MessageView = ({ chat, messages, setMessages }) => {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        if (chat) {
            loadMessages(chat.id, 0, true);
        } else {
            setMessages([]);
        }
    }, [chat]);

    useEffect(() => {
        if (searchTerm.length >= 2) {
            performSearch();
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const loadMessages = async (chatId, newOffset = 0, reset = false) => {
        setLoading(true);
        try {
            const response = await messageService.getChatMessages(chatId);

            if (reset) {
                setMessages(response.messages);
                setOffset(50);
            } else {
                setMessages(prev => [...prev, ...response.messages]);
                setOffset(prev => prev + 50);
            }

            setHasMore(response.messages.length === 50);
        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreMessages = () => {
        if (chat && hasMore && !loading) {
            loadMessages(chat.id, offset);
        }
    };

    const performSearch = async () => {
        try {
            const response = await messageService.searchMessages(searchTerm, 50);
            setSearchResults(response.results);
        } catch (error) {
            console.error('Error searching messages:', error);
            toast.error('Search failed');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (timestamp) => {
        try {
            const date = new Date(parseInt(timestamp));
            return format(date, 'MMM dd, yyyy HH:mm');
        } catch (error) {
            return 'Unknown time';
        }
    };

    const formatMessageBody = (body) => {
        if (!body) return '';

        // Simple URL detection and linking
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return body.replace(urlRegex, '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>');
    };

    // Function to parse and get participants
    const getParticipants = () => {
        if (!chat || !chat.participants) return [];

        if (typeof chat.participants != 'string') {
            return chat.participants || [];
        }

        try {
            const participants = JSON.parse(chat.participants);
            return Array.isArray(participants) ? participants : [];
        } catch (error) {
            console.error('Error parsing participants:', error);
            return [];
        }
    };

    // Format phone number for display
    const formatPhoneNumber = (number) => {
        if (!number) return '';

        // Remove any non-digit characters and format
        const cleaned = number.replace(/\D/g, '');

        // Basic formatting for international numbers
        if (cleaned.length > 10) {
            return `+${cleaned.slice(0, -10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
        } else if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }

        return number;
    };

    // Function to format sender name from WhatsApp format
    const formatSenderName = (senderName) => {
        if (!senderName) return null;

        // Split by '@' and take the first part (phone number)
        const phoneNumber = senderName.split('@')[0];

        // Add '+' prefix
        return `+${phoneNumber}`;
    };

    const MessageBubble = ({ message }) => {
        // Handle deleted/revoked messages
        if (message.message_type === 'revoked') {
            return (
                <div className={`flex ${message.from_me ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.from_me
                            ? 'bg-whatsapp-green text-white'
                            : 'bg-gray-200 text-gray-900'
                            }`}
                    >
                        {/* Display sender name for non-self messages in groups */}
                        {(!message.from_me && message.sender_name && chat.is_group) ? (
                            <div className={`text-xs mb-1 font-medium ${message.from_me ? 'text-white opacity-90' : 'text-gray-600'}`}>
                                {formatSenderName(message.sender_name)}
                            </div>
                        ) : ('')}

                        <div className="text-sm italic text-center flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2" fill="white" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            This message was deleted
                        </div>

                        <div className={`text-xs mt-1 ${message.from_me ? 'text-white opacity-80' : 'text-gray-500'}`}>
                            {formatTime(message.timestamp)}
                        </div>
                    </div>
                </div>
            );
        }

        // Handle regular messages (but only show if conditions are met)
        if ((chat.is_group && message.sender_name === 'Unknown')) {
            return null; // Don't display messages from unknown senders in groups
        }

        return (
            <div className={`flex ${message.from_me ? 'justify-end' : 'justify-start'} mb-4`}>
                <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.from_me
                        ? 'bg-whatsapp-green text-white'
                        : 'bg-gray-200 text-gray-900'
                        }`}
                >
                    {/* Display sender name for non-self messages in groups */}
                    {(!message.from_me && message.sender_name && chat.is_group) ? (
                        <div className={`text-xs mb-1 font-medium ${message.from_me ? 'text-white opacity-90' : 'text-gray-600'}`}>
                            {formatSenderName(message.sender_name)}
                        </div>
                    ) : ('')}

                    <div
                        className="text-sm break-words"
                        dangerouslySetInnerHTML={{ __html: formatMessageBody(message.body) }}
                    />

                    <div className={`text-xs mt-1 ${message.from_me ? 'text-white opacity-80' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                    </div>
                </div>
            </div>
        );
    };

    const SearchResultItem = ({ result }) => (
        <div className="p-3 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-start space-x-3">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                            {result.chat_name}
                        </span>
                        <span className="text-xs text-gray-500">
                            {formatTime(result.timestamp)}
                        </span>
                    </div>

                    {result.sender_name && (
                        <div className="text-xs text-gray-600 mb-1">
                            {result.sender_name}
                        </div>
                    )}

                    <div
                        className="text-sm text-gray-800"
                        dangerouslySetInnerHTML={{ __html: formatMessageBody(result.body) }}
                    />
                </div>
            </div>
        </div>
    );

    const ParticipantsList = ({ participants }) => (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Participants ({participants.length})
                </h4>
                <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    {showParticipants ? (
                        <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                    )}
                </button>
            </div>

            {showParticipants && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {participants.map((participant, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-whatsapp-green rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                        {participant.name ? participant.name.charAt(0).toUpperCase() :
                                            participant.number ? participant.number.slice(-2) : '?'}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">
                                        {formatPhoneNumber(participant.number)}
                                    </div>
                                </div>
                            </div>
                            {participant.isAdmin && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    Admin
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (!chat) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a chat to view messages
                    </h3>
                    <p className="text-gray-500">
                        Choose a chat from the sidebar to start viewing your archived messages
                    </p>
                </div>
            </div>
        );
    }

    const participants = getParticipants();

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {chat.chat_name}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {chat.is_group ? `Group • ${chat.participant_count} members` : 'Individual chat'} •
                            {messages.length} messages loaded
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        {(chat.is_group && participants.length > 0) ? (
                            <button
                                onClick={() => setShowParticipants(!showParticipants)}
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                                title="Show participants"
                            >
                                <UsersIcon className="h-5 w-5" />
                            </button>
                        ) : ''}

                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={`p-2 rounded-md hover:bg-gray-100 ${showSearch ? 'bg-whatsapp-green text-white' : 'text-gray-500'}`}
                        >
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Participants List */}
                {(chat.is_group && participants.length > 0) ? (
                    <ParticipantsList participants={participants} />
                ) : ''}

                {/* Search Bar */}
                {showSearch && (
                    <div className="mt-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-whatsapp-green focus:border-whatsapp-green"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {showSearch && searchTerm.length >= 2 ? (
                    /* Search Results */
                    <div className="h-full overflow-y-auto">
                        <div className="p-4 bg-blue-50 border-b border-blue-100">
                            <p className="text-sm text-blue-800">
                                {searchResults.length} results for "{searchTerm}"
                            </p>
                        </div>

                        {searchResults.length === 0 ? (
                            <div className="p-8 text-center">
                                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-sm font-medium text-gray-900 mb-1">No results found</h3>
                                <p className="text-sm text-gray-500">
                                    Try a different search term
                                </p>
                            </div>
                        ) : (
                            <div>
                                {searchResults.map((result, index) => (
                                    <SearchResultItem key={index} result={result} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Messages */
                    <div
                        ref={messagesContainerRef}
                        className="h-full overflow-y-auto p-4 bg-gray-50"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.1"%3E%3Cpath d="m0 40l40-40h-40v40z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
                    >
                        {loading && messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading messages...</p>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No messages yet
                                    </h3>
                                    <p className="text-gray-500">
                                        Messages will appear here once you fetch them from WhatsApp
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Messages */}
                                <div className="space-y-1">
                                    {messages.map((message, index) => (
                                        <MessageBubble key={index} message={message} />
                                    ))}
                                </div>

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>
                            Last updated: {chat.last_message_time ? formatTime(new Date(chat.last_message_time).getTime()) : 'Never'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageView;