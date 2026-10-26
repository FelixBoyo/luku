import { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';

export function ColorHarmony() {
  const navigate = useNavigate();
  const [baseItem, setBaseItem] = useState<string | null>(null);
  const [harmonyType, setHarmonyType] = useState<'complementary' | 'analogous' | 'triadic' | 'monochromatic'>('complementary');
  const [showTheory, setShowTheory] = useState(false);

  const wardrobeItems = [
    { id: 1, name: 'Navy Blazer', color: '#8A48CD', category: 'Outerwear' },
    { id: 2, name: 'White Shirt', color: '#FFFFFF', category: 'Tops' },
    { id: 3, name: 'Black Jeans', color: '#1A1A1A', category: 'Bottoms' },
    { id: 4, name: 'Red Dress', color: '#C41E3A', category: 'Dresses' },
  ];

  const harmonyTypes = [
    { id: 'complementary', name: 'Complementary', description: 'Opposite colors on the wheel' },
    { id: 'analogous', name: 'Analogous', description: 'Adjacent colors' },
    { id: 'triadic', name: 'Triadic', description: 'Three evenly spaced colors' },
    { id: 'monochromatic', name: 'Monochromatic', description: 'Shades of one color' },
  ];

  const suggestedOutfits = [
    { id: 1, name: 'Classic Contrast', items: ['Navy Blazer', 'White Shirt', 'Black Jeans'] },
    { id: 2, name: 'Bold Statement', items: ['Red Dress', 'Navy Blazer', 'White Shoes'] },
    { id: 3, name: 'Neutral Elegance', items: ['White Shirt', 'Black Jeans', 'Beige Coat'] },
  ];

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="sticky top-0 z-10 bg-black border-b-2 border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-black">
          <ChevronLeft className="w-6 h-6" strokeWidth={3} />
        </button>
        <h1 className="text-white text-xl font-black">COLOR HARMONY</h1>
        <div className="w-6"></div>
      </div>

      <div className="px-6 pt-6 pb-4">
        <h3 className="text-white text-sm font-black mb-3">SELECT BASE ITEM</h3>
        <div className="grid grid-cols-2 gap-3">
          {wardrobeItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setBaseItem(item.name)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                baseItem === item.name
                  ? 'bg-white border-[#48CD8A] shadow-md'
                  : 'bg-white border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg border-2 border-white/20 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-black truncate">{item.name}</p>
                </div>
              </div>
              <p className="text-white/60 text-xs font-semibold">{item.category}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-4">
        <h3 className="text-white text-sm font-black mb-3">HARMONY TYPE</h3>
        <div className="grid grid-cols-2 gap-3">
          {harmonyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setHarmonyType(type.id as any)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                harmonyType === type.id
                  ? 'bg-white text-black border-white/20'
                  : 'bg-white text-black border-white/10 hover:bg-black'
              }`}
            >
              <p className="text-sm font-black mb-1">{type.name}</p>
              <p className={`text-xs font-semibold ${harmonyType === type.id ? 'text-white/80' : 'text-white/60'}`}>
                {type.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-4">
        <h3 className="text-white text-sm font-black mb-3">GENERATED PALETTE</h3>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="aspect-square bg-gradient-to-br from-[#8A48CD] to-[#8A48CD] rounded-xl border-2 border-white/20 mb-2"></div>
              <p className="text-white text-xs font-black text-center">Primary</p>
            </div>
            <div className="flex-1">
              <div className="aspect-square bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-xl border-2 border-white/20 mb-2"></div>
              <p className="text-white text-xs font-black text-center">Accent</p>
            </div>
            <div className="flex-1">
              <div className="aspect-square bg-gradient-to-br from-[#F5F5F5] to-[#FAFAFA] rounded-xl border-2 border-white/20 mb-2"></div>
              <p className="text-white text-xs font-black text-center">Neutral</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <button
          onClick={() => setShowTheory(!showTheory)}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/10 flex items-center justify-between hover:bg-black transition-colors"
        >
          <p className="text-white text-sm font-black">COLOR THEORY GUIDE</p>
          {showTheory ? (
            <ChevronUp className="w-5 h-5 text-black" strokeWidth={3} />
          ) : (
            <ChevronDown className="w-5 h-5 text-black" strokeWidth={3} />
          )}
        </button>
        {showTheory && (
          <div className="mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/10">
            <div className="space-y-3">
              <div>
                <p className="text-white text-sm font-black mb-1">Complementary</p>
                <p className="text-white/70 text-xs font-semibold leading-relaxed">
                  Colors opposite on the wheel create high contrast and vibrant looks.
                </p>
              </div>
              <div>
                <p className="text-white text-sm font-black mb-1">Analogous</p>
                <p className="text-white/70 text-xs font-semibold leading-relaxed">
                  Adjacent colors create harmonious, serene combinations.
                </p>
              </div>
              <div>
                <p className="text-white text-sm font-black mb-1">Triadic</p>
                <p className="text-white/70 text-xs font-semibold leading-relaxed">
                  Three evenly spaced colors offer balanced, vibrant palettes.
                </p>
              </div>
              <div>
                <p className="text-white text-sm font-black mb-1">Monochromatic</p>
                <p className="text-white/70 text-xs font-semibold leading-relaxed">
                  Different shades of one color create sophisticated, cohesive looks.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        <h3 className="text-white text-sm font-black mb-3">SUGGESTED OUTFITS</h3>
        <div className="space-y-3">
          {suggestedOutfits.map((outfit) => (
            <div key={outfit.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 shadow-md">
              <p className="text-white text-sm font-black mb-3">{outfit.name}</p>
              <div className="flex flex-wrap gap-2">
                {outfit.items.map((item, idx) => (
                  <span key={idx} className="px-3 py-1 bg-black border-2 border-white/10 rounded-lg text-white text-xs font-semibold">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
