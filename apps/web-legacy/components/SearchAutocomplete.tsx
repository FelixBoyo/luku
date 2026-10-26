import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Product } from '../types';

interface SearchAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (product: Product) => void;
    placeholder?: string;
    className?: string;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
    value,
    onChange,
    onSelect,
    placeholder = 'Search products...',
    className = '',
}) => {
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [popularSearches] = useState<string[]>([
        'Casual Wear',
        'Formal Attire',
        'Summer Collection',
        'Winter Essentials',
    ]);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load recent searches from localStorage
        const recent = localStorage.getItem('luku_recent_searches');
        if (recent) {
            try {
                setRecentSearches(JSON.parse(recent));
            } catch (error) {
                console.error('Failed to parse recent searches:', error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (value.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('products_with_ratings')
                    .select('id, name, price, image_urls, category')
                    .eq('is_active', true)
                    .or(`name.ilike.%${value}%,description.ilike.%${value}%`)
                    .limit(5);

                if (error) throw error;
                setSuggestions(data || []);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
                setSuggestions([]);
            }
        };

        const debounceTimer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounceTimer);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (product: Product) => {
        onSelect(product);
        setShowSuggestions(false);
        
        // Save to recent searches
        const updated = [value, ...recentSearches.filter(s => s !== value)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('luku_recent_searches', JSON.stringify(updated));
    };

    const handleRecentSearch = (search: string) => {
        onChange(search);
        inputRef.current?.focus();
    };

    const displaySuggestions = showSuggestions && (suggestions.length > 0 || recentSearches.length > 0 || value.length === 0);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                />
                {value && (
                    <button
                        onClick={() => {
                            onChange('');
                            setShowSuggestions(false);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {displaySuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {suggestions.length > 0 && (
                        <div className="p-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                                Products
                            </p>
                            {suggestions.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleSelect(product)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded text-left"
                                >
                                    {product.image_urls.length > 0 && (
                                        <img
                                            src={product.image_urls[0]}
                                            alt={product.name}
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{product.category}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-indigo-600">
                                        ${product.price.toFixed(2)}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    {value.length === 0 && recentSearches.length > 0 && (
                        <div className="p-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                                Recent Searches
                            </p>
                            {recentSearches.map((search, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleRecentSearch(search)}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded text-left"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-gray-700">{search}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {value.length === 0 && popularSearches.length > 0 && (
                        <div className="p-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                                Popular Searches
                            </p>
                            {popularSearches.map((search, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleRecentSearch(search)}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded text-left"
                                >
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span className="text-sm text-gray-700">{search}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchAutocomplete;
