import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Tag, Trash2, X, Edit2, Heart, ArrowRightLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { BottomNav } from './BottomNav';

const wardrobeItems = [
  {
    id: 1,
    name: 'Wool Coat',
    category: 'Outerwear',
    brand: 'Massimo Dutti',
    purchasePrice: 18500,
    timesWorn: 12,
    dateAdded: 'Jan 15, 2024',
    condition: 'Gently Used',
    size: 'M',
    color: 'Camel',
    images: [
      'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=800',
      'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    ],
  },
  {
    id: 2,
    name: 'Cashmere Sweater',
    category: 'Tops',
    brand: 'COS',
    purchasePrice: 9800,
    timesWorn: 24,
    dateAdded: 'Mar 3, 2024',
    condition: 'Gently Used',
    size: 'S',
    color: 'Cream',
    images: [
      'https://images.unsplash.com/photo-1750390200293-92d5a788d3a2?w=800',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
    ],
  },
  {
    id: 3,
    name: 'Cotton T-Shirt',
    category: 'Tops',
    brand: 'Uniqlo',
    purchasePrice: 1500,
    timesWorn: 36,
    dateAdded: 'Apr 10, 2024',
    condition: 'Used',
    size: 'M',
    color: 'White',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    ],
  },
  {
    id: 4,
    name: 'Linen Shirt',
    category: 'Tops',
    brand: 'Zara',
    purchasePrice: 3200,
    timesWorn: 18,
    dateAdded: 'May 1, 2024',
    condition: 'New / Never Worn',
    size: 'L',
    color: 'Light Blue',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
      'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=800',
    ],
  },
  {
    id: 5,
    name: 'Tailored Trousers',
    category: 'Bottoms',
    brand: 'H&M',
    purchasePrice: 4500,
    timesWorn: 15,
    dateAdded: 'Feb 20, 2024',
    condition: 'Gently Used',
    size: 'M',
    color: 'Black',
    images: [
      'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=800',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    ],
  },
  {
    id: 6,
    name: 'Leather Shoes',
    category: 'Shoes',
    brand: 'Clarks',
    purchasePrice: 8900,
    timesWorn: 20,
    dateAdded: 'Dec 5, 2023',
    condition: 'Used',
    size: '42',
    color: 'Dark Brown',
    images: [
      'https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?w=800',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    ],
  },
];

