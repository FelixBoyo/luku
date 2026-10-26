import type { OutfitPieceDto } from './outfitSuggestions';

export type OotdDto = {
    id: string;
    date: string;
    title: string;
    description: string;
    occasion: string;
    coverImageUrl: string;
    pieces: OutfitPieceDto[];
    weatherNote?: string;
    matchScore: number;
    saved?: boolean;
};

export type OotdResponse = {
    ootd: OotdDto;
};

export type OotdRefreshRequest = {
    refresh?: boolean;
    weather?: string;
};
