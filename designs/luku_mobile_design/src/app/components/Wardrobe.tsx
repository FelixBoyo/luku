import { useState } from 'react';
import {
  Plus, Package, TrendingUp, Droplet, Clock, Shirt,
  Award, Target, Leaf, Calendar, Filter
} from 'lucide-react';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

import { SegmentedControl } from './common/SegmentedControl';
import { SectionCard } from './common/SectionCard';
import { StatCard } from './common/StatCard';

type WardrobeItem = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  color: string;
  status?: 'available' | 'in-wash' | 'needs-repair';
  wearCount?: number;
  lastWorn?: string;
};

const wardrobeItems: WardrobeItem[] = [
  {
    id: 1,
    name: 'Wool Coat',
    category: 'Outerwear',
    imageUrl: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHdvb2wlMjBjb2F0fGVufDF8fHx8MTc3NjQxMzU4M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'Camel',
    status: 'available',
    wearCount: 12,
    lastWorn: '2026-05-15',
  },
  {
    id: 2,
    name: 'Cashmere Sweater',
    category: 'Tops',
    imageUrl: 'https://images.unsplash.com/photo-1750390200293-92d5a788d3a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW4lMjBzd2VhdGVyJTIwa25pdHdlYXIlMjBtaW5pbWFsfGVufDF8fHx8MTc3NjE5ODgyNXww&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'Tan',
    status: 'available',
    wearCount: 24,
    lastWorn: '2026-05-18',
  },
  {
    id: 3,
    name: 'Cotton T-Shirt',
    category: 'Tops',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHQtc2hpcnQlMjBtaW5pbWFsfGVufDF8fHx8MTc3NjIwMTgwNXww&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'White',
    status: 'in-wash',
    wearCount: 36,
    lastWorn: '2026-05-17',
  },
  {
    id: 4,
    name: 'Linen Shirt',
    category: 'Tops',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHNoaXJ0JTIwbGluZW58ZW58MXx8fHwxNzc2MjAxODA1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'Beige',
    status: 'available',
    wearCount: 18,
    lastWorn: '2026-05-10',
  },
  {
    id: 8,
    name: 'Tailored Trousers',
    category: 'Bottoms',
    imageUrl: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWlsb3JlZCUyMHRyb3VzZXJzJTIwYmVpZ2V8ZW58MXx8fHwxNzc2MzIyOTY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'Beige',
    status: 'available',
    wearCount: 15,
    lastWorn: '2026-05-16',
  },
  {
    id: 5,
    name: 'Leather Shoes',
    category: 'Shoes',
    imageUrl: 'https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGxlYXRoZXIlMjBzaG9lcyUyMG1pbmltYWx8ZW58MXx8fHwxNzc2NDEzNTgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'Brown',
    status: 'available',
    wearCount: 20,
    lastWorn: '2026-05-18',
  },
  {
    id: 6,
    name: 'Ankle Boots',
    category: 'Shoes',
    imageUrl: 'https://images.unsplash.com/photo-1760402160205-e579a99a7347?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW4lMjBhbmtsZSUyMGJvb3RzfGVufDF8fHx8MTc3NjQxMzU4M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'Tan',
    status: 'available',
    wearCount: 8,
    lastWorn: '2026-05-12',
  },
  {
    id: 7,
    name: 'Sneakers',
    category: 'Shoes',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHNuZWFrZXJzJTIwbWluaW1hbHxlbnwxfHx8fDE3NzYyMDE4MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'White',
    status: 'available',
    wearCount: 32,
    lastWorn: '2026-05-19',
  },
];

