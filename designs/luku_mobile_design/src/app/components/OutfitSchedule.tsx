import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


type ScheduledOutfit = {
  date: string;
  outfit: {
    name: string;
    imageUrl: string;
  };
};

const scheduledOutfits: ScheduledOutfit[] = [
  {
    date: '2026-05-22',
    outfit: {
      name: 'Bold & Confident',
      imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
    },
  },
  {
    date: '2026-05-24',
    outfit: {
      name: 'Effortless Elegance',
      imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    },
  },
];

export function OutfitSchedule() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1)); // May 2026

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getOutfitForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledOutfits.find((s) => s.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="w-8 h-8 text-[#48CD8A]" strokeWidth={2.5} />
          <h1 className="text-white text-5xl font-black tracking-tighter leading-none">
            SCHEDULE
          </h1>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Plan your outfits for the week ahead
        </p>
      </div>

      {/* Month Navigation */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <button
            onClick={goToPreviousMonth}
            className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
          <h2 className="text-white text-xl font-black uppercase tracking-wide">
            {monthName}
          </h2>
          <button
            onClick={goToNextMonth}
            className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 mb-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div
              key={idx}
              className="text-center text-white/50 text-xs font-black uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square"></div>
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const scheduledOutfit = getOutfitForDate(day);
            const isToday = day === 20; // May 20, 2026

            return (
              <div
                key={day}
                className={`aspect-square rounded-xl border transition-all ${
                  isToday
                    ? 'border-[#48CD8A] border-2'
                    : scheduledOutfit
                    ? 'border-white/40'
                    : 'border-white/10'
                } ${
                  scheduledOutfit ? 'bg-white/5' : 'bg-transparent'
                } hover:bg-white/10 cursor-pointer relative overflow-hidden group`}
              >
                {scheduledOutfit ? (
                  <>
                    <img
                      src={scheduledOutfit.outfit.imageUrl}
                      alt={scheduledOutfit.outfit.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute top-1 left-1 text-white text-xs font-black">
                      {day}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white/70 text-sm font-bold">{day}</span>
                    <Plus className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity mt-1" strokeWidth={2.5} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Outfits */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xs font-black uppercase tracking-widest">
            This Week
          </h2>
          <Link to="/stylist">
            <button className="text-[#48CD8A] text-xs font-black uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" strokeWidth={3} />
              Get Suggestions
            </button>
          </Link>
        </div>

        <div className="space-y-3">
          {scheduledOutfits.map((scheduled) => {
            const date = new Date(scheduled.date);
            const dayName = date.toLocaleDateString('default', { weekday: 'long' });
            const dayNum = date.getDate();

            return (
              <div
                key={scheduled.date}
                className="relative h-32 rounded-2xl overflow-hidden border border-white/20 shadow-lg"
              >
                <img
                  src={scheduled.outfit.imageUrl}
                  alt={scheduled.outfit.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
                <div className="absolute inset-0 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-xs font-black uppercase mb-1">
                      {dayName}, {dayNum}
                    </p>
                    <h3 className="text-white text-xl font-black">
                      {scheduled.outfit.name}
                    </h3>
                  </div>
                  <button className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/40 text-white text-xs font-black uppercase rounded-lg hover:bg-white/20 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {scheduledOutfits.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-white/40" strokeWidth={2} />
              </div>
              <p className="text-white text-lg font-black mb-2">No Outfits Scheduled</p>
              <p className="text-white/60 text-sm font-semibold mb-6">
                Plan your week and never wonder what to wear
              </p>
              <Link to="/stylist">
                <button className="px-6 py-3 bg-[#48CD8A] text-black font-black text-sm rounded-lg hover:bg-[#3AB87A] transition-colors uppercase tracking-wide">
                  Get AI Suggestions
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
