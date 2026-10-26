export type OOTDItem = {
    name: string;
    wardrobeItemId: string;
    imageUrl: string;
};

export type OutfitOfDay = {
    id: string;
    name: string;
    items: OOTDItem[];
    imageUrl: string;
    occasion: string;
    temperature: string;
};
