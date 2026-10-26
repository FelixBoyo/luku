import { useState } from 'react';
import {
  TrendingUp, DollarSign, Package, Star, Eye, ShoppingBag, Users,
  BarChart3, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare
} from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SegmentedControl } from './common/SegmentedControl';
import { SectionCard } from './common/SectionCard';
import { StatCard, KPIRow } from './common/StatCard';

const topProducts = [
  {
    name: 'Structured Handbag',
    sales: 48,
    revenue: '$6,960',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=200',
    stock: 12,
  },
  {
    name: 'Classic Watch',
    sales: 32,
    revenue: '$7,040',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200',
    stock: 8,
  },
  {
    name: 'Silk Scarf',
    sales: 28,
    revenue: '$2,380',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1764697907673-eaba1d06205a?w=200',
    stock: 24,
  },
];

const recentOrders = [
  {
    id: '#ORD-2847',
    customer: 'Sarah Chen',
    amount: '$145',
    status: 'completed',
    date: '2h ago',
  },
  {
    id: '#ORD-2846',
    customer: 'Marcus Johnson',
    amount: '$220',
    status: 'processing',
    date: '5h ago',
  },
  {
    id: '#ORD-2845',
    customer: 'Elena Rodriguez',
    amount: '$89',
    status: 'pending',
    date: '1d ago',
  },
  {
    id: '#ORD-2844',
    customer: 'David Kim',
    amount: '$310',
    status: 'completed',
    date: '1d ago',
  },
];

const reviews = [
  {
    customer: 'Amanda L.',
    rating: 5,
    comment: 'Exceptional quality! The leather is so soft and beautiful.',
    product: 'Structured Handbag',
    date: '3h ago',
  },
  {
    customer: 'James T.',
    rating: 4,
    comment: 'Great watch, fast shipping. Very happy with my purchase.',
    product: 'Classic Watch',
    date: '1d ago',
  },
];

