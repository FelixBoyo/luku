import React from 'react';
import { Outfit } from '../types';
import HeartIcon from './icons/HeartIcon';
import UserIcon from './icons/UserIcon';

interface FavoritesListProps {
  favorites: Outfit[];
  onUnfavorite: (outfitId: string) => void;
  onTryOn: (outfit: Outfit, source?: string) => void;
}

const FavoriteOutfitCard: React.FC<{ outfit: Outfit; onUnfavorite: (outfitId: string) => void; onTryOn: (outfit: Outfit, source?: string) => void; }> = ({ outfit, onUnfavorite, onTryOn }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="p-5 flex justify-between items-start">
            <div>
                <h3 className="text-lg font-bold text-gray-800">{outfit.outfitName}</h3>
                <p className="text-sm text-gray-600 mt-1">{outfit.description}</p>
            </div>
            <div className="flex items-center space-x-0">
                <button onClick={() => onTryOn(outfit, 'favorites')} className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors" title="Virtual Try-On">
                    <UserIcon className="w-6 h-6"/>
                </button>
                <button onClick={() => onUnfavorite(outfit.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors">
                    <HeartIcon isFilled={true} className="w-6 h-6"/>
                </button>
            </div>
        </div>
        <div className="grid grid-cols-5 gap-2 px-4 pb-4 flex-grow">
            {outfit.items.map((item) => (
                <div key={item.id} className="relative aspect-square">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-md" title={item.name} />
                </div>
            ))}
        </div>
    </div>
);

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onUnfavorite, onTryOn }) => {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-100 rounded-lg">
        <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700">No Favorites Yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Find some outfit suggestions you love and click the heart to save them here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {favorites.map(outfit => (
        <FavoriteOutfitCard key={outfit.id} outfit={outfit} onUnfavorite={onUnfavorite} onTryOn={(outfit) => onTryOn(outfit, 'favorites')} />
      ))}
    </div>
  );
};

export default FavoritesList;