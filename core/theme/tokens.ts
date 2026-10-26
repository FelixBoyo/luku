// Central design tokens and layout primitives for the pre-MVP UI.
// These are intentionally lightweight so we can swap the visual system later
// without rewriting business logic or page structure.

export const colors = {
    brand: {
        indigo: 'from-indigo-600 to-purple-600',
        indigoHover: 'from-indigo-700 to-purple-700',
    },
    background: {
        app: 'bg-gray-50',
        surface: 'bg-white',
        surfaceMuted: 'bg-gray-50',
    },
    border: {
        subtle: 'border-gray-100',
        default: 'border-gray-200',
        strong: 'border-gray-300',
    },
    text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        muted: 'text-gray-500',
        onBrand: 'text-white',
    },
};

export const radii = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    pill: 'rounded-full',
};

export const shadows = {
    subtle: 'shadow-sm',
    medium: 'shadow-md',
    strong: 'shadow-lg',
};

export const layout = {
    // Standard page container used across header, app body, and dashboards.
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    pagePaddingY: 'py-8',
};

export const typography = {
    pageTitle: 'text-3xl font-bold',
    sectionTitle: 'text-2xl font-bold',
    subtitle: 'text-sm text-gray-600',
};

export const card = {
    base: `${colors.background.surface} ${radii.md} ${shadows.subtle} border ${colors.border.default}`,
    elevated: `${colors.background.surface} ${radii.lg} ${shadows.medium} border ${colors.border.subtle}`,
    muted: `${colors.background.surfaceMuted} ${radii.md} border ${colors.border.subtle}`,
    padding: 'p-6',
};
