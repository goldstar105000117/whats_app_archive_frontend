import React, { useState, useEffect } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

const NotificationSetup = () => {
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Show banner if notifications not granted and not denied
        if (notificationPermission === 'default') {
            setShowBanner(true);
        }
    }, [notificationPermission]);

    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                setShowBanner(false);
                // Show a test notification
                new Notification('WhatsApp Archive', {
                    body: 'Notifications enabled! You\'ll now receive real-time message alerts.',
                    icon: '/whatsapp-icon.png'
                });
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    if (!showBanner || notificationPermission === 'granted') {
        return null;
    }

    return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <BellIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                        Enable Notifications
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                        Get instant notifications when you receive new WhatsApp messages, even when this tab isn't active.
                    </p>
                    <div className="mt-3 flex space-x-3">
                        <button
                            onClick={requestNotificationPermission}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-800 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Enable Notifications
                        </button>
                        <button
                            onClick={() => setShowBanner(false)}
                            className="text-sm text-green-600 hover:text-green-500"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
                <div className="ml-auto flex-shrink-0">
                    <button
                        onClick={() => setShowBanner(false)}
                        className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSetup;