import React from 'react';
import { Album, Outfit, Product } from '../types';
import Button from './common/Button';
import FavoritesList from './FavoritesList';
import PlusIcon from './icons/PlusIcon';
import BookmarkSquareIcon from './icons/BookmarkSquareIcon';
import SparklesIcon from './icons/SparklesIcon';
import ProductCard from './ProductCard';
import Spinner from './common/Spinner';
import { getMoodBoardProductRecommendations } from '../services/moodBoardService';

interface AlbumsProps {
    albums: Album[];
    onCreateAlbum: (name: string) => void;
    onRemoveOutfit: (outfitId: string, albumId: string) => void;
    onTryOn: (outfit: Outfit, source?: string) => void;
    /**
     * Optional navigation helper to take the user to the Outfit Suggestions flow.
     * Used to support the \"Generate outfits from this mood board\" CTA.
     */
    onNavigateToOutfitSuggestions?: () => void;
    /**
     * Optional navigation helper to open a product in the marketplace / product detail.
     * Used by mood-board product recommendations.
     */
    onProductClick?: (product: Product) => void;
    /**
     * Generate new outfits based on the contents of a specific mood board.
     */
    onGenerateFromAlbum?: (album: Album) => void;
    /**
     * Optional set of outfits that were generated from a particular album.
     * The parent passes both the album id and generated outfits.
     */
    generatedAlbumOutfits?: { albumId: string; outfits: Outfit[] } | null;
}

