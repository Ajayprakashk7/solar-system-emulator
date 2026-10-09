'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { nasaAPI } from '../services/nasaAPI';

const MarsRoverEasterEgg = ({ isMarsSelected }) => {
  const [photo, setPhoto] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isMarsSelected) {
      setIsOpen(false);
    }
  }, [isMarsSelected]);

  const fetchPhoto = async (forceRefetch = false) => {
    if (photo && !forceRefetch) {
      setIsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await nasaAPI.getMarsRoverPhoto();
      if (data && data.photos && data.photos.length > 0) {
        // Get a random photo from the result
        const randomIdx = Math.floor(Math.random() * data.photos.length);
        setPhoto(data.photos[randomIdx]);
        setIsOpen(true);
      } else {
        setError('No rover photos available at the moment.');
      }
    } catch (err) {
      setError('Failed to fetch Mars rover photo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isMarsSelected) return null;

  return (
    <div className="mt-4">
      <button
        onClick={fetchPhoto}
        className="bg-red-900/50 hover:bg-red-800/60 text-red-200 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2"
      >
        <span>🤖</span>
        {loading ? 'Connecting to Curiosity Rover...' : 'View Curiosity Rover Feed'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[100] bg-black/95 sm:bg-zinc-900/95 sm:rounded-xl sm:border sm:border-red-500/30 sm:shadow-2xl sm:max-w-2xl w-full h-full sm:h-auto flex flex-col p-4 sm:p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-400 font-mono tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE ROVER FEED
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error ? (
              <div className="p-8 text-center text-red-300 font-mono border border-red-900/50 rounded bg-red-950/20">
                ⚠️ TRANSMISSION FAILED: {error}
              </div>
            ) : photo ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="relative flex-1 bg-black rounded-lg overflow-hidden border border-zinc-800 sm:min-h-[400px]">
                  <Image
                    src={photo.img_src.replace('http://', 'https://')}
                    alt={`Mars surface captured by ${photo.rover.name}'s ${photo.camera.full_name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-contain"
                  />

                  {/* Scanline overlay for retro effect */}
                  <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]"></div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:text-sm font-mono text-zinc-400">
                  <div>
                    <p><span className="text-zinc-500">ROVER:</span> {photo.rover.name}</p>
                    <p><span className="text-zinc-500">CAMERA:</span> {photo.camera.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="text-zinc-500">DATE:</span> {photo.earth_date}</p>
                    <p><span className="text-zinc-500">SOL:</span> {photo.sol}</p>
                  </div>
                </div>

                <button
                  onClick={() => { setPhoto(null); fetchPhoto(true); }}
                  disabled={loading}
                  className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs uppercase tracking-widest disabled:opacity-50 transition-colors"
                >
                  {loading ? 'RETRIEVING NEXT IMAGE...' : 'REQUEST NEW IMAGE'}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center text-red-400/70 font-mono animate-pulse">
                ESTABLISHING CONNECTION WITH MARS ORBITER...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarsRoverEasterEgg;
