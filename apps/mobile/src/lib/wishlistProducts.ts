import type { Product } from '../types/domain/product';
import type { WishlistItem } from '../types/domain/wishlist';

export const wishlistItemToProduct = (item: WishlistItem): Product => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    price: item.price,
    imageUrl: item.imageUrl,
    category: 'Accessories',
    seller: { id: item.brand.toLowerCase(), name: item.brand, rating: 4.8, sales: 0 },
});
