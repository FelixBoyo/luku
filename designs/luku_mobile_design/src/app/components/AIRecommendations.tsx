import { Sparkles, TrendingUp, Heart, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router';
import { SectionCard } from './common/SectionCard';

type RecommendedProduct = {
  id: number;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  aiReason: string; // Why AI recommends this
  matchScore: number; // 0-100
  matchesItems: string[]; // Wardrobe items it matches
  seller: {
    name: string;
    rating: number;
  };
  rating?: number;
  reviewCount?: number;
};

const aiRecommendations: RecommendedProduct[] = [
  {
    id: 1,
    name: 'Wool Trench Coat',
    brand: 'Timeless Essentials',
    price: 285,
    imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHRyZW5jaCUyMGNvYXQlMjBtaW5pbWFsfGVufDF8fHx8MTc3NjIwMjAwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    aiReason: 'Completes your earth-tone wardrobe',
    matchScore: 98,
    matchesItems: ['Cashmere Sweater', 'Tailored Trousers', 'Leather Shoes'],
    seller: { name: 'ChicBoutique', rating: 4.9 },
    rating: 4.8,
    reviewCount: 45,
  },
  {
    id: 2,
    name: 'Gold Chain Necklace',
    brand: 'Minimal Jewelry Co.',
    price: 78,
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwbmVja2xhY2UlMjBtaW5pbWFsfGVufDF8fHx8MTc3NjUzMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    aiReason: 'Pairs with your existing accessories',
    matchScore: 94,
    matchesItems: ['White T-Shirt', 'Linen Shirt'],
    seller: { name: 'ModernWardrobe', rating: 4.7 },
    rating: 4.9,
    reviewCount: 32,
  },
  {
    id: 3,
    name: 'Wide Leg Trousers',
    brand: 'Urban Staples',
    price: 125,
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHRyb3VzZXJzfGVufDF8fHx8MTc3NjIwMjAwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    aiReason: 'Matches your minimalist aesthetic',
    matchScore: 91,
    matchesItems: ['Cotton T-Shirt', 'Sneakers'],
    seller: { name: 'StyleHaven', rating: 5.0 },
    rating: 4.7,
    reviewCount: 28,
  },
  {
    id: 4,
    name: 'Leather Tote Bag',
    brand: 'Craftsman Studio',
    price: 198,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwdG90ZSUyMGJhZ3xlbnwxfHx8fDE3NzY1MzAwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    aiReason: 'Perfect for your work outfits',
    matchScore: 89,
    matchesItems: ['Wool Coat', 'Ankle Boots'],
    seller: { name: 'UrbanStyle', rating: 4.8 },
    rating: 4.6,
    reviewCount: 19,
  },
];

export function AIRecommendations() {
  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Hero Header with gradient */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#48CD8A]/20 via-[#3AB87A]/10 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-[#48CD8A]" strokeWidth={3} />
            <h1 className="text-white text-5xl font-black tracking-tighter leading-none">
              AI PICKS
            </h1>
          </div>
          <p className="text-white/70 text-sm font-semibold">
            Curated based on your wardrobe and style DNA
          </p>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="px-6 pb-8 -mt-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-black" strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-white text-sm font-black mb-1 uppercase tracking-wide">
                Style Analysis Complete
              </h3>
              <p className="text-white/70 text-sm font-semibold mb-3">
                Based on your 24 wardrobe items, we found pieces that perfectly complement your minimalist aesthetic.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#48CD8A] text-black text-xs font-black uppercase">
                  98% Match
                </span>
                <span className="px-3 py-1 bg-white/10 text-white text-xs font-black uppercase">
                  4 Perfect Fits
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations: Large editorial cards */}
      <div className="px-6 pb-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-white text-xs font-black uppercase tracking-widest mb-1">
              Top Recommendations
            </h2>
            <p className="text-white/60 text-xs font-semibold">Ordered by match score</p>
          </div>
          <button className="flex items-center gap-1 text-[#48CD8A] text-xs font-black uppercase">
            <Sparkles className="w-4 h-4" strokeWidth={3} />
            Refresh
          </button>
        </div>

        <div className="space-y-5">
          {aiRecommendations.map((product, idx) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <div className="relative h-80 overflow-hidden group">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  {/* Top badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-black" strokeWidth={3} />
                        <span className="text-black text-xs font-black">
                          {product.matchScore}% Match
                        </span>
                      </div>
                      {idx === 0 && (
                        <span className="px-2 py-1 bg-white text-black text-xs font-black uppercase">
                          #1 Pick
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white transition-colors group/btn"
                      >
                        <Heart className="w-5 h-5 text-white group-hover/btn:text-black" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="w-10 h-10 bg-white flex items-center justify-center hover:bg-[#48CD8A] transition-colors"
                      >
                        <ShoppingCart className="w-5 h-5 text-black" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom content */}
                  <div>
                    <h3 className="text-white text-2xl font-black mb-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-white/70 text-sm font-semibold mb-3">
                      {product.brand}
                    </p>
                    <p className="text-white/90 text-sm font-semibold mb-3">
                      {product.aiReason}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.matchesItems.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="px-2 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-white text-3xl font-black">${product.price}</p>
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#48CD8A] fill-[#48CD8A]" strokeWidth={3} />
                          <span className="text-white text-sm font-black">{product.rating}</span>
                          <span className="text-white/60 text-xs font-semibold">
                            ({product.reviewCount})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="px-6 pb-8">
        <div className="mb-4">
          <h2 className="text-white text-xs font-black uppercase tracking-widest mb-1">
            How It Works
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="w-10 h-10 bg-[#48CD8A] flex items-center justify-center flex-shrink-0">
              <span className="text-black text-sm font-black">1</span>
            </div>
            <div>
              <h4 className="text-white font-black text-sm mb-1 uppercase tracking-wide">
                Wardrobe Analysis
              </h4>
              <p className="text-white/70 text-xs font-semibold">
                Our AI analyzes your existing items, colors, and style preferences
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="w-10 h-10 bg-[#3AB87A] flex items-center justify-center flex-shrink-0">
              <span className="text-black text-sm font-black">2</span>
            </div>
            <div>
              <h4 className="text-white font-black text-sm mb-1 uppercase tracking-wide">
                Smart Matching
              </h4>
              <p className="text-white/70 text-xs font-semibold">
                We find items that complement your wardrobe and fill style gaps
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="w-10 h-10 bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-black text-sm font-black">3</span>
            </div>
            <div>
              <h4 className="text-white font-black text-sm mb-1 uppercase tracking-wide">
                Personalized Ranking
              </h4>
              <p className="text-white/70 text-xs font-semibold">
                Items are scored based on compatibility, price, and seller quality
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA to Browse All */}
      <div className="px-6 pb-8">
        <Link to="/marketplace">
          <button className="w-full bg-white text-black py-4 font-black uppercase text-sm hover:bg-[#48CD8A] transition-colors tracking-wide">
            Browse All Products
          </button>
        </Link>
      </div>
    </div>
  );
}
