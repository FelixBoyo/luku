import { useState } from 'react';
import { ChevronLeft, MessageCircle, Shirt, Tag, Star, User, SlidersHorizontal, Package, ShoppingBag, CheckCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


const wardrobeItems = [
  { id: 1, name: 'Wool Coat', category: 'Outerwear', imageUrl: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=600' },
  { id: 2, name: 'Cashmere Sweater', category: 'Tops', imageUrl: 'https://images.unsplash.com/photo-1750390200293-92d5a788d3a2?w=600' },
  { id: 3, name: 'Cotton T-Shirt', category: 'Tops', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600' },
  { id: 4, name: 'Linen Shirt', category: 'Tops', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
  { id: 5, name: 'Tailored Trousers', category: 'Bottoms', imageUrl: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=600' },
  { id: 6, name: 'Leather Shoes', category: 'Shoes', imageUrl: 'https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?w=600' },
];

const listings = [
  { id: 1, name: 'Vintage Denim Jacket', price: 8900, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', views: 142, status: 'Active', category: 'Outerwear' },
  { id: 2, name: 'Silk Scarf', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400', views: 56, status: 'Active', category: 'Accessories' },
  { id: 3, name: 'Leather Belt', price: 2400, imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400', views: 31, status: 'Sold', category: 'Accessories' },
];

const reviews = [
  { id: 1, reviewer: 'Marcus C.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', rating: 5, comment: 'Great seller! Item exactly as described, fast shipping.', date: '2 days ago', item: 'Wool Coat' },
  { id: 2, reviewer: 'Sophia R.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', rating: 5, comment: 'Lovely piece, well packaged. Would buy again!', date: '1 week ago', item: 'Cashmere Sweater' },
  { id: 3, reviewer: 'David K.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', rating: 4, comment: 'Good quality, slightly different shade than photos but still beautiful.', date: '2 weeks ago', item: 'Silk Scarf' },
  { id: 4, reviewer: 'Aisha M.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', rating: 5, comment: 'Amazing! Super fast response and item is stunning.', date: '1 month ago', item: 'Linen Shirt' },
];

const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

export function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [activeSection, setActiveSection] = useState('wardrobe');
  const [isFollowing, setIsFollowing] = useState(false);

  // Wardrobe filters
  const [showWardrobeFilters, setShowWardrobeFilters] = useState(false);
  const [wFilterCategory, setWFilterCategory] = useState('All');
  const [wFilterSize, setWFilterSize] = useState('All');

  // Listings filters
  const [showListingsFilters, setShowListingsFilters] = useState(false);
  const [lFilterStatus, setLFilterStatus] = useState('All');
  const [lFilterCategory, setLFilterCategory] = useState('All');

  const user = {
    name: 'Emma Thompson',
    username: '@emmastyle',
    bio: 'Minimalist style enthusiast · Sustainable fashion advocate',
    followers: 842,
    following: 234,
    listings: listings.length,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    wardrobePublic: true,
    verified: true,
    joinedDate: 'Jan 2023',
    responseTime: 'Within 2 hours',
    totalSales: 47,
  };

  const wardrobeActiveFilters = (wFilterCategory !== 'All' ? 1 : 0) + (wFilterSize !== 'All' ? 1 : 0);
  const listingsActiveFilters = (lFilterStatus !== 'All' ? 1 : 0) + (lFilterCategory !== 'All' ? 1 : 0);

  const filteredWardrobe = wardrobeItems.filter(i => wFilterCategory === 'All' || i.category === wFilterCategory);
  const filteredListings = listings.filter(l =>
    (lFilterStatus === 'All' || l.status === lFilterStatus) &&
    (lFilterCategory === 'All' || l.category === lFilterCategory)
  );

  const tabs = [
    { id: 'wardrobe', label: 'Wardrobe', icon: Shirt, count: wardrobeItems.length },
    { id: 'listings', label: 'Listings', icon: Tag, count: listings.length },
    { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
    { id: 'about', label: 'About', icon: User, count: null },
  ];

  return (
    <div className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Sticky back header */}
      <div className="sticky top-16 z-10 bg-black/90 backdrop-blur-xl border-b border-white/8 px-5 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft className="w-4 h-4 text-white" strokeWidth={2.5} />
        </button>
        <p className="text-white text-sm font-black truncate">{user.name}</p>
      </div>

      {/* Profile Header */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-white text-xl font-black leading-tight">{user.name}</h1>
              {user.verified && <CheckCircle className="w-4 h-4 text-[#48CD8A] flex-shrink-0" strokeWidth={2.5} />}
            </div>
            <p className="text-white/50 text-sm font-semibold mb-3">{user.username}</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-white text-base font-black">{user.followers}</p>
                <p className="text-white/50 text-[10px] font-semibold">Followers</p>
              </div>
              <div className="w-px h-6 bg-white/15" />
              <div>
                <p className="text-white text-base font-black">{user.following}</p>
                <p className="text-white/50 text-[10px] font-semibold">Following</p>
              </div>
              <div className="w-px h-6 bg-white/15" />
              <div>
                <p className="text-white text-base font-black">{user.totalSales}</p>
                <p className="text-white/50 text-[10px] font-semibold">Sales</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/60 text-sm font-semibold mb-4">{user.bio}</p>

        {/* Rating summary */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(avgRating) ? 'fill-[#F2B872] text-[#F2B872]' : 'text-white/20'}`} strokeWidth={2} />
            ))}
          </div>
          <span className="text-white text-xs font-black">{avgRating.toFixed(1)}</span>
          <span className="text-white/40 text-xs font-semibold">({reviews.length} reviews)</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setIsFollowing(f => !f)}
            className={`flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all border ${
              isFollowing
                ? 'bg-white/8 border-white/15 text-white'
                : 'bg-[#48CD8A] border-[#48CD8A] text-black'
            }`}
            style={{ background: isFollowing ? 'rgba(255,255,255,0.06)' : undefined }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <Link to="/inbox" className="flex-1">
            <button className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 border border-white/15 uppercase tracking-wide" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
              Message
            </button>
          </Link>
        </div>
      </div>

      {/* Tabs — 4 equal columns */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-4 border-b border-white/10">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex flex-col items-center gap-1 pb-3 pt-1 transition-all relative ${isActive ? 'text-white' : 'text-white/35'}`}
              >
                <Icon className="w-5 h-5" strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-wide">{tab.label}</span>
                {tab.count !== null && <span className={`text-[9px] font-semibold ${isActive ? 'text-[#48CD8A]' : 'text-white/25'}`}>{tab.count}</span>}
                {isActive && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#48CD8A] rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* WARDROBE */}
      {activeSection === 'wardrobe' && (
        <div className="px-6">
          {user.wardrobePublic ? (
            <>
              {/* Filter bar */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setShowWardrobeFilters(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${wardrobeActiveFilters > 0 ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'border-white/15 text-white'}`}
                  style={{ background: wardrobeActiveFilters > 0 ? undefined : 'rgba(255,255,255,0.05)' }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span className="text-xs font-black">Filters</span>
                  {wardrobeActiveFilters > 0 && <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-[10px] font-black rounded-full">{wardrobeActiveFilters}</span>}
                </button>
                {wardrobeActiveFilters > 0 && (
                  <button onClick={() => { setWFilterCategory('All'); setWFilterSize('All'); }} className="text-white/50 text-xs font-bold">Clear all</button>
                )}
              </div>

              {showWardrobeFilters && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 space-y-4">
                  <div>
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'].map(f => (
                        <button key={f} onClick={() => setWFilterCategory(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${wFilterCategory === f ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/60'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'].map(f => (
                        <button key={f} onClick={() => setWFilterSize(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${wFilterSize === f ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/60'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="columns-2 gap-3">
                {filteredWardrobe.map((item, idx) => {
                  const heights = ['h-64', 'h-80', 'h-72', 'h-96', 'h-64', 'h-80'];
                  return (
                    <Link key={item.id} to={`/wardrobe-item/${item.id}`}>
                      <div className={`relative ${heights[idx % heights.length]} rounded-2xl overflow-hidden break-inside-avoid mb-3 border border-white/20`}>
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg">
                          <p className="text-white text-[10px] font-black uppercase">{item.category}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-xs font-black">{item.name}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-white/30" strokeWidth={2} />
              </div>
              <p className="text-white text-base font-black mb-1">Private Wardrobe</p>
              <p className="text-white/50 text-sm font-semibold">This user's wardrobe is private</p>
            </div>
          )}
        </div>
      )}

      {/* LISTINGS */}
      {activeSection === 'listings' && (
        <div className="px-6">
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setShowListingsFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${listingsActiveFilters > 0 ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'border-white/15 text-white'}`}
              style={{ background: listingsActiveFilters > 0 ? undefined : 'rgba(255,255,255,0.05)' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="text-xs font-black">Filters</span>
              {listingsActiveFilters > 0 && <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-[10px] font-black rounded-full">{listingsActiveFilters}</span>}
            </button>
            {listingsActiveFilters > 0 && (
              <button onClick={() => { setLFilterStatus('All'); setLFilterCategory('All'); }} className="text-white/50 text-xs font-bold">Clear all</button>
            )}
          </div>

          {showListingsFilters && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 space-y-4">
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Active', 'Sold'].map(f => (
                    <button key={f} onClick={() => setLFilterStatus(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${lFilterStatus === f ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/60'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Bags'].map(f => (
                    <button key={f} onClick={() => setLFilterCategory(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${lFilterCategory === f ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/60'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {filteredListings.map(listing => (
              <Link key={listing.id} to={`/product/${listing.id}`}>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/20">
                  <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg" style={{ background: listing.status === 'Sold' ? 'rgba(255,255,255,0.3)' : 'rgba(72,205,138,0.8)' }}>
                    <p className="text-black text-[10px] font-black uppercase">{listing.status}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-black">{listing.name}</p>
                    <p className="text-[#48CD8A] text-sm font-black">KES {listing.price.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS */}
      {activeSection === 'reviews' && (
        <div className="px-6">
          {/* Rating summary card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-white text-4xl font-black">{avgRating.toFixed(1)}</p>
                <div className="flex justify-center mt-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(avgRating) ? 'fill-[#F2B872] text-[#F2B872]' : 'text-white/20'}`} strokeWidth={2} />
                  ))}
                </div>
                <p className="text-white/40 text-[10px] font-semibold mt-1">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const pct = (count / reviews.length) * 100;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-white/40 text-[10px] font-black w-3">{star}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F2B872] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                    <img src={review.avatar} alt={review.reviewer} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-black">{review.reviewer}</p>
                      <p className="text-white/40 text-[10px] font-semibold">{review.date}</p>
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-[#F2B872] text-[#F2B872]' : 'text-white/20'}`} strokeWidth={2} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-white/70 text-sm font-semibold mb-1">{review.comment}</p>
                <p className="text-white/35 text-[10px] font-semibold">Re: {review.item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABOUT */}
      {activeSection === 'about' && (
        <div className="px-6 space-y-3">
          {[
            { label: 'Member Since', value: user.joinedDate },
            { label: 'Response Time', value: user.responseTime },
            { label: 'Total Sales', value: `${user.totalSales} items sold` },
            { label: 'Location', value: 'Nairobi, Kenya' },
          ].map((row, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 flex items-center justify-between">
              <p className="text-white/50 text-xs font-black uppercase tracking-wide">{row.label}</p>
              <p className="text-white text-sm font-black">{row.value}</p>
            </div>
          ))}

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-2">
            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Seller Policies</p>
            <div className="space-y-2 text-white/60 text-sm font-semibold">
              <p>· Items are authentic and as described</p>
              <p>· Ships within 2 business days</p>
              <p>· Returns accepted within 7 days for item not as described</p>
              <p>· Secure packaging on all orders</p>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
