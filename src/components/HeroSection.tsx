import React, { useState } from 'react';

// Use the generated image path
const HERO_IMAGE_URL = '/src/assets/images/feast_table_banner_1792338216037.jpg';

export const HeroSection: React.FC = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="relative pt-6 pb-4 sm:pt-10 sm:pb-6 text-center no-print">
      {/* Decorative Autumn Header Tagline */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F4EDE2] border border-[#E5DAC8] text-[#C25927] text-xs font-semibold tracking-wide uppercase mb-3.5 shadow-2xs">
        <span role="img" aria-label="Autumn leaves">🍁</span>
        <span>Friendsgiving 2026 · Zero Login Potluck</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#2C1E16] tracking-tight leading-[1.15] max-w-2xl mx-auto px-2">
        Friendsgiving: The Feast Ledger
      </h1>

      <p className="mt-3 text-[#4A3B32] max-w-xl mx-auto text-sm sm:text-base leading-relaxed px-4">
        Claim what you're bringing so we don't end up with eight tubs of mashed potatoes and no pie. No passwords or app downloads needed.
      </p>

      {/* Hero Visual Accent Banner */}
      <div className="mt-6 max-w-4xl mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-[#E8DEC8] h-36 sm:h-52 bg-[#F0E6D8] flex items-center justify-center">
          {!imageError ? (
            <img
              src={HERO_IMAGE_URL}
              alt="Warm Friendsgiving rustic harvest dining table"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#FAF0E6] via-[#F4EDE2] to-[#FAF0E6] flex flex-col items-center justify-center text-[#705F55]">
              <span className="text-4xl mb-1">🦃 🍂 🥧</span>
              <span className="font-serif text-sm font-semibold text-[#2C1E16]">The Great Friendsgiving Gathering</span>
            </div>
          )}

          {/* Subtle gradient scrim at bottom to blend gracefully */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C1E16]/40 via-transparent to-transparent pointer-events-none" />

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs drop-shadow-sm font-medium">
            <span className="bg-[#2C1E16]/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px]">
              Harvest Table · Gather & Share
            </span>
            <span className="bg-[#2C1E16]/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] tabular-nums">
              Live Real-Time Coordination
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
