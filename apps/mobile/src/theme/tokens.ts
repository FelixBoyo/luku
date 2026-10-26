export const colors = {
    background: {
        app: '#FAFAFA',
        shell: '#000000',
        card: '#FFFFFF',
        cardDark: 'rgba(255,255,255,0.05)',
        muted: '#F5F5F5',
        inputDark: 'rgba(255,255,255,0.06)',
        earthyPanel: '#130B04',
    },
    text: {
        primary: '#0A0A0A',
        secondary: '#737373',
        onDark: '#FFFFFF',
        onDarkMuted: 'rgba(255,255,255,0.6)',
        onDarkSubtle: 'rgba(255,255,255,0.5)',
        accent: '#48CD8A',
        cream: '#F7F3EE',
    },
    accent: {
        primary: '#48CD8A',
        bright: '#3AB87A',
        warm: '#F2B872',
        terracotta: '#D98C4A',
        gradientStart: '#48CD8A',
        gradientEnd: '#3AB87A',
        tryOn: '#8A48CD',
    },
    border: {
        default: '#E5E5E5',
        dark: 'rgba(255,255,255,0.1)',
        black30: 'rgba(0,0,0,0.3)',
    },
    status: {
        error: '#FF0044',
        errorBg: '#fde7e7',
        errorText: '#a32424',
        positiveOnDark: '#48CD8A',
        positiveBgDark: 'rgba(72,205,138,0.3)',
        warningOnDark: '#F2B872',
        warningBgDark: 'rgba(242,184,114,0.22)',
        dangerOnDark: '#FF5C7A',
        dangerBgDark: 'rgba(255,0,68,0.2)',
        neutralOnDark: 'rgba(255,255,255,0.8)',
        neutralBgDark: 'rgba(255,255,255,0.12)',
    },
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    page: 24,
    tabBar: 88,
} as const;

export const radii = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 999,
} as const;

export const typography = {
    fontFamily: {
        regular: 'Outfit_400Regular',
        medium: 'Outfit_500Medium',
        semiBold: 'Outfit_600SemiBold',
        bold: 'Outfit_700Bold',
        black: 'Outfit_900Black',
    },
} as const;