export function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            SELLER_HUB
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-bold">Essential Leather Co.</p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <SegmentedControl
          segments={[
            { label: 'Overview', value: 'overview', icon: <BarChart3 className="w-4 h-4" strokeWidth={3} /> },
            { label: 'Products', value: 'products', icon: <Package className="w-4 h-4" strokeWidth={3} />, badge: 24 },
            { label: 'Orders', value: 'orders', icon: <ShoppingBag className="w-4 h-4" strokeWidth={3} />, badge: 12 },
            { label: 'Analytics', value: 'analytics', icon: <TrendingUp className="w-4 h-4" strokeWidth={3} /> },
            { label: 'Reviews', value: 'reviews', icon: <MessageSquare className="w-4 h-4" strokeWidth={3} /> },
          ]}
          activeSegment={activeTab}
          onChange={setActiveTab}
          variant="compact"
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="px-6 space-y-6">
          {/* KPI Row */}
          <KPIRow
            items={[
              { label: 'REVENUE', value: '$4.2K', highlight: true },
              { label: 'ORDERS', value: '86' },
              { label: 'RATING', value: '4.8★' },
            ]}
          />

          {/* Revenue Trend */}
          <SectionCard
            title="REVENUE_TREND"
            subtitle="Last 7 days"
            variant="elevated"
            headerCTA={{
              label: 'Details',
              onClick: () => setActiveTab('analytics'),
            }}
          >
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const heights = [60, 75, 55, 90, 70, 85, 95];
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-white/70 text-xs font-black w-8">{day}</span>
                    <div className="flex-1 bg-black rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-[#48CD8A] h-full rounded-full transition-all"
                        style={{ width: `${heights[idx]}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-black w-12 text-right">
                      ${(heights[idx] * 10).toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Top Products */}
          <SectionCard
            title="TOP_PRODUCTS"
            badge="3"
            headerCTA={{
              label: 'View All',
              onClick: () => setActiveTab('products'),
            }}
          >
            <div className="space-y-3">
              {topProducts.slice(0, 3).map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10"
                >
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-black text-sm mb-1 truncate">{product.name}</h3>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-[#48CD8A]" strokeWidth={3} />
                        <span className="text-white/70 font-black">{product.sales}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#48CD8A] fill-[#48CD8A]" strokeWidth={3} />
                        <span className="text-white/70 font-black">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-lg">{product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent Orders */}
          <SectionCard
            title="RECENT_ORDERS"
            headerCTA={{
              label: 'See All',
              onClick: () => setActiveTab('orders'),
            }}
            variant="gradient"
          >
            <div className="space-y-2">
              {recentOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10"
                >
                  <div className="flex-1">
                    <h4 className="text-white font-black text-sm">{order.id}</h4>
                    <p className="text-white/70 text-xs font-semibold">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-sm">{order.amount}</p>
                    <p className="text-white/50 text-xs font-semibold">{order.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Customer Insights */}
          <SectionCard title="CUSTOMER_INSIGHTS" variant="muted">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-black/80 text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#48CD8A]" strokeWidth={3} />
                  Repeat Customers
                </span>
                <span className="text-white text-lg font-black">42%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black/80 text-sm font-bold">Avg Order Value</span>
                <span className="text-white text-lg font-black">$156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black/80 text-sm font-bold">Satisfaction</span>
                <span className="text-white text-lg font-black">96%</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="px-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="TOTAL"
              value="24"
              icon={<Package className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
              size="compact"
            />
            <StatCard
              label="LOW_STOCK"
              value="3"
              icon={<AlertCircle className="w-5 h-5" strokeWidth={3} />}
              size="compact"
            />
          </div>

          <SectionCard title="ALL_PRODUCTS" variant="elevated">
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10"
                >
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-black text-sm mb-1 truncate">{product.name}</h3>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-[#48CD8A]" strokeWidth={3} />
                        <span className="text-white/70 font-black">{product.stock} left</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#48CD8A] fill-[#48CD8A]" strokeWidth={3} />
                        <span className="text-white/70 font-black">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-sm">{product.sales} sold</p>
                    <p className="text-white font-black text-lg">{product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="INVENTORY_ALERTS" variant="muted">
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <AlertCircle className="w-5 h-5 text-[#48CD8A] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <div>
                  <h4 className="text-white font-black text-sm mb-1">Low Stock Alert</h4>
                  <p className="text-white/70 text-xs font-semibold">
                    Classic Watch has only 8 units remaining
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="px-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="PENDING" value="3" variant="highlight" size="compact" />
            <StatCard label="PROCESS" value="5" size="compact" />
            <StatCard label="DONE" value="78" size="compact" />
          </div>

          <SectionCard title="ACTIVE_ORDERS" badge="8" variant="elevated">
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const statusConfig = {
                  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
                  processing: { icon: Clock, color: 'text-[#48CD8A]', bg: 'bg-[#48CD8A]/30' },
                  pending: { icon: AlertCircle, color: 'text-white/60', bg: 'bg-white/5' },
                };
                const config = statusConfig[order.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10"
                  >
                    <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-5 h-5 ${config.color}`} strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-black text-sm">{order.id}</h4>
                      <p className="text-white/70 text-xs font-semibold">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-sm">{order.amount}</p>
                      <p className="text-white/50 text-xs font-semibold capitalize">{order.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="ORDER_TIMELINE" variant="gradient">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#48CD8A] rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="text-white font-black text-sm">New Order Received</h4>
                  <p className="text-white/70 text-xs font-semibold">#ORD-2847 · 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#3AB87A] rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="text-white font-black text-sm">Order Shipped</h4>
                  <p className="text-white/70 text-xs font-semibold">#ORD-2846 · 5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black/40 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="text-white font-black text-sm">Payment Confirmed</h4>
                  <p className="text-white/70 text-xs font-semibold">#ORD-2845 · 1 day ago</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="px-6 space-y-6">
          <KPIRow
            items={[
              { label: 'TOTAL', value: '$12.4K' },
              { label: 'GROWTH', value: '+18%', highlight: true },
              { label: 'ORDERS', value: '246' },
            ]}
          />

          <SectionCard title="REVENUE_BY_PERIOD" variant="elevated">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button className="px-3 py-2 bg-white text-black rounded-lg font-black text-xs">
                WEEK
              </button>
              <button className="px-3 py-2 bg-white text-black rounded-lg font-black text-xs border-2 border-white/10">
                MONTH
              </button>
              <button className="px-3 py-2 bg-white text-black rounded-lg font-black text-xs border-2 border-white/10">
                YEAR
              </button>
            </div>
            <div className="space-y-3">
              {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, idx) => {
                const values = [1200, 1580, 980, 1420];
                const max = Math.max(...values);
                const percentage = (values[idx] / max) * 100;
                return (
                  <div key={week}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-sm font-bold">{week}</span>
                      <span className="text-white font-black text-sm">${values[idx]}</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
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

          <SectionCard title="TOP_CATEGORIES" variant="gradient">
            <div className="space-y-3">
              {['Bags', 'Accessories', 'Apparel'].map((cat, idx) => {
                const values = [42, 28, 30];
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-white text-sm font-bold">{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3AB87A] rounded-full"
                          style={{ width: `${values[idx]}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-black text-sm w-10 text-right">{values[idx]}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="CONVERSION_METRICS" variant="muted">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-black/80 text-sm font-bold">Visit to Cart</span>
                <span className="text-white text-lg font-black">18%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black/80 text-sm font-bold">Cart to Purchase</span>
                <span className="text-white text-lg font-black">64%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black/80 text-sm font-bold">Overall Conversion</span>
                <span className="text-white text-lg font-black">11.5%</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="px-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="AVG_RATING"
              value="4.8★"
              icon={<Star className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
              size="compact"
            />
            <StatCard
              label="REVIEWS"
              value="142"
              icon={<MessageSquare className="w-5 h-5" strokeWidth={3} />}
              size="compact"
            />
          </div>

          <SectionCard title="RATING_BREAKDOWN" variant="elevated">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const counts = { 5: 98, 4: 32, 3: 8, 2: 3, 1: 1 };
                const count = counts[stars as keyof typeof counts];
                const percentage = (count / 142) * 100;
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
              {reviews.map((review, idx) => (
                <div key={idx} className="p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-black text-sm">{review.customer}</h4>
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

          <SectionCard title="CUSTOMER_FEEDBACK" variant="muted">
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                <div>
                  <h4 className="text-white font-black text-sm mb-1">Most Praised</h4>
                  <p className="text-white/70 text-xs font-semibold">
                    Quality · Craftsmanship · Fast Shipping
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
