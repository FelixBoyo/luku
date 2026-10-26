import { useState } from 'react';
import { Link } from 'react-router';
import { Sparkles, Heart, RefreshCw, X, TrendingUp, Camera, ShoppingBag, ChevronDown } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


// AI-powered personalized recommendations
const aiRecommendations = [
  {
    id: 1,
    name: 'Vintage Leather Jacket',
    brand: 'Heritage Finds',
    price: 12500,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    aiMatch: 96,
    reason: 'Complements your saved vintage pieces',
    seller: 'VintageVibes',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Wool Trench Coat',
    brand: 'Timeless Essentials',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800',
    aiMatch: 94,
    reason: 'Matches your earth-tone wardrobe',
    seller: 'ChicBoutique',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Minimalist Handbag',
    brand: 'Essential Leather Co.',
    price: 9800,
    image: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=800',
    aiMatch: 92,
    reason: 'Perfect for your minimalist style',
    seller: 'UrbanStyle',
    rating: 4.9,
  },
  {
    id: 4,
    name: 'Silk Midi Dress',
    brand: 'Modern Staples',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    aiMatch: 91,
    reason: 'Ideal for upcoming events in your calendar',
    seller: 'ChicBoutique',
    rating: 4.7,
  },
  {
    id: 5,
    name: 'Leather Ankle Boots',
    brand: 'Heritage Footwear',
    price: 11200,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    aiMatch: 90,
    reason: 'Completes your wardrobe essentials',
    seller: 'VintageVibes',
    rating: 4.8,
  },
  {
    id: 6,
    name: 'Cashmere Sweater',
    brand: 'Soft Essentials',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
    aiMatch: 89,
    reason: 'Based on your recent browsing',
    seller: 'UrbanStyle',
    rating: 4.6,
  },
];

// Trending products
const trendingProducts = [
  {
    id: 7,
    name: 'Denim Jacket',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    trending: true,
  },
  {
    id: 8,
    name: 'White Sneakers',
    price: 4200,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    trending: true,
  },
  {
    id: 9,
    name: 'Linen Blazer',
    price: 9100,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    trending: true,
  },
  {
    id: 10,
    name: 'Gold Necklace',
    price: 3800,
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
    trending: true,
  },
];

// You might also like (based on similar items in wardrobe)
const youMightLike = [
  {
    id: 11,
    name: 'Structured Blazer',
    price: 10500,
    image: 'https://images.unsplash.com/photo-1720746943211-b03c22290261?w=400',
  },
  {
    id: 12,
    name: 'Wool Scarf',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400',
  },
  {
    id: 13,
    name: 'Leather Belt',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1624222247344-70e88d0d4850?w=400',
  },
];

