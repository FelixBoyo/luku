import React from 'react';
import { card as cardTokens, colors, radii, shadows } from '@core/theme/tokens';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'muted';
    padded?: boolean;
    as?: keyof JSX.IntrinsicElements;
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'default',
    padded = true,
    as: Component = 'div',
}) => {
    const variantClass =
        variant === 'elevated'
            ? cardTokens.elevated
            : variant === 'muted'
            ? cardTokens.muted
            : cardTokens.base;

    const paddingClass = padded ? cardTokens.padding : '';

    return (
        <Component className={`${variantClass} ${paddingClass} ${className}`}>
            {children}
        </Component>
    );
};

export default Card;

