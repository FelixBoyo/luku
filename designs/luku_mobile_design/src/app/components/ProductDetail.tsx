import { useState } from 'react';
import { ChevronLeft, Heart, Share2, Star, MessageCircle, ShoppingCart, Zap, ChevronRight, X, User, TrendingUp, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { SectionCard } from './common/SectionCard';

export function ProductDetail() {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const product = {
    name: 'Vintage Denim Jacket',
    brand: "Levi's",
    price: 89.99,
    originalPrice: 120.00,
    rating: 4.8,
    reviewCount: 156,
    seller: {
      id: 'stylehaven',
      name: 'StyleHaven',
      rating: 5.0,
      sales: 412,
      responseRate: 98,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    condition: 'Like New',
    description: 'Classic vintage denim jacket in excellent condition. Features authentic distressing and a timeless cut that pairs well with everything.',
    images: ['', '', ''],
    category: 'Layers',
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  const reviews = [
    { name: 'Emma R.', rating: 5, comment: 'Perfect fit! Exactly as described.', date: 'May 10, 2024', verified: true },
    { name: 'James L.', rating: 4, comment: 'Great quality, shipped fast.', date: 'May 8, 2024', verified: true },
    { name: 'Sophie M.', rating: 5, comment: 'Love it! Even better in person.', date: 'May 5, 2024', verified: true },
  ];

  const similarItems = [
    {
      id: 4,
      name: 'Linen Blazer',
      brand: 'Modern Staples',
      price: 195,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
      seller: 'UrbanStyle',
      rating: 4.8,
    },
    {
      id: 5,
      name: 'Cashmere Cardigan',
      brand: 'Soft Essentials',
      price: 168,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
      seller: 'RetroCloset',
      rating: 4.6,
    },
    {
      id: 1,
      name: 'Wool Trench Coat',
      brand: 'Timeless Essentials',
      price: 285,
      image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
      seller: 'ChicBoutique',
      rating: 4.9,
    },
  ];

  const aiRecommendations = [
    {
      id: 2,
      name: 'Wide Leg Trousers',
      brand: 'Urban Staples',
      price: 125,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
      aiMatch: 91,
      reason: 'Pairs perfectly with denim jackets',
    },
    {
      id: 6,
      name: 'White Cotton T-Shirt',
      brand: 'Basics Co.',
      price: 45,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      aiMatch: 94,
      reason: 'Classic combination for casual looks',
    },
  ];

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-32"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Floating header - transparent */}
      <div className="fixed top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
          <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsWishlisted(!isWishlisted)} className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#48CD8A] text-[#48CD8A]' : 'text-white'}`} strokeWidth={2.5} />
          </button>
          <button className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Full-bleed hero image */}
      <div className="relative h-[75vh] overflow-hidden">
        <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-white/40 text-sm font-semibold">
          Product Image
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>

        {/* Condition badge */}
        <div className="absolute top-20 left-6">
          <div className="px-3 py-1 bg-[#48CD8A]">
            <span className="text-black text-xs font-black uppercase">{product.condition}</span>
          </div>
        </div>
      </div>

      {/* Thumbnail gallery */}
      <div className="px-6 -mt-16 relative z-10 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {product.images.map((_, idx) => (
            <div key={idx} className="aspect-square w-20 bg-white/10 backdrop-blur-md border border-white/20 flex-shrink-0"></div>
          ))}
        </div>
      </div>

      {/* Product Info */}
      <div className="px-6 pb-6">
        <div className="mb-8">
          <p className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">{product.brand}</p>
          <h1 className="text-white text-4xl font-black mb-3 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#48CD8A] text-[#48CD8A]" strokeWidth={2.5} />
              <span className="text-white text-sm font-black">{product.rating}</span>
            </div>
            <span className="text-white/60 text-xs font-semibold">({product.reviewCount} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-white text-5xl font-black">${product.price}</span>
            <span className="text-white/40 text-xl font-semibold line-through">${product.originalPrice}</span>
          </div>

          <p className="text-white/80 text-sm font-semibold leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Size Selection - cleaner for functional screen */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-xs font-black uppercase tracking-wide">Select Size</h3>
            <button
              onClick={() => setShowSizeGuide(true)}
              className="text-[#48CD8A] text-xs font-bold uppercase"
            >
              Size Guide
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-3 font-black text-sm transition-all ${
                  selectedSize === size
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div>
            <h3 className="text-white text-xs font-black mb-3 uppercase tracking-wide">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-white/10 border border-white/20 text-white font-black hover:bg-white/20 transition-colors"
              >
                -
              </button>
              <span className="text-white text-xl font-black w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-white/10 border border-white/20 text-white font-black hover:bg-white/20 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl mb-6">
          <p className="text-white/60 text-xs font-black mb-3 uppercase">Sold By</p>
          <Link to={`/user/${product.seller.id}`}>
            <div className="flex items-center gap-3 mb-4 p-3 bg-black/40 backdrop-blur-sm rounded-lg hover:bg-black/60 transition-colors border border-white/10">
              <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                <img src={product.seller.avatar} alt={product.seller.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-black">{product.seller.name}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#48CD8A] fill-[#48CD8A]" strokeWidth={3} />
                    <span className="text-white text-xs font-black">{product.seller.rating}</span>
                  </div>
                  <span className="text-white/60 text-xs font-semibold">{product.seller.sales} sales</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" strokeWidth={3} />
            </div>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
              <p className="text-white text-lg font-black">{product.seller.responseRate}%</p>
              <p className="text-white/70 text-xs font-semibold">Response Rate</p>
            </div>
            <div className="text-center p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
              <p className="text-white text-lg font-black">&lt; 2h</p>
              <p className="text-white/70 text-xs font-semibold">Response Time</p>
            </div>
          </div>
          <Link to="/inbox">
            <button className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg text-white text-sm font-black hover:bg-white/20 transition-colors">
              <MessageCircle className="w-4 h-4" strokeWidth={3} />
              Contact Seller
            </button>
          </Link>
        </div>

        <div className="mb-6">
          <SectionCard
            title="PAIRS WELL WITH"
            subtitle="AI suggestions based on this item"
            variant="elevated"
            headerCTA={{
              label: 'View All',
              onClick: () => {},
            }}
          >
            <div className="space-y-3">
              {aiRecommendations.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`}>
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-[#F2B872] hover:bg-black/60 transition-all">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="px-2 py-0.5 bg-gradient-to-r from-[#F2B872] to-[#D98C4A] rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-black" strokeWidth={3} />
                            <span className="text-black text-xs font-black">{item.aiMatch}%</span>
                          </div>
                        </div>
                        <h4 className="text-white text-sm font-black truncate">{item.name}</h4>
                        <p className="text-white/70 text-xs font-semibold mb-1">{item.reason}</p>
                        <p className="text-white text-lg font-black">${item.price}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="mb-6">
          <SectionCard
            title="SIMILAR ITEMS"
            subtitle="More from this category"
            variant="gradient"
            headerCTA={{
              label: 'View All',
              onClick: () => {},
            }}
          >
            <div className="grid grid-cols-3 gap-3">
              {similarItems.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`}>
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-[#F2B872] transition-all">
                    <div className="aspect-[3/4] bg-white/5">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <h4 className="text-white text-xs font-black truncate">{item.name}</h4>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-2 h-2 text-[#48CD8A] fill-[#48CD8A]" strokeWidth={3} />
                        <span className="text-white text-xs font-bold">{item.rating}</span>
                      </div>
                      <p className="text-white text-sm font-black">${item.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-black">CUSTOMER REVIEWS ({reviews.length})</h3>
            <button className="flex items-center gap-1 text-[#48CD8A] text-xs font-bold">
              View All
              <ChevronRight className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={idx} className="pb-4 border-b border-white/10 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-black">{review.name}</p>
                    {review.verified && (
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-black rounded">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#48CD8A] text-[#48CD8A]" strokeWidth={2.5} />
                    ))}
                  </div>
                </div>
                <p className="text-white/70 text-sm font-semibold mb-1">{review.comment}</p>
                <p className="text-white/40 text-xs font-semibold">{review.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-20 px-5 py-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.98) 60%, transparent)' }}>
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-white/15 text-white font-black uppercase text-sm tracking-wide transition-all hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <ShoppingCart className="w-4 h-4" strokeWidth={2.5} />
            Add to Cart
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#48CD8A] text-black font-black uppercase text-sm tracking-wide hover:bg-[#3AB87A] transition-colors">
            <Zap className="w-4 h-4" strokeWidth={2.5} />
            Buy Now
          </button>
        </div>
      </div>

      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border-2 border-black/30 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-black text-xl font-black">SIZE GUIDE</h3>
              <button onClick={() => setShowSizeGuide(false)}>
                <X className="w-6 h-6 text-black/40" strokeWidth={2.5} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-[#FAFAFA] rounded-lg">
                <span className="text-black text-sm font-black">XS</span>
                <span className="text-black text-sm font-semibold">Bust: 32-34"</span>
              </div>
              <div className="flex justify-between p-3 bg-[#FAFAFA] rounded-lg">
                <span className="text-black text-sm font-black">S</span>
                <span className="text-black text-sm font-semibold">Bust: 34-36"</span>
              </div>
              <div className="flex justify-between p-3 bg-[#FAFAFA] rounded-lg">
                <span className="text-black text-sm font-black">M</span>
                <span className="text-black text-sm font-semibold">Bust: 36-38"</span>
              </div>
              <div className="flex justify-between p-3 bg-[#FAFAFA] rounded-lg">
                <span className="text-black text-sm font-black">L</span>
                <span className="text-black text-sm font-semibold">Bust: 38-40"</span>
              </div>
              <div className="flex justify-between p-3 bg-[#FAFAFA] rounded-lg">
                <span className="text-black text-sm font-black">XL</span>
                <span className="text-black text-sm font-semibold">Bust: 40-42"</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}