import { ProductDto } from './products';

export type CartItemDto = {
    id: string;
    userId: string;
    productId: string;
    quantity: number;
    createdAt: string;
    updatedAt: string;
    product?: ProductDto;
};

export type AddToCartRequest = {
    productId: string;
    quantity?: number;
};

export type UpdateCartQtyRequest = {
    quantity: number;
};
