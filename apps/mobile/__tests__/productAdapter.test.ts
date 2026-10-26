import { dtoToDisplayProduct, toDisplayProduct } from '../src/lib/productAdapter';
import type { ProductDto } from '../../../packages/contracts/src/products';
import type { Product } from '../src/types/domain/product';

const dto: ProductDto = {
    id: 'abc',
    businessId: 'biz-1',
    name: 'Test Jacket',
    description: 'A test product',
    price: 5000,
    category: 'Outerwear',
    color: 'Brown',
    style: 'Heritage Finds',
    size: 'M',
    imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    isActive: true,
    isFeatured: true,
    averageRating: 4.7,
    reviewCount: 12,
};

describe('productAdapter', () => {
    it('maps ProductDto to display shape', () => {
        const display = dtoToDisplayProduct(dto);
        expect(display.id).toBe('abc');
        expect(display.imageUrl).toBe('https://example.com/a.jpg');
        expect(display.images).toHaveLength(2);
        expect(display.brand).toBe('Heritage Finds');
        expect(display.isTrending).toBe(true);
    });

    it('passes through Product', () => {
        const product: Product = {
            id: '1',
            name: 'Vintage',
            brand: 'Brand',
            price: 100,
            imageUrl: 'https://example.com/x.jpg',
            category: 'Tops',
            seller: { id: 's', name: 'Seller', rating: 5, sales: 1 },
        };
        expect(toDisplayProduct(product)).toBe(product);
    });
});
