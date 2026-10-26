import { useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


const brandProducts = [
  {
    id: 1,
    name: 'Vintage Leather Jacket',
    price: 12500,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Wool Trench Coat',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Cashmere Sweater',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Linen Blazer',
    price: 9100,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
    rating: 4.8,
  },
];

export function BrandDetail() {
  const navigate = useNavigate();
  const { brandId } = useParams();

  // Mock brand data
  const brandData: Record<string, any> = {
    heritage: {
      name: 'Heritage Finds',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
      description: 'Timeless pieces with a story. Vintage and heritage-inspired fashion.',
      products: 12,
    },
    timeless: {
      name: 'Timeless Essentials',
      logo: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200',
      description: 'Modern essentials that stand the test of time.',
      products: 8,
    },
    modern: {
      name: 'Modern Staples',
      logo: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200',
      description: 'Contemporary fashion for the modern wardrobe.',
      products: 15,
    },
    urban: {
      name: 'UrbanStyle',
      logo: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200',
      description: 'Street style meets sophistication.',
      products: 20,
    },
  };

  const brand = brandData[brandId || 'heritage'] || brandData.heritage;

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Brand Header */}
      <div className="px-6 pt-8 pb-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          <span className="text-sm font-black uppercase">Back</span>
        </button>

        {/* Brand Info */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 bg-white/10 rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
              <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="text-white text-2xl font-black mb-2">{brand.name}</h1>
              <p className="text-white/70 text-sm font-semibold mb-3">{brand.description}</p>
              <p className="text-white/60 text-xs font-semibold">
                {brand.products} products available
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <h2 className="text-white text-xl font-black mb-4 uppercase tracking-wide">Products</h2>
          <div className="grid grid-cols-2 gap-3">
            {brandProducts.map((product) => (
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
      </div>

      <BottomNav />
    </div>
  );
}
