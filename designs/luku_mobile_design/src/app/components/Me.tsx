import { useState } from 'react';
import { Settings, Plus, Package, ShoppingBag, Users, Heart, Tag, X, Camera, Upload, Shirt, Bookmark, ChevronDown, ArrowRightLeft, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


type WardrobeItem = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  wearCount?: number;
};

const initialWardrobeItems: WardrobeItem[] = [
  { id: 1, name: 'Wool Coat', category: 'Outerwear', imageUrl: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=600', wearCount: 12 },
  { id: 2, name: 'Cashmere Sweater', category: 'Tops', imageUrl: 'https://images.unsplash.com/photo-1750390200293-92d5a788d3a2?w=600', wearCount: 24 },
  { id: 3, name: 'Cotton T-Shirt', category: 'Tops', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', wearCount: 36 },
  { id: 4, name: 'Linen Shirt', category: 'Tops', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', wearCount: 18 },
  { id: 5, name: 'Tailored Trousers', category: 'Bottoms', imageUrl: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=600', wearCount: 15 },
  { id: 6, name: 'Leather Shoes', category: 'Shoes', imageUrl: 'https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?w=600', wearCount: 20 },
];

const initialListings = [
  { id: 1, name: 'Vintage Denim Jacket', price: 8900, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', views: 142, status: 'Active' },
  { id: 2, name: 'Silk Scarf', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400', views: 56, status: 'Active' },
];

const favoriteOutfits = [
  { id: 'fav-1', name: 'Casual Weekend', items: 4, imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600', occasion: 'Brunch', savedDate: '2 days ago' },
  { id: 'fav-2', name: 'Office Chic', items: 5, imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600', occasion: 'Work', savedDate: '1 week ago' },
  { id: 'fav-3', name: 'Evening Elegance', items: 6, imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', occasion: 'Dinner', savedDate: '2 weeks ago' },
  { id: 'fav-4', name: 'Street Style', items: 4, imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', occasion: 'Casual', savedDate: '3 weeks ago' },
];

const wishlistItems = [
  { id: 101, name: 'Leather Jacket', brand: 'Classic Co.', price: 15900, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', addedDate: '1 day ago' },
  { id: 102, name: 'Silk Blouse', brand: 'Elegant Wear', price: 4500, imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=400', addedDate: '3 days ago' },
  { id: 103, name: 'Designer Handbag', brand: 'Luxury Items', price: 22000, imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', addedDate: '1 week ago' },
  { id: 104, name: 'Ankle Boots', brand: 'Footwear Plus', price: 9800, imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', addedDate: '1 week ago' },
];

const conditions = ['New / Never Worn', 'Gently Used', 'Used', 'Very Worn'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const categories = ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Shoes', 'Accessories', 'Bags'];

export function Me() {
  const [activeSection, setActiveSection] = useState('wardrobe');
  const [wardrobeFilter, setWardrobeFilter] = useState('All');
  const [commerceTab, setCommerceTab] = useState<'listings' | 'purchases'>('listings');

  // Wardrobe filters
  const [showWardrobeFilters, setShowWardrobeFilters] = useState(false);
  const [wFilterCategory, setWFilterCategory] = useState('All');
  const [wFilterSize, setWFilterSize] = useState('All');
  const [wFilterCondition, setWFilterCondition] = useState('All');

  // Commerce filters
  const [showCommerceFilters, setShowCommerceFilters] = useState(false);
  const [cFilterStatus, setCFilterStatus] = useState('All');
  const [cFilterCategory, setCFilterCategory] = useState('All');

  const [wardrobeItems, setWardrobeItems] = useState(initialWardrobeItems);
  const [listings, setListings] = useState(initialListings);

  // Add to wardrobe sheet
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', brand: '', category: '', size: '', condition: '' });

  const handleAddItem = () => {
    if (!newItem.name) return;
    const item: WardrobeItem = {
      id: Date.now(),
      name: newItem.name,
      category: newItem.category || 'Tops',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
      wearCount: 0,
    };
    setWardrobeItems(prev => [item, ...prev]);
    setNewItem({ name: '', brand: '', category: '', size: '', condition: '' });
    setShowAddSheet(false);
  };

  const moveToListing = (item: WardrobeItem) => {
    setWardrobeItems(prev => prev.filter(w => w.id !== item.id));
    setListings(prev => [{ id: item.id, name: item.name, price: 0, imageUrl: item.imageUrl, views: 0, status: 'Draft' }, ...prev]);
    setActiveSection('commerce');
    setCommerceTab('listings');
  };

  const moveToWardrobe = (listing: typeof initialListings[0]) => {
    setListings(prev => prev.filter(l => l.id !== listing.id));
    setWardrobeItems(prev => [{ id: listing.id, name: listing.name, category: 'Tops', imageUrl: listing.imageUrl, wearCount: 0 }, ...prev]);
    setActiveSection('wardrobe');
  };

  const wardrobeActiveFilters = (wFilterCategory !== 'All' ? 1 : 0) + (wFilterSize !== 'All' ? 1 : 0) + (wFilterCondition !== 'All' ? 1 : 0);
  const filteredWardrobe = wardrobeItems.filter(i =>
    (wFilterCategory === 'All' || i.category === wFilterCategory)
  );

  const commerceActiveFilters = (cFilterStatus !== 'All' ? 1 : 0) + (cFilterCategory !== 'All' ? 1 : 0);
  const filteredListings = listings.filter(l =>
    (cFilterStatus === 'All' || l.status === cFilterStatus)
  );

  const tabs = [
    { id: 'wardrobe', label: 'Wardrobe', icon: Shirt, count: wardrobeItems.length },
    { id: 'saved', label: 'Saved', icon: Heart, count: favoriteOutfits.length },
    { id: 'wishlist', label: 'Wishlist', icon: Bookmark, count: wishlistItems.length },
    { id: 'commerce', label: 'Commerce', icon: Tag, count: listings.length },
  ];

  return (
    <div className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Profile Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center border-4 border-white/20 shadow-lg">
              <span className="text-black text-2xl font-black">SM</span>
            </div>
            <div>
              <h1 className="text-white text-2xl font-black mb-1">Shannon Martinez</h1>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-white text-lg font-black">234</p>
                  <p className="text-white/60 text-xs font-semibold">Followers</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="text-white text-lg font-black">{listings.length}</p>
                  <p className="text-white/60 text-xs font-semibold">Listings</p>
                </div>
              </div>
            </div>
          </div>
          <Link to="/settings">
            <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
              <Settings className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </Link>
        </div>
        <p className="text-white/70 text-sm font-semibold">Minimalist style enthusiast · Sustainable fashion advocate</p>
      </div>

      {/* Section Tabs — 4 equal columns, no scroll */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-4 border-b border-white/10">
          {tabs.map((tab) => {
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
                <span className={`text-[9px] font-semibold ${isActive ? 'text-[#48CD8A]' : 'text-white/25'}`}>{tab.count}</span>
                {isActive && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#48CD8A] rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* WARDROBE */}
      {activeSection === 'wardrobe' && (
        <div className="px-6">
          {/* Add item button */}
          <button
            onClick={() => setShowAddSheet(true)}
            className="w-full mb-5 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-[#48CD8A]/40 transition-all"
            style={{ background: 'rgba(72,205,138,0.05)' }}
          >
            <div className="w-8 h-8 bg-[#48CD8A]/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-[#48CD8A]" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[#48CD8A] text-sm font-black">Add to Wardrobe</p>
              <p className="text-white/40 text-xs font-semibold">Photo, brand, size, condition</p>
            </div>
          </button>

          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setShowWardrobeFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${wardrobeActiveFilters > 0 ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/8 border-white/15 text-white hover:bg-white/15'}`}
              style={{ background: wardrobeActiveFilters > 0 ? undefined : 'rgba(255,255,255,0.05)' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="text-xs font-black">Filters</span>
              {wardrobeActiveFilters > 0 && <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-[10px] font-black rounded-full">{wardrobeActiveFilters}</span>}
            </button>
            {wardrobeActiveFilters > 0 && (
              <button
                onClick={() => { setWFilterCategory('All'); setWFilterSize('All'); setWFilterCondition('All'); }}
                className="text-white/50 text-xs font-bold hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showWardrobeFilters && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 space-y-4">
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Bags'].map(f => (
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
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Condition</p>
                <div className="flex flex-wrap gap-2">
                  {['All', 'New / Never Worn', 'Gently Used', 'Used', 'Very Worn'].map(f => (
                    <button key={f} onClick={() => setWFilterCondition(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${wFilterCondition === f ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/60'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Masonry Grid */}
          <div className="columns-2 gap-3">
            {filteredWardrobe.map((item, idx) => {
              const heights = ['h-64', 'h-80', 'h-72', 'h-96', 'h-64', 'h-80'];
              const heightClass = heights[idx % heights.length];
              return (
                <div key={item.id} className={`relative ${heightClass} rounded-2xl overflow-hidden break-inside-avoid mb-3 border border-white/20 shadow-lg`}>
                  <Link to={`/wardrobe-item/${item.id}`}>
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg">
                      <p className="text-white text-[10px] font-black uppercase tracking-wide">{item.category}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-black leading-tight">{item.name}</p>
                      <p className="text-white/60 text-[10px] font-semibold mt-0.5">Worn {item.wearCount}×</p>
                    </div>
                  </Link>
                  {/* List It button */}
                  <button
                    onClick={() => moveToListing(item)}
                    className="absolute top-3 right-3 w-7 h-7 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center"
                    title="Move to Listings"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#F2B872]" strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SAVED OUTFITS */}
      {activeSection === 'saved' && (
        <div className="px-6">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-4">Saved Outfit Inspirations</p>
          <div className="grid grid-cols-2 gap-3">
            {favoriteOutfits.map((outfit) => (
              <div key={outfit.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-[#48CD8A] fill-[#48CD8A]" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-black mb-0.5">{outfit.name}</p>
                  <p className="text-white/60 text-[10px] font-semibold">{outfit.items} pieces · {outfit.occasion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WISHLIST */}
      {activeSection === 'wishlist' && (
        <div className="px-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Items You Want</p>
            <p className="text-white/50 text-xs font-semibold">KES {wishlistItems.reduce((s, i) => s + i.price, 0).toLocaleString()}</p>
          </div>
          <div className="space-y-3">
            {wishlistItems.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`}>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-black truncate">{item.name}</p>
                    <p className="text-white/50 text-xs font-semibold">{item.brand}</p>
                    <p className="text-[#F2B872] text-sm font-black mt-0.5">KES {item.price.toLocaleString()}</p>
                  </div>
                  <Heart className="w-5 h-5 text-[#48CD8A] fill-[#48CD8A] flex-shrink-0" strokeWidth={2.5} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* COMMERCE — Listings + Purchases */}
      {activeSection === 'commerce' && (
        <div className="px-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 mb-5">
            {(['listings', 'purchases'] as const).map(t => (
              <button
                key={t}
                onClick={() => setCommerceTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border transition-all ${commerceTab === t ? 'bg-white text-black border-white' : 'bg-white/5 text-white/50 border-white/10'}`}
              >
                {t === 'listings' ? `Listings (${listings.length})` : 'Purchases'}
              </button>
            ))}
          </div>

          {commerceTab === 'listings' && (
            <div>
            {/* Filter bar */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setShowCommerceFilters(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${commerceActiveFilters > 0 ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/8 border-white/15 text-white hover:bg-white/15'}`}
                style={{ background: commerceActiveFilters > 0 ? undefined : 'rgba(255,255,255,0.05)' }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="text-xs font-black">Filters</span>
                {commerceActiveFilters > 0 && <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-[10px] font-black rounded-full">{commerceActiveFilters}</span>}
              </button>
              {commerceActiveFilters > 0 && (
                <button
                  onClick={() => { setCFilterStatus('All'); setCFilterCategory('All'); }}
                  className="text-white/50 text-xs font-bold hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Filter panel */}
            {showCommerceFilters && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 space-y-4">
                <div>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Active', 'Draft', 'Sold'].map(f => (
                      <button key={f} onClick={() => setCFilterStatus(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${cFilterStatus === f ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/60'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Bags'].map(f => (
                      <button key={f} onClick={() => setCFilterCategory(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${cFilterCategory === f ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/60'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                  <Link to={`/product/${listing.id}`}>
                    <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg" style={{ background: listing.status === 'Draft' ? 'rgba(242,184,114,0.8)' : 'rgba(72,205,138,0.8)' }}>
                      <p className="text-black text-[10px] font-black uppercase">{listing.status}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-black">{listing.name}</p>
                      {listing.price > 0 && <p className="text-[#48CD8A] text-sm font-black">KES {listing.price.toLocaleString()}</p>}
                      {listing.views > 0 && <p className="text-white/50 text-[10px] font-semibold">{listing.views} views</p>}
                    </div>
                  </Link>
                  {/* Move to Wardrobe */}
                  <button
                    onClick={() => moveToWardrobe(listing)}
                    className="absolute top-3 right-3 w-7 h-7 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center"
                    title="Move to Wardrobe"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-white/70" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              <Link to="/sell">
                <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Plus className="w-8 h-8 text-white/30" strokeWidth={2} />
                  <p className="text-white/40 text-xs font-black">New Listing</p>
                </div>
              </Link>
            </div>
            </div>
          )}

          {commerceTab === 'purchases' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-white/30" strokeWidth={2} />
              </div>
              <p className="text-white text-base font-black mb-1">Purchase History</p>
              <p className="text-white/50 text-sm font-semibold mb-5">Your orders and past purchases</p>
              <Link to="/orders">
                <button className="px-6 py-3 bg-white text-black font-black text-sm rounded-xl uppercase tracking-wide">View Orders</button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Add to Wardrobe Sheet */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddSheet(false)} />
          <div className="relative bg-[#0A0A0A] border-t border-white/10 rounded-t-3xl px-6 pt-5 pb-10 max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-black uppercase tracking-wide">Add to Wardrobe</h2>
              <button onClick={() => setShowAddSheet(false)} className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4 text-white/60" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Photo */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2 aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Upload className="w-6 h-6 text-white/30" strokeWidth={1.5} />
                  <p className="text-white/40 text-[10px] font-black text-center">Cover Photo</p>
                </div>
                {[0, 1, 2].map(i => (
                  <div key={i} className="aspect-square rounded-xl border border-dashed border-white/10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Camera className="w-4 h-4 text-white/20" strokeWidth={1.5} />
                  </div>
                ))}
              </div>

              {/* Name */}
              <div>
                <label className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2 block">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Vintage Leather Jacket"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-white/25 focus:outline-none focus:border-[#48CD8A] transition-colors"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2 block">Designer / Brand</label>
                <input
                  type="text"
                  value={newItem.brand}
                  onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))}
                  placeholder="e.g., Zara, Gucci, No Brand"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-white/25 focus:outline-none focus:border-[#48CD8A] transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2 block">Category</label>
                <div className="relative">
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                    className="w-full appearance-none px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors pr-10"
                  >
                    <option value="" className="bg-black">Select category</option>
                    {categories.map(c => <option key={c} className="bg-black">{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" strokeWidth={2.5} />
                </div>
              </div>

              {/* Size chips */}
              <div>
                <label className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3 block">Size</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setNewItem(p => ({ ...p, size: s }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${newItem.size === s ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3 block">Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {conditions.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewItem(p => ({ ...p, condition: c }))}
                      className={`px-3 py-2.5 rounded-xl text-xs font-black border transition-all text-left ${newItem.condition === c ? 'border-[#48CD8A] text-[#48CD8A]' : 'border-white/10 text-white/50'}`}
                      style={{ background: newItem.condition === c ? 'rgba(72,205,138,0.08)' : 'rgba(255,255,255,0.03)' }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddItem}
                disabled={!newItem.name}
                className="w-full py-4 bg-[#48CD8A] rounded-xl text-black font-black uppercase tracking-wide text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                Add to Wardrobe
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
