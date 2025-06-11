import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    UserIcon,
    ArrowRightOnRectangleIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';

export const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <div className="h-8 w-8 bg-whatsapp-green rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m.01 1.67c4.62 0 8.24 3.62 8.24 8.24 0 4.62-3.62 8.24-8.24 8.24-1.44 0-2.84-.37-4.05-1.05l-.46-.24-3.65.96.97-3.57-.26-.48c-.72-1.21-1.1-2.63-1.1-4.06 0-4.62 3.62-8.24 8.24-8.24z" />
                                </svg>
                            </div>
                            <span className="ml-3 text-xl font-bold text-gray-900">
                                WhatsApp Archive
                            </span>
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">
                                    {user?.username}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                                    <Cog6ToothIcon className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={logout}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 hover:text-red-900 hover:bg-red-50 transition-colors"
                                >
                                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};