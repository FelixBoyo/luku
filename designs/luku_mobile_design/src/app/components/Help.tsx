import { useState } from 'react';
import { Search, ChevronRight, Mail, MessageCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { SectionCard } from './common/SectionCard';

export function Help() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 1, name: 'Getting Started', icon: BookOpen, count: 8 },
    { id: 2, name: 'Wardrobe & Outfits', icon: BookOpen, count: 12 },
    { id: 3, name: 'Shopping & Orders', icon: BookOpen, count: 10 },
    { id: 4, name: 'Account Settings', icon: BookOpen, count: 6 },
    { id: 5, name: 'Seller Dashboard', icon: BookOpen, count: 15 },
    { id: 6, name: 'Sustainability', icon: BookOpen, count: 5 },
  ];

  const popularArticles = [
    { id: 1, title: 'How to add items to your wardrobe', category: 'Getting Started' },
    { id: 2, title: 'Creating your first outfit', category: 'Wardrobe & Outfits' },
    { id: 3, title: 'Understanding your Style DNA', category: 'Getting Started' },
    { id: 4, title: 'How to track your orders', category: 'Shopping & Orders' },
    { id: 5, title: 'Setting up M-Pesa payments', category: 'Shopping & Orders' },
  ];

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            HELP CENTER
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Find answers and get support
        </p>
      </div>

      {/* Search */}
      <div className="px-6 mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full px-4 py-4 pl-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white font-semibold focus:border-[#48CD8A] focus:outline-none shadow-md"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" strokeWidth={2.5} />
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 mb-6">
        <SectionCard title="BROWSE_BY_TOPIC" variant="elevated">
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl border-2 border-white/10 hover:bg-black transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#48CD8A]/20 rounded-lg flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-black" strokeWidth={3} />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-black text-sm">{category.name}</p>
                    <p className="text-white/60 text-xs font-semibold">{category.count} articles</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-black transition-colors" strokeWidth={3} />
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Popular Articles */}
      <div className="px-6 mb-6">
        <SectionCard title="POPULAR_ARTICLES" variant="muted">
          <div className="space-y-2">
            {popularArticles.map((article) => (
              <button
                key={article.id}
                className="w-full text-left p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10 hover:bg-black transition-colors"
              >
                <p className="text-white font-bold text-sm mb-1">{article.title}</p>
                <p className="text-white/60 text-xs font-semibold">{article.category}</p>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Contact Support */}
      <div className="px-6 mb-6">
        <SectionCard title="CONTACT_SUPPORT" variant="gradient">
          <div className="space-y-3">
            <button className="w-full p-4 bg-white/20 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-colors flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-black text-sm mb-1">Email Support</p>
                <p className="text-white/90 text-xs font-semibold">Response within 24 hours</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" strokeWidth={3} />
            </button>

            <button className="w-full p-4 bg-white/20 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-colors flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-black text-sm mb-1">Live Chat</p>
                <p className="text-white/90 text-xs font-semibold">Available Mon-Fri 9AM-5PM</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" strokeWidth={3} />
            </button>
          </div>
        </SectionCard>
      </div>

      {/* App Info */}
      <div className="px-6 mb-6">
        <div className="text-center space-y-2">
          <p className="text-white text-sm font-black">LUKU v1.0.0</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/terms">
              <button className="text-white/60 text-xs font-semibold hover:text-black transition-colors">
                Terms of Service
              </button>
            </Link>
            <span className="text-white/40">·</span>
            <Link to="/privacy">
              <button className="text-white/60 text-xs font-semibold hover:text-black transition-colors">
                Privacy Policy
              </button>
            </Link>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
