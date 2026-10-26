import { useState } from 'react';
import { ChevronLeft, Plus, Calendar, MapPin, CheckCircle2, Circle, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';

export function TripPlanner() {
  const navigate = useNavigate();
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [packedItems, setPackedItems] = useState<number[]>([]);

  const trips = [
    { id: 1, name: 'Paris Weekend', destination: 'Paris, France', startDate: 'May 25', endDate: 'May 28', days: 4 },
    { id: 2, name: 'Beach Vacation', destination: 'Bali, Indonesia', startDate: 'Jun 10', endDate: 'Jun 17', days: 8 },
  ];

  const tripDays = [
    { day: 1, date: 'May 25', outfitName: 'Travel Comfort', items: ['Jeans', 'T-Shirt', 'Sneakers'] },
    { day: 2, date: 'May 26', outfitName: 'City Explorer', items: ['Dress', 'Sandals', 'Sun Hat'] },
    { day: 3, date: 'May 27', outfitName: 'Dinner Date', items: ['Blazer', 'Blouse', 'Heels'] },
    { day: 4, date: 'May 28', outfitName: 'Travel Home', items: ['Jeans', 'Sweater', 'Sneakers'] },
  ];

  const packingList = [
    { id: 1, item: 'Blue Jeans', category: 'Bottoms' },
    { id: 2, item: 'White T-Shirt', category: 'Tops' },
    { id: 3, item: 'Summer Dress', category: 'Dresses' },
    { id: 4, item: 'Black Blazer', category: 'Outerwear' },
    { id: 5, item: 'Sneakers', category: 'Shoes' },
    { id: 6, item: 'Sandals', category: 'Shoes' },
    { id: 7, item: 'Heels', category: 'Shoes' },
  ];

  const togglePacked = (id: number) => {
    setPackedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (selectedTrip) {
    const trip = trips.find(t => t.id === selectedTrip);
    if (!trip) return null;

    return (
      <div
        className="min-h-screen w-full bg-black overflow-auto pb-24"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div className="sticky top-0 z-10 bg-black border-b-2 border-white/10 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSelectedTrip(null)} className="flex items-center gap-2 text-black">
            <ChevronLeft className="w-6 h-6" strokeWidth={3} />
          </button>
          <h1 className="text-white text-xl font-black">{trip.name}</h1>
          <div className="w-6"></div>
        </div>

        <div className="px-6 pt-6 pb-4">
          <div className="bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-2xl p-6 border-2 border-white/20 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5" strokeWidth={2.5} />
              <p className="font-black text-lg">{trip.destination}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" strokeWidth={2.5} />
              <p className="font-semibold text-sm">{trip.startDate} - {trip.endDate} ({trip.days} days)</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-white text-sm font-black mb-4">DAY-BY-DAY OUTFITS</h3>
          <div className="space-y-3">
            {tripDays.map((day) => (
              <div key={day.day} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 border-2 border-white/20 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white text-sm font-black">Day {day.day} · {day.date}</p>
                    <p className="text-white/70 text-xs font-semibold">{day.outfitName}</p>
                  </div>
                  <button className="text-[#48CD8A] text-xs font-bold hover:text-black transition-colors">
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {day.items.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-black border-2 border-white/10 rounded-lg text-white text-xs font-semibold">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-black">PACKING LIST</h3>
            <p className="text-white/60 text-xs font-semibold">
              {packedItems.length}/{packingList.length} packed
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 border-2 border-white/20 shadow-md">
            <div className="space-y-2">
              {packingList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => togglePacked(item.id)}
                  className="w-full flex items-center gap-3 p-3 bg-black rounded-lg hover:bg-white/5 transition-colors"
                >
                  {packedItems.includes(item.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" strokeWidth={2.5} />
                  ) : (
                    <Circle className="w-5 h-5 text-white/40 flex-shrink-0" strokeWidth={2.5} />
                  )}
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-bold ${packedItems.includes(item.id) ? 'text-white/60 line-through' : 'text-black'}`}>
                      {item.item}
                    </p>
                    <p className="text-white/60 text-xs font-semibold">{item.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-block">
            <h1 className="text-white text-4xl font-black tracking-tight relative">
              TRIP PLANNER
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
            </h1>
          </div>
          <button
            onClick={() => setShowNewTrip(true)}
            className="p-3 bg-white text-black rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <Plus className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Plan outfits for your trips
        </p>
      </div>

      <div className="px-6 pb-6">
        <div className="space-y-4">
          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => setSelectedTrip(trip.id)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md hover:border-[#48CD8A] transition-colors text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white text-xl font-black">{trip.name}</h3>
                <span className="px-3 py-1 bg-[#48CD8A]/20 rounded-lg border-2 border-white/10 text-white text-xs font-black">
                  {trip.days} DAYS
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-white/60" strokeWidth={2.5} />
                <p className="text-white/70 text-sm font-semibold">{trip.destination}</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/60" strokeWidth={2.5} />
                <p className="text-white/70 text-sm font-semibold">{trip.startDate} - {trip.endDate}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showNewTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-sm w-full border-2 border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-black">NEW TRIP</h3>
              <button onClick={() => setShowNewTrip(false)}>
                <X className="w-6 h-6 text-white/40" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-black mb-2 block">TRIP NAME</label>
                <input
                  type="text"
                  placeholder="Summer Vacation"
                  className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-white text-sm font-black mb-2 block">DESTINATION</label>
                <input
                  type="text"
                  placeholder="Paris, France"
                  className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white text-sm font-black mb-2 block">START DATE</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-black mb-2 block">END DATE</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                  />
                </div>
              </div>

              <button className="w-full bg-white text-black py-4 rounded-lg font-black uppercase text-sm hover:bg-[#1A1A1A] transition-colors">
                Create Trip
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
