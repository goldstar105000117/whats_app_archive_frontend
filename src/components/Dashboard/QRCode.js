import React from 'react';
import { QrCodeIcon } from '@heroicons/react/24/outline';

const QRCode = ({ qrCode }) => {
    if (!qrCode) return null;

    return (
        <div className="mt-8">
            <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <QrCodeIcon className="h-8 w-8 text-whatsapp-green mr-2" />
                        <h3 className="text-xl font-semibold text-gray-900">Scan QR Code</h3>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Open WhatsApp on your phone and scan this QR code to connect your account
                    </p>

                    <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-inner border-2 border-gray-100">
                            <img
                                src={qrCode}
                                alt="WhatsApp QR Code"
                                className="w-64 h-64 object-contain"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">How to scan:</h4>
                        <ol className="text-sm text-blue-800 text-left space-y-1">
                            <li>1. Open WhatsApp on your phone</li>
                            <li>2. Tap Menu (⋮) or Settings and select "Linked Devices"</li>
                            <li>3. Tap "Link a Device"</li>
                            <li>4. Point your phone at this screen to capture the QR code</li>
                        </ol>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> This QR code will expire in a few minutes.
                            If it expires, refresh the page to generate a new one.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCode;