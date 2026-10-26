import { useState } from 'react';
import { Send, RefreshCw, ShoppingBag, Heart, Camera } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


type OutfitItem = {
  id: number;
  name: string;
  image: string;
  owned: boolean;
  price?: number;
};

type OutfitSuggestion = {
  id: string;
  name: string;
  occasion: string;
  fromWardrobe?: boolean;
  items: OutfitItem[];
};

const mockOutfits: OutfitSuggestion[] = [
  {
    id: '1',
    name: 'Casual Weekend Vibes',
    occasion: 'Weekend Brunch',
    items: [
      { id: 1, name: 'Linen Blazer', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', owned: true },
      { id: 2, name: 'White Cotton Tee', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', owned: true },
      { id: 3, name: 'High-Waist Jeans', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', owned: false, price: 8500 },
      { id: 4, name: 'Leather Sneakers', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', owned: true },
    ],
  },
  {
    id: '2',
    name: 'Already In Your Closet',
    occasion: 'Weekend Errands',
    fromWardrobe: true,
    items: [
      { id: 9, name: 'Denim Jacket', image: 'https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=400', owned: true },
      { id: 10, name: 'Striped Shirt', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', owned: true },
      { id: 11, name: 'Chino Trousers', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', owned: true },
      { id: 12, name: 'White Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', owned: true },
    ],
  },
  {
    id: '3',
    name: 'Office Professional',
    occasion: 'Business Meeting',
    items: [
      { id: 5, name: 'Wool Trench', image: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=400', owned: true },
      { id: 6, name: 'Silk Blouse', image: 'https://images.unsplash.com/photo-1624206112431-23cbb5116b02?w=400', owned: false, price: 6200 },
      { id: 7, name: 'Tailored Trousers', image: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=400', owned: true },
      { id: 8, name: 'Ankle Boots', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', owned: true },
    ],
  },
];

export function Stylist() {
  const [prompt, setPrompt] = useState('');
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>(mockOutfits);
  const [isGenerating, setIsGenerating] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const toggleFavorite = (outfitId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(outfitId) ? next.delete(outfitId) : next.add(outfitId);
      return next;
    });
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Header — no icon */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-white text-3xl font-black tracking-tight leading-none mb-1">AI STYLIST</h1>
        <p className="text-white/60 text-sm font-semibold">Get outfit suggestions from your wardrobe</p>
      </div>

      {/* Prompt Input */}
      <div className="px-6 pb-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <label className="text-white text-xs font-black uppercase tracking-wide mb-3 block">
            Describe Your Needs
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'I need an outfit for a casual coffee date this weekend' or 'Suggest a professional look for my presentation'"
            className="w-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-[#F2B872] transition-colors resize-none h-24 mb-3"
          />
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-xs font-semibold">
              💡 Be specific about occasion, weather, or style
            </p>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="bg-gradient-to-r from-[#F2B872] to-[#D98C4A] text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />Generating...</>
              ) : (
                <><Send className="w-3.5 h-3.5" strokeWidth={2.5} />Generate</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Outfit Cards */}
      <div className="px-6 pb-6">
        <h2 className="text-white text-xs font-black uppercase tracking-widest mb-4">
          Suggested Outfits ({outfits.length})
        </h2>
        <div className="space-y-5">
          {outfits.map((outfit) => (
            <div
              key={outfit.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-5">
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {outfit.fromWardrobe && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#48CD8A]/15 border border-[#48CD8A]/30 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#48CD8A]" />
                        <span className="text-[#48CD8A] text-[9px] font-black uppercase tracking-widest">From Your Wardrobe</span>
                      </div>
                    )}
                    <h3 className="text-white text-base font-black leading-tight">{outfit.name}</h3>
                    <p className="text-white/50 text-xs font-semibold mt-0.5">{outfit.occasion}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 ml-3">
                    {/* Virtual Try-On */}
                    <Link to="/virtual-try-on">
                      <button className="w-9 h-9 bg-[#8A48CD]/20 border border-[#8A48CD]/30 rounded-xl flex items-center justify-center hover:bg-[#8A48CD]/30 transition-colors">
                        <Camera className="w-4 h-4 text-[#8A48CD]" strokeWidth={2.5} />
                      </button>
                    </Link>
                    {/* Favorite */}
                    <button
                      onClick={() => toggleFavorite(outfit.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        favorites.has(outfit.id)
                          ? 'bg-[#F2B872]/20 border border-[#F2B872]/40'
                          : 'bg-white/10 border border-white/10 hover:bg-white/15'
                      }`}
                    >
                      <Heart
                        className="w-4 h-4"
                        strokeWidth={2.5}
                        style={{ color: favorites.has(outfit.id) ? '#F2B872' : 'white', fill: favorites.has(outfit.id) ? '#F2B872' : 'none' }}
                      />
                    </button>
                    {/* Regenerate */}
                    <button
                      onClick={() => console.log('Regenerating', outfit.id)}
                      className="w-9 h-9 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-white/70" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Items grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {outfit.items.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/20">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-1.5">
                          <p className="text-white text-[9px] font-bold truncate drop-shadow-lg">{item.name}</p>
                        </div>
                        {!item.owned && (
                          <div className="absolute top-1 right-1">
                            <div className="w-5 h-5 bg-[#F2B872] rounded-full flex items-center justify-center">
                              <ShoppingBag className="w-3 h-3 text-black" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                        {item.owned && (
                          <div className="absolute top-1 left-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#48CD8A] shadow-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Complete The Look — only for non-wardrobe cards */}
                {!outfit.fromWardrobe && outfit.items.some((item) => !item.owned) && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-white text-xs font-black uppercase tracking-wide mb-3">Complete The Look</p>
                    <div className="space-y-2">
                      {outfit.items.filter((item) => !item.owned).map((item) => (
                        <Link key={item.id} to={`/product/${item.id}`}>
                          <div className="bg-black/40 rounded-xl p-3 border border-white/10 hover:border-[#F2B872] transition-all flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-black truncate">{item.name}</h4>
                              <p className="text-[#F2B872] text-sm font-black">KES {item.price?.toLocaleString()}</p>
                            </div>
                            <button className="w-8 h-8 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center hover:bg-[#F2B872] hover:border-[#F2B872] transition-all flex-shrink-0">
                              <ShoppingBag className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                            </button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Style Enhancers */}
      <div className="px-6 pb-12">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-white text-base font-black uppercase tracking-wide">Style Enhancers</h2>
            <p className="text-white/50 text-xs font-semibold mt-0.5">Items that complement your wardrobe</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 101, name: 'Leather Jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', price: 12500, match: 94 },
              { id: 102, name: 'Silk Scarf', image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400', price: 2800, match: 91 },
            ].map((item) => (
              <Link key={item.id} to={`/product/${item.id}`}>
                <div className="bg-black/40 rounded-xl overflow-hidden border border-white/10 hover:border-[#F2B872] transition-all">
                  <div className="relative aspect-[3/4]">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <div className="px-2 py-0.5 bg-gradient-to-r from-[#F2B872] to-[#D98C4A] rounded-full">
                        <span className="text-black text-[10px] font-black">{item.match}% Match</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-black mb-0.5 line-clamp-1">{item.name}</h3>
                    <p className="text-[#F2B872] text-sm font-black">KES {item.price.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
