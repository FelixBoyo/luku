import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, Check } from 'lucide-react';

export function OnboardingComplete() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Navigate to home after 3 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#48CD8A]/20 via-black to-[#3AB87A]/20 animate-pulse"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Success Icon */}
        <div className="w-32 h-32 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center shadow-2xl mb-8 border-4 border-white/20 relative">
          <Check className="w-16 h-16 text-black" strokeWidth={3} />
          <div className="absolute inset-0 rounded-full border-4 border-[#48CD8A] animate-ping opacity-75"></div>
        </div>

        {/* Title */}
        <h1 className="text-white text-5xl font-black tracking-tighter leading-none mb-4 text-center">
          ALL SET!
        </h1>

        {/* Description */}
        <p className="text-white/70 text-lg font-semibold text-center max-w-md mb-8 leading-relaxed">
          Your style profile is ready. We're curating personalized picks just for you.
        </p>

        {/* Features List */}
        <div className="space-y-4 mb-12">
          {[
            'AI-powered recommendations',
            'Personalized style matches',
            'Smart wardrobe tracking',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#48CD8A] rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
              <p className="text-white text-base font-semibold">{feature}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-white/60 text-sm font-semibold text-center">
            Loading your personalized feed...
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 opacity-30">
        <Sparkles className="w-8 h-8 text-[#48CD8A]" strokeWidth={2} />
      </div>
      <div className="absolute bottom-32 right-16 opacity-30">
        <Sparkles className="w-6 h-6 text-[#3AB87A]" strokeWidth={2} />
      </div>
      <div className="absolute top-1/3 right-8 opacity-30">
        <Sparkles className="w-10 h-10 text-[#48CD8A]" strokeWidth={2} />
      </div>
    </div>
  );
}
