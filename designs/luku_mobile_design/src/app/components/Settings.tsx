import { useState } from 'react';
import {
  User, Bell, Lock, CreditCard, HelpCircle, LogOut, ChevronRight,
  Moon, Globe, Palette, Mail, Smartphone, Shield
} from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


export function Settings() {

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
        <h1 className="text-white text-4xl font-black tracking-tight mb-2">
          SETTINGS
        </h1>
        <p className="text-white/70 text-sm font-semibold">
          Manage your account and preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="px-6 pt-6 space-y-6">
        {/* Account */}
        <div>
          <h2 className="text-white/40 text-xs font-black uppercase tracking-wider mb-3">
            Account
          </h2>
          <div className="space-y-2">
            <SettingsItem
              icon={User}
              label="Profile Information"
              description="Name, email, bio"
              to="/settings/profile"
            />
            <SettingsItem
              icon={Lock}
              label="Password & Security"
              description="Change password, 2FA"
              to="/settings/security"
            />
            <SettingsItem
              icon={CreditCard}
              label="Payment Methods"
              description="Cards, billing"
              to="/settings/payments"
            />
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h2 className="text-white/40 text-xs font-black uppercase tracking-wider mb-3">
            Preferences
          </h2>
          <div className="space-y-2">
            <SettingsItem
              icon={Bell}
              label="Notifications"
              description="Push, email, SMS"
              to="/settings/notifications"
            />
            <SettingsItem
              icon={Globe}
              label="Language & Region"
              description="English, Kenya"
              to="/settings/language"
            />
            <SettingsItem
              icon={Palette}
              label="Appearance"
              description="Theme, display"
              to="/settings/appearance"
            />
          </div>
        </div>

        {/* Privacy */}
        <div>
          <h2 className="text-white/40 text-xs font-black uppercase tracking-wider mb-3">
            Privacy & Safety
          </h2>
          <div className="space-y-2">
            <SettingsItem
              icon={Shield}
              label="Privacy Controls"
              description="Who can see your content"
              to="/settings/privacy"
            />
            <SettingsItem
              icon={User}
              label="Blocked Accounts"
              description="Manage blocked users"
              to="/settings/blocked"
            />
          </div>
        </div>

        {/* Support */}
        <div>
          <h2 className="text-white/40 text-xs font-black uppercase tracking-wider mb-3">
            Support
          </h2>
          <div className="space-y-2">
            <SettingsItem
              icon={HelpCircle}
              label="Help & FAQ"
              description="Get support"
              to="/help"
            />
            <SettingsItem
              icon={Mail}
              label="Contact Us"
              description="Send feedback"
              to="/contact"
            />
          </div>
        </div>

        {/* Legal */}
        <div>
          <h2 className="text-white/40 text-xs font-black uppercase tracking-wider mb-3">
            Legal
          </h2>
          <div className="space-y-2">
            <SettingsItem
              icon={ChevronRight}
              label="Terms of Service"
              to="/terms"
              hideChevron
            />
            <SettingsItem
              icon={ChevronRight}
              label="Privacy Policy"
              to="/privacy"
              hideChevron
            />
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4">
          <button className="w-full py-4 bg-white/10 border border-white/20 text-white font-black text-sm rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide">
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            Sign Out
          </button>
        </div>

        {/* App Info */}
        <div className="text-center py-6">
          <p className="text-white text-sm font-black mb-1">LUKU</p>
          <p className="text-white/40 text-xs font-semibold">Version 1.0.0</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

interface SettingsItemProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  description?: string;
  to: string;
  hideChevron?: boolean;
}

function SettingsItem({ icon: Icon, label, description, to, hideChevron }: SettingsItemProps) {
  return (
    <Link to={to}>
      <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold">{label}</p>
          {description && (
            <p className="text-white/60 text-xs font-semibold truncate">{description}</p>
          )}
        </div>
        {!hideChevron && (
          <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" strokeWidth={2.5} />
        )}
      </div>
    </Link>
  );
}
