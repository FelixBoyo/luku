export type StylistOutfitItem = {
    productId: string;
    name: string;
    image: string;
    owned: boolean;
    price?: number;
};

export type StylistOutfit = {
    id: string;
    name: string;
    occasion: string;
    fromWardrobe?: boolean;
    items: StylistOutfitItem[];
};

export type StyleEnhancer = {
    productId: string;
    name: string;
    image: string;
    price: number;
    match: number;
};
