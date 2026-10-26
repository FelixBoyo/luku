import React, { useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { createReturn } from '../store/slices/returnsSlice';
import { Order } from '../types';
import Button from './common/Button';
import { uploadProductImage } from '../services/imageService';
import { showToast } from '../store/slices/toastSlice';
import { trackEvent } from '../analytics/events';

interface ReturnRequestProps {
    order: Order;
    onSuccess: () => void;
    onCancel: () => void;
}

const ReturnRequest: React.FC<ReturnRequestProps> = ({ order, onSuccess, onCancel }) => {
    const dispatch = useAppDispatch();
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const returnReasons = [
        'Defective/Damaged',
        'Wrong Item',
        'Not as Described',
        "Doesn't Fit",
        'Changed My Mind',
        'Other',
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setPhotos([...photos, ...files]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) {
            dispatch(showToast({
                type: 'error',
                message: 'Please select a reason for return'
            }));
            return;
        }

        setUploading(true);
        try {
            let photoUrls: string[] = [];
            
            // Upload photos if any
            if (photos.length > 0) {
                const uploadPromises = photos.map(file => 
                    uploadProductImage(file, 'returns')
                );
                photoUrls = await Promise.all(uploadPromises);
            }

            await dispatch(
                createReturn({
                    order_id: order.id,
                    reason,
                    notes: notes || undefined,
                    return_photos: photoUrls.length > 0 ? photoUrls : undefined,
                })
            ).unwrap();

            trackEvent('return_requested', {
                orderId: order.id,
                productId: order.product_id,
                reasonCategory: reason,
            });

            dispatch(showToast({
                type: 'success',
                message: 'Return request submitted successfully!'
            }));
            onSuccess();
        } catch (error: any) {
            dispatch(showToast({
                type: 'error',
                message: error.message || 'Failed to submit return request. Please try again.'
            }));
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Return</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Return <span className="text-red-500">*</span>
                </label>
                <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">Select a reason</option>
                    {returnReasons.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Please provide any additional details..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (Optional)
                </label>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                {photos.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                        {photos.map((photo, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={URL.createObjectURL(photo)}
                                    alt={`Return photo ${index + 1}`}
                                    className="w-20 h-20 object-cover rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex space-x-4">
                <Button type="button" onClick={onCancel} variant="secondary">
                    Cancel
                </Button>
                <Button type="submit" disabled={uploading || !reason}>
                    {uploading ? 'Submitting...' : 'Submit Return Request'}
                </Button>
            </div>
        </form>
    );
};

export default ReturnRequest;
