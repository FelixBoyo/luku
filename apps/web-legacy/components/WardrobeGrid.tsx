import React, { useState, useMemo } from 'react';
import { ClothingItem } from '../types';
import FileUpload from './FileUpload';
import Button from './common/Button';
import WardrobeItemCard from './WardrobeItemCard';

interface WardrobeGridProps {
  items: ClothingItem[];
  onImagesUpload: (images: { base64Image: string, mimeType: string }[]) => void;
  isLoading: boolean;
  onUpdateItemStatus: (itemId: string, status: ClothingItem['status']) => void;
  onDeleteItem?: (itemId: string) => void;
  // Optional navigation helper to connect wardrobe to Mood Boards
  onNavigateToMoodBoards?: () => void;
}

const WardrobeGrid: React.FC<WardrobeGridProps> = ({
  items,
  onImagesUpload,
  isLoading,
  onUpdateItemStatus,
  onDeleteItem,
  onNavigateToMoodBoards,
}) => {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded-desc');

  const filterOptions = useMemo(() => {
    const categories = [...new Set(items.map(item => item.category))].sort();
    const colors = [...new Set(items.map(item => item.color))].sort();
    const seasons = [...new Set(items.map(item => item.season))].sort();
    const statuses = [...new Set(items.map(item => item.status))];
    return { categories, colors, seasons, statuses };
  }, [items]);

  const clearFilters = () => {
    setCategoryFilter('');
    setColorFilter('');
    setSeasonFilter('');
    setStatusFilter('');
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    if (colorFilter) {
      filtered = filtered.filter(item => item.color === colorFilter);
    }
    if (seasonFilter) {
      filtered = filtered.filter(item => item.season === seasonFilter);
    }
    if (statusFilter) {
        filtered = filtered.filter(item => item.status === statusFilter);
    }

    switch (sortBy) {
        case 'dateAdded-desc':
            filtered.sort((a, b) => b.dateAdded - a.dateAdded);
            break;
        case 'dateAdded-asc':
            filtered.sort((a, b) => a.dateAdded - b.dateAdded);
            break;
        case 'name-asc':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filtered.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'useCount-desc':
            filtered.sort((a, b) => b.useCount - a.useCount);
            break;
        case 'useCount-asc':
            filtered.sort((a, b) => a.useCount - b.useCount);
            break;
        default:
            break;
    }

    return filtered;
  }, [items, categoryFilter, colorFilter, seasonFilter, statusFilter, sortBy]);

  const sortOptions = [
      { value: 'dateAdded-desc', label: 'Newest First' },
      { value: 'dateAdded-asc', label: 'Oldest First' },
      { value: 'useCount-desc', label: 'Most Used' },
      { value: 'useCount-asc', label: 'Least Used' },
      { value: 'name-asc', label: 'Name (A-Z)' },
      { value: 'name-desc', label: 'Name (Z-A)' },
  ];

  const hasActiveFilters = categoryFilter || colorFilter || seasonFilter || statusFilter;

  return (
    <div>
        {onNavigateToMoodBoards && (
            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                        Turn your wardrobe into mood boards
                    </h2>
                    <p className="text-xs text-gray-700 mt-1">
                        Curate outfits and inspiration by saving looks into Mood Boards.
                        It becomes easier to plan trips, seasons, and style experiments.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={onNavigateToMoodBoards}
                >
                    Open Mood Boards
                </Button>
            </div>
        )}

        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                <div>
                    <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">Category</label>
                    <select id="category-filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value="">All</option>
                        {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="color-filter" className="block text-sm font-medium text-gray-700">Color</label>
                    <select id="color-filter" value={colorFilter} onChange={e => setColorFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value="">All</option>
                        {filterOptions.colors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="season-filter" className="block text-sm font-medium text-gray-700">Season</label>
                    <select id="season-filter" value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value="">All</option>
                        {filterOptions.seasons.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
                    <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm capitalize">
                        <option value="">All</option>
                        {filterOptions.statuses.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700">Sort by</label>
                    <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <Button variant="secondary" onClick={clearFilters} className="w-full" disabled={!hasActiveFilters}>
                        Clear Filters
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div className="col-span-1 sm:col-span-2 md:col-span-1 flex items-center justify-center">
            <FileUpload onImagesUpload={onImagesUpload} isLoading={isLoading} />
          </div>
          {filteredAndSortedItems.map(item => (
            <WardrobeItemCard key={item.id} item={item} onUpdateStatus={onUpdateItemStatus} onDelete={onDeleteItem} />
          ))}
           {filteredAndSortedItems.length === 0 && items.length > 0 && (
            <div className="col-span-full text-center py-12 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">No Matching Items</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default WardrobeGrid;
