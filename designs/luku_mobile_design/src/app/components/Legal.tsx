import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';
import { SectionCard } from './common/SectionCard';

type LegalProps = {
  type: 'terms' | 'privacy';
};

export function Legal({ type }: LegalProps) {
  const isTerms = type === 'terms';

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black px-6 py-4 flex items-center gap-4 border-b-2 border-white/10">
        <Link to="/help">
          <button className="w-10 h-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center hover:bg-black transition-all">
            <ChevronLeft className="w-5 h-5 text-black" strokeWidth={3} />
          </button>
        </Link>
        <h1 className="text-white text-2xl font-black">
          {isTerms ? 'TERMS OF SERVICE' : 'PRIVACY POLICY'}
        </h1>
      </div>

      <div className="px-6 pt-6">
        <SectionCard title={isTerms ? 'TERMS_OF_SERVICE' : 'PRIVACY_POLICY'} variant="default">
          <div className="space-y-6 text-white/70 text-sm font-semibold leading-relaxed">
            <div>
              <p className="text-white font-black text-sm mb-2">EFFECTIVE DATE</p>
              <p>May 19, 2026</p>
            </div>

            {isTerms ? (
              <>
                <div>
                  <p className="text-white font-black text-sm mb-2">1. ACCEPTANCE OF TERMS</p>
                  <p>
                    By accessing and using LUKU, you accept and agree to be bound by the terms and provision
                    of this agreement. If you do not agree to these terms, please do not use this service.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">2. USE LICENSE</p>
                  <p>
                    Permission is granted to temporarily use LUKU for personal, non-commercial use only.
                    This is the grant of a license, not a transfer of title.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">3. USER ACCOUNT</p>
                  <p>
                    You are responsible for maintaining the confidentiality of your account and password.
                    You agree to accept responsibility for all activities that occur under your account.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">4. MARKETPLACE TERMS</p>
                  <p>
                    When buying or selling through LUKU marketplace, you agree to complete transactions
                    in good faith. Sellers must accurately represent items. Buyers must honor purchase commitments.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">5. CONTENT</p>
                  <p>
                    Users retain ownership of content they upload. By uploading, you grant LUKU a license
                    to use, display, and distribute your content within the service.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">6. TERMINATION</p>
                  <p>
                    We reserve the right to terminate or suspend access to our service immediately, without
                    prior notice, for conduct that we believe violates these Terms of Service.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-white font-black text-sm mb-2">1. INFORMATION WE COLLECT</p>
                  <p>
                    We collect information you provide directly to us, including your name, email address,
                    wardrobe items, outfit preferences, and usage data to improve your experience.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">2. HOW WE USE YOUR INFORMATION</p>
                  <p>
                    We use the information we collect to provide, maintain, and improve our services,
                    including AI-powered outfit suggestions, personalized recommendations, and analytics.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">3. INFORMATION SHARING</p>
                  <p>
                    We do not sell your personal information. We may share information with service providers
                    who assist in operating our platform, conducting business, or serving our users.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">4. DATA SECURITY</p>
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal
                    information against unauthorized or unlawful processing and accidental loss or damage.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">5. YOUR RIGHTS</p>
                  <p>
                    You have the right to access, update, or delete your personal information at any time.
                    You can also request a copy of your data or object to certain processing activities.
                  </p>
                </div>

                <div>
                  <p className="text-white font-black text-sm mb-2">6. COOKIES AND TRACKING</p>
                  <p>
                    We use cookies and similar tracking technologies to track activity on our service and
                    store certain information to improve user experience and analytics.
                  </p>
                </div>
              </>
            )}

            <div className="pt-4 border-t-2 border-white/10">
              <p className="text-white font-black text-sm mb-2">CONTACT US</p>
              <p>
                If you have any questions about {isTerms ? 'these Terms' : 'this Privacy Policy'},
                please contact us at legal@luku.app
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
