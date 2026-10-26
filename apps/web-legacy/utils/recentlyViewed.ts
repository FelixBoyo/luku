const RECENTLY_VIEWED_KEY = 'luku_recently_viewed';
const MAX_ITEMS = 20;

export interface RecentlyViewedItem {
    productId: string;
    viewedAt: number;
}

export const addToRecentlyViewed = (productId: string): void => {
    try {
        const items = getRecentlyViewed();
        
        // Remove if already exists
        const filtered = items.filter(item => item.productId !== productId);
        
        // Add to beginning
        const updated = [{ productId, viewedAt: Date.now() }, ...filtered];
        
        // Keep only the most recent items
        const limited = updated.slice(0, MAX_ITEMS);
        
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(limited));
    } catch (error) {
        console.error('Failed to save recently viewed:', error);
    }
};

export const getRecentlyViewed = (): RecentlyViewedItem[] => {
    try {
        const data = localStorage.getItem(RECENTLY_VIEWED_KEY);
        if (!data) return [];
        
        const items = JSON.parse(data) as RecentlyViewedItem[];
        // Sort by viewedAt descending (most recent first)
        return items.sort((a, b) => b.viewedAt - a.viewedAt);
    } catch (error) {
        console.error('Failed to get recently viewed:', error);
        return [];
    }
};

export const clearRecentlyViewed = (): void => {
    try {
        localStorage.removeItem(RECENTLY_VIEWED_KEY);
    } catch (error) {
        console.error('Failed to clear recently viewed:', error);
    }
};

export const removeFromRecentlyViewed = (productId: string): void => {
    try {
        const items = getRecentlyViewed();
        const filtered = items.filter(item => item.productId !== productId);
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to remove from recently viewed:', error);
    }
};
