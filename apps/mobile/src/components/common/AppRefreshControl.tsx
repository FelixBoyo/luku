import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { colors } from '../../theme/tokens';

/**
 * Pull-to-refresh styled for the dark shell. The stock control renders a light
 * spinner that disappears against these backgrounds, so every screen shares
 * this one instead of restyling it per list.
 */
export const AppRefreshControl: React.FC<{ refreshing: boolean; onRefresh: () => void }> = ({
    refreshing,
    onRefresh,
}) => (
    <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.accent.primary}
        colors={[colors.accent.primary]}
        progressBackgroundColor={colors.background.shell}
    />
);

/**
 * Drives {@link AppRefreshControl} from an async loader. Tracks its own flag
 * rather than reusing the screen's `loading` state so a pull shows the spinner
 * instead of replacing the list with a skeleton.
 */
export const useRefresh = (load: () => Promise<unknown>) => {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void Promise.resolve(load()).finally(() => setRefreshing(false));
    }, [load]);

    return { refreshing, onRefresh };
};
