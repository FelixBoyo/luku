import { useState } from 'react';
import { ChevronLeft, User, Upload, Sparkles, Heart, ShoppingBag, Camera, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { BottomNav } from './BottomNav';

type Mode = 'mannequin' | 'upload';

const wardrobeOutfits = [
  {
    id: 1,
    name: 'Casual Weekend',
    occasion: 'Brunch',
    items: [
      { name: 'Linen Blazer', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200' },
      { name: 'White Tee', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200' },
      { name: 'High-Waist Jeans', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200' },
      { name: 'Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' },
    ],
  },
  {
    id: 2,
    name: 'Office Professional',
    occasion: 'Meeting',
    items: [
      { name: 'Wool Trench', image: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=200' },
      { name: 'Tailored Trousers', image: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=200' },
      { name: 'Ankle Boots', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200' },
    ],
  },
  {
    id: 3,
    name: 'Date Night',
    occasion: 'Evening',
    items: [
      { name: 'Silk Blouse', image: 'https://images.unsplash.com/photo-1624206112431-23cbb5116b02?w=200' },
      { name: 'Leather Jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200' },
      { name: 'Heels', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200' },
    ],
  },
];

const bodyTypes = ['Petite', 'Slim', 'Athletic', 'Curvy', 'Plus Size'];
const skinTones = [
  { label: 'Fair', color: '#F5DEB3' },
  { label: 'Light', color: '#DEB887' },
  { label: 'Medium', color: '#C68642' },
  { label: 'Tan', color: '#A0522D' },
  { label: 'Deep', color: '#6B3A2A' },
];

export function VirtualTryOn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('mannequin');
  const [selectedOutfit, setSelectedOutfit] = useState<number>(1);
  const [selectedBodyType, setSelectedBodyType] = useState('Athletic');
  const [selectedSkinTone, setSelectedSkinTone] = useState('Medium');
  const [saved, setSaved] = useState(false);

  const activeOutfit = wardrobeOutfits.find(o => o.id === selectedOutfit)!;

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
        <h1 className="text-white text-base font-black uppercase tracking-widest">Virtual Try-On</h1>
        <button
          onClick={() => setSaved(s => !s)}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${saved ? 'bg-[#F2B872]/20 border-[#F2B872]/40' : 'border-white/10 bg-white/6'}`}
          style={{ background: saved ? undefined : 'rgba(255,255,255,0.06)' }}
        >
          <Heart className="w-4 h-4" strokeWidth={2.5} style={{ color: saved ? '#F2B872' : 'white', fill: saved ? '#F2B872' : 'none' }} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          {(['mannequin', 'upload'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-xs uppercase tracking-wide transition-all ${
                mode === m ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              {m === 'mannequin' ? <User className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Upload className="w-3.5 h-3.5" strokeWidth={2.5} />}
              {m === 'mannequin' ? 'Mannequin' : 'My Photo'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div className="px-5 pb-5">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {mode === 'mannequin' ? (
            <div className="relative">
              {/* Mannequin visualization */}
              <div className="aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden">
                {/* Gradient backdrop */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#8A48CD]/10 via-transparent to-black/40" />

                {/* Layered outfit preview — stacked item thumbnails on a silhouette */}
                <div className="relative z-10 flex flex-col items-center gap-0">
                  {/* Head/silhouette */}
                  <div className="w-14 h-14 rounded-full border-2 border-white/20 mb-1 overflow-hidden"
                    style={{ backgroundColor: skinTones.find(s => s.label === selectedSkinTone)?.color || '#C68642' }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white/40" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Outfit items stacked */}
                  <div className="flex gap-2 flex-wrap justify-center max-w-[240px] mt-3">
                    {activeOutfit.items.map((item, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <p className="absolute bottom-0 left-0 right-0 text-white text-[8px] font-bold text-center pb-1 truncate px-0.5">
                          {item.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#48CD8A]/20 border border-[#48CD8A]/30">
                  <Sparkles className="w-3 h-3 text-[#48CD8A]" strokeWidth={2.5} />
                  <span className="text-[#48CD8A] text-[10px] font-black uppercase tracking-wide">AI Preview</span>
                </div>

                {/* Outfit name */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                    <p className="text-white text-sm font-black">{activeOutfit.name}</p>
                    <p className="text-white/50 text-xs font-semibold">{activeOutfit.occasion} · {activeOutfit.items.length} pieces</p>
                  </div>
                </div>
              </div>

              {/* Body customisation */}
              <div className="p-4 border-t border-white/8" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3">Customise</p>
                <div className="space-y-3">
                  {/* Body type chips */}
                  <div>
                    <p className="text-white/40 text-[10px] font-semibold mb-2">Body Type</p>
                    <div className="flex gap-2 flex-wrap">
                      {bodyTypes.map(bt => (
                        <button
                          key={bt}
                          onClick={() => setSelectedBodyType(bt)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                            selectedBodyType === bt
                              ? 'bg-[#48CD8A] text-black'
                              : 'bg-white/8 text-white/60 border border-white/10 hover:bg-white/12'
                          }`}
                          style={{ background: selectedBodyType === bt ? undefined : 'rgba(255,255,255,0.05)' }}
                        >
                          {bt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skin tone dots */}
                  <div>
                    <p className="text-white/40 text-[10px] font-semibold mb-2">Skin Tone</p>
                    <div className="flex gap-3">
                      {skinTones.map(st => (
                        <button
                          key={st.label}
                          onClick={() => setSelectedSkinTone(st.label)}
                          className="relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                          style={{
                            backgroundColor: st.color,
                            borderColor: selectedSkinTone === st.label ? 'white' : 'transparent',
                          }}
                          title={st.label}
                        >
                          {selectedSkinTone === st.label && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow" strokeWidth={3} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Upload mode */
            <div className="aspect-[3/4] flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-16 h-16 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Camera className="w-8 h-8 text-white/40" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-white font-black mb-1">Upload Your Photo</p>
                <p className="text-white/40 text-sm font-semibold">See how outfits look on you</p>
              </div>
              <button className="px-6 py-3 bg-[#48CD8A] text-black rounded-xl font-black text-sm uppercase tracking-wide hover:bg-[#3AB87A] transition-colors">
                Choose Photo
              </button>
              <p className="text-white/25 text-xs font-semibold text-center max-w-[200px]">
                Photos are processed locally and never stored
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Outfit selector */}
      <div className="px-5 pb-5">
        <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3">Select Outfit</p>
        <div className="space-y-2">
          {wardrobeOutfits.map(outfit => (
            <button
              key={outfit.id}
              onClick={() => setSelectedOutfit(outfit.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                selectedOutfit === outfit.id
                  ? 'border-[#48CD8A]/40 bg-[#48CD8A]/8'
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={{ background: selectedOutfit === outfit.id ? 'rgba(72,205,138,0.06)' : 'rgba(255,255,255,0.03)' }}
            >
              {/* Item thumbnails */}
              <div className="flex -space-x-2">
                {outfit.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="w-9 h-9 rounded-lg overflow-hidden border-2 border-black flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {outfit.items.length > 3 && (
                  <div className="w-9 h-9 rounded-lg bg-white/10 border-2 border-black flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-black">+{outfit.items.length - 3}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-black truncate">{outfit.name}</p>
                <p className="text-white/40 text-xs font-semibold">{outfit.occasion} · {outfit.items.length} pieces</p>
              </div>

              {selectedOutfit === outfit.id && (
                <div className="w-5 h-5 rounded-full bg-[#48CD8A] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Shop missing items */}
      <div className="px-5 pb-6">
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Complete This Look</p>
            <Link to="/marketplace" className="text-[#F2B872] text-[10px] font-black uppercase tracking-wide">Shop All</Link>
          </div>
          <div className="flex gap-3">
            {[
              { name: 'Silk Scarf', price: 'KES 2,800', image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=200' },
              { name: 'Leather Bag', price: 'KES 9,500', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200' },
            ].map((item, i) => (
              <div key={i} className="flex-1 bg-black/40 rounded-xl overflow-hidden border border-white/10">
                <div className="aspect-square relative overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <button className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-[#F2B872] rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-white text-[11px] font-black truncate">{item.name}</p>
                  <p className="text-[#F2B872] text-[11px] font-black">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
