import React, { useState } from 'react';
import {
    MagnifyingGlassIcon,
    UserIcon,
    UserGroupIcon,
    ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ChatList = ({ chats, selectedChat, onSelectChat }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChats = chats.filter(chat =>
        chat.chat_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (error) {
            return '';
        }
    };

    const ChatItem = ({ chat }) => (
        <div
            onClick={() => onSelectChat(chat)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat?.id === chat.id ? 'bg-whatsapp-green-light border-whatsapp-green' : ''
                }`}
        >
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {chat.is_group ? (
                            <UserGroupIcon className="h-6 w-6 text-gray-600" />
                        ) : (
                            <UserIcon className="h-6 w-6 text-gray-600" />
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {chat.chat_name || 'Unknown Chat'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {formatDate(chat.last_message_time)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                                {chat.message_count} messages
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-whatsapp-green focus:border-whatsapp-green"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                    <div className="p-8 text-center">
                        <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {searchTerm ? 'No chats found' : 'No chats available'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {searchTerm
                                ? 'Try adjusting your search term'
                                : 'Connect WhatsApp and fetch messages to see your chats'
                            }
                        </p>
                    </div>
                ) : (
                    <div>
                        {filteredChats.map((chat) => (
                            <ChatItem key={chat.id} chat={chat} />
                        ))}
                    </div>
                )}
            </div>

            {/* Summary */}
            {filteredChats.length > 0 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                        Showing {filteredChats.length} of {chats.length} chats
                    </p>
                </div>
            )}
        </div>
    );
};

export default ChatList;