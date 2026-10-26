import React from 'react';
import { MasonryGrid } from '../common/MasonryGrid';
import { Skeleton } from '../common/Skeleton';
import { masonryHeight } from '../../lib/masonry';
import { radii } from '../../theme/tokens';

type MasonrySkeletonProps = {
    count?: number;
};

export const MasonrySkeleton: React.FC<MasonrySkeletonProps> = ({
    count = 6,
}) => {
    const items = Array.from({ length: count }, (_, i) => i);
    return (
        <MasonryGrid
            items={items}
            keyExtractor={(item) => `masonry-skel-${item}`}
            renderItem={(_, index) => (
                <Skeleton height={masonryHeight(index)} borderRadius={radii.lg} />
            )}
        />
    );
};
