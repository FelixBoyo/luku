import { useCallback, useRef, useState, type RefObject } from 'react';
import {
    Animated,
    NativeScrollEvent,
    NativeSyntheticEvent,
    TextInput,
} from 'react-native';

export const COLLAPSE_THRESHOLD = 72;
export const EXPAND_THRESHOLD = 40;

export function useCollapsingChrome() {
    const [chromeCollapsed, setChromeCollapsed] = useState(false);
    const fullChromeOpacity = useRef(new Animated.Value(1)).current;
    const compactChromeOpacity = useRef(new Animated.Value(0)).current;

    const setCollapsed = useCallback(
        (collapsed: boolean) => {
            setChromeCollapsed(collapsed);
            Animated.parallel([
                Animated.timing(fullChromeOpacity, {
                    toValue: collapsed ? 0 : 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(compactChromeOpacity, {
                    toValue: collapsed ? 1 : 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        },
        [fullChromeOpacity, compactChromeOpacity],
    );

    const onScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = e.nativeEvent.contentOffset.y;
            if (!chromeCollapsed && y > COLLAPSE_THRESHOLD) {
                setCollapsed(true);
            } else if (chromeCollapsed && y < EXPAND_THRESHOLD) {
                setCollapsed(false);
            }
        },
        [chromeCollapsed, setCollapsed],
    );

    return {
        chromeCollapsed,
        fullChromeOpacity,
        compactChromeOpacity,
        onScroll,
        setCollapsed,
    };
}

type ScrollableListRef = RefObject<{
    scrollToOffset: (params: { offset: number; animated?: boolean | null }) => void;
} | null>;

export function focusSearchFromCompact(
    listRef: ScrollableListRef,
    inputRef: RefObject<TextInput | null>,
) {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setTimeout(() => inputRef.current?.focus(), 280);
}
