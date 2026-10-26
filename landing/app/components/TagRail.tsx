const FEATURES = [
  {
    code: '01',
    title: 'Build your wardrobe',
    body: 'Start by adding items to your digital wardrobe. Take a photo or upload from your gallery — brand, size, condition, all searchable.',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=80',
  },
  {
    code: '02',
    title: 'Stylist',
    body: 'AI-powered outfit suggestions from your wardrobe and the marketplace — personalized to your style and occasion.',
    image:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop&q=80',
  },
  {
    code: '03',
    title: 'Log wear & cost per wear',
    body: 'Log every wear. Track times worn, purchase price, and cost per wear — know which pieces earn their place.',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80',
  },
  {
    code: '04',
    title: 'List for sale',
    body: 'Your item is now live on the LUKU marketplace. One tap from wardrobe — no new photos, no separate listing flow.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=80',
  },
];

export default function TagRail() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {FEATURES.map((f, i) => (
        <div
          key={f.code}
          className={`reveal-on-scroll reveal-delay-${i + 1} group card-dark overflow-hidden backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(72,205,138,0.2)]`}
        >
          <div className="relative h-36 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${f.image}')` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <span className="absolute left-4 top-4 text-micro text-cream/90">{f.code}</span>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold leading-snug text-cream/90 group-hover:text-cream transition-colors duration-300">
              {f.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mist group-hover:text-cream/80 transition-colors duration-500">
              {f.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
