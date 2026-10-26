import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LUKU — Style · Shop · Sustain',
  description:
    'AI styling from your own wardrobe — then shop what completes the look. Track wears, cost per wear, and resell from one closet.',
  metadataBase: new URL('https://luku.app'),
  openGraph: {
    title: 'LUKU — Style · Shop · Sustain',
    description:
      'AI styling from your own wardrobe — then shop what completes the look.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
