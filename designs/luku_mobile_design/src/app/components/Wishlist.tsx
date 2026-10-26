import { useState } from 'react';
import { Grid, List, Heart, ShoppingCart, Trash2, CheckSquare, Square } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';

export function Wishlist() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const wishlistItems = [
    { id: 1, name: 'Vintage Denim Jacket', price: 89.99, seller: 'StyleHaven', image: '', inStock: true },
    { id: 2, name: 'Leather Crossbody Bag', price: 65.00, seller: 'RetroCloset', image: '', inStock: true },
    { id: 3, name: 'White Linen Dress', price: 45.50, seller: 'ChicBoutique', image: '', inStock: false },
    { id: 4, name: 'Black Ankle Boots', price: 120.00, seller: 'UrbanStyle', image: '', inStock: true },
    { id: 5, name: 'Gold Hoop Earrings', price: 28.00, seller: 'JewelBox', image: '', inStock: true },
    { id: 6, name: 'Oversized Blazer', price: 95.00, seller: 'ModernWardrobe', image: '', inStock: true },
  ];

  const toggleSelect = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItems(wishlistItems.map(item => item.id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-block">
            <h1 className="text-white text-4xl font-black tracking-tight relative">
              WISHLIST
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-black border-white/20 text-white'
                  : 'bg-white border-white/10 text-black'
              }`}
            >
              <Grid className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-black border-white/20 text-white'
                  : 'bg-white border-white/10 text-black'
              }`}
            >
              <List className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          {wishlistItems.length} items saved
        </p>
      </div>

      {selectedItems.length > 0 && (
        <div className="px-6 pb-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-[#48CD8A] shadow-md flex items-center justify-between">
            <p className="text-white text-sm font-black">{selectedItems.length} selected</p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-white text-black rounded-lg text-xs font-black uppercase hover:bg-[#1A1A1A] transition-colors flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" strokeWidth={3} />
                Add to Cart
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-black uppercase hover:bg-red-700 transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" strokeWidth={3} />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={selectedItems.length === wishlistItems.length ? deselectAll : selectAll}
            className="text-[#48CD8A] text-sm font-bold hover:text-black transition-colors"
          >
            {selectedItems.length === wishlistItems.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => toggleSelect(item.id)}
                  className="absolute top-3 left-3 z-10 w-6 h-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md border-2 border-white/20 flex items-center justify-center"
                >
                  {selectedItems.includes(item.id) ? (
                    <CheckSquare className="w-5 h-5 text-black" strokeWidth={3} />
                  ) : (
                    <Square className="w-5 h-5 text-white/40" strokeWidth={2.5} />
                  )}
                </button>
                <Link to={`/product/${item.id}`}>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl border-2 border-white/20 overflow-hidden shadow-md hover:border-[#48CD8A] transition-colors">
                    <div className="relative aspect-[3/4] bg-white/5">
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-sm font-black">OUT OF STOCK</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-black mb-1 truncate">{item.name}</p>
                      <p className="text-white/60 text-xs font-semibold mb-2">{item.seller}</p>
                      <p className="text-white text-lg font-black">${item.price}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="px-6 pb-6">
          <div className="space-y-3">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl border-2 border-white/20 overflow-hidden shadow-md flex items-center gap-3 p-3">
                <button
                  onClick={() => toggleSelect(item.id)}
                  className="w-6 h-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md border-2 border-white/20 flex items-center justify-center flex-shrink-0"
                >
                  {selectedItems.includes(item.id) ? (
                    <CheckSquare className="w-5 h-5 text-black" strokeWidth={3} />
                  ) : (
                    <Square className="w-5 h-5 text-white/40" strokeWidth={2.5} />
                  )}
                </button>
                <Link to={`/product/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-20 h-20 bg-white/5 rounded-lg flex-shrink-0 relative">
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-black">OUT</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-black mb-1 truncate">{item.name}</p>
                    <p className="text-white/60 text-xs font-semibold mb-2">{item.seller}</p>
                    <p className="text-white text-lg font-black">${item.price}</p>
                  </div>
                </Link>
                <button className="p-2 text-red-600 flex-shrink-0">
                  <Heart className="w-5 h-5 fill-red-600" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {wishlistItems.length === 0 && (
        <div className="text-center py-12 px-6">
          <Heart className="w-16 h-16 text-black/20 mx-auto mb-4" strokeWidth={2.5} />
          <p className="text-white text-xl font-black mb-2">Your Wishlist is Empty</p>
          <p className="text-white/60 text-sm font-semibold mb-6">
            Save items you love to buy later
          </p>
          <Link to="/marketplace">
            <button className="px-6 py-3 bg-white text-black rounded-lg font-black uppercase text-sm hover:bg-[#1A1A1A] transition-colors">
              Browse Marketplace
            </button>
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
