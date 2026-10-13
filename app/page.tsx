'use client';

import dynamic from 'next/dynamic';

const LoadingScreen = () => (
  <div
    className="flex min-h-[100dvh] w-full items-center justify-center bg-black px-4"
    role="status"
    aria-live="polite"
  >
    <div className="text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-b-blue-400"
      />
      <p className="text-base font-medium text-blue-300 sm:text-lg">Loading Solar System…</p>
      <p className="mt-1 text-xs text-gray-500 sm:text-sm">Preparing the interactive 3D scene</p>
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
