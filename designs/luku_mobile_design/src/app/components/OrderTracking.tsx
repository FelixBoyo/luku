import { useState } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Calendar, Phone } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'in_transit' | 'delivered';

export function OrderTracking() {

  // Mock order data
  const order = {
    id: 'ORD-2026-05-001',
    date: 'May 21, 2026',
    currentStatus: 'in_transit' as OrderStatus,
    estimatedDelivery: 'May 25, 2026',
    trackingNumber: 'TRK-8492-3756',
    items: [
      {
        id: 1,
        name: 'Wool Coat',
        price: 8900,
        imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
        seller: 'ChicBoutique',
        quantity: 1,
      },
      {
        id: 2,
        name: 'Leather Boots',
        price: 4500,
        imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
        seller: 'VintageVibes',
        quantity: 1,
      },
    ],
    shippingAddress: {
      name: 'Shannon Martinez',
      street: '123 Moi Avenue',
      city: 'Nairobi',
      postal: '00100',
      phone: '+254 712 345 678',
    },
    timeline: [
      {
        status: 'confirmed',
        label: 'Order Confirmed',
        date: 'May 21, 10:30 AM',
        completed: true,
      },
      {
        status: 'processing',
        label: 'Processing',
        date: 'May 21, 2:45 PM',
        completed: true,
      },
      {
        status: 'shipped',
        label: 'Shipped',
        date: 'May 22, 9:00 AM',
        completed: true,
      },
      {
        status: 'in_transit',
        label: 'In Transit',
        date: 'May 23, 11:20 AM',
        completed: true,
        current: true,
      },
      {
        status: 'delivered',
        label: 'Delivered',
        date: 'Expected May 25',
        completed: false,
      },
    ],
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-white/10">
        <Link to="/">
          <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors mb-4">
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </Link>
        <h1 className="text-white text-3xl font-black tracking-tight mb-2">ORDER TRACKING</h1>
        <p className="text-white/70 text-sm font-semibold">Order #{order.id}</p>
      </div>

      {/* Status Hero */}
      <div className="px-6 pt-8 pb-6">
        <div className="bg-gradient-to-br from-[#48CD8A]/10 to-[#3AB87A]/10 border border-[#48CD8A]/30 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#48CD8A] rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="w-8 h-8 text-black" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-[#48CD8A] text-sm font-black uppercase tracking-wide mb-1">
                {order.timeline.find((t) => t.current)?.label}
              </p>
              <p className="text-white text-xl font-black">Your order is on its way!</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-white/60" strokeWidth={2.5} />
            <p className="text-white/70 text-sm font-semibold">
              Estimated delivery: {order.estimatedDelivery}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-white/60" strokeWidth={2.5} />
            <p className="text-white/70 text-sm font-semibold">
              Tracking: {order.trackingNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 pb-6">
        <h2 className="text-white text-xs font-black uppercase tracking-widest mb-4">
          Order Timeline
        </h2>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10"></div>

          {/* Timeline Items */}
          <div className="space-y-6">
            {order.timeline.map((item, index) => (
              <div key={index} className="relative flex items-start gap-4">
                {/* Status Icon */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 border-black ${
                    item.completed
                      ? 'bg-[#48CD8A]'
                      : 'bg-white/10 border-white/20'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle className="w-6 h-6 text-black" strokeWidth={2.5} />
                  ) : (
                    <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <p
                    className={`text-base font-black mb-1 ${
                      item.current ? 'text-[#48CD8A]' : item.completed ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      item.completed ? 'text-white/70' : 'text-white/40'
                    }`}
                  >
                    {item.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="px-6 pb-6">
        <h2 className="text-white text-xs font-black uppercase tracking-widest mb-4">
          Delivery Address
        </h2>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-bold mb-1">{order.shippingAddress.name}</p>
              <p className="text-white/70 text-sm font-semibold">
                {order.shippingAddress.street}
              </p>
              <p className="text-white/70 text-sm font-semibold">
                {order.shippingAddress.city}, {order.shippingAddress.postal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <Phone className="w-4 h-4 text-white/60" strokeWidth={2.5} />
            <p className="text-white/70 text-sm font-semibold">{order.shippingAddress.phone}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="px-6 pb-12">
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
                <p className="text-white/60 text-xs font-semibold mb-2">
                  Sold by {item.seller}
                </p>
                <p className="text-white/60 text-xs font-semibold">Qty: {item.quantity}</p>
              </div>
              <p className="text-[#48CD8A] text-lg font-black">
                KES {item.price.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
