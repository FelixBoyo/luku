import { Link } from 'react-router';
import {
  Plus,
  Camera,
  Sparkles,
  User,
  Bell,
  Gift,
  TrendingUp,
  DollarSign,
  Package,
  Crown,
  UserPlus,
  Calendar,
  ShoppingBag,
  BarChart3,
  Leaf,
  ChevronRight,
  Grid3x3,
} from 'lucide-react';
import { SectionCard } from './common/SectionCard';

// Sample outfit data for More From Your Wardrobe
const sampleOutfits = [
  {
    id: 1,
    name: 'STREET CASUAL',
    tags: ['CASUAL', 'WEEKEND'],
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
  },
  {
    id: 2,
    name: 'MINIMAL WORK',
    tags: ['OFFICE', 'POLISHED'],
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
  },
];

/**
 * TEMPORARY STAGING SCREEN
 *
 * This component displays widgets from the luku-revamp-prompt.md spec
 * that don't have a permanent home yet in either Hub or Insights.
 *
 * Use this to view and test widgets before deciding their final placement.
 */
export function WidgetStaging() {
  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black px-6 pt-6 pb-4">
        <h1 className="text-white font-black uppercase tracking-wide mb-1">
          WIDGET STAGING
        </h1>
        <p className="text-white/70 text-sm font-semibold">
          Temporary home for widgets without placement
        </p>
      </div>

      <div className="px-6 space-y-4">
        {/* 1. Quick Actions Row */}
        <SectionCard
          title="QUICK_ACTIONS"
          subtitle="Fast access to common tasks"
          variant="default"
        >
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-full bg-[#48CD8A] flex items-center justify-center">
                <Plus className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <span className="text-white text-xs font-black uppercase tracking-wide">
                Add Item
              </span>
            </button>

            <button className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-full bg-[#48CD8A] flex items-center justify-center">
                <Camera className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <span className="text-white text-xs font-black uppercase tracking-wide">
                Log Outfit
              </span>
            </button>

            <button className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-full bg-[#48CD8A] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <span className="text-white text-xs font-black uppercase tracking-wide">
                Generate
              </span>
            </button>

            <button className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-full bg-[#48CD8A] flex items-center justify-center">
                <User className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <span className="text-white text-xs font-black uppercase tracking-wide">
                Try On
              </span>
            </button>
          </div>
        </SectionCard>

        {/* 2. More From Your Wardrobe */}
        <SectionCard
          title="MORE_FROM_YOUR_WARDROBE"
          subtitle="AI suggestions"
          headerCta="See all"
          variant="elevated"
        >
          <div className="grid grid-cols-2 gap-3">
            {sampleOutfits.map((outfit) => (
              <Link key={outfit.id} to={`/outfit/${outfit.id}`}>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 overflow-hidden hover:scale-105 transition-transform">
                  <div className="aspect-[3/4] bg-white/5 overflow-hidden">
                    <img
                      src={outfit.image}
                      alt={outfit.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-black uppercase tracking-wide">
                      {outfit.name}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {outfit.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-[#48CD8A]/30 text-white text-xs font-bold rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* 3. Mood Boards */}
        <SectionCard
          title="MOOD_BOARDS"
          subtitle="Your collections"
          badge="2"
          headerCta="See all"
          variant="default"
        >
          <div className="grid grid-cols-2 gap-3">
            <Link to="/mood-boards">
              <div className="aspect-square bg-white/5 rounded-xl overflow-hidden border-2 border-white/10 hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"
                  alt="Mood board"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <Link to="/mood-boards">
              <div className="aspect-square bg-white/5 rounded-xl overflow-hidden border-2 border-white/10 hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"
                  alt="Mood board"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          </div>
        </SectionCard>

        {/* 4. Eco Pill / Sustainability Link */}
        <SectionCard
          title="ECO_PILL"
          subtitle="Sustainability impact"
          variant="gradient"
        >
          <Link to="/insights">
            <div className="bg-white/20 rounded-xl p-4 border-2 border-white/30 hover:bg-white/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-black" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-white text-sm font-black">
                    24 kg CO₂ saved this month
                  </p>
                  <p className="text-white/80 text-xs font-semibold">
                    Tap for sustainability insights
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" strokeWidth={3} />
            </div>
          </Link>
        </SectionCard>

        {/* 5. Wardrobe Insights Mini */}
        <SectionCard
          title="WARDROBE_INSIGHTS_MINI"
          subtitle="Quick wardrobe stats"
          headerCta="See all"
          variant="elevated"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm font-semibold">
                Items needing wash
              </span>
              <span className="text-white text-lg font-black">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm font-semibold">
                Most worn this month
              </span>
              <span className="text-white text-sm font-black">
                Denim Jacket
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm font-semibold">
                Least worn category
              </span>
              <span className="text-white text-sm font-black">Dresses</span>
            </div>
          </div>
        </SectionCard>

        {/* 6. Discover Preview Rail */}
        <SectionCard
          title="DISCOVER_PREVIEW"
          subtitle="AI suggestions for you"
          headerCta="See all"
          variant="default"
        >
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {['Urban Explorer', 'Casual Friday', 'Date Night'].map(
              (name, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-40 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] flex items-center justify-center">
                    <Sparkles
                      className="w-12 h-12 text-white"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-black uppercase tracking-wide">
                      {name}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </SectionCard>

        {/* 7. Marketplace Recommendations Rail */}
        <SectionCard
          title="MARKETPLACE_RECOMMENDATIONS"
          subtitle="Based on your wardrobe"
          headerCta="See all"
          variant="default"
        >
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {['Ankle Boots', 'Leather Belt', 'Silk Scarf'].map((name, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-36 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 overflow-hidden"
              >
                <div className="aspect-square bg-gradient-to-br from-[#3AB87A] to-[#000000] flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
                <div className="p-2">
                  <p className="text-white text-xs font-black uppercase tracking-wide truncate">
                    {name}
                  </p>
                  <p className="text-white/70 text-xs font-semibold">
                    KES {(idx + 2) * 1500}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 8. Sustainability Snapshot (Full) */}
        <SectionCard
          title="SUSTAINABILITY_SNAPSHOT"
          subtitle="Your environmental impact"
          headerCta="Deep dive"
          variant="gradient"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-white text-2xl font-black">24 kg</p>
                <p className="text-white/80 text-sm font-semibold">
                  CO₂ saved this month
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-white text-lg font-black">450 L</p>
                <p className="text-white/80 text-xs font-semibold">
                  Water saved
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-white text-lg font-black">3.2x</p>
                <p className="text-white/80 text-xs font-semibold">
                  Wear/item ratio
                </p>
              </div>
            </div>

            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-white text-xs font-black uppercase tracking-wide mb-2">
                Suggested Swaps
              </p>
              <p className="text-white/90 text-sm font-semibold">
                Consider secondhand denim instead of new for 70% less impact
              </p>
            </div>
          </div>
        </SectionCard>

        {/* 9. Notifications Preview */}
        <SectionCard
          title="NOTIFICATIONS"
          subtitle="Recent activity"
          headerCta="See all"
          variant="default"
        >
          <div className="space-y-3">
            {[
              {
                icon: Package,
                title: 'Order shipped',
                time: '2h ago',
                unread: true,
              },
              {
                icon: TrendingUp,
                title: 'New style trend: Layered look',
                time: '5h ago',
                unread: true,
              },
              {
                icon: Sparkles,
                title: 'Fresh outfit suggestions ready',
                time: '1d ago',
                unread: false,
              },
            ].map((notif, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/20"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notif.unread ? 'bg-[#48CD8A]' : 'bg-black'
                  }`}
                >
                  <notif.icon
                    className="w-5 h-5 text-black"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-black ${
                      notif.unread ? 'text-black' : 'text-white/70'
                    }`}
                  >
                    {notif.title}
                  </p>
                  <p className="text-xs text-white/60 font-semibold">
                    {notif.time}
                  </p>
                </div>
                {notif.unread && (
                  <div className="w-2 h-2 rounded-full bg-[#3AB87A]" />
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 10. LUKU Pro Upsell Card */}
        <SectionCard title="LUKU_PRO" variant="elevated">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-white text-lg font-black uppercase tracking-wide">
                  Upgrade to Pro
                </p>
                <p className="text-white/70 text-xs font-semibold">
                  Unlock premium features
                </p>
              </div>
            </div>

            <ul className="space-y-2">
              {[
                'Unlimited outfit generations',
                'Advanced AI styling',
                'Priority support',
                'Exclusive marketplace access',
              ].map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-white/70 text-sm font-semibold"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#48CD8A]" />
                  {feature}
                </li>
              ))}
            </ul>

            <button className="w-full bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] text-white py-3 rounded-lg font-black uppercase tracking-wide text-sm shadow-md active:scale-95 transition-transform">
              Start Free Trial
            </button>
          </div>
        </SectionCard>

        {/* 11. Creator Earnings Widget */}
        <SectionCard
          title="CREATOR_EARNINGS"
          subtitle="Your performance"
          headerCta="Open dashboard"
          variant="elevated"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm font-semibold">
                This month
              </span>
              <span className="text-white text-2xl font-black">
                KES 8,450
              </span>
            </div>

            <div className="bg-black rounded-lg p-3 border-2 border-white/10">
              <p className="text-white text-xs font-black uppercase tracking-wide mb-1">
                Top Performing Look
              </p>
              <p className="text-white/70 text-sm font-semibold">
                "Minimalist Monday" • 24 clicks
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-white/70 text-xs font-semibold">
                  Conversion
                </p>
                <p className="text-white text-lg font-black">12.4%</p>
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold">
                  Pending payout
                </p>
                <p className="text-white text-lg font-black">KES 3,200</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 12. Seller Widget */}
        <SectionCard
          title="SELLER_DASHBOARD"
          subtitle="Your store"
          headerCta="Open dashboard"
          variant="elevated"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black rounded-lg p-3 border-2 border-white/10">
                <p className="text-white text-2xl font-black">5</p>
                <p className="text-white/70 text-xs font-semibold">
                  Pending
                </p>
              </div>
              <div className="bg-black rounded-lg p-3 border-2 border-white/10">
                <p className="text-white text-2xl font-black">2</p>
                <p className="text-white/70 text-xs font-semibold">
                  Low Stock
                </p>
              </div>
              <div className="bg-[#48CD8A] rounded-lg p-3 border-2 border-white/20">
                <p className="text-white text-lg font-black">12.4K</p>
                <p className="text-white/70 text-xs font-semibold">Today</p>
              </div>
            </div>

            <button className="w-full bg-white text-black py-3 rounded-lg font-black uppercase tracking-wide text-sm active:scale-95 transition-transform">
              View Orders
            </button>
          </div>
        </SectionCard>

        {/* 13. Refer-a-Friend Banner */}
        <SectionCard title="REFER_A_FRIEND" variant="gradient">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-white text-lg font-black uppercase tracking-wide mb-1">
                Share LUKU
              </p>
              <p className="text-white/90 text-sm font-semibold">
                Give KES 500, get KES 500 when friends join
              </p>
            </div>
          </div>
          <button className="w-full bg-white text-black py-3 rounded-lg font-black uppercase tracking-wide text-sm mt-4 active:scale-95 transition-transform">
            Get Your Link
          </button>
        </SectionCard>

        {/* 14. Onboarding Banner */}
        <SectionCard title="ONBOARDING_BANNER" variant="muted">
          <div className="space-y-3">
            <p className="text-white font-bold">
              Get started with LUKU in 3 steps
            </p>

            <div className="space-y-2">
              {[
                { label: 'Add your first wardrobe item', done: true },
                { label: 'Generate your first outfit', done: false },
                { label: 'Complete your style profile', done: false },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.done
                        ? 'bg-[#48CD8A]'
                        : 'bg-white/5 backdrop-blur-sm border border-white/10'
                    }`}
                  >
                    {step.done && (
                      <span className="text-white font-black text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      step.done ? 'text-white/50 line-through' : 'text-black'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full overflow-hidden border-2 border-white/20">
              <div className="h-full bg-[#48CD8A] w-1/3" />
            </div>
          </div>
        </SectionCard>

        {/* Footer note */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20">
          <p className="text-white text-sm font-black uppercase tracking-wide mb-2">
            About This Screen
          </p>
          <p className="text-white/70 text-sm font-semibold leading-relaxed">
            This is a temporary staging area for widgets from the revamp spec
            that haven't been assigned to Hub or Insights yet. Each widget can
            be moved to its permanent home when ready.
          </p>
        </div>
      </div>
    </div>
  );
}
