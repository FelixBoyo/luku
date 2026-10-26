import { useState } from 'react';
import { Flame, Award, Target, Star, TrendingUp, Share2, Gift } from 'lucide-react';
import { BottomNav } from './BottomNav';

export function Achievements() {
  const [showShareModal, setShowShareModal] = useState(false);

  const streaks = {
    current: 12,
    longest: 28,
  };

  const badges = [
    { id: 1, name: 'Style Starter', description: 'Created first outfit', icon: Star, progress: 100, unlocked: true, color: '#48CD8A' },
    { id: 2, name: 'Wardrobe Pro', description: 'Added 50 items', icon: Target, progress: 100, unlocked: true, color: '#3AB87A' },
    { id: 3, name: 'Outfit Master', description: 'Created 25 outfits', icon: Award, progress: 68, unlocked: false, color: '#000000' },
    { id: 4, name: 'Trendsetter', description: 'Got 100 outfit likes', icon: TrendingUp, progress: 45, unlocked: false, color: '#0A0A0A' },
    { id: 5, name: 'Eco Champion', description: 'Saved 100kg CO₂', icon: Flame, progress: 24, unlocked: false, color: '#48CD8A' },
    { id: 6, name: 'Community Star', description: 'Helped 10 users', icon: Star, progress: 30, unlocked: false, color: '#48CD8A' },
  ];

  const weeklyDigest = [
    { day: 'Mon', outfits: 2 },
    { day: 'Tue', outfits: 1 },
    { day: 'Wed', outfits: 3 },
    { day: 'Thu', outfits: 0 },
    { day: 'Fri', outfits: 2 },
    { day: 'Sat', outfits: 1 },
    { day: 'Sun', outfits: 2 },
  ];

  const unlockedBadges = badges.filter(b => b.unlocked).length;

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            ACHIEVEMENTS
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Track your style journey
        </p>
      </div>

      {/* Streak Hero */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 border-2 border-orange-700/30 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-8 h-8" strokeWidth={2.5} />
            <p className="font-black text-2xl">Streak</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-white/90 mb-1">CURRENT STREAK</p>
              <p className="text-5xl font-black">{streaks.current}</p>
              <p className="text-sm font-semibold text-white/90">days</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90 mb-1">LONGEST STREAK</p>
              <p className="text-5xl font-black">{streaks.longest}</p>
              <p className="text-sm font-semibold text-white/90">days</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/20 rounded-lg border-2 border-white/30">
            <p className="text-white/90 text-sm font-semibold text-center">
              Keep going! Create an outfit today to maintain your streak.
            </p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-black">BADGES</h3>
          <p className="text-white/60 text-xs font-semibold">
            {unlockedBadges}/{badges.length} unlocked
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 border-2 shadow-md ${
                badge.unlocked ? 'border-[#48CD8A]' : 'border-white/10'
              }`}
            >
              <div className="relative mb-3">
                <div
                  className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 ${
                    badge.unlocked ? 'border-[#48CD8A]' : 'border-[#F5F5F5]'
                  }`}
                  style={{ backgroundColor: badge.unlocked ? badge.color : '#F5F5F5' }}
                >
                  <badge.icon
                    className={`w-10 h-10 ${badge.unlocked ? 'text-white' : 'text-white/40'}`}
                    strokeWidth={2.5}
                  />
                </div>
                {!badge.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-20 h-20 -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="#F5F5F5"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke={badge.color}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - badge.progress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-white text-sm font-black text-center mb-1">{badge.name}</p>
              <p className="text-white/70 text-xs font-semibold text-center mb-2">
                {badge.description}
              </p>
              {!badge.unlocked && (
                <div className="bg-black rounded-lg p-2">
                  <p className="text-white text-xs font-bold text-center">{badge.progress}% Complete</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <h3 className="text-white text-sm font-black mb-4">WEEKLY ACTIVITY</h3>
          <div className="flex items-end justify-between gap-2 h-32 mb-4">
            {weeklyDigest.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-white/5 rounded-t-lg relative" style={{ height: '100%' }}>
                  {day.outfits > 0 && (
                    <div
                      className="w-full bg-[#48CD8A] rounded-t-lg absolute bottom-0 flex items-end justify-center pb-1"
                      style={{ height: `${(day.outfits / 3) * 100}%` }}
                    >
                      <span className="text-white text-xs font-black">{day.outfits}</span>
                    </div>
                  )}
                </div>
                <p className={`text-xs font-bold ${idx === 5 || idx === 6 ? 'text-[#48CD8A]' : 'text-white/60'}`}>
                  {day.day}
                </p>
              </div>
            ))}
          </div>
          <div className="p-3 bg-black rounded-lg">
            <p className="text-white text-sm font-semibold text-center">
              You created <span className="font-black">11 outfits</span> this week!
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="space-y-3">
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full bg-white text-black py-4 rounded-lg font-black uppercase text-sm hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" strokeWidth={3} />
            Share Progress
          </button>
          <button className="w-full bg-white text-black border-2 border-white/20 py-4 rounded-lg font-black uppercase text-sm hover:bg-black transition-colors flex items-center justify-center gap-2">
            <Gift className="w-5 h-5" strokeWidth={3} />
            Refer a Friend
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-sm w-full border-2 border-white/20">
            <h3 className="text-white text-xl font-black mb-4 text-center">SHARE YOUR PROGRESS</h3>
            <div className="bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-2xl p-6 mb-6 text-white text-center">
              <Flame className="w-12 h-12 mx-auto mb-3" strokeWidth={2.5} />
              <p className="text-3xl font-black mb-1">{streaks.current} Day Streak!</p>
              <p className="text-sm font-semibold">{unlockedBadges} Badges Unlocked</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 bg-white text-black border-2 border-white/20 py-3 rounded-lg font-black uppercase text-sm hover:bg-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 bg-white text-black py-3 rounded-lg font-black uppercase text-sm hover:bg-[#1A1A1A] transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
