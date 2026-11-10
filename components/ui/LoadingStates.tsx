'use client';

import { motion } from 'framer-motion';

/**
 * Loading indicator for texture loading
 */
export const TextureLoader = ({ planetName }: { planetName?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
    <motion.div
      className="relative w-24 h-24"
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500" />
    </motion.div>
    
    <div className="text-center space-y-2">
      <p className="text-gray-400 text-sm">
        Loading {planetName ? `${planetName} textures` : 'textures'}...
      </p>
      <div className="flex justify-center space-x-1">
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </div>
  </div>
);

/**
 * Skeleton loader for planet detail panel
 */
export const PlanetDetailSkeleton = () => (
  <div className="animate-pulse space-y-6 p-6" aria-hidden="true">
    {/* Header skeleton */}
    <div className="space-y-3">
      <div className="h-8 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
    </div>

    {/* Image skeleton */}
    <div className="w-full h-64 bg-gray-700 rounded-lg" />

    {/* Stats skeleton */}
    <div className="space-y-3">
      <div className="h-4 bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-700 rounded w-5/6" />
      <div className="h-4 bg-gray-700 rounded w-4/6" />
    </div>

    {/* Facts skeleton */}
    <div className="space-y-2">
      <div className="h-3 bg-gray-700 rounded w-full" />
      <div className="h-3 bg-gray-700 rounded w-11/12" />
      <div className="h-3 bg-gray-700 rounded w-10/12" />
    </div>
  </div>
);

/**
 * Loading spinner for general use
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  message 
}: { 
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        className={`${sizeClasses[size]} rounded-full border-4 border-blue-500/20 border-t-blue-500`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {message && (
        <p className="text-gray-400 text-sm">{message}</p>
      )}
    </div>
  );
};

/**
 * Skeleton for planet menu items
 */
export const PlanetMenuSkeleton = () => (
  <div className="space-y-2 p-4" aria-hidden="true">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg animate-pulse"
      >
        <div className="w-10 h-10 bg-gray-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded w-24" />
          <div className="h-3 bg-gray-700 rounded w-16" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Image loading placeholder with shimmer effect
 */
export const ImagePlaceholder = ({ 
  aspectRatio = 'aspect-video',
  rounded = 'rounded-lg'
}: {
  aspectRatio?: string;
  rounded?: string;
}) => (
  <div className={`${aspectRatio} ${rounded} bg-gray-800 overflow-hidden relative`} aria-hidden="true">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer" />
  </div>
);

/**
 * Full screen loading overlay
 */
export const FullScreenLoader = ({ message }: { message?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
  >
    <div className="text-center space-y-6">
      <motion.div
        className="w-20 h-20 mx-auto rounded-full border-4 border-blue-500/20 border-t-blue-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">
          {message || 'Loading Solar System...'}
        </h2>
        <p className="text-gray-400 text-sm">
          Preparing your journey through the cosmos
        </p>
      </div>
    </div>
  </motion.div>
);

/**
 * API error display component
 */
export const APIErrorDisplay = ({ 
  message = 'Unable to load data',
  retry
}: {
  message?: string;
  retry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4 p-6">
    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
      <svg
        className="w-8 h-8 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    
    <div className="text-center space-y-2">
      <p className="text-gray-300 font-medium">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);
