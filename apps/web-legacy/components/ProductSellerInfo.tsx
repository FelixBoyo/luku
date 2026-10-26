import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Product } from '../types';
import SellerVerificationBadge from './SellerVerificationBadge';

interface ProductSellerInfoProps {
    product: Product;
    showBadgeOnly?: boolean;
    className?: string;
}

interface BusinessInfo {
    business_name: string;
    is_verified: boolean;
}

const ProductSellerInfo: React.FC<ProductSellerInfoProps> = ({
    product,
    showBadgeOnly = false,
    className = '',
}) => {
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBusinessInfo = async () => {
            try {
                const { data, error } = await supabase
                    .from('business_accounts')
                    .select('business_name, is_verified')
                    .eq('id', product.business_id)
                    .single();

                if (error) throw error;
                setBusinessInfo(data);
            } catch (error) {
                console.error('Failed to fetch business info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBusinessInfo();
    }, [product.business_id]);

    if (loading || !businessInfo) {
        return null;
    }

    if (showBadgeOnly) {
        return (
            <SellerVerificationBadge
                isVerified={businessInfo.is_verified}
                businessName={businessInfo.business_name}
                className={className}
                size="sm"
            />
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm text-gray-600">Sold by {businessInfo.business_name}</span>
            <SellerVerificationBadge
                isVerified={businessInfo.is_verified}
                businessName={undefined}
                size="sm"
            />
        </div>
    );
};

export default ProductSellerInfo;
