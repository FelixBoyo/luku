import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const useRootNavigation = (): NavigationProp<RootStackParamList> => {
    let navigation = useNavigation();
    while (navigation.getParent()) {
        navigation = navigation.getParent()!;
    }
    return navigation as NavigationProp<RootStackParamList>;
};