export function Home() {
  const [showPreferencePrompt, setShowPreferencePrompt] = useState(true);
  const [outfitOfDayIndex, setOutfitOfDayIndex] = useState(0);
  const [outfitLiked, setOutfitLiked] = useState(false);

  // Mock outfit of the day data
  const outfitsOfDay = [
    {
      id: 'ootd-1',
      name: 'Casual Chic Weekend',
      items: ['Linen Blazer', 'White Tee', 'High-Waist Jeans', 'Leather Sneakers'],
      image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800',
      occasion: 'Weekend Brunch',
      temperature: '22°C',
    },
    {
      id: 'ootd-2',
      name: 'Smart Professional',
      items: ['Wool Trench', 'Silk Blouse', 'Tailored Trousers', 'Ankle Boots'],
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
      occasion: 'Office Meeting',
      temperature: '19°C',
    },
    {
      id: 'ootd-3',
      name: 'Evening Elegance',
      items: ['Silk Dress', 'Statement Earrings', 'Clutch Bag', 'Heeled Sandals'],
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      occasion: 'Dinner Date',
      temperature: '20°C',
    },
  ];

  const currentOutfit = outfitsOfDay[outfitOfDayIndex];

  const refreshOutfit = () => {
    setOutfitOfDayIndex((prev) => (prev + 1) % outfitsOfDay.length);
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Outfit of the Day - AT THE TOP */}
      <div className="px-6 pt-6 pb-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Outfit of the Day</p>
              <h3 className="text-white text-base font-black leading-tight mt-0.5">{currentOutfit.name}</h3>
              <p className="text-white/50 text-xs font-semibold">{currentOutfit.occasion} · {currentOutfit.temperature}</p>
            </div>
          </div>

          <div className="px-4 pb-4">
            {/* Item grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {currentOutfit.items.map((item, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/20"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${
                      idx === 0 ? '1591047139829-d91aecb6caea' :
                      idx === 1 ? '1521572163474-6864f9cf17ab' :
                      idx === 2 ? '1542272604-787c3835535d' :
                      '1543163521-1bf539c55dd2'
                    }?w=200&fit=crop`}
                    alt={item}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-white text-[9px] font-bold truncate drop-shadow-lg">{item}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons row — all fit evenly below the grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setOutfitLiked(!outfitLiked)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                  outfitLiked
                    ? 'bg-[#F2B872]/15 border-[#F2B872]/40'
                    : 'bg-white/8 border-white/10 hover:bg-white/15'
                }`}
                style={{ background: outfitLiked ? undefined : 'rgba(255,255,255,0.05)' }}
              >
                <Heart
                  className="w-4 h-4"
                  strokeWidth={2.5}
                  style={{ color: outfitLiked ? '#F2B872' : 'white', fill: outfitLiked ? '#F2B872' : 'none' }}
                />
                <span className="text-[11px] font-black uppercase" style={{ color: outfitLiked ? '#F2B872' : 'rgba(255,255,255,0.8)' }}>
                  Save
                </span>
              </button>

              <Link to="/virtual-try-on" className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#8A48CD]/30 hover:bg-[#8A48CD]/15 transition-all" style={{ background: 'rgba(138,72,205,0.1)' }}>
                <Camera className="w-4 h-4 text-[#8A48CD]" strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase text-[#8A48CD]">Try On</span>
              </Link>

              <button
                onClick={refreshOutfit}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <RefreshCw className="w-4 h-4 text-white/70" strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase text-white/70">New</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="flex flex-col items-center py-1 gap-0.5">
        <p className="text-white/25 text-[9px] font-black uppercase tracking-widest">Scroll for more</p>
        <ChevronDown className="w-4 h-4 text-white/25 animate-bounce" strokeWidth={2.5} />
      </div>

      {/* Preference Refresh Prompt */}
      {showPreferencePrompt && (
        <div className="px-6 pt-2">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative shadow-xl">
            <button
              onClick={() => setShowPreferencePrompt(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/60" strokeWidth={2.5} />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F2B872]/20 to-[#D98C4A]/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-[#F2B872]/20">
                <Sparkles className="w-6 h-6 text-[#F2B872]" strokeWidth={2.5} />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="text-white text-base font-black mb-1">Refine Your Picks</h3>
                <p className="text-white/60 text-sm font-semibold mb-4 leading-relaxed">
                  Update your style preferences to get better recommendations
                </p>
                <Link to="/onboarding">
                  <button className="px-5 py-2 bg-white/10 backdrop-blur-sm text-white text-xs font-black rounded-lg hover:bg-white/20 transition-all uppercase tracking-wide border border-white/10">
                    Update Preferences
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="px-6 pt-8 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-6 h-6 text-[#48CD8A]" strokeWidth={2.5} />
          <h1 className="text-white text-2xl font-black tracking-tight">PICKED FOR YOU</h1>
        </div>
        <p className="text-white/70 text-sm font-semibold mb-4">
          AI-curated recommendations based on your style, wardrobe, and browsing
        </p>
      </div>

      {/* Hero Recommendation - Editorial Layout */}
      <div className="mb-8">
        <Link to={`/product/${aiRecommendations[0].id}`}>
          <div className="relative h-[600px] overflow-hidden group">
            <img
              src={aiRecommendations[0].image}
              alt={aiRecommendations[0].name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

            {/* AI Match Badge */}
            <div className="absolute top-6 left-6">
              <div className="px-4 py-2 bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-black" strokeWidth={3} />
                <span className="text-black text-sm font-black">{aiRecommendations[0].aiMatch}% Match</span>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-[#48CD8A] text-xs font-black uppercase tracking-wide mb-2">
                Top Pick
              </p>
              <h2 className="text-white text-4xl font-black tracking-tight leading-none mb-2">
                {aiRecommendations[0].name}
              </h2>
              <p className="text-white/80 text-sm font-semibold mb-4">
                {aiRecommendations[0].brand}
              </p>
              <p className="text-white/60 text-sm font-semibold mb-4 italic">
                {aiRecommendations[0].reason}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-white text-3xl font-black">
                  KES {aiRecommendations[0].price.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  <span className="text-[#48CD8A] text-sm font-black">{aiRecommendations[0].rating}</span>
                  <span className="text-white/50 text-xs font-semibold">/ 5</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Editorial Grid - Mix of sizes */}
      <div className="px-6 mb-12">
        <div className="grid grid-cols-2 gap-3">
          {/* Second recommendation - full width */}
          <Link to={`/product/${aiRecommendations[1].id}`} className="col-span-2">
            <div className="relative h-80 overflow-hidden group">
              <img
                src={aiRecommendations[1].image}
                alt={aiRecommendations[1].name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 bg-[#48CD8A]/90 backdrop-blur-sm rounded-full">
                  <span className="text-black text-xs font-black">{aiRecommendations[1].aiMatch}% Match</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white text-2xl font-black mb-1 leading-tight">
                  {aiRecommendations[1].name}
                </h3>
                <p className="text-white/70 text-xs font-semibold mb-2">{aiRecommendations[1].reason}</p>
                <p className="text-white text-xl font-black">
                  KES {aiRecommendations[1].price.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>

          {/* Third and fourth recommendations - side by side */}
          {aiRecommendations.slice(2, 4).map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <div className="relative aspect-[3/4] overflow-hidden group">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <div className="px-2 py-1 bg-[#48CD8A]/90 backdrop-blur-sm rounded-full">
                    <span className="text-black text-xs font-black">{product.aiMatch}%</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white text-base font-black mb-1 leading-tight">
                    {product.name}
                  </h4>
                  <p className="text-white/60 text-xs font-semibold mb-2 line-clamp-1">
                    {product.reason}
                  </p>
                  <p className="text-white text-lg font-black">
                    KES {product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* You Might Also Like */}
      <div className="mb-12">
        <div className="px-6 mb-4">
          <h2 className="text-white text-xs font-black uppercase tracking-widest mb-1">
            You Might Also Like
          </h2>
          <p className="text-white/60 text-xs font-semibold">Based on items in your wardrobe</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pl-6 pr-6" style={{ scrollbarWidth: 'none' }}>
          {youMightLike.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <div className="flex-shrink-0 w-44 group">
                <div className="relative aspect-[3/4] overflow-hidden mb-2 rounded-xl">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <p className="text-white text-sm font-black mb-1 line-clamp-1">{product.name}</p>
                <p className="text-white/60 text-sm font-semibold">
                  KES {product.price.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Now */}
      <div className="px-6 mb-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-white text-xs font-black uppercase tracking-widest mb-1">
              Trending Now
            </h2>
            <p className="text-white/60 text-xs font-semibold">What everyone's buying</p>
          </div>
          <Link to="/marketplace">
            <button className="flex items-center gap-1 text-[#48CD8A] text-xs font-black uppercase">
              <TrendingUp className="w-4 h-4" strokeWidth={3} />
              All
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {trendingProducts.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <div className="relative aspect-square overflow-hidden group rounded-xl">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-black text-xs font-black uppercase rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" strokeWidth={3} />
                    Hot
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="text-white text-sm font-black mb-1">{product.name}</h4>
                  <p className="text-white text-base font-black">
                    KES {product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* More Recommendations */}
      <div className="px-6 pb-12">
        <div className="mb-4">
          <h2 className="text-white text-xs font-black uppercase tracking-widest mb-1">
            More For You
          </h2>
          <p className="text-white/60 text-xs font-semibold">Keep exploring your personalized picks</p>
        </div>

        <div className="space-y-3">
          {aiRecommendations.slice(4).map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="px-2 py-0.5 bg-[#48CD8A]/20 rounded-full">
                      <span className="text-[#48CD8A] text-xs font-black">{product.aiMatch}%</span>
                    </div>
                  </div>
                  <h4 className="text-white text-sm font-black mb-1">{product.name}</h4>
                  <p className="text-white/60 text-xs font-semibold mb-2">{product.reason}</p>
                  <p className="text-white text-base font-black">
                    KES {product.price.toLocaleString()}
                  </p>
                </div>
                <button className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center hover:bg-[#48CD8A] hover:border-[#48CD8A] transition-all flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* View All AI Recommendations */}
        <Link to="/ai-recommendations">
          <button className="w-full mt-6 bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] text-black font-black text-sm py-4 rounded-xl hover:opacity-90 transition-opacity uppercase tracking-wide flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
            View All AI Recommendations
          </button>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}