import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Product } from '../types';
import Button from './common/Button';

interface ContactSellerProps {
    product: Product;
    onClose: () => void;
}

const ContactSeller: React.FC<ContactSellerProps> = ({ product, onClose }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message) {
            alert('Please fill in all fields');
            return;
        }

        setSending(true);
        try {
            // Get business account info
            const { data: business } = await supabase
                .from('business_accounts')
                .select('business_name, contact_email')
                .eq('id', product.business_id)
                .single();

            if (!business) {
                throw new Error('Business account not found');
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // In a real app, you'd send an email here
            // For now, we'll just log it and show success
            console.log('Contact seller message:', {
                to: business.contact_email,
                from: user.email,
                subject: `[LUKU] ${subject}`,
                message: `Product: ${product.name}\n\n${message}`,
            });

            // You could integrate with an email service here
            // For now, we'll use mailto as a fallback
            const mailtoLink = `mailto:${business.contact_email}?subject=${encodeURIComponent(`[LUKU] ${subject}`)}&body=${encodeURIComponent(`Product: ${product.name}\n\n${message}`)}`;
            window.location.href = mailtoLink;

            alert('Opening your email client to contact the seller.');
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to contact seller');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Contact Seller</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Product:</p>
                <p className="font-medium text-gray-900">{product.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        placeholder="e.g., Question about sizing"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={6}
                        placeholder="Ask your question about this product..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div className="flex space-x-4">
                    <Button type="button" onClick={onClose} variant="secondary">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={sending || !subject || !message}>
                        {sending ? 'Sending...' : 'Send Message'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ContactSeller;
