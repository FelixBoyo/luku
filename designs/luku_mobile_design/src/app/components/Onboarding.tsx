import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { Link } from 'react-router';

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const styles = [
    'Minimalist', 'Vintage', 'Bohemian', 'Streetwear',
    'Elegant', 'Casual', 'Formal', 'Athleisure',
    'Preppy', 'Edgy', 'Romantic', 'Classic'
  ];

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  return (
    <div
      className="min-h-screen w-full bg-black flex flex-col"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Progress Bar */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex gap-2 mb-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`flex-1 h-2 rounded-full ${
                num <= step ? 'bg-[#48CD8A]' : 'bg-white/5'
              }`}
            />
          ))}
        </div>
        <p className="text-white/60 text-sm font-semibold text-center">
          Step {step} of 3
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {step === 1 && (
            <div>
              <h1 className="text-white text-3xl font-black mb-3">
                Welcome to LUKU!
              </h1>
              <p className="text-white/70 text-base font-semibold leading-relaxed mb-8">
                Let's personalize your experience. What's your style?
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={`px-4 py-3 rounded-lg font-bold text-sm border-2 transition-all ${
                      selectedStyles.includes(style)
                        ? 'bg-white text-black border-white/20'
                        : 'bg-white text-black border-white/20 hover:bg-black'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={selectedStyles.length === 0}
                className="w-full bg-white text-black py-4 rounded-lg font-black uppercase tracking-wide text-sm hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-white text-3xl font-black mb-3">
                Build Your Wardrobe
              </h1>
              <p className="text-white/70 text-base font-semibold leading-relaxed mb-8">
                Start by adding items to your digital wardrobe. We'll use AI to help you create amazing outfits.
              </p>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-8 text-center fade-up">
                <div className="w-24 h-24 bg-gradient-to-br from-[#48CD8A]/20 to-[#3AB87A]/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-white/40 hover-scale press-response">
                  <span className="text-white text-4xl">+</span>
                </div>
                <p className="text-white font-bold mb-2">Add Your First Item</p>
                <p className="text-white/70 text-sm font-semibold">
                  Take a photo or upload from your gallery
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white text-black py-4 rounded-lg font-black uppercase tracking-wide text-sm border-2 border-white/20 hover:bg-black transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-white text-black py-4 rounded-lg font-black uppercase tracking-wide text-sm hover:bg-[#1A1A1A] transition-colors"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/20">
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
                <h1 className="text-white text-3xl font-black mb-3">
                  You're All Set!
                </h1>
                <p className="text-white/70 text-base font-semibold leading-relaxed">
                  Welcome to LUKU. Let's start your style journey.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Get AI-powered outfit suggestions',
                  'Build mood boards and collections',
                  'Track your sustainability impact',
                  'Shop curated marketplace items',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                    <div className="w-6 h-6 bg-[#48CD8A] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-black" strokeWidth={3} />
                    </div>
                    <p className="text-white text-sm font-bold">{feature}</p>
                  </div>
                ))}
              </div>

              <Link to="/">
                <button className="w-full bg-white text-black py-4 rounded-lg font-black uppercase tracking-wide text-sm hover:bg-[#1A1A1A] transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
