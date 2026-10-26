import { Check, Eye, Share2, Edit } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

import { useState } from 'react';

export function ListingConfirmation() {

  // Mock listing data - would come from route state
  const listing = {
    id: 1,
    name: 'Vintage Leather Jacket',
    price: 8900,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
    category: 'Outerwear',
    condition: 'Like New',
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Success Hero */}
      <div className="relative h-96 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={listing.imageUrl}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30"></div>
        </div>

        {/* Success Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-32 h-32 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center shadow-2xl animate-pulse border-4 border-white/20">
            <Check className="w-16 h-16 text-black" strokeWidth={3} />
          </div>
        </div>

        {/* Bottom Text */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h1 className="text-white text-4xl font-black tracking-tight leading-none mb-2 text-center">
            LISTING LIVE!
          </h1>
          <p className="text-white/70 text-sm font-semibold text-center">
            Your item is now visible to thousands of buyers
          </p>
        </div>
      </div>

      {/* Listing Details */}
      <div className="px-6 pt-8">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
          <h2 className="text-white text-2xl font-black mb-4">{listing.name}</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                Price
              </p>
              <p className="text-[#48CD8A] text-2xl font-black">
                KES {listing.price.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                Category
              </p>
              <p className="text-white text-lg font-bold">{listing.category}</p>
            </div>
          </div>

          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
              Condition
            </p>
            <p className="text-white text-lg font-bold">{listing.condition}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Eye className="w-6 h-6 text-white/40 mx-auto mb-2" strokeWidth={2.5} />
            <p className="text-white text-2xl font-black">0</p>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
              Views
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Share2 className="w-6 h-6 text-white/40 mx-auto mb-2" strokeWidth={2.5} />
            <p className="text-white text-2xl font-black">0</p>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
              Shares
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Eye className="w-6 h-6 text-white/40 mx-auto mb-2" strokeWidth={2.5} />
            <p className="text-white text-2xl font-black">0</p>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
              Saves
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          <Link to={`/product/${listing.id}`}>
            <button className="w-full bg-white text-black font-black text-sm py-4 rounded-xl hover:bg-[#FAFAFA] transition-colors uppercase tracking-wide flex items-center justify-center gap-2">
              <Eye className="w-5 h-5" strokeWidth={2.5} />
              View Listing
            </button>
          </Link>

          <button className="w-full bg-white/10 border border-white/20 text-white font-black text-sm py-4 rounded-xl hover:bg-white/20 transition-colors uppercase tracking-wide flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" strokeWidth={2.5} />
            Share Listing
          </button>

          <button className="w-full bg-white/10 border border-white/20 text-white font-black text-sm py-4 rounded-xl hover:bg-white/20 transition-colors uppercase tracking-wide flex items-center justify-center gap-2">
            <Edit className="w-5 h-5" strokeWidth={2.5} />
            Edit Listing
          </button>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-[#48CD8A]/10 to-[#3AB87A]/10 border border-[#48CD8A]/30 rounded-2xl p-6 mb-6">
          <h3 className="text-white text-lg font-black mb-4">Boost Your Sales</h3>
          <ul className="space-y-3">
            {[
              'Share on social media to reach more buyers',
              'Respond quickly to messages to build trust',
              'Add more photos to showcase details',
              'Price competitively for faster sales',
            ].map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#48CD8A] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-black" strokeWidth={3} />
                </div>
                <p className="text-white text-sm font-semibold">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Continue Shopping */}
        <Link to="/marketplace">
          <button className="w-full bg-white/10 border border-white/20 text-white font-black text-sm py-4 rounded-xl hover:bg-white/20 transition-colors uppercase tracking-wide mb-6">
            Browse Marketplace
          </button>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
