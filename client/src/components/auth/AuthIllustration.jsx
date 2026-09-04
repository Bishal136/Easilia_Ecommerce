import React from "react";

/**
 * AuthIllustration: High-fidelity 3D glassmorphic visual banner
 * matching the DealPort Figma mockup (Fig/Landing page- Registration)
 */
export const AuthIllustration = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 sm:p-10 lg:p-12 overflow-hidden select-none">
      {/* Top Header Text */}
      <div className="relative z-20">
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-white tracking-tight leading-none drop-shadow-xs">
          Join Us
        </h2>
        <p className="text-white/90 text-xs sm:text-sm font-medium mt-2 tracking-wide drop-shadow-xs">
          Let’s Make Your Dream In Reality
        </p>
      </div>

      {/* Center 3D Composition Scene */}
      <div className="relative z-10 my-auto flex items-center justify-center py-6">
        <div className="relative w-[280px] h-[260px] sm:w-[320px] h-[290px] flex items-center justify-center">
          {/* 1. Large Warm Glowing Blob / Heart in Background */}
          <div className="absolute -bottom-2 -left-2 w-48 h-48 sm:w-56 sm:h-56 rounded-[45%_55%_65%_35%/50%_45%_55%_50%] bg-gradient-to-tr from-[#FF5722] via-[#FF7043] to-[#FFAB91] shadow-2xl opacity-95 animate-pulse duration-1000 transform -rotate-12 blur-[0.5px]" />

          {/* 2. Chat Bubble with Checkmark (Top Right) */}
          <div className="absolute top-4 right-14 z-20 w-12 h-12 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-[#29B6F6]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div className="absolute -top-1 right-2 w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-xs" />
          </div>

          {/* 3. Small Floating Translucent Pastel Spheres */}
          <div className="absolute top-2 left-20 z-10 w-9 h-9 rounded-full bg-[#FFD54F]/70 backdrop-blur-xs border border-white/50 shadow-sm" />
          <div className="absolute top-0 left-28 z-10 w-5 h-5 rounded-full bg-[#00E5FF]/80 shadow-xs" />
          <div className="absolute top-12 left-10 z-10 w-12 h-12 rounded-full bg-white/30 backdrop-blur-xs border border-white/40 shadow-xs flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-sm">✓</span>
          </div>

          {/* 4. Frosted Glass Pouch / Gift Bag (Center) */}
          <div className="relative z-20 w-44 sm:w-48 h-52 sm:h-56 rounded-2xl bg-gradient-to-b from-white/60 via-white/35 to-white/20 backdrop-blur-xl border border-white/70 shadow-2xl p-3 flex flex-col justify-between transform -rotate-6">
            {/* Top Seal / Ziplock Strip */}
            <div className="w-full h-3.5 bg-white/80 rounded-t-lg shadow-inner flex items-center justify-center gap-1">
              <div className="w-8 h-1 bg-slate-300/60 rounded-full" />
            </div>

            {/* Glowing 3D Heart on Bag Top */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 w-14 h-14 filter drop-shadow-md">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <defs>
                  <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF8A65" />
                    <stop offset="50%" stopColor="#FF5722" />
                    <stop offset="100%" stopColor="#E91E63" />
                  </linearGradient>
                </defs>
                <path
                  d="M16 28s-11-7.2-11-14.8C5 7.8 9.3 4 13.5 4c2.5 0 4.5 1.5 5.5 3 1-1.5 3-3 5.5-3 4.2 0 8.5 3.8 8.5 9.2C33 20.8 16 28 16 28z"
                  fill="url(#heartGrad)"
                />
              </svg>
            </div>

            {/* Glossy Balls & Bubbles Inside Bag */}
            <div className="relative w-full h-full flex flex-wrap items-center justify-center gap-2 pt-4">
              {/* Cyan orb */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#2979FF] shadow-md border border-white/40" />
              {/* Yellow orb */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFEA00] to-[#FF9100] shadow-md border border-white/40" />
              {/* Green orb */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#76FF03] to-[#00E676] shadow-md border border-white/40" />
              {/* Soft blue orb */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2979FF] to-[#651FFF] shadow-md border border-white/40" />
              {/* Pastel yellow sphere */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FFF176] to-[#FBC02D] shadow-sm" />
            </div>
          </div>

          {/* 5. 3D Diagonal Down Arrow */}
          <div className="absolute top-10 right-4 z-30 filter drop-shadow-xl transform -rotate-12 hover:translate-y-1 transition-transform">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <defs>
                <linearGradient id="arrowFace" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00E5FF" />
                  <stop offset="1" stopColor="#2979FF" />
                </linearGradient>
                <linearGradient id="arrowSide" x1="0" y1="0" x2="0" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00B0FF" />
                  <stop offset="1" stopColor="#1565C0" />
                </linearGradient>
              </defs>
              {/* 3D Arrow Head & Shaft */}
              <path
                d="M10 50L5 35L20 40L42 12L54 22L32 50L38 55L10 50Z"
                fill="url(#arrowFace)"
              />
              <path
                d="M5 35L10 50L12 52L8 37L5 35Z"
                fill="url(#arrowSide)"
              />
            </svg>
          </div>

          {/* 6. 3D Wavy Pastel Squiggle Ribbon (Bottom Right) */}
          <div className="absolute -bottom-2 right-6 z-30 filter drop-shadow-md">
            <svg width="45" height="75" viewBox="0 0 45 75" fill="none">
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="45" y2="75" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#80D8FF" />
                  <stop offset="0.5" stopColor="#B388FF" />
                  <stop offset="1" stopColor="#8C9EFF" />
                </linearGradient>
              </defs>
              <path
                d="M32 4C22 14 36 24 24 34C12 44 32 54 20 68"
                stroke="url(#waveGrad)"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Ambient Glow */}
      <div className="relative z-10 text-[11px] text-white/70 font-light">
        Easilia • Fast & Secure Authentication
      </div>
    </div>
  );
};

export default AuthIllustration;
