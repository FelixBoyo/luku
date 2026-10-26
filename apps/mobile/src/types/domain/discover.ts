export type Brand = {
    id: string;
    name: string;
    tagline: string;
    logoText: string;
    coverUrl: string;
    followers: string;
    productCount: number;
    rating: number;
    verified: boolean;
    description: string;
};

export type Style = {
    id: string;
    name: string;
    tagline: string;
    coverUrl: string;
    followers: string;
    description: string;
    keywords: string[];
};

/** @deprecated Use Brand */
export type MockBrand = Brand;
/** @deprecated Use Style */
export type MockStyle = Style;
