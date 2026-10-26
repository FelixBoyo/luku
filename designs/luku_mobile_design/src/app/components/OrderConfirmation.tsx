import { Check, Package, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

import { useState } from 'react';

export function OrderConfirmation() {

  // Mock order data - would come from route state
  const order = {
    id: 'ORD-2026-05-001',
    date: 'May 21, 2026',
    total: 12400,
    estimatedDelivery: 'May 25-28, 2026',
    items: [
      {
        id: 1,
        name: 'Wool Coat',
        price: 8900,
        imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
        seller: 'ChicBoutique',
      },
      {
        id: 2,
        name: 'Leather Boots',
        price: 4500,
        imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
        seller: 'VintageVibes',
      },
    ],
    shippingAddress: {
      name: 'Shannon Martinez',
      street: '123 Moi Avenue',
      city: 'Nairobi',
      postal: '00100',
    },
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={0} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Success Hero */}
      <div className="relative h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#48CD8A]/30 via-[#3AB87A]/20 to-black"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          {/* Success Icon */}
          <div className="w-32 h-32 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center shadow-2xl mb-6 border-4 border-white/20">
            <Check className="w-16 h-16 text-black" strokeWidth={3} />
          </div>

          {/* Title */}
          <h1 className="text-white text-5xl font-black tracking-tighter leading-none mb-3 text-center">
            ORDER PLACED!
          </h1>
          <p className="text-white/70 text-sm font-semibold text-center mb-6">
            Thank you for your purchase
          </p>

          {/* Order Number */}
          <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-xl px-6 py-3">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide text-center mb-1">
              Order Number
            </p>
            <p className="text-white text-lg font-black text-center">{order.id}</p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="px-6 pt-8">
        {/* Delivery Info */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-[#48CD8A]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-[#48CD8A]" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                Estimated Delivery
              </p>
              <p className="text-white text-xl font-black">{order.estimatedDelivery}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                Delivery Address
              </p>
              <p className="text-white text-sm font-bold">{order.shippingAddress.name}</p>
              <p className="text-white/70 text-sm font-semibold">
                {order.shippingAddress.street}
              </p>
              <p className="text-white/70 text-sm font-semibold">
                {order.shippingAddress.city}, {order.shippingAddress.postal}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h2 className="text-white text-xs font-black uppercase tracking-widest mb-4">
            Order Items
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold mb-1">{item.name}</p>
                  <p className="text-white/60 text-xs font-semibold">
                    Sold by {item.seller}
                  </p>
                </div>
                <p className="text-[#48CD8A] text-lg font-black">
                  KES {item.price.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
          <h3 className="text-white text-sm font-black uppercase tracking-wide mb-4">
            Order Summary
          </h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-sm font-semibold">Subtotal</p>
              <p className="text-white text-sm font-bold">
                KES {(order.total - 1000).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-sm font-semibold">Shipping</p>
              <p className="text-white text-sm font-bold">KES 1,000</p>
            </div>
          </div>
          <div className="border-t border-white/20 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-white text-lg font-black">Total</p>
              <p className="text-[#48CD8A] text-2xl font-black">
                KES {order.total.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          <Link to="/orders">
            <button className="w-full bg-white text-black font-black text-sm py-4 rounded-xl hover:bg-[#FAFAFA] transition-colors uppercase tracking-wide flex items-center justify-center gap-2">
              <Package className="w-5 h-5" strokeWidth={2.5} />
              Track Order
            </button>
          </Link>

          <Link to="/marketplace">
            <button className="w-full bg-white/10 border border-white/20 text-white font-black text-sm py-4 rounded-xl hover:bg-white/20 transition-colors uppercase tracking-wide flex items-center justify-center gap-2">
              Continue Shopping
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </Link>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-[#48CD8A]/10 to-[#3AB87A]/10 border border-[#48CD8A]/30 rounded-2xl p-6 mb-6">
          <h3 className="text-white text-lg font-black mb-4">What's Next?</h3>
          <ul className="space-y-3">
            {[
              "You'll receive a confirmation email shortly",
              'Track your order status in the Orders section',
              'The seller will ship your items within 2-3 days',
              'Rate your purchase after delivery',
            ].map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-black">{idx + 1}</span>
                </div>
                <p className="text-white text-sm font-semibold">{step}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
