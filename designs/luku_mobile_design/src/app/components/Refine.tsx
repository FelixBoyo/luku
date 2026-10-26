import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import svgPaths from "../../imports/svg-rkai03z4co";

export function Refine() {
  const [styleValue, setStyleValue] = useState(50);
  const [selectedMood, setSelectedMood] = useState<string>('Minimal');

  const moods = ['Minimal', 'Bold', 'Street', 'Elegant'];

  // Determine outfit based on style slider
  const getOutfitStyle = () => {
    if (styleValue < 33) return 'casual';
    if (styleValue < 67) return 'smart-casual';
    return 'formal';
  };

  const outfitStyle = getOutfitStyle();

  return (
    <div 
      className="min-h-screen w-full bg-black overflow-auto pb-8"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header - No navbar as it's part of outfit detail flow */}
      <div className="px-5 pt-6 pb-4">
        <Link to="/">
          <button className="text-white flex items-center gap-2 font-bold">
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
            <span>Back to Outfit</span>
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="px-5 pb-24">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            Refine Your Look
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Adjust style and mood to personalize
          </p>
        </div>

        {/* Outfit Preview */}
        <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/10">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Main item - Coat */}
            <div className="col-span-2 row-span-2">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
                <img
                  src="https://images.unsplash.com/photo-1746972465439-9659007c7ae2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHRyZW5jaCUyMGNvYXQlMjBtYW5uZXF1aW58ZW58MXx8fHwxNzc2MTk4ODI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Coat"
                  className="w-full h-full object-cover"
                />
                {/* Favorite button */}
                <button className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 18 18">
                    <path 
                      clipRule="evenodd" 
                      d={svgPaths.p4df3400} 
                      fill="black" 
                      fillRule="evenodd" 
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* Sweater */}
            <div className="aspect-square">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
                <img
                  src="https://images.unsplash.com/photo-1750390200293-92d5a788d3a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW4lMjBzd2VhdGVyJTIwa25pdHdlYXIlMjBtaW5pbWFsfGVufDF8fHx8MTc3NjE5ODgyNXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Top"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Boots */}
            <div className="aspect-square">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
                <img
                  src="https://images.unsplash.com/photo-1666374554013-bf9a3c00f39b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGxlYXRoZXIlMjBib290cyUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NzYxOTg4MjV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Boots"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Style indicator */}
          <div className="text-center">
            <span className="inline-block bg-[#48CD8A] text-black px-4 py-1.5 rounded-full text-sm font-semibold">
              {outfitStyle === 'casual' && 'Casual Style'}
              {outfitStyle === 'smart-casual' && 'Smart Casual'}
              {outfitStyle === 'formal' && 'Formal Style'}
            </span>
          </div>
        </div>

        {/* Controls Section */}
        <div className="mb-8">
          {/* Style Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <label className="text-white font-semibold text-base">
                Style
              </label>
              <div className="flex gap-2 text-xs text-white/60">
                <span className={styleValue < 50 ? 'font-semibold text-black' : ''}>
                  Casual
                </span>
                <span>→</span>
                <span className={styleValue >= 50 ? 'font-semibold text-black' : ''}>
                  Formal
                </span>
              </div>
            </div>
            
            {/* Custom Slider */}
            <div className="relative h-2 bg-[#E6D8C7] rounded-full">
              <div 
                className="absolute h-full bg-[#48CD8A] rounded-full transition-all duration-300"
                style={{ width: `${styleValue}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={styleValue}
                onChange={(e) => setStyleValue(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-[#48CD8A] border-4 border-[#FAFAFA] rounded-full shadow-lg transition-all duration-300"
                style={{ left: `calc(${styleValue}% - 12px)` }}
              />
            </div>
          </div>

          {/* Mood Chips */}
          <div>
            <label className="text-white font-semibold text-base block mb-3">
              Mood
            </label>
            <div className="flex flex-wrap gap-2.5">
              {moods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`
                    px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200
                    ${
                      selectedMood === mood
                        ? 'bg-[#48CD8A] text-black shadow-md'
                        : 'bg-[#E6D8C7] text-white/70 hover:bg-[#E6D8C7]/80'
                    }
                  `}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Elevate This Version Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[#48CD8A] font-semibold text-lg">
              Elevate this version
            </h2>
          </div>
          
          {/* Suggested Items */}
          <div className="grid grid-cols-2 gap-3">
            {/* Item 1 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-sm border border-white/5">
              <div className="aspect-square relative">
                <img
                  src="https://images.unsplash.com/photo-1665832102613-5b94286ec041?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGxlYXRoZXIlMjBoYW5kYmFnJTIwbWluaW1hbCUyMGJlaWdlfGVufDF8fHx8MTc3NjE5ODgyOHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Leather Bag"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-white font-semibold text-sm mb-1">
                  Leather Bag
                </h3>
                <p className="text-white/60 text-xs mb-2">
                  Completes the look
                </p>
                <p className="text-white font-semibold text-sm">$85</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-sm border border-white/5">
              <div className="aspect-square relative">
                <img
                  src="https://images.unsplash.com/photo-1630300236870-c9480cfa7856?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lbCUyMGJsYXplciUyMGphY2tldCUyMG5ldXRyYWx8ZW58MXx8fHwxNzc2MTk4ODI4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Blazer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-white font-semibold text-sm mb-1">
                  Structured Blazer
                </h3>
                <p className="text-white/60 text-xs mb-2">
                  Adds refinement
                </p>
                <p className="text-white font-semibold text-sm">$145</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button className="w-full bg-white text-black font-bold text-lg py-5 rounded-xl shadow-xl hover:bg-[#1A1A1A] transition-colors">
          Apply Changes
        </button>
      </div>
    </div>
  );
}