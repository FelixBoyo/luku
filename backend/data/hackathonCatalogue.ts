export type LookPiece = { name: string; category: string; price: number };

export type CatalogueItem = {
    id: string;
    name: string;
    category: string;
    price: number; // total for the whole look
    imageUrl: string; // public URL of a photo of the complete outfit being worn
    garmentCategory: 'auto' | 'full_body';
    pieces: LookPiece[];
    sellerName: string;
    sellerWhatsapp: string;
    occasions: string[];
};

export const CATALOGUE: CatalogueItem[] = [
    {
        id: 'look-001',
        name: 'TEST ONLY: replace with a real look',
        category: 'Outfit',
        price: 4800,
        imageUrl:
            'https://plugins-media.makeupar.com/strapi/assets/clothes_reference_full_body_02_e8b9d78f2e.png',
        garmentCategory: 'full_body',
        pieces: [
            { name: 'Piece 1', category: 'Top', price: 2000 },
            { name: 'Piece 2', category: 'Bottom', price: 2800 },
        ],
        sellerName: 'REPLACE',
        sellerWhatsapp: '2547XXXXXXXX',
        occasions: ['interview'],
    },
];