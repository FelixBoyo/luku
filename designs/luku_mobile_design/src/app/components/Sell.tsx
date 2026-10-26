import { useState } from 'react';
import { Upload, Camera, Tag, ChevronDown } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


const conditions = [
  { label: 'New / Never Worn', desc: 'Tags still on, unused' },
  { label: 'Gently Used', desc: 'Worn a few times, like new' },
  { label: 'Used', desc: 'Regular wear, minor signs' },
  { label: 'Very Worn', desc: 'Visible wear and tear' },
  { label: 'Not Specified', desc: '' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export function Sell() {
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [photoCount, setPhotoCount] = useState(0);

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <h1 className="text-white text-4xl font-black tracking-tighter leading-none mb-1">LIST AN ITEM</h1>
        <p className="text-white/50 text-sm font-semibold">Reach thousands of buyers on Luku</p>
      </div>

      <div className="px-6 pt-6 space-y-6">

        {/* Photo Upload */}
        <div>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3">Photos</p>
          <div className="grid grid-cols-4 gap-2">
            {/* Main upload zone */}
            <div
              onClick={() => setPhotoCount(c => Math.min(c + 1, 3))}
              className="col-span-2 row-span-2 aspect-square bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/8 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <Upload className="w-5 h-5 text-white/50" strokeWidth={2} />
              </div>
              <p className="text-white/60 text-xs font-black text-center">Add Cover Photo</p>
            </div>
            {/* Extra slots */}
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="aspect-square bg-white/4 border border-dashed border-white/15 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/8 transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <Camera className="w-5 h-5 text-white/25" strokeWidth={1.5} />
              </div>
            ))}
          </div>
          <p className="text-white/30 text-[10px] font-semibold mt-2">Add up to 8 photos · First photo is the cover</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8" />

        {/* Item Details */}
        <div>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-4">Item Details</p>
          <div className="space-y-4">

            <div>
              <label className="text-white/70 text-xs font-black mb-2 block uppercase tracking-wide">Title</label>
              <input
                type="text"
                placeholder="e.g., Vintage Leather Jacket"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-white/30 focus:outline-none focus:border-[#48CD8A] transition-colors"
              />
            </div>

            <div>
              <label className="text-white/70 text-xs font-black mb-2 block uppercase tracking-wide">Designer / Brand</label>
              <input
                type="text"
                placeholder="e.g., Zara, Gucci, No Brand"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-white/30 focus:outline-none focus:border-[#48CD8A] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-xs font-black mb-2 block uppercase tracking-wide">Category</label>
                <div className="relative">
                  <select className="w-full appearance-none px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:border-[#48CD8A] transition-colors pr-10">
                    <option value="" className="bg-black">Select</option>
                    <option className="bg-black">Tops</option>
                    <option className="bg-black">Bottoms</option>
                    <option className="bg-black">Outerwear</option>
                    <option className="bg-black">Dresses</option>
                    <option className="bg-black">Shoes</option>
                    <option className="bg-black">Accessories</option>
                    <option className="bg-black">Bags</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <label className="text-white/70 text-xs font-black mb-2 block uppercase tracking-wide">Price (KES)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-white/30 focus:outline-none focus:border-[#48CD8A] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-xs font-black mb-3 block uppercase tracking-wide">Size</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all border ${
                      selectedSize === s
                        ? 'bg-[#48CD8A] border-[#48CD8A] text-black'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-white/70 text-xs font-black mb-2 block uppercase tracking-wide">Description</label>
              <textarea
                placeholder="Describe the item — measurements, fabric, any flaws..."
                rows={3}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-white/30 focus:outline-none focus:border-[#48CD8A] transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8" />

        {/* Condition */}
        <div>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3">Condition</p>
          <div className="space-y-2">
            {conditions.map(c => (
              <button
                key={c.label}
                onClick={() => setSelectedCondition(c.label)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left ${
                  selectedCondition === c.label
                    ? 'border-[#48CD8A] bg-[#48CD8A]/8'
                    : 'border-white/10 bg-white/4 hover:bg-white/8'
                }`}
                style={{ background: selectedCondition === c.label ? 'rgba(72,205,138,0.07)' : 'rgba(255,255,255,0.03)' }}
              >
                <div>
                  <p className={`text-sm font-black ${selectedCondition === c.label ? 'text-[#48CD8A]' : 'text-white'}`}>
                    {c.label}
                  </p>
                  {c.desc && <p className="text-white/40 text-xs font-semibold mt-0.5">{c.desc}</p>}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selectedCondition === c.label ? 'border-[#48CD8A]' : 'border-white/20'
                }`}>
                  {selectedCondition === c.label && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#48CD8A]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          <button className="flex-1 py-4 bg-white/8 border border-white/10 rounded-xl text-white font-black uppercase tracking-wide hover:bg-white/15 transition-colors text-sm"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            Save Draft
          </button>
          <button className="flex-1 py-4 bg-[#48CD8A] rounded-xl text-black font-black uppercase tracking-wide hover:bg-[#3AB87A] transition-colors flex items-center justify-center gap-2 text-sm">
            <Tag className="w-4 h-4" strokeWidth={2.5} />
            List Item
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
