export type ProductDto = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    color: string;
    style: string;
    size: string;
    imageUrls: string[];
    isFeatured: boolean;
    isActive: boolean;
    averageRating: number | null;
    reviewCount: number;
    businessId: string;
    sellerName?: string;
    sellerUserId?: string;
    sellerAvatarUrl?: string;
    stockQuantity?: number;
};

export type ProductListQuery = {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    color?: string;
    style?: string;
    minPrice?: number;
    maxPrice?: number;
};

export type WishlistItemDto = {
    productId: string;
    addedAt: string;
};
