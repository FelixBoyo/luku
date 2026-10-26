import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createBusinessAccount, updateBusinessAccount } from '../store/slices/businessSlice';
import { upsertBusinessKyc, fetchBusinessKyc } from '../store/slices/businessKycSlice';
import { uploadBusinessLogo, uploadBusinessBanner } from '../services/imageService';
import { supabase } from '../services/supabaseClient';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Card from './common/Card';

interface BusinessAccountRegistrationProps {
    onComplete?: () => void;
}

const BusinessAccountRegistration: React.FC<BusinessAccountRegistrationProps> = ({
    onComplete,
}) => {
    const dispatch = useAppDispatch();
    const { loading, currentBusiness } = useAppSelector((state) => state.business);
    const { data: businessKyc } = useAppSelector((state) => state.businessKyc);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        business_name: '',
        business_description: '',
        contact_email: '',
        logo_url: '',
        banner_url: '',
    });
    const [kycFormData, setKycFormData] = useState({
        legal_entity_name: '',
        address_line1: '',
        city: '',
        state_region: '',
        postal_code: '',
        country: '',
        registration_number: '',
        representative_legal_name: '',
        representative_phone: '',
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [bannerPreview, setBannerPreview] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (currentBusiness) {
            dispatch(fetchBusinessKyc(currentBusiness.id));
        }
    }, [currentBusiness?.id, dispatch]);

    useEffect(() => {
        if (businessKyc) {
            setKycFormData({
                legal_entity_name: businessKyc.legal_entity_name ?? '',
                address_line1: businessKyc.address_line1 ?? '',
                city: businessKyc.city ?? '',
                state_region: businessKyc.state_region ?? '',
                postal_code: businessKyc.postal_code ?? '',
                country: businessKyc.country ?? '',
                registration_number: businessKyc.registration_number ?? '',
                representative_legal_name: businessKyc.representative_legal_name ?? '',
                representative_phone: businessKyc.representative_phone ?? '',
            });
        }
    }, [businessKyc]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleKycInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setKycFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.business_name || !formData.contact_email) {
                setError('Please fill in all required fields');
                return;
            }
        }
        if (step === 2) {
            if (!kycFormData.legal_entity_name?.trim() || !kycFormData.address_line1?.trim() ||
                !kycFormData.city?.trim() || !kycFormData.postal_code?.trim() || !kycFormData.country?.trim() ||
                !kycFormData.representative_legal_name?.trim() || !kycFormData.representative_phone?.trim()) {
                setError('Please fill in all required business verification fields');
                return;
            }
        }
        setError(null);
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
        setError(null);
    };

    const handleSubmit = async () => {
        try {
            setError(null);

            let logoUrl = formData.logo_url;
            let bannerUrl = formData.banner_url;

            if (logoFile) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated');
                logoUrl = await uploadBusinessLogo(logoFile, user.id);
            }

            if (bannerFile) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated');
                bannerUrl = await uploadBusinessBanner(bannerFile, user.id);
            }

            let businessId: string;
            if (currentBusiness) {
                await dispatch(
                    updateBusinessAccount({
                        ...formData,
                        logo_url: logoUrl,
                        banner_url: bannerUrl,
                    })
                ).unwrap();
                businessId = currentBusiness.id;
            } else {
                const created = await dispatch(
                    createBusinessAccount({
                        business_name: formData.business_name,
                        business_description: formData.business_description,
                        contact_email: formData.contact_email,
                        logo_url: logoUrl || undefined,
                        banner_url: bannerUrl || undefined,
                    })
                ).unwrap();
                businessId = created.id;
            }

            await dispatch(
                upsertBusinessKyc({
                    business_id: businessId,
                    legal_entity_name: kycFormData.legal_entity_name.trim(),
                    address_line1: kycFormData.address_line1.trim(),
                    city: kycFormData.city.trim(),
                    state_region: kycFormData.state_region?.trim() || undefined,
                    postal_code: kycFormData.postal_code.trim(),
                    country: kycFormData.country.trim(),
                    registration_number: kycFormData.registration_number?.trim() || undefined,
                    representative_legal_name: kycFormData.representative_legal_name.trim(),
                    representative_phone: kycFormData.representative_phone.trim(),
                })
            ).unwrap();

            if (onComplete) {
                onComplete();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save business account');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {currentBusiness ? 'Update Business Account' : 'Create Business Account'}
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="business_name"
                                value={formData.business_name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter your business name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="contact_email"
                                value={formData.contact_email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="contact@yourbusiness.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Description
                            </label>
                            <textarea
                                name="business_description"
                                value={formData.business_description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Tell us about your business..."
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleNext}>Next</Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Business details for secure selling</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Legal entity name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="legal_entity_name"
                            value={kycFormData.legal_entity_name}
                            onChange={handleKycInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Registered business name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="address_line1"
                            value={kycFormData.address_line1}
                            onChange={handleKycInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                            placeholder="Street, building"
                            required
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                                type="text"
                                name="city"
                                value={kycFormData.city}
                                onChange={handleKycInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="City"
                                required
                            />
                            <input
                                type="text"
                                name="state_region"
                                value={kycFormData.state_region}
                                onChange={handleKycInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="State / Region"
                            />
                            <input
                                type="text"
                                name="postal_code"
                                value={kycFormData.postal_code}
                                onChange={handleKycInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Postal code"
                                required
                            />
                            <input
                                type="text"
                                name="country"
                                value={kycFormData.country}
                                onChange={handleKycInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Country"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Registration / Tax ID
                        </label>
                        <input
                            type="text"
                            name="registration_number"
                            value={kycFormData.registration_number}
                            onChange={handleKycInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Optional"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Representative legal name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="representative_legal_name"
                                value={kycFormData.representative_legal_name}
                                onChange={handleKycInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Representative phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="representative_phone"
                                value={kycFormData.representative_phone}
                                onChange={handleKycInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <Button onClick={handleBack} variant="secondary">Back</Button>
                        <Button onClick={handleNext}>Next</Button>
                    </div>
                </div>
                )}

                {step === 3 && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Logo
                        </label>
                        <div className="flex items-center space-x-4">
                            {logoPreview && (
                                <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    className="w-24 h-24 object-cover rounded-md"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Banner Image
                        </label>
                        <div className="space-y-2">
                            {bannerPreview && (
                                <img
                                    src={bannerPreview}
                                    alt="Banner preview"
                                    className="w-full h-32 object-cover rounded-md"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBannerChange}
                                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <Button onClick={handleBack} variant="secondary">
                            Back
                        </Button>
                        <Button onClick={handleSubmit}>
                            {currentBusiness ? 'Update Account' : 'Create Account'}
                        </Button>
                    </div>
                </div>
                )}
            </Card>
        </div>
    );
};

export default BusinessAccountRegistration;

