export const MASONRY_HEIGHTS = [220, 280, 200, 300, 230, 270, 250];

export const masonryHeight = (index: number): number =>
    MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length];

export const splitMasonryColumns = <T>(items: T[]): [T[], T[]] => [
    items.filter((_, i) => i % 2 === 0),
    items.filter((_, i) => i % 2 === 1),
];
