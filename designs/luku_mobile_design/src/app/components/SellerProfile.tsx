import { useState } from 'react';
import { Star, MapPin, Calendar, ShoppingBag, Heart, MessageCircle, Share2, TrendingUp, Award, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { SectionCard } from './common/SectionCard';

type SellerProduct = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  condition: string;
  isSold?: boolean;
  likes: number;
};

export function SellerProfile() {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about'>('products');

  // Mock seller data
  const seller = {
    name: 'ChicBoutique',
    username: '@chicboutique',
    bio: 'Curating timeless, sustainable fashion pieces. Based in Portland, OR. Specializing in earth-tone essentials and vintage finds.',
    location: 'Portland, Oregon',
    joinedDate: 'March 2024',
    rating: 4.9,
    totalSales: 234,
    followers: 1248,
    totalReviews: 156,
    responseRate: '98%',
    responseTime: '< 2 hours',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
  };

  const products: SellerProduct[] = [
    {
      id: 1,
      name: 'Structured Handbag',
      price: 145,
      imageUrl: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=400',
      condition: 'New',
      likes: 42,
    },
    {
      id: 6,
      name: 'Leather Ankle Boots',
      price: 210,
      imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
      condition: 'New',
      likes: 38,
    },
    {
      id: 8,
      name: 'Minimalist Belt',
      price: 52,
      imageUrl: 'https://images.unsplash.com/photo-1624222247344-70e88d0d4850?w=400',
      condition: 'New',
      likes: 24,
    },
    {
      id: 9,
      name: 'Wool Scarf',
      price: 68,
      imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400',
      condition: 'Like New',
      likes: 31,
    },
    {
      id: 10,
      name: 'Silk Blouse',
      price: 95,
      imageUrl: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400',
      condition: 'Excellent',
      likes: 27,
    },
    {
      id: 11,
      name: 'Canvas Tote',
      price: 42,
      imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
      condition: 'New',
      isSold: true,
      likes: 18,
    },
  ];

  const reviews = [
    {
      id: 1,
      customer: 'Sarah M.',
      rating: 5,
      comment: 'Amazing quality and fast shipping! The handbag is even more beautiful in person.',
      product: 'Structured Handbag',
      date: '2 days ago',
      verified: true,
    },
    {
      id: 2,
      customer: 'James T.',
      rating: 5,
      comment: 'Great seller, very responsive and items exactly as described.',
      product: 'Leather Ankle Boots',
      date: '1 week ago',
      verified: true,
    },
    {
      id: 3,
      customer: 'Emma L.',
      rating: 4,
      comment: 'Beautiful piece! Packaging was excellent too.',
      product: 'Silk Blouse',
      date: '2 weeks ago',
      verified: true,
    },
  ];

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Editorial Cover Hero */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={seller.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black"></div>

        {/* Floating Navigation */}
        <div className="absolute top-0 left-0 right-0 px-6 pt-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center"
          >
            <span className="text-white font-black text-lg">←</span>
          </button>
          <button className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Seller Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-white">
              <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 pb-1">
              <h1 className="text-white text-3xl font-black mb-1 leading-tight">{seller.name}</h1>
              <p className="text-white/70 text-sm font-semibold mb-3">{seller.username}</p>

              {/* Stats Inline */}
              <div className="flex gap-4 mb-3">
                <div>
                  <span className="text-white text-lg font-black">{seller.totalSales}</span>
                  <span className="text-white/60 text-xs font-semibold ml-1">sales</span>
                </div>
                <div>
                  <span className="text-white text-lg font-black">{seller.followers}</span>
                  <span className="text-white/60 text-xs font-semibold ml-1">followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#48CD8A] fill-[#48CD8A]" strokeWidth={2.5} />
                  <span className="text-white text-lg font-black">{seller.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio & Actions */}
      <div className="px-6 mb-6">
        <p className="text-white/80 text-sm font-semibold mb-4 leading-relaxed">
          {seller.bio}
        </p>

        {/* Location & Joined */}
        <div className="flex flex-wrap gap-3 text-xs mb-4">
          <div className="flex items-center gap-1 text-white/60 font-semibold">
            <MapPin className="w-3 h-3" strokeWidth={2.5} />
            {seller.location}
          </div>
          <div className="flex items-center gap-1 text-white/60 font-semibold">
            <Calendar className="w-3 h-3" strokeWidth={2.5} />
            Joined {seller.joinedDate}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleFollow}
            className={`flex-1 py-3 font-black text-sm flex items-center justify-center gap-2 transition-colors uppercase tracking-wide ${isFollowing ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-white text-black hover:bg-[#FAFAFA]'}`}
          >
            <User className="w-4 h-4" strokeWidth={2.5} />
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <Link to="/inbox" className="flex-1">
            <button className="w-full py-3 bg-white/10 border border-white/20 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors uppercase tracking-wide">
              <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
              Message
            </button>
          </Link>
        </div>
      </div>

      {/* Seller Stats */}
      <div className="px-6 mb-6">
        <SectionCard title="SELLER_STATS" variant="elevated">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black rounded-lg p-3 border-2 border-white/10 text-center">
              <p className="text-white text-2xl font-black mb-1">{seller.responseRate}</p>
              <p className="text-white/70 text-xs font-bold">Response Rate</p>
            </div>
            <div className="bg-black rounded-lg p-3 border-2 border-white/10 text-center">
              <p className="text-white text-2xl font-black mb-1">{seller.responseTime}</p>
              <p className="text-white/70 text-xs font-bold">Response Time</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wide whitespace-nowrap transition-all shadow-md ${
              activeTab === 'products'
                ? 'bg-white text-black border-2 border-white/20'
                : 'bg-white text-black border-2 border-white/20 hover:bg-black'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wide whitespace-nowrap transition-all shadow-md ${
              activeTab === 'reviews'
                ? 'bg-white text-black border-2 border-white/20'
                : 'bg-white text-black border-2 border-white/20 hover:bg-black'
            }`}
          >
            Reviews ({seller.totalReviews})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wide whitespace-nowrap transition-all shadow-md ${
              activeTab === 'about'
                ? 'bg-white text-black border-2 border-white/20'
                : 'bg-white text-black border-2 border-white/20 hover:bg-black'
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`}>
                <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-md border-2 border-white/20 hover:border-[#48CD8A] transition-all ${product.isSold ? 'opacity-60' : ''}`}>
                  <div className="aspect-[3/4] relative overflow-hidden bg-black">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.isSold && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-black">SOLD</span>
                      </div>
                    )}
                    {!product.isSold && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center"
                        >
                          <Heart className="w-4 h-4 text-black" strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-black mb-1 truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-lg font-black">
                        ${product.price}
                      </p>
                      <span className="px-2 py-0.5 bg-white/5 text-black/80 text-xs font-bold rounded">
                        {product.condition}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-white/60 text-xs font-semibold">
                      <Heart className="w-3 h-3" strokeWidth={2.5} />
                      {product.likes} likes
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="px-6 pb-6 space-y-6">
          <SectionCard title="RATING_BREAKDOWN" variant="elevated">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const counts = { 5: 132, 4: 18, 3: 4, 2: 1, 1: 1 };
                const count = counts[stars as keyof typeof counts];
                const percentage = (count / seller.totalReviews) * 100;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-white text-sm font-black w-8">{stars}★</span>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#48CD8A] rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white/70 text-sm font-black w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="RECENT_REVIEWS" variant="gradient">
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-black text-sm">{review.customer}</h4>
                        {review.verified && (
                          <Award className="w-3 h-3 text-[#48CD8A]" strokeWidth={2.5} />
                        )}
                      </div>
                      <p className="text-white/70 text-xs font-semibold">{review.product}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-[#48CD8A] fill-[#48CD8A]"
                          strokeWidth={3}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-white text-sm font-semibold mb-2">{review.comment}</p>
                  <p className="text-white/50 text-xs font-semibold">{review.date}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="px-6 pb-6 space-y-6">
          <SectionCard title="ABOUT_THIS_SELLER" variant="elevated">
            <p className="text-white text-sm font-semibold mb-4">
              {seller.bio}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm font-semibold">Location</span>
                <span className="text-white text-sm font-black">{seller.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm font-semibold">Member Since</span>
                <span className="text-white text-sm font-black">{seller.joinedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm font-semibold">Total Listings</span>
                <span className="text-white text-sm font-black">{products.length}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="POLICIES" variant="muted">
            <div className="space-y-3">
              <div>
                <h4 className="text-white font-black text-sm mb-1">Returns</h4>
                <p className="text-white/70 text-xs font-semibold">
                  Accepts returns within 7 days of delivery
                </p>
              </div>
              <div>
                <h4 className="text-white font-black text-sm mb-1">Shipping</h4>
                <p className="text-white/70 text-xs font-semibold">
                  Ships within 1-2 business days via USPS Priority Mail
                </p>
              </div>
              <div>
                <h4 className="text-white font-black text-sm mb-1">Payment</h4>
                <p className="text-white/70 text-xs font-semibold">
                  Accepts all major credit cards and PayPal
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      <BottomNav />
    </div>
  );
}