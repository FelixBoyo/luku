import { useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


const styleProducts = [
  {
    id: 1,
    name: 'Wool Trench Coat',
    brand: 'Timeless Essentials',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600',
    rating: 4.8,
  },
  {
    id: 2,
    name: 'Linen Blazer',
    brand: 'Modern Staples',
    price: 9100,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Cashmere Sweater',
    brand: 'Soft Essentials',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
    rating: 4.6,
  },
  {
    id: 4,
    name: 'Minimalist Handbag',
    brand: 'Essential Leather Co.',
    price: 9800,
    image: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=600',
    rating: 4.9,
  },
  {
    id: 5,
    name: 'Leather Ankle Boots',
    brand: 'Heritage Footwear',
    price: 11200,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
    rating: 4.8,
  },
  {
    id: 6,
    name: 'Silk Midi Dress',
    brand: 'Modern Staples',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
    rating: 4.7,
  },
];

export function StyleDetail() {
  const navigate = useNavigate();
  const { styleId } = useParams();

  // Mock style data
  const styleData: Record<string, any> = {
    minimalist: {
      name: 'Minimalist',
      description: 'Clean lines, neutral tones, and timeless pieces. Less is more.',
      image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800',
      count: 234,
      tags: ['Clean Lines', 'Neutral Tones', 'Timeless', 'Simple'],
    },
    streetwear: {
      name: 'Streetwear',
      description: 'Urban edge meets casual comfort. Bold statements and contemporary vibes.',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
      count: 189,
      tags: ['Urban', 'Bold', 'Casual', 'Contemporary'],
    },
    vintage: {
      name: 'Vintage',
      description: 'Retro charm with a modern twist. Unique pieces with character.',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      count: 156,
      tags: ['Retro', 'Unique', 'Timeless', 'Character'],
    },
    business: {
      name: 'Business Casual',
      description: 'Professional polish with approachable style. Work-ready sophistication.',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      count: 198,
      tags: ['Professional', 'Polished', 'Sophisticated', 'Work-Ready'],
    },
  };

  const style = styleData[styleId || 'minimalist'] || styleData.minimalist;

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={style.image}
          alt={style.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          <span className="text-sm font-black uppercase">Back</span>
        </button>

        {/* Style Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-white text-4xl font-black mb-2">{style.name}</h1>
          <p className="text-white/90 text-base font-semibold mb-3">{style.description}</p>
          <p className="text-white/70 text-sm font-semibold">{style.count} items</p>
        </div>
      </div>

      {/* Style Tags */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {style.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm font-black uppercase tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-6 pb-12">
        <h2 className="text-white text-xl font-black mb-4 uppercase tracking-wide">
          Shop This Style
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {styleProducts.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <div className="relative aspect-[3/4] overflow-hidden group rounded-xl">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                <div className="absolute top-3 right-3">
                  <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-black fill-black" strokeWidth={3} />
                    <span className="text-black text-xs font-black">{product.rating}</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white/60 text-xs font-semibold mb-1">{product.brand}</p>
                  <h3 className="text-white font-black mb-2 leading-tight text-base">
                    {product.name}
                  </h3>
                  <p className="text-white font-black text-lg">
                    KES {product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
