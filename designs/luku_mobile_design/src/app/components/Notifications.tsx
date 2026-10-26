import { useState } from 'react';
import { Bell, Package, Sparkles, Store, Settings as SettingsIcon, Palette } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SubNavChipRail } from './common/SubNavChipRail';

export function Notifications() {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', count: 12 },
    { id: 'orders', label: 'Orders', count: 3 },
    { id: 'style', label: 'Style', count: 5 },
    { id: 'marketplace', label: 'Marketplace', count: 2 },
    { id: 'system', label: 'System', count: 1 },
    { id: 'creator', label: 'Creator', count: 1 },
  ];

  const notifications = [
    { id: 1, type: 'orders', icon: Package, title: 'Order Shipped', message: 'Your order #1234 has been shipped', time: '2 hours ago', unread: true },
    { id: 2, type: 'style', icon: Sparkles, title: 'New Outfit Suggestions', message: '5 new outfit ideas based on your wardrobe', time: '4 hours ago', unread: true },
    { id: 3, type: 'marketplace', icon: Store, title: 'Price Drop Alert', message: 'Vintage Leather Bag is now $45', time: '1 day ago', unread: true },
    { id: 4, type: 'orders', icon: Package, title: 'Order Delivered', message: 'Your order #1233 has been delivered', time: '2 days ago', unread: false },
    { id: 5, type: 'style', icon: Palette, title: 'Style DNA Updated', message: 'Your style profile has been refreshed', time: '2 days ago', unread: false },
    { id: 6, type: 'creator', icon: Sparkles, title: 'Earnings Update', message: 'You earned $24 this week', time: '3 days ago', unread: false },
    { id: 7, type: 'system', icon: SettingsIcon, title: 'New Feature Available', message: 'Try our new Virtual Try-On feature', time: '4 days ago', unread: false },
    { id: 8, type: 'marketplace', icon: Store, title: 'Item Sold', message: 'Your Black Dress sold for $55', time: '5 days ago', unread: false },
  ];

  const filteredNotifications = activeCategory === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeCategory);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-block">
            <h1 className="text-white text-4xl font-black tracking-tight relative">
              NOTIFICATIONS
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
            </h1>
          </div>
          {unreadCount > 0 && (
            <div className="px-3 py-1 bg-[#48CD8A] rounded-full">
              <span className="text-white text-sm font-black">{unreadCount} New</span>
            </div>
          )}
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Stay updated with your activity
        </p>
      </div>

      <div className="px-6 mb-6">
        <SubNavChipRail
          items={categories.map(cat => ({
            id: cat.id,
            label: cat.label,
            badge: cat.count,
          }))}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      <div className="px-6 pb-6">
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <button
              key={notification.id}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                notification.unread
                  ? 'bg-white border-[#48CD8A] shadow-md'
                  : 'bg-white/60 border-white/10 hover:bg-white hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  notification.unread ? 'bg-[#48CD8A]/20' : 'bg-white/5'
                }`}>
                  <notification.icon className="w-5 h-5 text-black" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-black">{notification.title}</p>
                    {notification.unread && (
                      <div className="w-2 h-2 rounded-full bg-[#48CD8A] flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  <p className="text-white/70 text-sm font-semibold mb-2">{notification.message}</p>
                  <p className="text-white/40 text-xs font-semibold">{notification.time}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-black/20 mx-auto mb-3" strokeWidth={2.5} />
            <p className="text-white/60 text-sm font-semibold">No notifications in this category</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
