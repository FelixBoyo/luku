import { useEffect } from 'react';
import { useNavigate } from 'react-router';
const BG = "https://images.unsplash.com/photo-1662532577856-e8ee8b138a8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

export function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/landing');
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="absolute inset-0" style={{ backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/80" />

      {/* Top masthead */}
      <div className="absolute top-0 left-0 right-0 px-5 pt-14">
        <h1
          className="text-[#F7F3EE] tracking-tighter select-none -ml-1"
          style={{ fontSize: 'clamp(5rem, 22vw, 9rem)', fontWeight: 900, lineHeight: 0.88 }}
        >
          LUKU
        </h1>
        <p className="text-[#F2B872] text-[10px] font-black uppercase tracking-[0.3em] mt-3 ml-1">
          Your Style. Your Wardrobe.
        </p>
      </div>

      {/* Bottom loading */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {[0, 160, 320].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                animationDelay: `${delay}ms`,
                backgroundColor: i === 1 ? '#48CD8A' : '#F2B872',
              }}
            />
          ))}
        </div>
        <p className="text-[#F7F3EE]/30 text-[10px] font-black uppercase tracking-[0.25em]">
          Style · Shop · Sustain
        </p>
      </div>
    </div>
  );
}
