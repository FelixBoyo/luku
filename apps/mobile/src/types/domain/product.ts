export type Seller = {
    id: string;
    name: string;
    rating: number;
    sales: number;
    avatarUrl?: string;
    responseRate?: number;
    responseTime?: string;
};

export type Review = {
    name: string;
    rating: number;
    comment: string;
    date: string;
    verified?: boolean;
};

export type Product = {
    id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    images?: string[];
    category: string;
    seller: Seller;
    /** Catalog owner. Cart grouping keys off this, not `seller.id`. */
    businessId?: string;
    condition?: 'New' | 'Like New' | 'Excellent' | 'Good';
    isTrending?: boolean;
    isNew?: boolean;
    rating?: number;
    reviewCount?: number;
    aiMatch?: number;
    description?: string;
    color?: string;
    size?: string;
    reviews?: Review[];
    stockQuantity?: number;
};

/** @deprecated Use Product */
export type MockProduct = Product;
/** @deprecated Use Seller */
export type MockSeller = Seller;
/** @deprecated Use Review */
export type MockReview = Review;
