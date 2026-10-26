import React, { useState, useRef, useEffect } from 'react';
import { ClothingItem } from '../types';
import HeartIcon from './icons/HeartIcon';

interface WardrobeItemCardProps {
    item: ClothingItem;
    onUpdateStatus: (itemId: string, status: ClothingItem['status']) => void;
    onDelete?: (itemId: string) => void;
}

const StatusIndicator: React.FC<{ status: ClothingItem['status'] }> = ({
    status,
}) => {
    const statusStyles: Record<
        ClothingItem['status'],
        { bg: string; text: string; label: string }
    > = {
        clean: { bg: 'bg-green-100', text: 'text-green-800', label: 'Clean' },
        'in wash': {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            label: 'In Wash',
        },
        dirty: { bg: 'bg-gray-200', text: 'text-gray-800', label: 'Dirty' },
    };
    const style = statusStyles[status];
    return (
        <span
            className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${style.bg} ${style.text}`}
        >
            {style.label}
        </span>
    );
};

const WardrobeItemCard: React.FC<WardrobeItemCardProps> = ({
    item,
    onUpdateStatus,
    onDelete,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const statuses: ClothingItem['status'][] = ['clean', 'in wash', 'dirty'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusChange = (newStatus: ClothingItem['status']) => {
        onUpdateStatus(item.id, newStatus);
        setMenuOpen(false);
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(item.id);
        }
        setMenuOpen(false);
    };

    return (
        <div className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-xl">
            <img
                src={item.imageUrl}
                alt={item.name}
                className={`h-56 w-full object-cover transition-all duration-300 group-hover:scale-105 ${
                    item.status !== 'clean' ? 'grayscale' : ''
                }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

            <StatusIndicator status={item.status} />

            {item.useCount > 0 && (
                <div className="absolute top-2 right-2 flex items-center space-x-1 rounded-full bg-red-500/90 px-2 py-1 text-xs font-bold text-white shadow-md">
                    <HeartIcon className="h-3 w-3" isFilled={true} />
                    <span>{item.useCount}</span>
                </div>
            )}

            <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-end">
                <div>
                    <h3 className="text-sm font-semibold text-white">
                        {item.name}
                    </h3>
                    <p className="text-xs text-gray-300">
                        {item.category} &bull; {item.season}
                    </p>
                </div>
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-md shadow-lg border z-10">
                            {statuses.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 capitalize disabled:opacity-50 disabled:bg-gray-100"
                                    disabled={item.status === status}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                            <div className="border-t border-gray-200"></div>
                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                Delete Item
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WardrobeItemCard;
