import { useState } from 'react';
import { SlidersHorizontal, Star, TrendingUp, Sparkles, User, Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';

type Product = {
  id: number;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  category: string;
  seller: {
    name: string;
    rating: number;
    sales: number;
  };
  condition?: 'New' | 'Like New' | 'Excellent' | 'Good';
  isTrending?: boolean;
  isNew?: boolean;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  aiMatch?: number; // AI match percentage based on wardrobe
};

const products: Product[] = [
  {
    id: 1,
    name: 'Structured Handbag',
    brand: 'Essential Leather Co.',
    price: 145,
    imageUrl: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGxlYXRoZXIlMjBoYW5kYmFnJTIwbWluaW1hbCUyMGJlaWdlfGVufDF8fHx8MTc3NjE5ODgyOHww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Accessories',
    seller: { name: 'ChicBoutique', rating: 4.9, sales: 234 },
    condition: 'New',
    isTrending: true,
    soldCount: 48,
    rating: 4.8,
    reviewCount: 32,
    aiMatch: 95,
  },
  {
    id: 2,
    name: 'Classic Watch',
    brand: 'Timeless & Co.',
    price: 220,
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwd2F0Y2glMjBtaW5pbWFsJTIwbGVhdGhlcnxlbnwxfHx8fDE3NzYyMDEzNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Accessories',
    seller: { name: 'ModernWardrobe', rating: 4.7, sales: 156 },
    condition: 'Like New',
    soldCount: 32,
    rating: 4.6,
    reviewCount: 24,
    aiMatch: 88,
  },
  {
    id: 3,
    name: 'Silk Scarf',
    brand: 'Heritage Textiles',
    price: 85,
    imageUrl: 'https://images.unsplash.com/photo-1764697907673-eaba1d06205a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXJ0aCUyMHRvbmUlMjBzY2FyZiUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc3NjE5ODgyOHww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Accessories',
    seller: { name: 'StyleHaven', rating: 5.0, sales: 412 },
    condition: 'New',
    isNew: true,
    soldCount: 28,
    rating: 5.0,
    reviewCount: 18,
    aiMatch: 92,
  },
  {
    id: 4,
    name: 'Linen Blazer',
    brand: 'Modern Staples',
    price: 195,
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGJsYXplciUyMGxpbmVuJTIwd29tZW58ZW58MXx8fHwxNzc2MjAyNDY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Layers',
    seller: { name: 'UrbanStyle', rating: 4.8, sales: 189 },
    condition: 'Excellent',
    isTrending: true,
    soldCount: 56,
    rating: 4.7,
    reviewCount: 41,
    aiMatch: 85,
  },
  {
    id: 5,
    name: 'Cashmere Cardigan',
    brand: 'Soft Essentials',
    price: 168,
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGNhcmRpZ2FuJTIwY2FzaG1lcmV8ZW58MXx8fHwxNzc2MjAyNDY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Layers',
    seller: { name: 'RetroCloset', rating: 4.6, sales: 98 },
    condition: 'Like New',
    soldCount: 22,
    rating: 4.5,
    reviewCount: 15,
    aiMatch: 78,
  },
  {
    id: 6,
    name: 'Leather Ankle Boots',
    brand: 'Urban Craftsman',
    price: 210,
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGFua2xlJTIwYm9vdHMlMjBsZWF0aGVyfGVufDF8fHx8MTc3NjIwMjQ2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Shoes',
    seller: { name: 'ChicBoutique', rating: 4.9, sales: 234 },
    condition: 'New',
    isNew: true,
    soldCount: 64,
    rating: 4.9,
    reviewCount: 52,
    aiMatch: 90,
  },
  {
    id: 7,
    name: 'Vintage Denim Jacket',
    brand: "Levi's",
    price: 89,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGphY2tldHxlbnwxfHx8fDE3NzYyMDIwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Layers',
    seller: { name: 'VintageVibes', rating: 4.8, sales: 567 },
    condition: 'Excellent',
    isTrending: true,
    soldCount: 142,
    rating: 4.8,
    reviewCount: 89,
    aiMatch: 82,
  },
  {
    id: 8,
    name: 'Minimalist Belt',
    brand: 'Essential Leather Co.',
    price: 52,
    imageUrl: 'https://images.unsplash.com/photo-1624222247344-70e88d0d4850?w=400',
    category: 'Accessories',
    seller: { name: 'ChicBoutique', rating: 4.9, sales: 234 },
    condition: 'New',
    soldCount: 38,
    rating: 4.7,
    reviewCount: 21,
    aiMatch: 94,
  },
];

export function Marketplace() {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'recommended' | 'trending' | 'new'>('recommended');

  const filters = ['All', 'Accessories', 'Layers', 'Shoes'];

  const getFilteredProducts = () => {
    let filtered = activeFilter === 'All'
      ? products
      : products.filter(p => p.category === activeFilter);

    // Apply view mode sorting
    if (viewMode === 'trending') {
      filtered = filtered.filter(p => p.isTrending).concat(filtered.filter(p => !p.isTrending));
    } else if (viewMode === 'new') {
      filtered = filtered.filter(p => p.isNew).concat(filtered.filter(p => !p.isNew));
    } else {
      // Sort by AI match for recommended
      filtered = [...filtered].sort((a, b) => (b.aiMatch || 0) - (a.aiMatch || 0));
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Hero Header with first product as focal point */}
      {filteredProducts.length > 0 && (
        <div className="relative h-[50vh] overflow-hidden page-enter">
          <img
            src={filteredProducts[0].imageUrl}
            alt={filteredProducts[0].name}
            className="w-full h-full object-cover ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black"></div>

          {/* Floating Header */}
          <div className="absolute top-0 left-0 right-0 px-6 pt-8">
            <h1 className="text-white text-5xl font-black tracking-tighter leading-none">
              MARKET
            </h1>
          </div>

          {/* Product Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                {filteredProducts[0].aiMatch && filteredProducts[0].aiMatch >= 90 && (
                  <div className="px-2 py-1 bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] inline-flex items-center gap-1 mb-2">
                    <Sparkles className="w-3 h-3 text-black" strokeWidth={3} />
                    <span className="text-black text-xs font-black">{filteredProducts[0].aiMatch}%</span>
                  </div>
                )}
                <h2 className="text-white text-2xl font-black mb-1">
                  {filteredProducts[0].name}
                </h2>
                <p className="text-white/70 text-sm font-semibold">
                  {filteredProducts[0].brand}
                </p>
              </div>
              <p className="text-white text-3xl font-black">
                ${filteredProducts[0].price}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs - Floating */}
      <div className="px-6 pb-4 pt-6">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setViewMode('recommended')}
            className={`px-4 py-2 font-black text-xs uppercase tracking-wide whitespace-nowrap transition-all flex items-center gap-2 ${
              viewMode === 'recommended'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20'
            }`}
          >
            <Sparkles className="w-4 h-4" strokeWidth={3} />
            For You
          </button>
          <button
            onClick={() => setViewMode('trending')}
            className={`px-4 py-2 font-black text-xs uppercase tracking-wide whitespace-nowrap transition-all flex items-center gap-2 ${
              viewMode === 'trending'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20'
            }`}
          >
            <TrendingUp className="w-4 h-4" strokeWidth={3} />
            Trending
          </button>
          <button
            onClick={() => setViewMode('new')}
            className={`px-4 py-2 font-black text-xs uppercase tracking-wide whitespace-nowrap transition-all ${
              viewMode === 'new'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20'
            }`}
          >
            New Arrivals
          </button>
        </div>
      </div>

      {/* Filters - Minimal */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`
                px-4 py-2 font-semibold text-xs whitespace-nowrap transition-all
                ${
                  activeFilter === filter
                    ? 'bg-[#48CD8A] text-black'
                    : 'bg-white/10 text-white/60 backdrop-blur-sm border border-white/10 hover:bg-white/20'
                }
              `}
            >
              {filter}
            </button>
          ))}

          <button className="px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 hover:bg-white/20 transition-all flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editorial Product Grid - Masonry style */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.slice(1).map((product, idx) => {
            // Vary height: every 3rd item is taller
            const isTall = idx % 3 === 0;
            const aspectClass = isTall ? 'aspect-[3/5]' : 'aspect-[3/4]';

            return (
              <Link key={product.id} to={`/product/${product.id}`}>
                <div className={`relative ${aspectClass} overflow-hidden group`}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isTrending && (
                      <span className="px-2 py-1 bg-[#48CD8A] text-black text-[10px] font-black uppercase flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" strokeWidth={3} />
                        Hot
                      </span>
                    )}
                    {product.isNew && (
                      <span className="px-2 py-1 bg-white text-black text-[10px] font-black uppercase">
                        New
                      </span>
                    )}
                    {product.aiMatch && product.aiMatch >= 90 && (
                      <span className="px-2 py-1 bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] text-black text-[10px] font-black flex items-center gap-1">
                        <Sparkles className="w-3 h-3" strokeWidth={3} />
                        {product.aiMatch}%
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white transition-all group/btn"
                    >
                      <Heart className="w-4 h-4 text-white group-hover/btn:text-black" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Product Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white text-sm font-black mb-1 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-white/70 text-xs font-semibold mb-2 truncate">
                      {product.brand}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-white text-lg font-black">
                        ${product.price}
                      </p>
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#48CD8A] fill-[#48CD8A]" strokeWidth={2.5} />
                          <span className="text-white text-xs font-black">{product.rating}</span>
                        </div>
                      )}
                    </div>

                    {product.condition && (
                      <p className="text-white/60 text-xs font-semibold mt-1">
                        {product.condition}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
