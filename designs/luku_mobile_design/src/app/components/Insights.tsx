import {
  TrendingUp, Target, Leaf, Clock, Award, Palette,
  Users, MapPin, ShoppingBag, Heart
} from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SectionCard } from './common/SectionCard';
import { StatCard } from './common/StatCard';

export function Insights() {
  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-block">
            <h1 className="text-white text-4xl font-black tracking-tight relative">
              INSIGHTS
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
            </h1>
          </div>
          {/* Date Range Filter */}
          <div className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md">
            <span className="text-white text-sm font-black">THIS MONTH</span>
          </div>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Wardrobe & style at a glance
        </p>
      </div>

      {/* 1. Wardrobe Pulse */}
      <div className="px-6 mb-6">
        <SectionCard title="WARDROBE_PULSE" variant="elevated">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="WEAR_RATE"
              value="78%"
              change="+12%"
              trend="up"
              icon={<TrendingUp className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
              size="compact"
            />
            <StatCard
              label="AVG_USES"
              value="24"
              change="+3"
              trend="up"
              icon={<Target className="w-5 h-5" strokeWidth={3} />}
              size="compact"
            />
          </div>
        </SectionCard>
      </div>

      {/* 2. Upcoming Events */}
      <div className="px-6 mb-6">
        <SectionCard
          title="UPCOMING_EVENTS"
          badge="2"
          headerCTA={{
            label: 'View All',
            onClick: () => {},
          }}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
              <div className="w-12 h-12 bg-[#48CD8A] rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-white text-lg font-black">22</span>
                <span className="text-white text-xs font-black">MAY</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black text-sm mb-1">Team Meeting</h4>
                <p className="text-white/70 text-xs font-semibold">Business Casual • 9:00 AM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex flex-col items-center justify-center flex-shrink-0 border-2 border-white/10">
                <span className="text-white text-lg font-black">24</span>
                <span className="text-white text-xs font-black">MAY</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black text-sm mb-1">Dinner Party</h4>
                <p className="text-white/70 text-xs font-semibold">Evening Wear • 7:00 PM</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 3. Eco Impact */}
      <div className="px-6 mb-6">
        <SectionCard
          title="ECO_IMPACT"
          subtitle="Your sustainability metrics"
          variant="gradient"
          headerCTA={{
            label: 'Tips',
            onClick: () => {},
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-black/80 text-sm font-bold flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#48CD8A]" strokeWidth={3} />
                CO₂ Saved
              </span>
              <span className="text-white text-lg font-black">24kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/80 text-sm font-bold">Wear/Item Ratio</span>
              <span className="text-white text-lg font-black">3.2x</span>
            </div>
            <div className="w-full h-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#3AB87A] rounded-full" style={{ width: '68%' }}></div>
            </div>
            <div className="pt-2">
              <p className="text-white text-sm font-semibold">
                🌱 Great work! You're wearing items <strong>3.2x on average</strong> before they need care.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 4. Style Insights */}
      <div className="px-6 mb-6">
        <SectionCard
          title="STYLE_INSIGHTS"
          headerCTA={{
            label: 'Style DNA',
            onClick: () => {},
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-black/80 text-sm font-bold">Most Worn Color</span>
              <span className="text-white text-lg font-black flex items-center gap-2">
                <span className="w-6 h-6 bg-[#3AB87A] rounded-full border border-white/20"></span>
                AMBER
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/80 text-sm font-bold">Favorite Category</span>
              <span className="text-white text-lg font-black">TOPS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/80 text-sm font-bold">Avg Outfit Rating</span>
              <span className="text-white text-lg font-black">4.6★</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 5. Achievements */}
      <div className="px-6 mb-6">
        <SectionCard title="ACHIEVEMENTS" badge="NEW" variant="muted">
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            <div className="flex-shrink-0 w-20 text-center">
              <div className="w-16 h-16 bg-[#48CD8A] rounded-full flex items-center justify-center mb-2 border-2 border-white/20">
                <Award className="w-8 h-8 text-black" strokeWidth={3} />
              </div>
              <p className="text-white text-xs font-black">7-DAY STREAK</p>
            </div>
            <div className="flex-shrink-0 w-20 text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center mb-2 border-2 border-white/20">
                <Palette className="w-8 h-8 text-black" strokeWidth={3} />
              </div>
              <p className="text-white text-xs font-black">COLOR MASTER</p>
            </div>
            <div className="flex-shrink-0 w-20 text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center mb-2 border-2 border-white/20">
                <Leaf className="w-8 h-8 text-black" strokeWidth={3} />
              </div>
              <p className="text-white text-xs font-black">ECO WARRIOR</p>
            </div>
            <div className="flex-shrink-0 w-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2 border-2 border-white/10 relative">
                <Target className="w-8 h-8 text-white/40" strokeWidth={3} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#48CD8A] border-t-transparent rounded-full"></div>
                </div>
              </div>
              <p className="text-white/60 text-xs font-black">STYLE PRO</p>
              <p className="text-white/50 text-[10px] font-semibold">8/10</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 6. Recent Activity */}
      <div className="px-6 mb-6">
        <SectionCard title="RECENT_ACTIVITY" variant="gradient">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-[#48CD8A]" strokeWidth={3} />
              <span className="text-white/70 font-semibold">
                Wore <strong className="text-black">SOFT POWER</strong> outfit
              </span>
              <span className="ml-auto text-white/50 text-xs font-bold">2h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Heart className="w-4 h-4 text-[#48CD8A]" strokeWidth={3} />
              <span className="text-white/70 font-semibold">
                Saved <strong className="text-black">3 items</strong> to favorites
              </span>
              <span className="ml-auto text-white/50 text-xs font-bold">5h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShoppingBag className="w-4 h-4 text-[#48CD8A]" strokeWidth={3} />
              <span className="text-white/70 font-semibold">
                Added <strong className="text-black">Wool Coat</strong> to wardrobe
              </span>
              <span className="ml-auto text-white/50 text-xs font-bold">1d ago</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 7. Trending Styles */}
      <div className="px-6 mb-6">
        <SectionCard
          title="TRENDING_IN_COMMUNITY"
          subtitle="Popular styles"
          headerCTA={{
            label: 'Discover',
            onClick: () => {},
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-square bg-white/5 rounded-lg overflow-hidden relative border-2 border-white/10">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"
                alt="Trending style"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-black">LAYERED LOOK</p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3 text-white" strokeWidth={3} />
                  <span className="text-white text-xs font-semibold">142 wears</span>
                </div>
              </div>
            </div>
            <div className="aspect-square bg-white/5 rounded-lg overflow-hidden relative border-2 border-white/10">
              <img
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"
                alt="Trending style"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-black">MINIMALIST</p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3 text-white" strokeWidth={3} />
                  <span className="text-white text-xs font-semibold">98 wears</span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 8. Style Tip */}
      <div className="px-6 mb-6">
        <SectionCard title="STYLE_TIP" subtitle="Daily fashion insight" variant="muted">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#48CD8A] rounded-full flex items-center justify-center flex-shrink-0">
              <Palette className="w-5 h-5 text-black" strokeWidth={3} />
            </div>
            <div>
              <h4 className="text-white font-black text-sm mb-2">Color Harmony Tip</h4>
              <p className="text-white/70 text-sm font-semibold leading-relaxed">
                Earth tones like tan and beige pair beautifully with deep browns. Try layering different textures in similar hues for depth.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 9. Community Feed */}
      <div className="px-6 mb-6">
        <SectionCard
          title="COMMUNITY_FEED"
          subtitle="What others are wearing"
          headerCTA={{
            label: 'See All',
            onClick: () => {},
          }}
          variant="elevated"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white/20">
                <span className="text-white font-black text-sm">JD</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black text-sm mb-1">Jane Doe</h4>
                <p className="text-white/70 text-xs font-semibold mb-2">
                  Wore <strong>MINIMAL WORK</strong> outfit
                </p>
                <div className="w-full h-24 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden border-2 border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"
                    alt="Outfit"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white/20">
                <span className="text-white font-black text-sm">MT</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black text-sm mb-1">Marcus Taylor</h4>
                <p className="text-white/70 text-xs font-semibold mb-2">
                  Created <strong>EARTH TONES</strong> mood board
                </p>
                <div className="w-full h-24 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden border-2 border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400"
                    alt="Mood board"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <BottomNav />
    </div>
  );
}
