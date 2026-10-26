import { useState } from 'react';
import {
  User, Settings, Bell, Lock, CreditCard, HelpCircle,
  LogOut, ChevronRight, Moon, Globe, Palette, Heart,
  ShoppingBag, Grid3x3, BarChart3, Shield, Mail, Smartphone,
  LayoutGrid, Package, Store, Sparkles
} from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

import { SectionCard } from './common/SectionCard';
import { Drawer } from './common/Drawer';

export function Profile() {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  const closeDrawer = () => setActiveDrawer(null);

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Editorial Profile Hero */}
      <div className="relative h-64 overflow-hidden">
        {/* Cover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#48CD8A]/20 via-[#3AB87A]/10 to-black"></div>

        {/* Floating header */}
        <div className="absolute top-0 left-0 right-0 px-6 pt-8">
          <h1 className="text-white text-5xl font-black tracking-tighter leading-none">
            ACCOUNT
          </h1>
        </div>

        {/* Profile info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white">
              <User className="w-10 h-10 text-black" strokeWidth={2.5} />
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-white text-2xl font-black mb-1">Shannon Martinez</h2>
              <p className="text-white/70 text-sm font-semibold">shannon@example.com</p>
            </div>
            <button
              onClick={() => setActiveDrawer('profile')}
              className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-1 hover:bg-white transition-colors group"
            >
              <ChevronRight className="w-5 h-5 text-white group-hover:text-black" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access - Ecommerce */}
      <div className="px-6 mb-6">
        <SectionCard title="SHOPPING" variant="elevated">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/cart">
              <button className="p-4 bg-gradient-to-br from-[#48CD8A]/20 to-[#3AB87A]/20 hover:from-[#48CD8A]/30 hover:to-[#3AB87A]/30 rounded-lg border-2 border-white/20 transition-colors text-left w-full">
                <ShoppingBag className="w-6 h-6 text-[#48CD8A] mb-2" strokeWidth={3} />
                <p className="text-white text-sm font-black">CART</p>
                <p className="text-white/60 text-xs font-semibold">3 items</p>
              </button>
            </Link>
            <Link to="/orders">
              <button className="p-4 bg-gradient-to-br from-[#48CD8A]/20 to-[#3AB87A]/20 hover:from-[#48CD8A]/30 hover:to-[#3AB87A]/30 rounded-lg border-2 border-white/20 transition-colors text-left w-full">
                <Package className="w-6 h-6 text-[#48CD8A] mb-2" strokeWidth={3} />
                <p className="text-white text-sm font-black">ORDERS</p>
                <p className="text-white/60 text-xs font-semibold">5 active</p>
              </button>
            </Link>
            <button
              onClick={() => setActiveDrawer('favorites')}
              className="p-4 bg-black hover:bg-white/5 rounded-lg border-2 border-white/10 transition-colors text-left"
            >
              <Heart className="w-6 h-6 text-[#48CD8A] mb-2" strokeWidth={3} />
              <p className="text-white text-sm font-black">WISHLIST</p>
              <p className="text-white/60 text-xs font-semibold">18 items</p>
            </button>
            <Link to="/marketplace">
              <button className="p-4 bg-black hover:bg-white/5 rounded-lg border-2 border-white/10 transition-colors text-left w-full">
                <Store className="w-6 h-6 text-[#48CD8A] mb-2" strokeWidth={3} />
                <p className="text-white text-sm font-black">SHOP</p>
                <p className="text-white/60 text-xs font-semibold">Browse</p>
              </button>
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Dashboards */}
      <div className="px-6 mb-6">
        <SectionCard title="DASHBOARDS" variant="elevated">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/seller-dashboard">
              <button className="p-4 bg-black hover:bg-white/5 rounded-lg border-2 border-white/10 transition-colors text-left w-full">
                <BarChart3 className="w-6 h-6 text-[#48CD8A] mb-2" strokeWidth={3} />
                <p className="text-white text-sm font-black">SELLER</p>
                <p className="text-white/60 text-xs font-semibold">Your store</p>
              </button>
            </Link>
            <Link to="/creator-dashboard">
              <button className="p-4 bg-black hover:bg-white/5 rounded-lg border-2 border-white/10 transition-colors text-left w-full">
                <Sparkles className="w-6 h-6 text-[#48CD8A] mb-2" strokeWidth={3} />
                <p className="text-white text-sm font-black">CREATOR</p>
                <p className="text-white/60 text-xs font-semibold">Earnings</p>
              </button>
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Quick Access - Other */}
      <div className="px-6 mb-6">
        <SectionCard title="QUICK_ACCESS" variant="elevated">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/mood-boards">
                <button className="p-4 bg-black hover:bg-white/5 rounded-lg border-2 border-white/10 transition-colors text-left w-full">
                  <Grid3x3 className="w-6 h-6 text-[#48CD8A] mb-2" strokeWidth={3} />
                  <p className="text-white text-sm font-black">MOOD BOARDS</p>
                  <p className="text-white/60 text-xs font-semibold">2 boards</p>
                </button>
              </Link>
              <Link to="/insights">
                <button className="p-4 bg-black hover:bg-white/5 rounded-lg border-2 border-white/10 transition-colors text-left w-full">
                  <BarChart3 className="w-6 h-6 text-[#48CD8A] mb-2" strokeWidth={3} />
                  <p className="text-white text-sm font-black">INSIGHTS</p>
                  <p className="text-white/60 text-xs font-semibold">Analytics</p>
                </button>
              </Link>
            </div>

            {/* Widget Staging - Development Tool */}
            <Link to="/widget-staging">
              <button className="p-4 bg-gradient-to-br from-[#48CD8A]/20 to-[#3AB87A]/20 hover:from-[#48CD8A]/30 hover:to-[#3AB87A]/30 rounded-lg border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/20 transition-all text-left w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#48CD8A] rounded-lg flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-black" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-black">WIDGET STAGING</p>
                    <p className="text-white/60 text-xs font-semibold">View unplaced widgets</p>
                  </div>
                </div>
              </button>
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Settings Sections */}
      <div className="px-6 space-y-3">
        {/* Account Settings */}
        <button
          onClick={() => setActiveDrawer('account')}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#48CD8A]/20 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#48CD8A]" strokeWidth={3} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-base">Account Settings</p>
              <p className="text-white/60 text-xs font-semibold">Profile, email, password</p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-white/40 group-hover:text-black transition-colors"
            strokeWidth={3}
          />
        </button>

        {/* Preferences */}
        <button
          onClick={() => setActiveDrawer('preferences')}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#3AB87A]/20 rounded-lg flex items-center justify-center">
              <Palette className="w-6 h-6 text-[#48CD8A]" strokeWidth={3} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-base">Preferences</p>
              <p className="text-white/60 text-xs font-semibold">Theme, language, units</p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-white/40 group-hover:text-black transition-colors"
            strokeWidth={3}
          />
        </button>

        {/* Notifications */}
        <button
          onClick={() => setActiveDrawer('notifications')}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-[#48CD8A]" strokeWidth={3} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-base">Notifications</p>
              <p className="text-white/60 text-xs font-semibold">Push, email, SMS</p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-white/40 group-hover:text-black transition-colors"
            strokeWidth={3}
          />
        </button>

        {/* Privacy & Security */}
        <button
          onClick={() => setActiveDrawer('privacy')}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#48CD8A]" strokeWidth={3} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-base">Privacy & Security</p>
              <p className="text-white/60 text-xs font-semibold">Data, visibility, 2FA</p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-white/40 group-hover:text-black transition-colors"
            strokeWidth={3}
          />
        </button>

        {/* Subscription */}
        <button
          onClick={() => setActiveDrawer('subscription')}
          className="w-full bg-gradient-to-br from-[#48CD8A]/10 to-[#3AB87A]/10 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#48CD8A] rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-black" strokeWidth={3} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-base">Subscription</p>
              <p className="text-white/60 text-xs font-semibold">Free Plan · Upgrade to Pro</p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-white/40 group-hover:text-black transition-colors"
            strokeWidth={3}
          />
        </button>

        {/* Help & Support */}
        <button
          onClick={() => setActiveDrawer('help')}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-[#48CD8A]" strokeWidth={3} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-base">Help & Support</p>
              <p className="text-white/60 text-xs font-semibold">FAQ, contact us</p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-white/40 group-hover:text-black transition-colors"
            strokeWidth={3}
          />
        </button>
      </div>

      {/* Sign Out */}
      <div className="px-6 mt-8 mb-6">
        <button className="w-full bg-white text-white font-black text-sm py-4 rounded-xl border-2 border-white/20 hover:bg-black transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" strokeWidth={3} />
          SIGN_OUT
        </button>
      </div>

      {/* Drawers */}
      <Drawer isOpen={activeDrawer === 'account'} onClose={closeDrawer} title="ACCOUNT_SETTINGS">
        <div className="space-y-6">
          <SectionCard title="PERSONAL_INFO" variant="elevated">
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-black mb-2 block">FULL NAME</label>
                <input
                  type="text"
                  defaultValue="Shannon Martinez"
                  className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white text-sm font-black mb-2 block">EMAIL</label>
                <input
                  type="email"
                  defaultValue="shannon@example.com"
                  className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white text-sm font-black mb-2 block">PHONE</label>
                <input
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="PASSWORD" variant="muted">
            <button className="w-full py-3 bg-white text-black font-black text-sm rounded-lg hover:bg-[#1A1A1A] transition-colors">
              CHANGE_PASSWORD
            </button>
          </SectionCard>

          <SectionCard title="DANGER_ZONE" variant="muted">
            <button className="w-full py-3 bg-red-600 text-white font-black text-sm rounded-lg hover:bg-red-700 transition-colors">
              DELETE_ACCOUNT
            </button>
          </SectionCard>
        </div>
      </Drawer>

      <Drawer isOpen={activeDrawer === 'preferences'} onClose={closeDrawer} title="PREFERENCES">
        <div className="space-y-6">
          <SectionCard title="APPEARANCE" variant="elevated">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black rounded-lg border-2 border-white/10">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-[#48CD8A]" strokeWidth={3} />
                  <span className="text-white font-bold text-sm">Dark Mode</span>
                </div>
                <div className="w-12 h-6 bg-white/5 rounded-full relative cursor-pointer border-2 border-white/10">
                  <div className="w-5 h-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full absolute top-0.5 left-0.5 border-2 border-white/20"></div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="REGIONAL" variant="gradient">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#48CD8A]" strokeWidth={3} />
                  <span className="text-white font-bold text-sm">Language</span>
                </div>
                <span className="text-white font-black text-sm">English</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <span className="text-white font-bold text-sm">Temperature</span>
                <span className="text-white font-black text-sm">Celsius</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </Drawer>

      <Drawer isOpen={activeDrawer === 'notifications'} onClose={closeDrawer} title="NOTIFICATIONS">
        <div className="space-y-6">
          <SectionCard title="PUSH_NOTIFICATIONS" variant="elevated">
            <div className="space-y-3">
              {[
                { label: 'Daily Outfit', icon: Smartphone },
                { label: 'New Trends', icon: Bell },
                { label: 'Community Activity', icon: User },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 bg-black rounded-lg border-2 border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-[#48CD8A]" strokeWidth={3} />
                    <span className="text-white font-bold text-sm">{item.label}</span>
                  </div>
                  <div className="w-12 h-6 bg-[#48CD8A] rounded-full relative cursor-pointer border-2 border-white/10">
                    <div className="w-5 h-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full absolute top-0.5 right-0.5 border-2 border-white/20"></div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="EMAIL_NOTIFICATIONS" variant="muted">
            <div className="space-y-3">
              {['Weekly Summary', 'Promotions', 'Tips & Tricks'].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#48CD8A]" strokeWidth={3} />
                    <span className="text-white font-bold text-sm">{item}</span>
                  </div>
                  <div className="w-12 h-6 bg-white/5 rounded-full relative cursor-pointer border-2 border-white/10">
                    <div className="w-5 h-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full absolute top-0.5 left-0.5 border-2 border-white/20"></div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </Drawer>

      <Drawer isOpen={activeDrawer === 'privacy'} onClose={closeDrawer} title="PRIVACY_&_SECURITY">
        <div className="space-y-6">
          <SectionCard title="TWO-FACTOR_AUTH" variant="elevated">
            <div className="flex items-center justify-between p-4 bg-black rounded-lg border-2 border-white/10">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#48CD8A]" strokeWidth={3} />
                <div>
                  <p className="text-white font-black text-sm">2FA Enabled</p>
                  <p className="text-white/60 text-xs font-semibold">Extra security layer</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-[#48CD8A] rounded-full relative border-2 border-white/10">
                <div className="w-5 h-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full absolute top-0.5 right-0.5 border-2 border-white/20"></div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="PRIVACY_CONTROLS" variant="gradient">
            <div className="space-y-3">
              {['Profile Visibility', 'Activity Status', 'Location Sharing'].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10"
                >
                  <span className="text-white font-bold text-sm">{item}</span>
                  <span className="text-white font-black text-sm">Public</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="DATA_MANAGEMENT" variant="muted">
            <div className="space-y-2">
              <button className="w-full py-3 bg-white text-white font-black text-sm rounded-lg border-2 border-white/10 hover:bg-black transition-colors">
                DOWNLOAD_MY_DATA
              </button>
              <button className="w-full py-3 bg-white text-white font-black text-sm rounded-lg border-2 border-white/10 hover:bg-black transition-colors">
                CLEAR_CACHE
              </button>
            </div>
          </SectionCard>
        </div>
      </Drawer>

      <Drawer
        isOpen={activeDrawer === 'subscription'}
        onClose={closeDrawer}
        title="SUBSCRIPTION"
      >
        <div className="space-y-6">
          <SectionCard title="CURRENT_PLAN" variant="muted">
            <div className="text-center py-4">
              <p className="text-white font-black text-2xl mb-2">FREE</p>
              <p className="text-white/70 text-sm font-semibold">Limited features</p>
            </div>
          </SectionCard>

          <SectionCard title="UPGRADE_TO_PRO" variant="elevated">
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-[#48CD8A]/20 to-[#3AB87A]/20 rounded-lg border-2 border-white/10">
                <p className="text-white font-black text-4xl mb-2">$9.99</p>
                <p className="text-white/70 text-sm font-bold">per month</p>
              </div>
              <ul className="space-y-2">
                {[
                  'Unlimited outfit generation',
                  'Advanced AI styling',
                  'Trip planning tools',
                  'Priority support',
                  'Ad-free experience',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white text-sm font-semibold">
                    <div className="w-5 h-5 bg-[#48CD8A] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-black">✓</span>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 bg-white text-black font-black text-base rounded-lg hover:bg-[#1A1A1A] transition-colors">
                UPGRADE_NOW
              </button>
            </div>
          </SectionCard>
        </div>
      </Drawer>

      <Drawer isOpen={activeDrawer === 'help'} onClose={closeDrawer} title="HELP_&_SUPPORT">
        <div className="space-y-6">
          <SectionCard title="QUICK_LINKS" variant="elevated">
            <div className="space-y-2">
              {['Getting Started', 'User Guide', 'FAQ', 'Video Tutorials'].map((item) => (
                <button
                  key={item}
                  className="w-full text-left p-3 bg-black rounded-lg border-2 border-white/10 hover:bg-white/5 transition-colors"
                >
                  <span className="text-white font-bold text-sm">{item}</span>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="CONTACT_US" variant="gradient">
            <div className="space-y-3">
              <button className="w-full py-3 bg-white text-white font-black text-sm rounded-lg border-2 border-white/10 hover:bg-black transition-colors">
                EMAIL_SUPPORT
              </button>
              <button className="w-full py-3 bg-white text-white font-black text-sm rounded-lg border-2 border-white/10 hover:bg-black transition-colors">
                LIVE_CHAT
              </button>
            </div>
          </SectionCard>

          <SectionCard title="APP_INFO" variant="muted">
            <div className="space-y-2 text-center">
              <p className="text-white font-black text-lg">LUKU</p>
              <p className="text-white/70 text-sm font-semibold">Version 1.0.0</p>
              <div className="pt-3 space-y-1">
                <button className="text-white/60 text-xs font-semibold hover:text-black transition-colors">
                  Terms of Service
                </button>
                <span className="text-white/40 text-xs mx-2">·</span>
                <button className="text-white/60 text-xs font-semibold hover:text-black transition-colors">
                  Privacy Policy
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      </Drawer>

      <BottomNav />
    </div>
  );
}