export function Wardrobe() {
  const [activeTab, setActiveTab] = useState('items');
  const [activeFilter, setActiveFilter] = useState('All Items');

  const filters = ['All Items', 'Tops', 'Bottoms', 'Outerwear', 'Shoes'];

  const getFilteredItems = () => {
    if (activeFilter === 'All Items') return wardrobeItems;
    return wardrobeItems.filter((item) => item.category === activeFilter);
  };

  const filteredItems = getFilteredItems();
  const itemsInWash = wardrobeItems.filter((item) => item.status === 'in-wash');

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            WARDROBE
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-bold">
          {wardrobeItems.length} items · {itemsInWash.length} in wash
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <SegmentedControl
          segments={[
            { label: 'Items', value: 'items', icon: <Package className="w-4 h-4" strokeWidth={3} /> },
            { label: 'Insights', value: 'insights', icon: <TrendingUp className="w-4 h-4" strokeWidth={3} /> },
            { label: 'Laundry', value: 'laundry', icon: <Droplet className="w-4 h-4" strokeWidth={3} />, badge: itemsInWash.length },
            { label: 'Wear Log', value: 'wearlog', icon: <Clock className="w-4 h-4" strokeWidth={3} /> },
          ]}
          activeSegment={activeTab}
          onChange={setActiveTab}
          fullWidth
        />
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <>
          {/* Featured Item Hero */}
          {filteredItems.length > 0 && (
            <div className="px-6 mb-8">
              <div className="relative h-96 overflow-hidden group">
                <img
                  src={filteredItems[0].imageUrl}
                  alt={filteredItems[0].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/60 text-xs font-semibold mb-1 uppercase tracking-wide">
                        {filteredItems[0].category}
                      </p>
                      <h2 className="text-white text-3xl font-black mb-2 leading-tight">
                        {filteredItems[0].name}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-white/80 text-sm font-semibold">
                          Worn {filteredItems[0].wearCount}x
                        </span>
                        <span className="px-2 py-1 bg-[#48CD8A] text-black text-xs font-black uppercase">
                          Most Worn
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Chips */}
          <div className="px-6 mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 font-black text-xs uppercase tracking-wide whitespace-nowrap transition-all ${
                    activeFilter === filter
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Asymmetric Items Grid */}
          <div className="px-6">
            <div className="grid grid-cols-3 gap-3">
              {filteredItems.slice(1).map((item, idx) => {
                // Create varied layout: first item spans 2 columns, every 5th item is taller
                const isWide = idx === 0;
                const isTall = idx % 5 === 4;
                const colSpan = isWide ? 'col-span-2' : '';
                const aspectClass = isTall ? 'aspect-[3/4]' : 'aspect-square';

                return (
                  <div
                    key={item.id}
                    className={`relative overflow-hidden group cursor-pointer ${colSpan}`}
                  >
                    <div className={`${aspectClass} relative`}>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {item.status === 'in-wash' && (
                        <div className="absolute top-2 right-2 bg-[#48CD8A] text-black text-[10px] font-black px-2 py-1 uppercase">
                          In Wash
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                        <h3 className="text-white font-black text-sm mb-1">{item.name}</h3>
                        <p className="text-white/70 text-xs font-semibold">
                          {item.wearCount} wears
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="px-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="TOTAL"
              value={wardrobeItems.length}
              icon={<Package className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
              size="compact"
            />
            <StatCard
              label="AVG_WEAR"
              value="3.2x"
              icon={<Target className="w-5 h-5" strokeWidth={3} />}
              size="compact"
            />
            <StatCard
              label="SUSTAIN"
              value="4/5"
              icon={<Leaf className="w-5 h-5" strokeWidth={3} />}
              size="compact"
            />
          </div>

          {/* Category Breakdown */}
          <SectionCard title="CATEGORY_BREAKDOWN" variant="elevated">
            <div className="space-y-3">
              {['Tops', 'Bottoms', 'Shoes', 'Outerwear'].map((cat) => {
                const count = wardrobeItems.filter((item) => item.category === cat).length;
                const percentage = Math.round((count / wardrobeItems.length) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-sm font-bold">{cat}</span>
                      <span className="text-white/70 text-sm font-black">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#48CD8A] rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Most & Least Worn */}
          <SectionCard title="USAGE_INSIGHTS" variant="gradient">
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-black text-sm mb-2">Most Worn</h4>
                <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                  <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={wardrobeItems[2].imageUrl}
                      alt={wardrobeItems[2].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-sm">{wardrobeItems[2].name}</p>
                    <p className="text-white/70 text-xs font-semibold">{wardrobeItems[2].wearCount} wears</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-white font-black text-sm mb-2">Least Worn</h4>
                <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                  <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={wardrobeItems[6].imageUrl}
                      alt={wardrobeItems[6].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-sm">{wardrobeItems[6].name}</p>
                    <p className="text-white/70 text-xs font-semibold">{wardrobeItems[6].wearCount} wears</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Sustainability Score */}
          <SectionCard title="ECO_IMPACT" variant="muted">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm font-bold">CO₂ Saved</span>
                <span className="text-white text-lg font-black">24kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm font-bold">Rewears This Month</span>
                <span className="text-white text-lg font-black">42</span>
              </div>
              <div className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <p className="text-white text-sm font-semibold">
                  🌱 Great work! You're wearing items <strong>3.2x on average</strong> before they need care.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Laundry Tab */}
      {activeTab === 'laundry' && (
        <div className="px-6 space-y-6">
          <SectionCard
            title="IN_WASH"
            badge={itemsInWash.length}
            variant="elevated"
          >
            {itemsInWash.length > 0 ? (
              <div className="space-y-3">
                {itemsInWash.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10"
                  >
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-black text-sm mb-1">{item.name}</h4>
                      <p className="text-white/70 text-xs font-semibold">{item.category} · {item.color}</p>
                    </div>
                    <div className="px-3 py-2 bg-[#3AB87A] rounded-lg">
                      <p className="text-white text-xs font-black">WASHING</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-sm font-semibold text-center py-8">
                No items currently in wash
              </p>
            )}
          </SectionCard>

          <SectionCard title="CARE_SCHEDULE" variant="muted">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <Calendar className="w-5 h-5 text-[#48CD8A] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <div>
                  <h4 className="text-white font-black text-sm mb-1">Dry Cleaning Due</h4>
                  <p className="text-white/70 text-xs font-semibold">Wool Coat · May 25</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <Droplet className="w-5 h-5 text-[#48CD8A] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <div>
                  <h4 className="text-white font-black text-sm mb-1">Hand Wash Reminder</h4>
                  <p className="text-white/70 text-xs font-semibold">Cashmere Sweater · May 22</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Wear Log Tab */}
      {activeTab === 'wearlog' && (
        <div className="px-6 space-y-6">
          <SectionCard title="RECENT_WEARS" variant="elevated">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={wardrobeItems[7].imageUrl} alt={wardrobeItems[7].name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-black text-sm">{wardrobeItems[7].name}</h4>
                  <p className="text-white/70 text-xs font-semibold">Today · 10:30 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={wardrobeItems[1].imageUrl} alt={wardrobeItems[1].name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-black text-sm">{wardrobeItems[1].name}</h4>
                  <p className="text-white/70 text-xs font-semibold">Yesterday · 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={wardrobeItems[2].imageUrl} alt={wardrobeItems[2].name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-black text-sm">{wardrobeItems[2].name}</h4>
                  <p className="text-white/70 text-xs font-semibold">May 17 · 9:00 AM</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="WEAR_CALENDAR" variant="gradient">
            <div>
              <div className="grid grid-cols-7 gap-2 mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={idx} className="text-center text-white/50 text-xs font-bold">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, idx) => {
                  const hasWear = [0, 2, 5, 8, 12, 15, 18, 19, 22, 25].includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                        hasWear
                          ? 'bg-[#48CD8A] text-black'
                          : 'bg-white text-white/40 border-2 border-white/10'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="WEAR_STREAK" variant="muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#48CD8A] rounded-full flex items-center justify-center border-2 border-white/20">
                  <Award className="w-6 h-6 text-black" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-white font-black text-lg">7 Days</h4>
                  <p className="text-white/70 text-xs font-semibold">Current streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-2xl">42</p>
                <p className="text-white/70 text-xs font-semibold">Total wears</p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Floating Add Button */}
      <button
        className="fixed bottom-28 right-6 w-16 h-16 bg-[#48CD8A] text-black rounded-full shadow-2xl hover:bg-[#3AB87A] transition-all flex items-center justify-center z-20 hover:scale-110 border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20"
        aria-label="Add new clothing item"
      >
        <Plus className="w-8 h-8" strokeWidth={4} />
      </button>

      <BottomNav />
    </div>
  );
}