const outfitsUsingItem = [
  { id: 1, name: 'Casual Weekend', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=300' },
  { id: 2, name: 'Night Out', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300' },
  { id: 3, name: 'Date Night', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300' },
];

const wearHistory = [
  { date: 'May 15, 2024', occasion: 'Dinner with friends' },
  { date: 'May 10, 2024', occasion: 'Coffee meeting' },
  { date: 'May 5, 2024', occasion: 'Weekend brunch' },
  { date: 'Apr 28, 2024', occasion: 'Concert' },
];

export function WardrobeItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [liked, setLiked] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [editForm, setEditForm] = useState({ name: '', brand: '', color: '', size: '', condition: '', purchasePrice: '' });

  // Image carousel swipe
  const imgTouchStartX = useRef<number | null>(null);

  const currentIndex = wardrobeItems.findIndex(i => i.id === Number(id));
  const item = currentIndex >= 0 ? wardrobeItems[currentIndex] : wardrobeItems[0];
  const prevItem = currentIndex > 0 ? wardrobeItems[currentIndex - 1] : null;
  const nextItem = currentIndex < wardrobeItems.length - 1 ? wardrobeItems[currentIndex + 1] : null;

  const goTo = (targetId: number) => {
    setActiveImageIndex(0);
    navigate(`/wardrobe-item/${targetId}`);
  };

  const handleImgTouchStart = (e: React.TouchEvent) => {
    imgTouchStartX.current = e.touches[0].clientX;
  };

  const handleImgTouchEnd = (e: React.TouchEvent) => {
    if (imgTouchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - imgTouchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0 && activeImageIndex < item.images.length - 1) {
        setActiveImageIndex(i => i + 1);
      } else if (dx > 0 && activeImageIndex > 0) {
        setActiveImageIndex(i => i - 1);
      }
    }
    imgTouchStartX.current = null;
  };

  const costPerWear = item.purchasePrice / (item.timesWorn || 1);

  const openEdit = () => {
    setEditForm({
      name: item.name,
      brand: item.brand,
      color: item.color,
      size: item.size,
      condition: item.condition,
      purchasePrice: String(item.purchasePrice),
    });
    setShowEditSheet(true);
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>

        {/* Item counter */}
        <div className="text-center">
          <p className="text-white text-sm font-black">{item.name}</p>
          <p className="text-white/40 text-[10px] font-semibold">
            {currentIndex + 1} / {wardrobeItems.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked(l => !l)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: liked ? 'rgba(242,184,114,0.15)' : 'rgba(255,255,255,0.06)', border: liked ? '1px solid rgba(242,184,114,0.3)' : '1px solid rgba(255,255,255,0.1)' }}
          >
            <Heart className="w-4 h-4" strokeWidth={2.5} style={{ color: liked ? '#F2B872' : 'white', fill: liked ? '#F2B872' : 'none' }} />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Trash2 className="w-4 h-4 text-red-400" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Hero image carousel */}
      <div className="relative">
        <div
          className="aspect-[3/4] overflow-hidden"
          onTouchStart={handleImgTouchStart}
          onTouchEnd={handleImgTouchEnd}
        >
          <img
            key={activeImageIndex}
            src={item.images[activeImageIndex]}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Item prev/next arrows */}
        {prevItem && (
          <button
            onClick={() => goTo(prevItem.id)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        )}
        {nextItem && (
          <button
            onClick={() => goTo(nextItem.id)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        )}

        {/* Category badge */}
        <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg">
          <p className="text-white text-[10px] font-black uppercase tracking-wide">{item.category}</p>
        </div>

        {/* Image dots — only show when item has multiple photos */}
        {item.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {item.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`rounded-full transition-all ${i === activeImageIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip — only when item has multiple photos */}
      {item.images.length > 1 && (
        <div className="flex gap-2 px-5 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {item.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImageIndex(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImageIndex ? 'border-[#48CD8A]' : 'border-white/10 opacity-50'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-5 pt-5 space-y-4">

        {/* Title + details */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-white text-xl font-black leading-tight">{item.name}</h2>
              <p className="text-white/50 text-sm font-semibold mt-0.5">{item.brand} · {item.color}</p>
            </div>
            <button onClick={openEdit} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Edit2 className="w-3.5 h-3.5 text-white/50" strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[item.size, item.condition, `Added ${item.dateAdded}`].map((tag, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-white/60 text-[10px] font-black" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Times Worn', value: item.timesWorn, small: false },
            { label: 'Purchase Price', value: `KES ${item.purchasePrice.toLocaleString()}`, small: true },
            { label: 'Cost Per Wear', value: `KES ${costPerWear.toFixed(0)}`, small: true },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className={`text-white font-black mb-0.5 ${stat.small ? 'text-sm' : 'text-2xl'}`}>{stat.value}</p>
              <p className="text-white/40 text-[10px] font-semibold leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/virtual-try-on" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#8A48CD]/30 text-[#8A48CD] text-xs font-black uppercase tracking-wide" style={{ background: 'rgba(138,72,205,0.08)' }}>
            <Calendar className="w-4 h-4" strokeWidth={2.5} />
            Try On
          </Link>
          <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#F2B872]/30 text-[#F2B872] text-xs font-black uppercase tracking-wide" style={{ background: 'rgba(242,184,114,0.08)' }}>
            <ArrowRightLeft className="w-4 h-4" strokeWidth={2.5} />
            List for Sale
          </button>
        </div>

        {/* Outfits using this item */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3">
            In {outfitsUsingItem.length} Outfits
          </p>
          <div className="grid grid-cols-3 gap-2">
            {outfitsUsingItem.map((outfit) => (
              <Link key={outfit.id} to={`/outfit/${outfit.id}`}>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10">
                  <img src={outfit.image} alt={outfit.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-0 left-0 right-0 p-2 text-white text-[9px] font-black leading-tight">{outfit.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Wear history */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-2">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3">Wear History</p>
          <div className="space-y-3">
            {wearHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3 pb-3 border-b border-white/8 last:border-0 last:pb-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#48CD8A] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white text-xs font-black">{entry.date}</p>
                  <p className="text-white/50 text-[10px] font-semibold">{entry.occasion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      {showEditSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditSheet(false)} />
          <div className="relative bg-[#0A0A0A] border-t border-white/10 rounded-t-3xl px-6 pt-5 pb-10 max-h-[85vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-base font-black uppercase tracking-wide">Edit Item</h2>
              <button onClick={() => setShowEditSheet(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X className="w-4 h-4 text-white/50" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Item Name', key: 'name', placeholder: 'e.g. Wool Coat' },
                { label: 'Designer / Brand', key: 'brand', placeholder: 'e.g. Zara, Gucci' },
                { label: 'Colour', key: 'color', placeholder: 'e.g. Camel, Black' },
                { label: 'Purchase Price (KES)', key: 'purchasePrice', placeholder: '0', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2 block">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={editForm[field.key as keyof typeof editForm]}
                    onChange={e => setEditForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-white/25 focus:outline-none focus:border-[#48CD8A] transition-colors"
                  />
                </div>
              ))}

              {/* Size chips */}
              <div>
                <label className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3 block">Size</label>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'].map(s => (
                    <button
                      key={s}
                      onClick={() => setEditForm(p => ({ ...p, size: s }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${editForm.size === s ? 'bg-[#48CD8A] border-[#48CD8A] text-black' : 'bg-white/5 border-white/10 text-white/50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3 block">Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {['New / Never Worn', 'Gently Used', 'Used', 'Very Worn'].map(c => (
                    <button
                      key={c}
                      onClick={() => setEditForm(p => ({ ...p, condition: c }))}
                      className={`px-3 py-2.5 rounded-xl text-xs font-black border transition-all text-left ${editForm.condition === c ? 'border-[#48CD8A] text-[#48CD8A]' : 'border-white/10 text-white/50'}`}
                      style={{ background: editForm.condition === c ? 'rgba(72,205,138,0.08)' : 'rgba(255,255,255,0.03)' }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowEditSheet(false)}
                className="w-full py-4 bg-[#48CD8A] rounded-xl text-black font-black uppercase tracking-wide text-sm mt-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-base font-black uppercase tracking-wide">Remove Item?</h3>
              <button onClick={() => setShowDeleteModal(false)}>
                <X className="w-5 h-5 text-white/40" strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-white/60 text-sm font-semibold mb-5">
              This item is used in {outfitsUsingItem.length} outfits. Removing it will also update those outfits.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-white/8 border border-white/10 rounded-xl text-white font-black text-sm uppercase"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/me')}
                className="flex-1 py-3 bg-red-500/80 border border-red-500/30 rounded-xl text-white font-black text-sm uppercase"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
