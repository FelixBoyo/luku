import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { upsertSellerKyc, fetchSellerKyc } from '../store/slices/sellerKycSlice';
import Button from './common/Button';
import Spinner from './common/Spinner';

interface SellerKycFormProps {
    onComplete?: () => void;
}

const SellerKycForm: React.FC<SellerKycFormProps> = ({ onComplete }) => {
    const dispatch = useAppDispatch();
    const { data: existingKyc, loading, error } = useAppSelector((state) => state.sellerKyc);

    const [formData, setFormData] = useState({
        legal_name: '',
        phone: '',
        address_line1: '',
        city: '',
        state_region: '',
        postal_code: '',
        country: '',
        date_of_birth: '',
        id_type: '',
        id_number: '',
    });
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (existingKyc) {
            setFormData({
                legal_name: existingKyc.legal_name ?? '',
                phone: existingKyc.phone ?? '',
                address_line1: existingKyc.address_line1 ?? '',
                city: existingKyc.city ?? '',
                state_region: existingKyc.state_region ?? '',
                postal_code: existingKyc.postal_code ?? '',
                country: existingKyc.country ?? '',
                date_of_birth: existingKyc.date_of_birth ?? '',
                id_type: existingKyc.id_type ?? '',
                id_number: existingKyc.id_number ?? '',
            });
        }
    }, [existingKyc]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setSubmitError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (!formData.legal_name?.trim() || !formData.phone?.trim() || !formData.address_line1?.trim() ||
            !formData.city?.trim() || !formData.postal_code?.trim() || !formData.country?.trim()) {
            setSubmitError('Please fill in all required fields.');
            return;
        }
        try {
            await dispatch(upsertSellerKyc({
                legal_name: formData.legal_name.trim(),
                phone: formData.phone.trim(),
                address_line1: formData.address_line1.trim(),
                city: formData.city.trim(),
                state_region: formData.state_region?.trim() || undefined,
                postal_code: formData.postal_code.trim(),
                country: formData.country.trim(),
                date_of_birth: formData.date_of_birth || undefined,
                id_type: formData.id_type || undefined,
                id_number: formData.id_number?.trim() || undefined,
            })).unwrap();
            onComplete?.();
        } catch (err: any) {
            setSubmitError(err?.message ?? 'Failed to save. Please try again.');
        }
    };

    if (loading && !existingKyc) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seller verification</h2>
            <p className="text-gray-600 mb-6">
                We need a few details to keep buying and selling secure for everyone.
            </p>
            {(error || submitError) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {submitError ?? error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full legal name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="legal_name"
                        value={formData.legal_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="As on ID"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="+254..."
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="address_line1"
                        value={formData.address_line1}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Street, building"
                        required
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            City <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            State / Region
                        </label>
                        <input
                            type="text"
                            name="state_region"
                            value={formData.state_region}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Postal code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. Kenya"
                            required
                        />
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-sm text-gray-500 mb-3">Optional (for verification)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID type</label>
                            <select
                                name="id_type"
                                value={formData.id_type}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select</option>
                                <option value="national_id">National ID</option>
                                <option value="passport">Passport</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID number</label>
                        <input
                            type="text"
                            name="id_number"
                            value={formData.id_number}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" isLoading={loading}>
                        Continue
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SellerKycForm;
