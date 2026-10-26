import { useState } from 'react';
import { Sparkles, TrendingUp, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';

export function StyleDNA() {
  const styleKeywords = [
    { word: 'Minimalist', size: 28, weight: 90 },
    { word: 'Casual', size: 24, weight: 75 },
    { word: 'Modern', size: 20, weight: 60 },
    { word: 'Classic', size: 18, weight: 50 },
    { word: 'Elegant', size: 16, weight: 40 },
    { word: 'Bohemian', size: 14, weight: 30 },
    { word: 'Edgy', size: 12, weight: 20 },
    { word: 'Vintage', size: 12, weight: 15 },
  ];

  const topColors = [
    { color: '#1A1A1A', name: 'Black', percentage: 35 },
    { color: '#FFFFFF', name: 'White', percentage: 28 },
    { color: '#8A48CD', name: 'Navy', percentage: 18 },
    { color: '#C9B8A8', name: 'Beige', percentage: 12 },
    { color: '#8B4513', name: 'Brown', percentage: 7 },
  ];

  const favoriteCategories = [
    { category: 'Tops', count: 42, percentage: 35 },
    { category: 'Bottoms', count: 28, percentage: 23 },
    { category: 'Dresses', count: 24, percentage: 20 },
    { category: 'Outerwear', count: 18, percentage: 15 },
    { category: 'Shoes', count: 8, percentage: 7 },
  ];

  const styleEvolution = `Your style has evolved significantly over the past year. You started with a more colorful, experimental approach but have gradually shifted towards a minimalist aesthetic with a focus on neutral tones and timeless pieces. Your wardrobe now reflects a "capsule wardrobe" philosophy with versatile, high-quality items.`;

  const recommendations = [
    { id: 1, title: 'Add More Accessories', description: 'Elevate your minimalist looks with statement jewelry' },
    { id: 2, title: 'Experiment with Textures', description: 'Try different fabrics to add depth to neutral outfits' },
    { id: 3, title: 'Seasonal Color Accents', description: 'Incorporate seasonal colors while keeping your base neutral' },
  ];

  const stats = {
    avgRating: 4.6,
    totalOutfits: 156,
    mostWornItem: 'Black Blazer',
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            STYLE DNA
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Your unique style profile
        </p>
      </div>

      {/* Style Keywords Cloud */}
      <div className="px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <h3 className="text-white text-sm font-black mb-4">YOUR STYLE KEYWORDS</h3>
          <div className="flex flex-wrap gap-3 justify-center py-4">
            {styleKeywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-black border-2 border-white/10 rounded-lg text-black transition-transform hover:scale-105"
                style={{
                  fontSize: `${keyword.size}px`,
                  fontWeight: keyword.weight >= 70 ? 900 : keyword.weight >= 50 ? 700 : 600,
                }}
              >
                {keyword.word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Colors */}
      <div className="px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <h3 className="text-white text-sm font-black mb-4">TOP COLORS</h3>
          <div className="space-y-3">
            {topColors.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-white/20"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <p className="text-white text-sm font-black">{item.name}</p>
                  </div>
                  <p className="text-white/70 text-sm font-semibold">{item.percentage}%</p>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#48CD8A] rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Favorite Categories */}
      <div className="px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <h3 className="text-white text-sm font-black mb-4">FAVORITE CATEGORIES</h3>
          <div className="space-y-3">
            {favoriteCategories.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-black rounded-lg">
                <div className="flex-1">
                  <p className="text-white text-sm font-black mb-1">{item.category}</p>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3AB87A] rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-white text-lg font-black">{item.count}</p>
                  <p className="text-white/60 text-xs font-semibold">items</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 text-center">
            <TrendingUp className="w-6 h-6 text-[#48CD8A] mx-auto mb-2" strokeWidth={2.5} />
            <p className="text-white text-xl font-black mb-1">{stats.avgRating}</p>
            <p className="text-white/70 text-xs font-semibold">Avg Rating</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 text-center">
            <Sparkles className="w-6 h-6 text-[#48CD8A] mx-auto mb-2" strokeWidth={2.5} />
            <p className="text-white text-xl font-black mb-1">{stats.totalOutfits}</p>
            <p className="text-white/70 text-xs font-semibold">Outfits</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 text-center">
            <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" strokeWidth={2.5} />
            <p className="text-white text-xs font-black mb-1">{stats.mostWornItem}</p>
            <p className="text-white/70 text-xs font-semibold">Most Worn</p>
          </div>
        </div>
      </div>

      {/* Style Evolution */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-2xl p-6 border-2 border-white/20 text-white shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-6 h-6" strokeWidth={2.5} />
            <h3 className="font-black text-lg">STYLE EVOLUTION</h3>
          </div>
          <p className="font-semibold text-sm leading-relaxed text-white/95">
            {styleEvolution}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <h3 className="text-white text-sm font-black mb-4">PERSONALIZED RECOMMENDATIONS</h3>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 bg-black rounded-xl border-2 border-white/10 hover:border-[#48CD8A] transition-colors cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white text-sm font-black mb-1">{rec.title}</p>
                    <p className="text-white/70 text-xs font-semibold">{rec.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-black transition-colors flex-shrink-0 ml-2" strokeWidth={3} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        <Link to="/refine">
          <button className="w-full bg-white text-black py-4 rounded-lg font-black uppercase text-sm hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" strokeWidth={3} />
            Get New Outfit Suggestions
          </button>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
