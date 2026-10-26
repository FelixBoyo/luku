'use client';

import { useEffect } from 'react';
import GarmentTag from './components/GarmentTag';
import TagRail from './components/TagRail';
import EmailCapture from './components/EmailCapture';
import InteractiveBackground from './components/InteractiveBackground';
import GradientButton from './components/GradientButton';
import Wordmark, { TaglineRow } from './components/Wordmark';

const NAV_LINKS = [
  { href: '#discover', label: 'Discover' },
  { href: '#wardrobe', label: 'Wardrobe' },
  { href: '#sell', label: 'Sell' },
  { href: '#stylist', label: 'Stylist' },
];

const featureHighlights = [
  {
    title: 'Build your wardrobe',
    body: 'Start by adding items to your digital wardrobe. Take a photo or upload from your gallery.',
    image:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Track what you wear',
    body: 'Log wears, see cost per wear, and know which pieces earn their place in your closet.',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&auto=format&fit=crop&q=80',
  },
];

const STATS = [
  { label: 'Times Worn', value: '24' },
  { label: 'Purchase Price', value: 'KES 18,500' },
  { label: 'Cost Per Wear', value: 'KES 771' },
];

export default function Home() {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.08,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-clip grid-bg bg-shell text-cream selection:bg-moss selection:text-ink">
      <InteractiveBackground />

      <header className="relative z-20 mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 md:px-10">
        <a href="#" className="transition-opacity hover:opacity-90">
          <Wordmark variant="nav" />
        </a>
        <nav className="hidden items-center gap-8 text-sm text-mist md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="transition-all duration-300 hover:-translate-y-0.5 hover:text-cream"
            >
              {label}
            </a>
          ))}
        </nav>
        <GradientButton href="#get-luku" label="Join waitlist" className="px-5 py-2.5 text-xs" />
      </header>

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 pb-16 pt-10 md:px-10 md:pb-24 md:pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          <div className="fade-up max-w-2xl">
            <TaglineRow className="mb-6" />
            <h1 className="text-[2.5rem] font-black leading-[1.05] tracking-tight md:text-[3.5rem]">
              Your Style.
              <br />
              Your Wardrobe.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-mist md:text-xl">
              AI styling from your own wardrobe — then shop what completes the look.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <GradientButton href="#get-luku" label="Join waitlist" />
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-mist transition-colors hover:text-cream"
              >
                How it works →
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-mist">
              <span className="rounded-luku-lg border border-mistFaint px-3 py-1.5">Wardrobe tracking</span>
              <span className="rounded-luku-lg border border-mistFaint px-3 py-1.5">AI stylist</span>
              <span className="rounded-luku-lg border border-mistFaint px-3 py-1.5">Peer marketplace</span>
            </div>
          </div>

          <div
            className="relative h-[460px] overflow-hidden rounded-luku border border-mistFaint bg-[rgba(255,255,255,0.05)] shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:h-[560px]"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1400&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute left-5 top-5 rounded-luku-lg border border-mistFaint bg-black/20 px-3 py-1.5 text-micro text-cream/90 backdrop-blur-sm">
              Your wardrobe
            </div>

            <GarmentTag
              className="absolute left-[6%] top-[6%] w-[180px] md:w-[210px]"
              rotate={-6}
              label="Times Worn"
              value="12×"
              sub="Wool Coat"
              accent="warm"
              delay={0}
            />
            <GarmentTag
              className="absolute right-[2%] top-[20%] w-[190px] md:w-[220px]"
              rotate={4}
              label="Cost Per Wear"
              value="KES 1,542"
              sub="↓ from 18,500"
              accent="moss"
              delay={0.15}
            />
            <div className="absolute bottom-5 right-5 max-w-[220px] rounded-luku border border-mistFaint bg-black/25 p-4 backdrop-blur-md">
              <p className="text-micro-warm">Smart tracking</p>
              <p className="mt-2 text-xl font-black leading-tight text-cream">
                Every piece, accounted for.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="wardrobe" className="relative z-10 mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div className="reveal-on-scroll relative min-h-[420px] overflow-hidden rounded-luku border border-mistFaint">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7 md:p-8">
              <p className="text-micro-warm">Build your wardrobe</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-cream md:text-4xl">
                Style that starts with what you already own.
              </h2>
            </div>
          </div>

          <div className="grid gap-4">
            {featureHighlights.map((item, index) => (
              <div
                key={item.title}
                className={`reveal-on-scroll reveal-delay-${index + 1} group card-dark overflow-hidden backdrop-blur-sm`}
              >
                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                <div className="p-6">
                  <p className="text-micro-warm">Feature / 0{index + 1}</p>
                  <h3 className="mt-3 text-2xl font-black leading-tight text-cream transition-colors duration-300 group-hover:text-moss">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="discover"
        className="reveal-on-scroll relative z-10 mx-auto max-w-[1400px] border-y border-mistFaint bg-[rgba(255,255,255,0.02)] px-6 py-10 backdrop-blur-[2px] md:px-10 md:py-14"
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <p className="text-micro-warm">Welcome to LUKU</p>
            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Let&apos;s personalize your experience.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-mist">
              AI-powered recommendations, personalized style matches, and smart wardrobe tracking — all in one app.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {STATS.map(({ label, value }) => (
                <div key={label} className="card-dark p-3">
                  <div className="text-2xl font-black text-moss">{value}</div>
                  <div className="text-micro mt-2 text-mist">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-luku border border-mistFaint">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1400&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/70" />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <div className="reveal-on-scroll mb-12 max-w-2xl">
          <p className="text-micro-warm mb-4">How it works</p>
          <h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
            Four steps to style, track, and sell from one closet.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-mist">
            From wardrobe to marketplace — everything connected in LUKU.
          </p>
        </div>
        <TagRail />
      </section>

      <section id="sell" className="relative z-10 mx-auto max-w-[1400px] border-t border-mistFaint px-6 py-24 md:px-10 md:py-32">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="reveal-on-scroll relative min-h-[460px] overflow-hidden rounded-luku border border-mistFaint">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1400&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 max-w-md rounded-luku border border-mistFaint bg-black/25 p-4 backdrop-blur-md">
              <p className="text-micro-warm">List for sale</p>
              <p className="mt-2 text-2xl font-black leading-tight text-cream">
                Your item is now live on the LUKU marketplace.
              </p>
            </div>
          </div>

          <div className="reveal-on-scroll reveal-delay-2">
            <p className="text-micro mb-4 text-moss">From wardrobe to marketplace</p>
            <h2 className="mb-6 text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Listing published — one tap from your closet.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-mist">
              List directly from your wardrobe. No new photos, no separate flow — your item story stays intact.
            </p>
            <div className="card-dark mt-8 p-6 md:p-7">
              <dl className="space-y-5">
                {[
                  ['Wool Coat', 'KES 18,500 → Listed at KES 9,200', 'Active'],
                  ['Cashmere Sweater', 'Worn 24× before listing', 'Sold'],
                  ['Leather Boots', 'Listed straight from wardrobe', 'Active'],
                ].map(([name, meta, status]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-4 border-b border-mistFaint pb-5 last:border-0 last:pb-0"
                  >
                    <div>
                      <dt className="text-base font-bold text-cream">{name}</dt>
                      <dd className="mt-1 text-xs text-mist">{meta}</dd>
                    </div>
                    <span
                      className={`text-micro rounded-luku-lg px-3 py-1 ${
                        status === 'Sold'
                          ? 'bg-white/10 text-mist'
                          : 'border border-moss/20 bg-moss/10 text-moss'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section
        id="stylist"
        className="reveal-on-scroll relative z-10 mx-auto max-w-[1400px] border-t border-mistFaint px-6 py-24 md:px-10 md:py-32"
      >
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl">
            <p className="text-micro-warm mb-4">Eco impact</p>
            <h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
              Rewear more. Waste less. Resell with intention.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-mist">
              Track CO₂ saved and rewears this month — calm, data-led wardrobe insights that reward what you already own.
            </p>
          </div>
          <div className="relative h-[320px] overflow-hidden rounded-luku border border-mistFaint">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/70" />
          </div>
        </div>
      </section>

      <section id="get-luku" className="relative z-10 mx-auto max-w-[1400px] border-t border-mistFaint px-6 pb-12 pt-20 md:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.7fr] lg:gap-12">
          <div className="reveal-on-scroll card-dark p-6 md:p-8">
            <Wordmark variant="nav" className="mb-6 block" />
            <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Your closet is waiting.
            </h2>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-mist">
              Be first in line when LUKU opens up. No spam — just one email when your closet is ready.
            </p>
            <EmailCapture />
          </div>
          <div className="reveal-on-scroll reveal-delay-3 relative min-h-[260px] overflow-hidden rounded-luku border border-mistFaint">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=1200&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-micro-warm">Style · Shop · Sustain</p>
              <p className="mt-2 text-2xl font-black leading-tight text-cream">
                Your personal style companion.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-[1400px] border-t border-mistFaint px-6 py-8 md:px-10">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Wordmark variant="nav" />
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-mist">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="hover:text-cream transition-colors">
                {label}
              </a>
            ))}
            <a href="#get-luku" className="hover:text-cream transition-colors">
              Join waitlist
            </a>
          </nav>
          <p className="text-xs text-mist">© {new Date().getFullYear()} LUKU</p>
        </div>
      </footer>
    </main>
  );
}
