import { useState } from 'react';
import { ChevronLeft, Sparkles, Plus, ShoppingBag, X, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';

export function StylePlayground() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([
    { id: 1, name: 'Vintage x Modern', query: 'Vintage meets streetwear', image: '', timestamp: '2 hours ago' },
    { id: 2, name: 'Summer Vibes', query: 'Beachy summer aesthetic', image: '', timestamp: '1 day ago' },
  ]);
  const [showQueryDrawer, setShowQueryDrawer] = useState(false);
  const [intensity, setIntensity] = useState(50);

  const [queryParams, setQueryParams] = useState({
    style1: '',
    style2: '',
    colorPalette: '',
    occasion: '',
  });

  const styleOptions = ['Vintage', 'Modern', 'Streetwear', 'Bohemian', 'Minimalist', 'Elegant', 'Edgy'];
  const colorOptions = ['Earth Tones', 'Pastels', 'Monochrome', 'Bold & Bright', 'Neutrals'];
  const occasionOptions = ['Casual', 'Work', 'Date Night', 'Party', 'Travel'];

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black border-b-2 border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-black">
          <ChevronLeft className="w-6 h-6" strokeWidth={3} />
        </button>
        <h1 className="text-white text-xl font-black">STYLE PLAYGROUND</h1>
        <button onClick={() => setShowQueryDrawer(true)} className="p-2 bg-white text-black rounded-lg">
          <Plus className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>

      {/* Description */}
      <div className="px-6 pt-6 pb-4">
        <div className="bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-2xl p-6 border-2 border-white/20 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6" strokeWidth={2.5} />
            <p className="font-black text-lg">AI Style Generator</p>
          </div>
          <p className="font-semibold text-sm text-white/90">
            Experiment with style combinations and see AI-generated outfit visualizations
          </p>
        </div>
      </div>

      {/* Sessions */}
      <div className="px-6 pb-6">
        <h3 className="text-white text-sm font-black mb-4">YOUR SESSIONS</h3>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl border-2 border-white/20 shadow-md overflow-hidden">
              <div className="aspect-video bg-white/5 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-black/20" strokeWidth={2} />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-white text-lg font-black mb-1">{session.name}</p>
                    <p className="text-white/70 text-sm font-semibold mb-2">{session.query}</p>
                    <p className="text-white/40 text-xs font-semibold">{session.timestamp}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-white text-black py-3 rounded-lg font-black uppercase text-xs hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" strokeWidth={3} />
                    Regenerate
                  </button>
                  <button className="flex-1 bg-white text-black border-2 border-white/20 py-3 rounded-lg font-black uppercase text-xs hover:bg-black transition-colors flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" strokeWidth={3} />
                    Shop Look
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-black/20 mx-auto mb-4" strokeWidth={2} />
            <p className="text-white text-xl font-black mb-2">No Sessions Yet</p>
            <p className="text-white/60 text-sm font-semibold mb-6">
              Create your first AI-generated style
            </p>
            <button
              onClick={() => setShowQueryDrawer(true)}
              className="px-6 py-3 bg-white text-black rounded-lg font-black uppercase text-sm hover:bg-[#1A1A1A] transition-colors"
            >
              Start Creating
            </button>
          </div>
        )}
      </div>

      {/* Query Composer Drawer */}
      {showQueryDrawer && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-t-3xl border-t-2 border-white/20 max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b-2 border-white/10 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white text-xl font-black">CREATE STYLE</h3>
              <button onClick={() => setShowQueryDrawer(false)}>
                <X className="w-6 h-6 text-white/40" strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Style Fusion */}
              <div>
                <label className="text-white text-sm font-black mb-3 block">STYLE FUSION</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={queryParams.style1}
                    onChange={(e) => setQueryParams({ ...queryParams, style1: e.target.value })}
                    className="px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                  >
                    <option value="">Style 1</option>
                    {styleOptions.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                  <select
                    value={queryParams.style2}
                    onChange={(e) => setQueryParams({ ...queryParams, style2: e.target.value })}
                    className="px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                  >
                    <option value="">Style 2</option>
                    {styleOptions.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="text-white text-sm font-black mb-3 block">COLOR PALETTE</label>
                <div className="grid grid-cols-2 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setQueryParams({ ...queryParams, colorPalette: color })}
                      className={`px-4 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
                        queryParams.colorPalette === color
                          ? 'bg-white text-black border-white/20'
                          : 'bg-white text-black border-white/10 hover:bg-black'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div>
                <label className="text-white text-sm font-black mb-3 block">OCCASION</label>
                <div className="grid grid-cols-2 gap-2">
                  {occasionOptions.map((occasion) => (
                    <button
                      key={occasion}
                      onClick={() => setQueryParams({ ...queryParams, occasion })}
                      className={`px-4 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
                        queryParams.occasion === occasion
                          ? 'bg-white text-black border-white/20'
                          : 'bg-white text-black border-white/10 hover:bg-black'
                      }`}
                    >
                      {occasion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white text-sm font-black">STYLE INTENSITY</label>
                  <span className="text-white text-sm font-black">{intensity}%</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #48CD8A 0%, #48CD8A ${intensity}%, #F5F5F5 ${intensity}%, #F5F5F5 100%)`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/60 text-xs font-semibold">Subtle</span>
                  <span className="text-white/60 text-xs font-semibold">Bold</span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => setShowQueryDrawer(false)}
                className="w-full bg-white text-black py-4 rounded-lg font-black uppercase text-sm hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" strokeWidth={3} />
                Generate Style
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
