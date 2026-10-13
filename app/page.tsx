'use client';

import dynamic from 'next/dynamic';

const OrbitalLoader = () => (
  <div className="relative mx-auto mb-6 h-14 w-14" aria-hidden="true">
    <div className="absolute inset-[9px] rounded-full border border-white/12" />
    <div className="orbit-loader absolute inset-0 rounded-full border border-transparent border-t-white/55">
      <span className="absolute -top-[2px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
    </div>
    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85" />
  </div>
);

const LoadingScreen = () => (
  <div
    className="flex min-h-[100dvh] w-full items-center justify-center bg-black px-6"
    role="status"
    aria-live="polite"
  >
    <div className="text-center">
      <OrbitalLoader />
      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/35">
        Interactive orbital atlas
      </p>
      <p className="mt-2 text-xl font-light tracking-[-0.03em] text-white/90 sm:text-2xl">
        Solar System
      </p>
      <p className="mt-2 text-xs text-white/30">Preparing the orbital scene</p>
    </div>
  </div>
);

// Three.js and browser APIs are client-only. The scene owns texture loading once
// mounted, avoiding duplicate preload work and misleading progress indicators.
const SolarSystem = dynamic(() => import('../components/solar-system/SolarSystem'), {
  ssr: false,
  loading: LoadingScreen,
});

export default function SolarSystemPage() {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-black">
      <SolarSystem />
    </div>
  );
}
