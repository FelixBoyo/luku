import React from 'react';
import { radii, colors } from '@core/theme/tokens';

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    helperText?: string;
    error?: string;
    fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
    id,
    label,
    helperText,
    error,
    fullWidth = true,
    className = '',
    ...props
}) => {
    const inputId = id || props.name;

    const baseClasses = [
        'block',
        fullWidth ? 'w-full' : '',
        'px-3 py-2',
        'border-2',
        radii.md,
        'shadow-sm',
        'placeholder-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
        error ? 'border-red-500' : 'border-gray-200',
        'bg-white',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={fullWidth ? 'w-full' : ''}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label}
                </label>
            )}
            <input id={inputId} className={baseClasses} {...props} />
            {error ? (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            ) : helperText ? (
                <p className={`mt-1 text-xs ${colors.text.secondary}`}>
                    {helperText}
                </p>
            ) : null}
        </div>
    );
};

export default Input;

