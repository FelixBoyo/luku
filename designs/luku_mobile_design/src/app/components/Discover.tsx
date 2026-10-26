import { useState } from 'react';
import { Search, SlidersHorizontal, X, Star, TrendingUp, User } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


// Product data
const products = [
  {
    id: 1,
    name: 'Vintage Leather Jacket',
    brand: 'Heritage Finds',
    price: 12500,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
    category: 'Outerwear',
    size: 'M',
    rating: 4.9,
    seller: 'VintageVibes',
  },
  {
    id: 2,
    name: 'Wool Trench Coat',
    brand: 'Timeless Essentials',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600',
    category: 'Outerwear',
    size: 'L',
    rating: 4.8,
    seller: 'ChicBoutique',
  },
  {
    id: 3,
    name: 'Minimalist Handbag',
    brand: 'Essential Leather Co.',
    price: 9800,
    image: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=600',
    category: 'Accessories',
    size: 'One Size',
    rating: 4.9,
    seller: 'UrbanStyle',
  },
  {
    id: 4,
    name: 'Silk Midi Dress',
    brand: 'Modern Staples',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
    category: 'Dresses',
    size: 'S',
    rating: 4.7,
    seller: 'ChicBoutique',
  },
  {
    id: 5,
    name: 'Leather Ankle Boots',
    brand: 'Heritage Footwear',
    price: 11200,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
    category: 'Footwear',
    size: '8',
    rating: 4.8,
    seller: 'VintageVibes',
  },
  {
    id: 6,
    name: 'Cashmere Sweater',
    brand: 'Soft Essentials',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
    category: 'Tops',
    size: 'M',
    rating: 4.6,
    seller: 'UrbanStyle',
  },
  {
    id: 7,
    name: 'Linen Blazer',
    brand: 'Modern Staples',
    price: 9100,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
    category: 'Outerwear',
    size: 'M',
    rating: 4.8,
    seller: 'ChicBoutique',
  },
  {
    id: 8,
    name: 'White Sneakers',
    brand: 'Street Essentials',
    price: 4200,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
    category: 'Footwear',
    size: '9',
    rating: 4.7,
    seller: 'UrbanStyle',
  },
];

// Profile data
const profiles = [
  {
    id: 'user1',
    name: 'Emma Thompson',
    username: '@emmastyle',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    followers: 842,
    wardrobeItems: 24,
  },
  {
    id: 'user2',
    name: 'Marcus Chen',
    username: '@marcusstyle',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    followers: 1203,
    wardrobeItems: 31,
  },
  {
    id: 'user3',
    name: 'Sophia Rodriguez',
    username: '@sophiawardrobe',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    followers: 654,
    wardrobeItems: 19,
  },
  {
    id: 'user4',
    name: 'David Kim',
    username: '@davidminimal',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    followers: 423,
    wardrobeItems: 28,
  },
];