const Albums: React.FC<AlbumsProps> = ({
    albums,
    onCreateAlbum,
    onRemoveOutfit,
    onTryOn,
    onNavigateToOutfitSuggestions,
    onProductClick,
    onGenerateFromAlbum,
    generatedAlbumOutfits,
}) => {
    const [selectedAlbum, setSelectedAlbum] = React.useState<Album | null>(
        null
    );
    const [newAlbumName, setNewAlbumName] = React.useState('');
    const [recommendedProducts, setRecommendedProducts] = React.useState<Product[]>([]);
    const [recsLoading, setRecsLoading] = React.useState(false);
    const [recsError, setRecsError] = React.useState<string | null>(null);

    // Fetch product recommendations whenever a specific mood board is opened
    React.useEffect(() => {
        if (!selectedAlbum) {
            setRecommendedProducts([]);
            setRecsError(null);
            return;
        }

        let isCancelled = false;

        const loadRecommendations = async () => {
            setRecsLoading(true);
            setRecsError(null);
            try {
                const products = await getMoodBoardProductRecommendations(
                    selectedAlbum.id,
                    8
                );
                if (!isCancelled) {
                    setRecommendedProducts(products);
                }
            } catch (error: any) {
                if (!isCancelled) {
                    setRecsError(
                        error?.message ||
                            'Unable to load recommendations for this mood board.'
                    );
                }
            } finally {
                if (!isCancelled) {
                    setRecsLoading(false);
                }
            }
        };

        loadRecommendations();

        return () => {
            isCancelled = true;
        };
    }, [selectedAlbum]);

    const handleCreateAlbum = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAlbumName.trim()) {
            onCreateAlbum(newAlbumName.trim());
            setNewAlbumName('');
        }
    };

    if (selectedAlbum) {
        return (
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {selectedAlbum.name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedAlbum.outfits.length} outfit
                            {selectedAlbum.outfits.length !== 1 ? 's' : ''} in this album
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {onGenerateFromAlbum &&
                            selectedAlbum.outfits.length > 0 && (
                                <Button
                                    variant="primary"
                                    onClick={() =>
                                        onGenerateFromAlbum(selectedAlbum)
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    Generate outfits from this mood board
                                </Button>
                            )}
                        <Button
                            variant="secondary"
                            onClick={() => setSelectedAlbum(null)}
                            className="w-full sm:w-auto"
                        >
                            &larr; Back to all mood boards
                        </Button>
                    </div>
                </div>
                <FavoritesList
                    favorites={selectedAlbum.outfits}
                    onUnfavorite={(outfitId) =>
                        onRemoveOutfit(outfitId, selectedAlbum.id)
                    }
                    onTryOn={(outfit) => onTryOn(outfit, 'albums')}
                />

                {generatedAlbumOutfits &&
                    generatedAlbumOutfits.albumId === selectedAlbum.id &&
                    generatedAlbumOutfits.outfits.length > 0 && (
                        <div className="mt-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        AI-generated outfits inspired by this mood board
                                    </h3>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {generatedAlbumOutfits.outfits.map((outfit) => (
                                    <FavoritesList
                                        key={outfit.id}
                                        favorites={[outfit]}
                                        onUnfavorite={() => {}}
                                        onTryOn={(o) => onTryOn(o, 'albums_generated')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                {/* Mood board powered product recommendations */}
                <div className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-xl font-semibold text-gray-900">
                                Recommended products for this mood board
                            </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Based on the styles, colors, and categories in this collection.
                        </p>
                    </div>

                    {recsLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl">
                            <Spinner />
                            <p className="text-sm text-gray-600 mt-3">
                                Finding products that match this mood board...
                            </p>
                        </div>
                    ) : recsError ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                            {recsError}
                        </div>
                    ) : recommendedProducts.length === 0 ? (
                        <div className="py-8 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border border-dashed border-gray-300 text-center">
                            <p className="text-sm text-gray-600 max-w-md mx-auto">
                                As this mood board grows, we&apos;ll start recommending marketplace
                                pieces that complete these outfits.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {recommendedProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={onProductClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const hasAlbums = albums.length > 0;

    return (
        <div>
            {/* Enhanced Header Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <SparklesIcon className="w-8 h-8 text-indigo-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Mood Boards
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Organize your favorite outfits into beautiful mood boards
                            that capture your style, trips, and life moments.
                        </p>
                    </div>
                </div>
            </div>

            {/* Enhanced Create Album Form */}
            <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100">
                <form
                    onSubmit={handleCreateAlbum}
                    className="flex flex-col sm:flex-row items-end gap-4"
                >
                    <div className="flex-grow w-full">
                        <label
                            htmlFor="new-album-name"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                            Create New Mood Board
                        </label>
                        <input
                            id="new-album-name"
                            type="text"
                            value={newAlbumName}
                            onChange={(e) => setNewAlbumName(e.target.value)}
                            placeholder="e.g., Work Attire, Summer Vacation, Date Night"
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!newAlbumName.trim()}
                        className="w-full sm:w-auto whitespace-nowrap"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create Mood Board
                    </Button>
                </form>
            </div>

            {!hasAlbums && (
                <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                        <BookmarkSquareIcon className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Your Mood Boards Live Here
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Create your first mood board above to start organizing your
                        favorite outfits into visual collections that inspire your
                        style, trips, and creative projects.
                    </p>
                </div>
            )}

            {hasAlbums && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {albums.map((album) => {
                        // Get unique images from all outfits for better collage
                        const allImages = album.outfits.flatMap(outfit => 
                            outfit.items.map(item => item.imageUrl)
                        ).slice(0, 4);
                        
                        return (
                            <button
                                key={album.id}
                                onClick={() => setSelectedAlbum(album)}
                                className="group relative block w-full aspect-[4/3] p-6 rounded-xl bg-white hover:shadow-2xl transition-all duration-300 text-left overflow-hidden border-2 border-gray-200 hover:border-indigo-300 transform hover:-translate-y-1"
                            >
                                {/* Enhanced Image Collage Background */}
                                {allImages.length > 0 ? (
                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 opacity-15 group-hover:opacity-25 transition-opacity duration-300">
                                        {allImages.map((imageUrl, index) => (
                                            <div
                                                key={index}
                                                className={`overflow-hidden ${
                                                    index === 0 ? 'rounded-tl-xl' : ''
                                                } ${
                                                    index === 1 ? 'rounded-tr-xl' : ''
                                                } ${
                                                    index === 2 ? 'rounded-bl-xl' : ''
                                                } ${
                                                    index === 3 ? 'rounded-br-xl' : ''
                                                }`}
                                            >
                                                <img
                                                    src={imageUrl}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 opacity-30 group-hover:opacity-40 transition-opacity"></div>
                                )}
                                
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent group-hover:from-indigo-900/70 group-hover:via-purple-900/30 transition-all duration-300"></div>
                                
                                {/* Content */}
                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <div className="flex-1"></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                                            {album.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-white/90 text-sm">
                                            <BookmarkSquareIcon className="w-4 h-4" />
                                            <span>
                                                {album.outfits.length} outfit
                                                {album.outfits.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Hover Indicator */}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <SparklesIcon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Albums;
