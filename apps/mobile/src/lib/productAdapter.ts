import type { ProductDto } from '../../../../packages/contracts/src/products';
import type { Product } from '../types/domain/product';

export const toDisplayProduct = (p: Product): Product => p;

export const dtoToDisplayProduct = (p: ProductDto): Product => ({
    id: p.id,
    name: p.name,
    brand: p.style || p.category,
    price: p.price,
    imageUrl: p.imageUrls[0] ?? '',
    images: p.imageUrls,
    category: p.category,
    businessId: p.businessId,
    seller: {
        id: p.sellerUserId ?? p.businessId,
        name: p.sellerName ?? 'LUKU Seller',
        avatarUrl: p.sellerAvatarUrl,
        rating: p.averageRating ?? 4.8,
        sales: p.reviewCount ?? 0,
    },
    condition: 'New',
    isNew: false,
    isTrending: p.isFeatured,
    rating: p.averageRating ?? undefined,
    reviewCount: p.reviewCount,
    description: p.description ?? undefined,
    color: p.color,
    size: p.size,
    stockQuantity: p.stockQuantity,
});

/** @deprecated Use toDisplayProduct */
export const mockToDisplayProduct = toDisplayProduct;