// Brands data
const brands = [
  { id: 'heritage', name: 'Heritage Finds', products: 12, logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200' },
  { id: 'timeless', name: 'Timeless Essentials', products: 8, logo: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200' },
  { id: 'modern', name: 'Modern Staples', products: 15, logo: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200' },
  { id: 'urban', name: 'UrbanStyle', products: 20, logo: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200' },
];

// Styles data
const styles = [
  { id: 'minimalist', name: 'Minimalist', count: 234, image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400' },
  { id: 'streetwear', name: 'Streetwear', count: 189, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400' },
  { id: 'vintage', name: 'Vintage', count: 156, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
  { id: 'business', name: 'Business Casual', count: 198, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400' },
];

const categories = ['All', 'Outerwear', 'Tops', 'Bottoms', 'Dresses', 'Footwear', 'Accessories'];
const sizes = ['All', 'XS', 'S', 'M', 'L', 'XL'];
const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under KES 5,000', min: 0, max: 5000 },
  { label: 'KES 5,000 - 10,000', min: 5000, max: 10000 },
  { label: 'KES 10,000 - 15,000', min: 10000, max: 15000 },
  { label: 'Over KES 15,000', min: 15000, max: Infinity },
];

export function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [searchTab, setSearchTab] = useState<'items' | 'profiles' | 'brands' | 'styles'>('items');

  const isSearching = searchQuery.trim().length > 0;

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSize = selectedSize === 'All' || product.size === selectedSize;
    const matchesPrice = product.price >= priceRanges[selectedPriceRange].min &&
      product.price <= priceRanges[selectedPriceRange].max;

    return matchesSearch && matchesCategory && matchesSize && matchesPrice;
  });

  // Filter profiles
  const filteredProfiles = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter brands
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter styles
  const filteredStyles = styles.filter((style) =>
    style.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedSize('All');
    setSelectedPriceRange(0);
  };

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedSize !== 'All' ? 1 : 0) +
    (selectedPriceRange !== 0 ? 1 : 0);

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Search Bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" strokeWidth={2.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for items, brands, profiles, styles..."
            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-[#48CD8A] transition-colors"
          />
        </div>
      </div>

      {/* Search Results Tabs - Only show when searching */}
      {isSearching && (
        <div className="px-6 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'items', label: 'Items', count: filteredProducts.length },
              { id: 'profiles', label: 'Profiles', count: filteredProfiles.length },
              { id: 'brands', label: 'Brands', count: filteredBrands.length },
              { id: 'styles', label: 'Styles', count: filteredStyles.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSearchTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wide whitespace-nowrap transition-all ${
                  searchTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full transition-colors relative ${
              activeFiltersCount > 0
                ? 'bg-[#48CD8A] border-[#48CD8A] text-black'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-sm font-black">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-black text-white text-xs font-black rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-white/60 text-sm font-bold hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}

          <div className="flex-1"></div>

          <div className="text-white/60 text-sm font-semibold">
            {filteredProducts.length} items
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-6 pb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            {/* Category Filter */}
            <div className="mb-5">
              <h3 className="text-white text-xs font-black uppercase tracking-wide mb-3">
                Category
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                      selectedCategory === category
                        ? 'bg-[#48CD8A] border-[#48CD8A] text-black'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="mb-5">
              <h3 className="text-white text-xs font-black uppercase tracking-wide mb-3">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                      selectedSize === size
                        ? 'bg-[#48CD8A] border-[#48CD8A] text-black'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 className="text-white text-xs font-black uppercase tracking-wide mb-3">
                Price Range
              </h3>
              <div className="space-y-2">
                {priceRanges.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPriceRange(index)}
                    className={`w-full px-4 py-3 rounded-lg text-sm font-bold border text-left transition-all ${
                      selectedPriceRange === index
                        ? 'bg-[#48CD8A] border-[#48CD8A] text-black'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wardrobe Pairing Recommendations */}
      {!isSearching && (
        <div className="pb-6">
          <div className="flex items-center justify-between px-6 mb-3">
            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Pair With Your Wardrobe</p>
            <Link to="/wardrobe" className="text-[#F2B872] text-[10px] font-black uppercase tracking-wide">View All</Link>
          </div>
          <div
            className="flex gap-3 overflow-x-auto px-6"
            style={{ scrollbarWidth: 'none' }}
          >
            {[
              { image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', name: 'Leather Jacket', pairs: 'White Tee', match: 95, price: 'KES 12,500' },
              { image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', name: 'Ankle Boots', pairs: 'Blazer', match: 92, price: 'KES 11,200' },
              { image: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=400', name: 'Minimalist Handbag', pairs: 'Coat', match: 90, price: 'KES 9,800' },
              { image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', name: 'Cashmere Sweater', pairs: 'Jeans', match: 88, price: 'KES 8,900' },
            ].map((item, i) => (
              <div key={i} className="flex-shrink-0 w-36 bg-black/40 rounded-xl overflow-hidden border border-white/10">
                <div className="relative aspect-[3/4]">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <div className="px-1.5 py-0.5 bg-gradient-to-r from-[#F2B872] to-[#D98C4A] rounded-full">
                      <span className="text-black text-[9px] font-black">{item.match}%</span>
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-white/50 text-[9px] font-semibold mb-0.5">with your {item.pairs}</p>
                  <p className="text-white text-xs font-black truncate">{item.name}</p>
                  <p className="text-[#F2B872] text-xs font-black mt-0.5">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isSearching ? (
        <div className="px-6 pb-12">
          {/* Items Tab */}
          {searchTab === 'items' && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
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
          )}

          {/* Profiles Tab */}
          {searchTab === 'profiles' && filteredProfiles.length > 0 && (
            <div className="space-y-3">
              {filteredProfiles.map((profile) => (
                <Link key={profile.id} to={`/user/${profile.id}`}>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-base font-black mb-1">{profile.name}</h3>
                        <p className="text-white/60 text-sm font-semibold mb-2">{profile.username}</p>
                        <div className="flex items-center gap-4 text-white/70 text-xs font-semibold">
                          <span>{profile.followers} followers</span>
                          <span>•</span>
                          <span>{profile.wardrobeItems} items</span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white text-black rounded-lg font-black text-xs uppercase hover:bg-[#F7F3EE] transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Brands Tab */}
          {searchTab === 'brands' && filteredBrands.length > 0 && (
            <div className="space-y-3">
              {filteredBrands.map((brand) => (
                <Link key={brand.id} to={`/brand/${brand.id}`}>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 flex-shrink-0 bg-white/5">
                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-base font-black mb-1">{brand.name}</h3>
                        <p className="text-white/60 text-sm font-semibold">{brand.products} products available</p>
                      </div>
                      <button className="px-4 py-2 bg-white text-black rounded-lg font-black text-xs uppercase hover:bg-[#F7F3EE] transition-colors">
                        Explore
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Styles Tab */}
          {searchTab === 'styles' && filteredStyles.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {filteredStyles.map((style) => (
                <Link key={style.id} to={`/style/${style.id}`}>
                  <div className="relative aspect-[4/5] overflow-hidden group rounded-xl">
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white text-xl font-black mb-2 leading-tight">
                        {style.name}
                      </h3>
                      <p className="text-white/70 text-sm font-semibold">
                        {style.count} items
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State for Each Tab */}
          {((searchTab === 'items' && filteredProducts.length === 0) ||
            (searchTab === 'profiles' && filteredProfiles.length === 0) ||
            (searchTab === 'brands' && filteredBrands.length === 0) ||
            (searchTab === 'styles' && filteredStyles.length === 0)) && (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center mb-6">
                <Search className="w-12 h-12 text-white/30" strokeWidth={2} />
              </div>
              <h2 className="text-white text-2xl font-black mb-3">No {searchTab} Found</h2>
              <p className="text-white/60 text-sm font-semibold text-center max-w-sm">
                Try searching for something else
              </p>
            </div>
          )}
        </div>
      ) : (
        filteredProducts.length > 0 ? (
        <div className="px-6 pb-12">
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, index) => {
              // Create varied heights for editorial feel
              const isFeatured = index === 0;

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className={isFeatured ? 'col-span-2' : ''}
                >
                  <div className={`relative overflow-hidden group rounded-xl ${isFeatured ? 'h-96' : 'aspect-[3/4]'}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-black fill-black" strokeWidth={3} />
                        <span className="text-black text-xs font-black">{product.rating}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white/60 text-xs font-semibold mb-1">{product.brand}</p>
                      <h3 className={`text-white font-black mb-2 leading-tight ${isFeatured ? 'text-2xl' : 'text-base'}`}>
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className={`text-white font-black ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
                          KES {product.price.toLocaleString()}
                        </p>
                        {isFeatured && (
                          <span className="px-3 py-1 bg-[#48CD8A] text-black text-xs font-black uppercase rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        // Empty State
        <div className="px-6 pb-12 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-24 h-24 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center mb-6">
            <Search className="w-12 h-12 text-white/30" strokeWidth={2} />
          </div>
          <h2 className="text-white text-2xl font-black mb-3">No Results Found</h2>
          <p className="text-white/60 text-sm font-semibold text-center max-w-sm mb-6">
            Try adjusting your filters or search terms to find what you're looking for
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-white text-black font-black text-sm rounded-xl hover:bg-[#FAFAFA] transition-colors uppercase tracking-wide"
          >
            Clear All Filters
          </button>
        </div>
      ))}
      <BottomNav />
    </div>
  );
}