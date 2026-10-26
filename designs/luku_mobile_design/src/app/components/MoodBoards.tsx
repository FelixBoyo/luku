import { useState } from 'react';
import { Plus, Grid3x3, Users, Lock, Share2, Heart, MoreVertical, Pin } from 'lucide-react';
import { BottomNav } from './BottomNav';

type MoodBoard = {
  id: number;
  name: string;
  images: string[];
  isCollaborative: boolean;
  collaborators?: number;
  saves: number;
  isPrivate: boolean;
};

const moodBoards: MoodBoard[] = [
  {
    id: 1,
    name: 'MINIMAL_EARTH',
    images: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
      'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    ],
    isCollaborative: true,
    collaborators: 3,
    saves: 24,
    isPrivate: false,
  },
  {
    id: 2,
    name: 'SUMMER_LAYERS',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400',
    ],
    isCollaborative: false,
    saves: 12,
    isPrivate: true,
  },
];

export function MoodBoards() {
  const [activeTab, setActiveTab] = useState('My Boards');
  const tabs = ['My Boards', 'Shared', 'Saved'];

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4 sticky top-0 bg-black z-10">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            MOOD_BOARDS
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md">
            <p className="text-white/70 text-xs font-black uppercase tracking-wider">
              BOARDS
            </p>
            <p className="text-white text-2xl font-black">{moodBoards.length}</p>
          </div>
          <div className="bg-[#48CD8A] rounded-xl p-3 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md">
            <p className="text-white/70 text-xs font-black uppercase tracking-wider">
              COLLAB
            </p>
            <p className="text-white text-2xl font-black">3</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md">
            <p className="text-white/70 text-xs font-black uppercase tracking-wider">
              SAVES
            </p>
            <p className="text-white text-2xl font-black">36</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg font-black text-sm whitespace-nowrap transition-all shadow-md ${
                activeTab === tab
                  ? 'bg-white text-black border-2 border-white/20'
                  : 'bg-white text-black border-2 border-white/20 hover:bg-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Mood Boards Grid */}
      <div className="px-6 space-y-6">
        {moodBoards.map((board) => (
          <div
            key={board.id}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 shadow-lg"
          >
            {/* Board Header */}
            <div className="p-4 border-b-2 border-white/5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white text-lg font-black uppercase tracking-wide">
                  {board.name}
                </h3>
                <button className="text-white/60 hover:text-black">
                  <MoreVertical className="w-5 h-5" strokeWidth={3} />
                </button>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm">
                {board.isCollaborative && (
                  <div className="flex items-center gap-1 text-[#48CD8A]">
                    <Users className="w-4 h-4" strokeWidth={3} />
                    <span className="font-black">{board.collaborators}</span>
                  </div>
                )}
                {board.isPrivate && (
                  <div className="flex items-center gap-1 text-white/60">
                    <Lock className="w-4 h-4" strokeWidth={3} />
                  </div>
                )}
                <div className="flex items-center gap-1 text-white/60">
                  <Heart className="w-4 h-4" strokeWidth={3} />
                  <span className="font-black">{board.saves}</span>
                </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-2 p-2">
              {board.images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square bg-white/5 rounded-lg overflow-hidden relative group"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pin className="w-4 h-4 text-white drop-shadow-lg" strokeWidth={3} />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t-2 border-white/5">
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-black hover:bg-white/5 rounded-lg font-black text-sm text-black transition-colors border-2 border-white/10">
                  EDIT
                </button>
                <button className="flex-1 py-3 bg-black hover:bg-[#1A1A1A] text-white rounded-lg font-black text-sm transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" strokeWidth={3} />
                  SHARE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <button
        className="fixed bottom-28 right-6 w-16 h-16 bg-[#48CD8A] text-black rounded-full shadow-2xl hover:bg-[#3AB87A] transition-all flex items-center justify-center z-20 hover:scale-110 border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20"
        aria-label="Create new mood board"
      >
        <Plus className="w-8 h-8" strokeWidth={4} />
      </button>

      <BottomNav />
    </div>
  );
}
