import { useState } from 'react';
import { Leaf, TrendingDown, Droplet, Recycle, Award, ChevronRight, ChevronLeft as ChevronLeftIcon } from 'lucide-react';
import { BottomNav } from './BottomNav';

export function Sustainability() {
  const [selectedMonth, setSelectedMonth] = useState(4); // May = index 4

  const stats = {
    co2Saved: 24,
    waterSaved: 1250,
    wearRatio: 3.2,
  };

  const monthlyData = [
    { month: 'Jan', co2: 18, water: 980 },
    { month: 'Feb', co2: 22, water: 1100 },
    { month: 'Mar', co2: 20, water: 1050 },
    { month: 'Apr', co2: 26, water: 1300 },
    { month: 'May', co2: 24, water: 1250 },
  ];

  const suggestedSwaps = [
    { id: 1, current: 'Fast Fashion T-Shirt', swap: 'Organic Cotton Tee', impact: '5kg CO₂ saved', image: '' },
    { id: 2, current: 'New Jeans', swap: 'Vintage Denim', impact: '15kg CO₂ saved', image: '' },
  ];

  const achievements = [
    { id: 1, name: 'Eco Warrior', description: '30 days of sustainable choices', icon: Award, unlocked: true },
    { id: 2, name: 'Water Saver', description: 'Saved 1000L of water', icon: Droplet, unlocked: true },
    { id: 3, name: 'Circular Champion', description: 'Resold 5 items', icon: Recycle, unlocked: false },
  ];

  const tips = [
    'Wash clothes in cold water to save energy',
    'Air dry instead of using a dryer',
    'Buy secondhand when possible',
    'Choose quality over quantity',
  ];

  const [currentTip, setCurrentTip] = useState(0);

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            SUSTAINABILITY
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-green-500 rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Your environmental impact
        </p>
      </div>

      {/* Hero Stats */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 border-2 border-green-700/30 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-6 h-6" strokeWidth={2.5} />
            <p className="font-black text-lg">This Month's Impact</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-black mb-1">{stats.co2Saved}kg</p>
              <p className="text-sm font-semibold text-white/90">CO₂ Saved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black mb-1">{stats.waterSaved}L</p>
              <p className="text-sm font-semibold text-white/90">Water Saved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black mb-1">{stats.wearRatio}x</p>
              <p className="text-sm font-semibold text-white/90">Wear Ratio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <h3 className="text-white text-sm font-black mb-4">MONTHLY TRENDS</h3>

          {/* Simple Bar Chart */}
          <div className="space-y-4 mb-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-xs font-black">CO₂ SAVED (kg)</p>
              </div>
              <div className="flex items-end gap-2 h-24">
                {monthlyData.map((data, idx) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-white/5 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-green-500 rounded-t-lg absolute bottom-0"
                        style={{ height: `${(data.co2 / 30) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-white/60 text-xs font-semibold">{data.month}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-xs font-black">WATER SAVED (L)</p>
              </div>
              <div className="flex items-end gap-2 h-24">
                {monthlyData.map((data, idx) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-white/5 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-blue-500 rounded-t-lg absolute bottom-0"
                        style={{ height: `${(data.water / 1500) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-white/60 text-xs font-semibold">{data.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Swaps */}
      <div className="px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-black">SUGGESTED SWAPS</h3>
            <button className="text-[#48CD8A] text-xs font-bold hover:text-black transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {suggestedSwaps.map((swap) => (
              <div key={swap.id} className="p-4 bg-black rounded-xl border-2 border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-white text-sm font-black mb-1">{swap.current}</p>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-green-600" strokeWidth={3} />
                      <p className="text-green-600 text-sm font-bold">{swap.swap}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                  <p className="text-green-600 text-xs font-bold">{swap.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eco Achievements */}
      <div className="px-6 pb-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 shadow-md">
          <h3 className="text-white text-sm font-black mb-4">ECO ACHIEVEMENTS</h3>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 ${
                  achievement.unlocked
                    ? 'bg-green-50 border-green-500/30'
                    : 'bg-black border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    achievement.unlocked ? 'bg-green-500' : 'bg-white/5'
                  }`}>
                    <achievement.icon className={`w-6 h-6 ${achievement.unlocked ? 'text-white' : 'text-white/40'}`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-black mb-1">{achievement.name}</p>
                    <p className="text-white/70 text-xs font-semibold">{achievement.description}</p>
                  </div>
                  {achievement.unlocked && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips Carousel */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-2xl p-6 border-2 border-white/20 text-white shadow-md">
          <h3 className="font-black text-sm mb-3">ECO TIP OF THE DAY</h3>
          <p className="font-semibold text-sm mb-4">{tips[currentTip]}</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentTip((currentTip - 1 + tips.length) % tips.length)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" strokeWidth={3} />
            </button>
            <div className="flex gap-2">
              {tips.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx === currentTip ? 'bg-white' : 'bg-white/40'}`}
                ></div>
              ))}
            </div>
            <button
              onClick={() => setCurrentTip((currentTip + 1) % tips.length)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
