import React, { useMemo, useState } from 'react';
import { Album, Outfit } from '../types';
import Button from './common/Button';

interface SaveOutfitModalProps {
    outfit: Outfit;
    albums: Album[];
    onSaveToAlbum: (albumId: string) => void | Promise<void>;
    onCreateAndSaveAlbum: (name: string) => void | Promise<void>;
    onClose: () => void;
}

const SaveOutfitModal: React.FC<SaveOutfitModalProps> = ({
    outfit,
    albums,
    onSaveToAlbum,
    onCreateAndSaveAlbum,
    onClose,
}) => {
    const [search, setSearch] = useState('');
    const [newBoardName, setNewBoardName] = useState('');

    const filteredAlbums = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return albums;
        return albums.filter((album) =>
            album.name.toLowerCase().includes(term)
        );
    }, [albums, search]);

    const handleSaveClick = async (albumId: string) => {
        await onSaveToAlbum(albumId);
        onClose();
    };

    const handleCreateAndSave = async () => {
        const name = newBoardName.trim();
        if (!name) return;
        await onCreateAndSaveAlbum(name);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Save outfit to mood board
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <span className="text-2xl" aria-hidden="true">
                            &times;
                        </span>
                    </button>
                </div>

                <div className="px-6 py-4 border-b">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        {outfit.outfitName}
                    </p>
                    <div className="flex gap-2">
                        {outfit.items.slice(0, 4).map((item) => (
                            <img
                                key={item.id}
                                src={item.imageUrl}
                                alt={item.name}
                                title={item.name}
                                className="w-12 h-12 rounded-md object-cover border border-gray-200"
                            />
                        ))}
                    </div>
                </div>

                <div className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Search mood boards
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="e.g., Summer Trip, Workwear, Date Night"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="space-y-2 max-h-44 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50">
                        {filteredAlbums.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">
                                No mood boards match this search.
                            </p>
                        ) : (
                            filteredAlbums.map((album) => (
                                <button
                                    key={album.id}
                                    onClick={() => handleSaveClick(album.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 transition-colors"
                                >
                                    <span className="truncate">
                                        {album.name}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2">
                                        {album.outfits.length}{' '}
                                        {album.outfits.length === 1
                                            ? 'outfit'
                                            : 'outfits'}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 space-y-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Or create a new mood board
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newBoardName}
                                onChange={(e) =>
                                    setNewBoardName(e.target.value)
                                }
                                placeholder="New mood board name"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <Button
                                onClick={handleCreateAndSave}
                                disabled={!newBoardName.trim()}
                                className="whitespace-nowrap"
                            >
                                Create & Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveOutfitModal;

