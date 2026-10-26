import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Check, Heart, Share2, ShoppingBag, User as UserIcon, Shuffle, Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { BottomNav } from './BottomNav';

type Review = {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  helpful: number;
  date: string;
};

const reviews: Review[] = [
  {
    id: 1,
    userName: 'Sarah M.',
    rating: 5,
    comment: 'Perfect for professional settings! The combination is elegant and comfortable.',
    helpful: 12,
    date: '2 days ago',
  },
  {
    id: 2,
    userName: 'Alex K.',
    rating: 4,
    comment: 'Love the minimalist aesthetic. Would add a pop of color with accessories.',
    helpful: 8,
    date: '5 days ago',
  },
  {
    id: 3,
    userName: 'Jordan L.',
    rating: 5,
    comment: 'This outfit saved me for my job interview. Highly recommend!',
    helpful: 15,
    date: '1 week ago',
  },
];

export function OutfitDetail() {
  const [userRating, setUserRating] = useState(0);

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4 sticky top-0 bg-black/90 backdrop-blur-lg z-10">
        <Link to="/">
          <button className="text-white flex items-center gap-2 font-bold hover-scale press-response">
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
            <span>Back</span>
          </button>
        </Link>
      </div>

      {/* Full Outfit Image */}
      <div className="px-5 mb-6 fade-up">
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <div className="aspect-[3/4] relative">
            <img
              src="https://images.unsplash.com/photo-1768825197238-629b1ae2dc18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYmVpZ2UlMjBvdXRmaXQlMjBmYXNoaW9uJTIwZWRpdG9yaWFsfGVufDF8fHx8MTc3NjIwMDc3N3ww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Minimalist Chic Outfit"
              className="w-full h-full object-cover ken-burns"
            />
            {/* Style Label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5">
              <h1 className="text-white text-2xl font-black tracking-tight drop-shadow-lg fade-up-delay-1">
                Minimalist Chic
              </h1>
            </div>
            {/* Match Score Badge */}
            <div className="absolute top-4 right-4 bg-[#48CD8A] px-4 py-3 shadow-lg fade-up-delay-2">
              <p className="text-black/80 text-xs font-black uppercase tracking-wider">
                STYLE_MATCH
              </p>
              <p className="text-black text-2xl font-black">
                94%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 mb-6 fade-up-delay-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Sustainability Score */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-md">
            <p className="text-white/70 text-xs font-black uppercase tracking-wider mb-2">
              SUSTAIN_SCORE
            </p>
            <div className="flex gap-1">
              {Array(5).fill(0).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm ${i < 4 ? 'bg-[#3AB87A]' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>

          {/* Versatility Score */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-md">
            <p className="text-white/70 text-xs font-black uppercase tracking-wider mb-1">
              VERSATILE_LVL
            </p>
            <p className="text-white text-2xl font-black">
              HIGH
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 pb-32">
        {/* Section 1: From Your Wardrobe */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-[#48CD8A] rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-black" strokeWidth={3} />
            </div>
            <h2 className="text-white text-xl font-black tracking-tight uppercase">
              From_Your_Wardrobe
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Wardrobe Item 1 - Coat */}
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/20 shadow-md" >
              <div className="aspect-square relative">
                <img
                  src="https://images.unsplash.com/photo-1619470149201-63960dec27cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHdvb2wlMjBjb2F0JTIwbWluaW1hbHxlbnwxfHx8fDE3NzYzMjI5NjN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Coat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-white font-bold text-base">
                  Wool Coat
                </h3>
                <p className="text-white/70 text-sm font-semibold mt-0.5">
                  In your closet
                </p>
              </div>
            </div>

            {/* Wardrobe Item 2 - Trousers */}
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/20 shadow-md" >
              <div className="aspect-square relative">
                <img
                  src="https://images.unsplash.com/photo-1619470148547-0adbfc64b595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWlsb3JlZCUyMHRyb3VzZXJzJTIwYmVpZ2V8ZW58MXx8fHwxNzc2MzIyOTY2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Trousers"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-white font-bold text-base">
                  Tailored Trousers
                </h3>
                <p className="text-white/70 text-sm font-semibold mt-0.5">
                  In your closet
                </p>
              </div>
            </div>

            {/* Wardrobe Item 3 - Shoes */}
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/20 shadow-md" >
              <div className="aspect-square relative">
                <img
                  src="https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGxlYXRoZXIlMjBzaG9lc3xlbnwxfHx8fDE3NzYzMjI5Njh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Shoes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-white font-bold text-base">
                  Leather Shoes
                </h3>
                <p className="text-white/70 text-sm font-semibold mt-0.5">
                  In your closet
                </p>
              </div>
            </div>

            {/* Wardrobe Item 4 - Sweater */}
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/20 shadow-md" >
              <div className="aspect-square relative">
                <img
                  src="https://images.unsplash.com/photo-1750390200293-92d5a788d3a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW4lMjBzd2VhdGVyJTIwa25pdHdlYXIlMjBtaW5pbWFsfGVufDF8fHx8MTc3NjE5ODgyNXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Sweater"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-white font-bold text-base">
                  Cashmere Sweater
                </h3>
                <p className="text-white/70 text-sm font-semibold mt-0.5">
                  In your closet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-px bg-[#000000]/30 my-8" />

        {/* Section 2: Recommended Additions */}
        <div className="mb-8">
          <h2 className="text-[#48CD8A] text-xl font-black tracking-tight mb-4 uppercase">
            Recommended_Additions
          </h2>

          <div className="space-y-4">
            {/* Marketplace Item 1 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-md border border-white/20" >
              <div className="flex gap-4 p-4">
                <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1665832102613-5b94286ec041?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm93biUyMGxlYXRoZXIlMjBoYW5kYmFnJTIwbWluaW1hbCUyMGJlaWdlfGVufDF8fHx8MTc3NjE5ODgyOHww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Structured Handbag"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">
                    Structured Handbag
                  </h3>
                  <p className="text-white/80 text-sm font-semibold mb-2 leading-relaxed">
                    Adds polish and completes the minimalist aesthetic
                  </p>
                  <p className="text-[#48CD8A] font-bold text-xl">
                    $145
                  </p>
                </div>
              </div>
            </div>

            {/* Marketplace Item 2 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-md border border-white/20" >
              <div className="flex gap-4 p-4">
                <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwd2F0Y2glMjBtaW5pbWFsJTIwbGVhdGhlcnxlbnwxfHx8fDE3NzYyMDEzNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Classic Watch"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">
                    Classic Watch
                  </h3>
                  <p className="text-white/80 text-sm font-semibold mb-2 leading-relaxed">
                    Timeless accent piece that elevates the entire look
                  </p>
                  <p className="text-[#48CD8A] font-bold text-xl">
                    $220
                  </p>
                </div>
              </div>
            </div>

            {/* Marketplace Item 3 */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-md border border-white/20" >
              <div className="flex gap-4 p-4">
                <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1764697907673-eaba1d06205a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXJ0aCUyMHRvbmUlMjBzY2FyZiUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc3NjE5ODgyOHww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Silk Scarf"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">
                    Silk Scarf
                  </h3>
                  <p className="text-white/80 text-sm font-semibold mb-2 leading-relaxed">
                    Perfect layering piece for added texture and warmth
                  </p>
                  <p className="text-[#48CD8A] font-bold text-xl">
                    $85
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="space-y-4">
          {/* Action Buttons Row */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              className="flex-1 p-4 bg-white border border-white/20 hover:bg-black rounded-xl transition-all shadow-md group"
              
              aria-label="Shuffle outfit pieces"
              title="Try different combinations"
            >
              <Shuffle className="w-6 h-6 text-black mx-auto" strokeWidth={3} />
            </button>
            <button
              className="flex-1 p-4 bg-white border border-white/20 hover:bg-[#48CD8A] rounded-xl transition-all shadow-md group"
              
              aria-label="Add to favorites"
              title="Save this outfit"
            >
              <Heart className="w-6 h-6 text-black group-hover:fill-[#0A0A0A] mx-auto" strokeWidth={3} />
            </button>
            <button
              className="flex-1 p-4 bg-white border border-white/20 hover:bg-black rounded-xl transition-all shadow-md group"
              
              aria-label="Share outfit"
              title="Share with friends"
            >
              <Share2 className="w-6 h-6 text-black mx-auto" strokeWidth={3} />
            </button>
            <button
              className="flex-1 p-4 bg-[#48CD8A] hover:bg-[#3AB87A] rounded-xl transition-all shadow-md group border border-white/20"
              
              aria-label="Virtual try on"
              title="See how it looks on you"
            >
              <UserIcon className="w-6 h-6 text-black mx-auto" strokeWidth={3} />
            </button>
          </div>

          {/* Primary CTA */}
          <button className="w-full bg-white text-black font-black text-lg py-5 rounded-xl shadow-xl hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2 border border-white/20" >
            <ShoppingBag className="w-5 h-5" strokeWidth={3} />
            SHOP_THIS_LOOK
          </button>
        </div>

        {/* Separator */}
        <div className="h-px bg-[#000000]/30 my-8" />

        {/* Ratings & Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-block w-1 h-6 bg-[#48CD8A] rounded-full" />
            <h2 className="text-white text-xl font-black uppercase tracking-wide">
              COMMUNITY_RATINGS
            </h2>
            <div className="flex-1 h-0.5 bg-[#000000]/20 rounded-full" />
          </div>

          {/* Overall Rating Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 border-2 border-white/20 outline outline-2 outline-offset-2 outline-[#000000]/20 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-white text-5xl font-black">4.7</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= 4 ? 'fill-[#48CD8A] text-[#48CD8A]' : 'text-black/20'}`}
                        strokeWidth={3}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-white/70 text-sm font-bold">
                  Based on 127 reviews
                </p>
              </div>
              <button className="px-6 py-3 bg-black hover:bg-[#1A1A1A] text-white rounded-xl font-black text-sm transition-colors">
                RATE_THIS
              </button>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const percentage = stars === 5 ? 68 : stars === 4 ? 24 : stars === 3 ? 6 : stars === 2 ? 2 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[...Array(stars)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#48CD8A] text-[#48CD8A]" strokeWidth={3} />
                      ))}
                    </div>
                    <div className="flex-1 bg-black rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#48CD8A] h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-white/70 text-xs font-black w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 border-2 border-white/20 outline outline-2 outline-offset-1 outline-[#000000]/15 shadow-md"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-black text-base mb-1">
                      {review.userName}
                    </p>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'fill-[#48CD8A] text-[#48CD8A]' : 'text-black/20'}`}
                          strokeWidth={3}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-white/60 text-xs font-bold">
                    {review.date}
                  </span>
                </div>

                {/* Review Content */}
                <p className="text-white/80 text-sm font-semibold leading-relaxed mb-4">
                  {review.comment}
                </p>

                {/* Review Actions */}
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-white/60 hover:text-black transition-colors">
                    <ThumbsUp className="w-4 h-4" strokeWidth={3} />
                    <span className="text-xs font-black">Helpful ({review.helpful})</span>
                  </button>
                  <button className="flex items-center gap-2 text-white/60 hover:text-black transition-colors">
                    <MessageCircle className="w-4 h-4" strokeWidth={3} />
                    <span className="text-xs font-black">Reply</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}