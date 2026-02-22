'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Circle, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import planetsData from '../lib/planetsData';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';

export default function SearchControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControl();

  // Flatten the data structure to include both planets and moons
  const searchIndex = useMemo(() => {
    const index = [];

    planetsData.forEach(planet => {
      // Add planet
      index.push({
        ...planet,
        type: 'planet',
        parentName: null
      });

      // Add moons if any
      if (planet.moons && planet.moons.length > 0) {
        planet.moons.forEach(moon => {
          index.push({
            ...moon,
            type: 'moon',
            isMoon: true,
            parentName: planet.name,
            parentPlanetData: planet
          });
        });
      }
    });

    return index;
  }, []);

  // Filter results based on query
  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return searchIndex.filter(item =>
      item.name.toLowerCase().includes(query)
    );
  }, [searchQuery, searchIndex]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results.length > 0) {
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    } else {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (item) => {
    if (!item) return;

    if (item.type === 'moon') {
      // Construct moon selection object as expected by Moons.js logic
      // We need to ensure we pass enough info for the camera controller
      // Note: Moons.js usually calculates the position on click.
      // CameraController now handles dynamic lookup via context,
      // but we need to pass basic moon data.

      const moonSelection = {
        ...item,
        isMoon: true,
        parentPlanet: item.parentName,
        parentPlanetData: item.parentPlanetData,
        // We don't have exact position here, but CameraController will look it up in context
        // provided Moons.js has rendered it at least once.
      };
      setSelectedPlanet(moonSelection);
    } else {
      setSelectedPlanet(item);
    }

    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        className="fixed top-4 right-20 sm:right-24 z-40 bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-colors border border-white/10 text-white"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Search celestial bodies (Cmd+K)"
      >
        <Search size={20} />
      </motion.button>

      {/* Search Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              className="w-full max-w-lg mx-4 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="flex items-center p-4 border-b border-white/10 gap-3">
                <Search className="text-white/50" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search planets, moons..."
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-lg"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Results List */}
              <div className="max-h-[60vh] overflow-y-auto">
                {results.length > 0 ? (
                  <div className="py-2">
                    {results.map((item, index) => (
                      <button
                        key={`${item.type}-${item.name}`}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                          index === selectedIndex ? 'bg-blue-600/20' : 'hover:bg-white/5'
                        }`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            item.type === 'planet' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {item.type === 'planet' ? <Circle size={16} /> : <Moon size={16} />}
                          </div>
                          <div>
                            <div className="text-white font-medium">{item.name}</div>
                            {item.type === 'moon' && (
                              <div className="text-xs text-white/40">Moon of {item.parentName}</div>
                            )}
                          </div>
                        </div>
                        {index === selectedIndex && (
                          <span className="text-xs text-white/50 hidden sm:block">Press Enter</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  searchQuery && (
                    <div className="p-8 text-center text-white/30">
                      No results found for "{searchQuery}"
                    </div>
                  )
                )}

                {!searchQuery && (
                  <div className="p-8 text-center text-white/30 text-sm">
                    Type to find planets and moons...
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex justify-between text-xs text-white/30">
                <span>Navigate with ↑↓</span>
                <span>ESC to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
