import React from 'react';
import { MasonryGrid } from '../common/MasonryGrid';
import { Skeleton } from '../common/Skeleton';
import { MASONRY_HEIGHTS } from '../../lib/masonry';
import { radii } from '../../theme/tokens';

const wardrobeHeight = (index: number): number =>
    MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length];

export const WardrobeGridSkeleton: React.FC<{ count?: number }> = ({
    count = 6,
}) => {
    const items = Array.from({ length: count }, (_, i) => i);
    return (
        <MasonryGrid
            items={items}
            keyExtractor={(item) => `wardrobe-skel-${item}`}
            renderItem={(_, index) => (
                <Skeleton height={wardrobeHeight(index)} borderRadius={radii.xl} />
            )}
        />
    );
};
