import React from 'react';
import Button from './common/Button';

interface DetectedItem {
    itemName: string;
    category: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

interface OutfitPreviewModalProps {
    imageUrl: string;
    detectedItems: DetectedItem[];
    onConfirmSeparate: () => void;
    onConfirmSingle: () => void;
    onCancel: () => void;
    isProcessing?: boolean;
}

const OutfitPreviewModal: React.FC<OutfitPreviewModalProps> = ({
    imageUrl,
    detectedItems,
    onConfirmSeparate,
    onConfirmSingle,
    onCancel,
    isProcessing = false,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Multiple Items Detected! 🎉
                    </h2>

                    <div className="mb-6">
                        <div className="relative mb-4 rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                                src={imageUrl}
                                alt="Outfit preview"
                                className="w-full h-auto"
                            />
                        </div>

                        <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-indigo-900 mb-2">
                                We detected {detectedItems.length} separate items:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                {detectedItems.map((item, index) => (
                                    <li
                                        key={index}
                                        className="text-sm text-indigo-800"
                                    >
                                        <span className="font-medium">
                                            {item.itemName}
                                        </span>{' '}
                                        ({item.category})
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            Would you like to upload these as separate clothing
                            items? This will allow you to mix and match them
                            with other items in your wardrobe.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <Button
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onConfirmSingle}
                            disabled={isProcessing}
                        >
                            Upload as Single Item
                        </Button>
                        <Button
                            onClick={onConfirmSeparate}
                            isLoading={isProcessing}
                            disabled={isProcessing}
                        >
                            Upload Separately
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutfitPreviewModal;

