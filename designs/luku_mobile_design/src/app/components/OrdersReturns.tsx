import { useState } from 'react';
import {
  Package, CheckCircle, XCircle, Clock, TrendingUp,
  MapPin, ChevronRight, Download, MessageSquare, RotateCcw
} from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SegmentedControl } from './common/SegmentedControl';
import { SectionCard } from './common/SectionCard';
import { StatCard } from './common/StatCard';

type Order = {
  id: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: {
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  tracking?: string;
  estimatedDelivery?: string;
};

type Return = {
  id: string;
  orderId: string;
  date: string;
  status: 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';
  reason: string;
  refundAmount: number;
  items: {
    name: string;
    quantity: number;
    image: string;
  }[];
};

const activeOrders: Order[] = [
  {
    id: '#ORD-2848',
    date: '2026-05-19',
    status: 'processing',
    total: 535,
    estimatedDelivery: 'May 24-26',
    items: [
      {
        name: 'Structured Handbag',
        price: 145,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=200',
      },
      {
        name: 'Classic Watch',
        price: 220,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200',
      },
      {
        name: 'Silk Scarf',
        price: 85,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1764697907673-eaba1d06205a?w=200',
      },
    ],
  },
  {
    id: '#ORD-2847',
    date: '2026-05-17',
    status: 'shipped',
    total: 145,
    tracking: 'USPS-9405-5036-9930-1234-5678-90',
    estimatedDelivery: 'May 22',
    items: [
      {
        name: 'Leather Jacket',
        price: 145,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
      },
    ],
  },
];

const pastOrders: Order[] = [
  {
    id: '#ORD-2846',
    date: '2026-05-10',
    status: 'delivered',
    total: 220,
    items: [
      {
        name: 'Wool Coat',
        price: 220,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=200',
      },
    ],
  },
  {
    id: '#ORD-2845',
    date: '2026-05-03',
    status: 'delivered',
    total: 385,
    items: [
      {
        name: 'Cashmere Sweater',
        price: 165,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1750390200293-92d5a788d3a2?w=200',
      },
      {
        name: 'Linen Shirt',
        price: 95,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200',
      },
      {
        name: 'Leather Belt',
        price: 65,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1624222247344-550fb60583bb?w=200',
      },
    ],
  },
];

const returns: Return[] = [
  {
    id: '#RET-1024',
    orderId: '#ORD-2844',
    date: '2026-05-15',
    status: 'approved',
    reason: 'Size too large',
    refundAmount: 95,
    items: [
      {
        name: 'Cotton T-Shirt',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
      },
    ],
  },
  {
    id: '#RET-1023',
    orderId: '#ORD-2842',
    date: '2026-05-08',
    status: 'refunded',
    reason: 'Wrong color received',
    refundAmount: 145,
    items: [
      {
        name: 'Ankle Boots',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1760402160205-e579a99a7347?w=200',
      },
    ],
  },
];

export function OrdersReturns() {
  const [activeTab, setActiveTab] = useState('active');

  const getStatusConfig = (status: Order['status']) => {
    const configs = {
      processing: { color: 'text-[#48CD8A]', bg: 'bg-[#48CD8A]/30', label: 'PROCESSING' },
      shipped: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'SHIPPED' },
      delivered: { color: 'text-green-600', bg: 'bg-green-100', label: 'DELIVERED' },
      cancelled: { color: 'text-red-600', bg: 'bg-red-100', label: 'CANCELLED' },
    };
    return configs[status];
  };

  const getReturnStatusConfig = (status: Return['status']) => {
    const configs = {
      requested: { color: 'text-[#48CD8A]', bg: 'bg-[#48CD8A]/30', label: 'REQUESTED' },
      approved: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'APPROVED' },
      received: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'RECEIVED' },
      refunded: { color: 'text-green-600', bg: 'bg-green-100', label: 'REFUNDED' },
      rejected: { color: 'text-red-600', bg: 'bg-red-100', label: 'REJECTED' },
    };
    return configs[status];
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            ORDERS
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-bold">
          Track your purchases and returns
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <SegmentedControl
          segments={[
            { label: 'Active', value: 'active', icon: <Clock className="w-4 h-4" strokeWidth={3} />, badge: activeOrders.length },
            { label: 'Past', value: 'past', icon: <CheckCircle className="w-4 h-4" strokeWidth={3} /> },
            { label: 'Returns', value: 'returns', icon: <RotateCcw className="w-4 h-4" strokeWidth={3} />, badge: returns.filter(r => r.status !== 'refunded').length },
          ]}
          activeSegment={activeTab}
          onChange={setActiveTab}
          fullWidth
        />
      </div>

      {/* Active Orders Tab */}
      {activeTab === 'active' && (
        <div className="px-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="ACTIVE"
              value={activeOrders.length}
              icon={<Package className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
              size="compact"
            />
            <StatCard
              label="IN_TRANSIT"
              value={activeOrders.filter(o => o.status === 'shipped').length}
              size="compact"
            />
            <StatCard
              label="TOTAL"
              value={`$${activeOrders.reduce((sum, o) => sum + o.total, 0)}`}
              size="compact"
            />
          </div>

          {/* Active Orders List */}
          {activeOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <SectionCard
                key={order.id}
                title={order.id}
                subtitle={`Ordered ${order.date}`}
                variant="elevated"
                badge={statusConfig.label}
              >
                <div className="space-y-3 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-black text-sm mb-1">{item.name}</h4>
                        <p className="text-white/70 text-xs font-semibold">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-white font-black text-lg">${item.price}</p>
                    </div>
                  ))}
                </div>

                {order.status === 'shipped' && order.tracking && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                      <div className="flex-1">
                        <p className="text-blue-900 font-black text-sm mb-1">In Transit</p>
                        <p className="text-blue-700 text-xs font-semibold">Tracking: {order.tracking}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-blue-700 text-xs font-bold">Est. Delivery: {order.estimatedDelivery}</p>
                    </div>
                  </div>
                )}

                {order.status === 'processing' && order.estimatedDelivery && (
                  <div className="mb-4 p-3 bg-[#48CD8A]/20 rounded-lg border-2 border-white/10">
                    <p className="text-white text-sm font-bold mb-1">Preparing Your Order</p>
                    <p className="text-white/70 text-xs font-semibold">Est. Delivery: {order.estimatedDelivery}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t-2 border-white/5">
                  <span className="text-white font-bold text-sm">Order Total</span>
                  <span className="text-white font-black text-2xl">${order.total}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {order.status === 'shipped' && (
                    <button className="py-3 bg-white text-black font-black text-sm rounded-lg hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2">
                      <MapPin className="w-4 h-4" strokeWidth={3} />
                      TRACK
                    </button>
                  )}
                  <button className="py-3 bg-white text-white font-black text-sm rounded-lg border-2 border-white/10 hover:bg-black transition-colors flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" strokeWidth={3} />
                    SUPPORT
                  </button>
                  {order.status === 'processing' && (
                    <button className="py-3 bg-red-600 text-white font-black text-sm rounded-lg hover:bg-red-700 transition-colors">
                      CANCEL
                    </button>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      {/* Past Orders Tab */}
      {activeTab === 'past' && (
        <div className="px-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="COMPLETED"
              value={pastOrders.length}
              icon={<CheckCircle className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
              size="compact"
            />
            <StatCard
              label="THIS_YEAR"
              value="12"
              size="compact"
            />
            <StatCard
              label="SPENT"
              value="$1,240"
              size="compact"
            />
          </div>

          {/* Past Orders List */}
          {pastOrders.map((order) => (
            <SectionCard
              key={order.id}
              title={order.id}
              subtitle={`Delivered ${order.date}`}
              variant="muted"
            >
              <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-sm">{item.name}</h4>
                      <p className="text-white/60 text-xs font-semibold">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white font-black text-base">${item.price}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t-2 border-white/5 mb-4">
                <span className="text-white font-bold text-sm">Total</span>
                <span className="text-white font-black text-xl">${order.total}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button className="py-2.5 bg-white text-white font-black text-xs rounded-lg border-2 border-white/10 hover:bg-black transition-colors">
                  REORDER
                </button>
                <button className="py-2.5 bg-white text-white font-black text-xs rounded-lg border-2 border-white/10 hover:bg-black transition-colors flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" strokeWidth={3} />
                  INVOICE
                </button>
                <button className="py-2.5 bg-white text-white font-black text-xs rounded-lg border-2 border-white/10 hover:bg-black transition-colors">
                  RETURN
                </button>
              </div>
            </SectionCard>
          ))}

          <SectionCard title="ORDER_HISTORY" variant="gradient">
            <div className="space-y-3">
              {['January - $280', 'February - $145', 'March - $420', 'April - $395'].map((month) => (
                <div key={month} className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                  <span className="text-white font-bold text-sm">{month.split(' - ')[0]}</span>
                  <span className="text-white font-black text-base">{month.split(' - ')[1]}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="px-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="PENDING"
              value={returns.filter(r => r.status === 'requested' || r.status === 'approved').length}
              icon={<RotateCcw className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
              size="compact"
            />
            <StatCard
              label="REFUNDED"
              value={returns.filter(r => r.status === 'refunded').length}
              size="compact"
            />
            <StatCard
              label="AMOUNT"
              value={`$${returns.reduce((sum, r) => sum + r.refundAmount, 0)}`}
              size="compact"
            />
          </div>

          {/* Returns List */}
          {returns.map((returnItem) => {
            const statusConfig = getReturnStatusConfig(returnItem.status);
            return (
              <SectionCard
                key={returnItem.id}
                title={returnItem.id}
                subtitle={`Original Order: ${returnItem.orderId}`}
                variant="elevated"
                badge={statusConfig.label}
              >
                <div className="space-y-3 mb-4">
                  {returnItem.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-black rounded-lg border-2 border-white/10">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-black text-sm mb-1">{item.name}</h4>
                        <p className="text-white/70 text-xs font-semibold">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                  <p className="text-white font-black text-sm mb-1">Return Reason</p>
                  <p className="text-white/70 text-sm font-semibold">{returnItem.reason}</p>
                </div>

                {returnItem.status === 'refunded' && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={3} />
                      <p className="text-green-900 font-black text-sm">Refund Processed</p>
                    </div>
                    <p className="text-green-700 text-xs font-semibold">
                      ${returnItem.refundAmount} returned to your payment method
                    </p>
                  </div>
                )}

                {returnItem.status === 'approved' && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-5 h-5 text-blue-600" strokeWidth={3} />
                      <p className="text-blue-900 font-black text-sm">Return Approved</p>
                    </div>
                    <p className="text-blue-700 text-xs font-semibold">
                      Please ship your item back within 7 days
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t-2 border-white/5">
                  <span className="text-white font-bold text-sm">Refund Amount</span>
                  <span className="text-white font-black text-2xl">${returnItem.refundAmount}</span>
                </div>

                {returnItem.status !== 'refunded' && (
                  <div className="mt-4">
                    <button className="w-full py-3 bg-white text-white font-black text-sm rounded-lg border-2 border-white/10 hover:bg-black transition-colors flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" strokeWidth={3} />
                      CONTACT_SUPPORT
                    </button>
                  </div>
                )}
              </SectionCard>
            );
          })}

          <SectionCard title="RETURN_POLICY" variant="muted">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#48CD8A] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <p className="text-white text-sm font-semibold">30-day return window for most items</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#48CD8A] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <p className="text-white text-sm font-semibold">Items must be unworn with tags attached</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#48CD8A] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <p className="text-white text-sm font-semibold">Free return shipping on defective items</p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
