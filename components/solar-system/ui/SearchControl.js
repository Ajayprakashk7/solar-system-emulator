'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Globe, Moon } from 'lucide-react';
import planetsData from '../lib/planetsData';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';

export default function SearchControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControl();

  // Flatten the data structure for search
  const searchItems = useMemo(() => {
    const items = [];

    planetsData.forEach(planet => {
      // Add Planet
      items.push({
        ...planet,
        type: 'Planet',
        searchLabel: planet.name,
        icon: Globe
      });

      // Add Moons
      if (planet.moons && planet.moons.length > 0) {
        planet.moons.forEach(moon => {
          items.push({
            ...moon,
            type: 'Moon',
            isMoon: true,
            parentPlanet: planet.name,
            parentPlanetData: planet,
            searchLabel: `${moon.name} (Moon of ${planet.name})`,
            name: moon.name, // Ensure name is top-level
            icon: Moon
          });
        });
      }
    });

    return items;
  }, []);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return searchItems.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.type === 'Moon' && item.parentPlanet.toLowerCase().includes(lowerQuery))
    ).slice(0, 10); // Limit to 10 results
  }, [query, searchItems]);

  const handleSelect = useCallback((item) => {
    setSelectedPlanet(item);
    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
    setIsOpen(false);
    setQuery('');
  }, [setSelectedPlanet, overrideSpeedFactor, setCameraState]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) {
        // Cmd/Ctrl + K to open
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && filteredItems[activeIndex]) {
            handleSelect(filteredItems[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, activeIndex, handleSelect]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
      setQuery('');
      setActiveIndex(-1);
    }
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        className="fixed top-4 right-16 sm:right-20 z-50 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors group"
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Search celestial bodies"
      >
        <Search className="w-5 h-5 text-blue-300 group-hover:text-blue-100" />
        <span className="sr-only">Search</span>
      </motion.button>

      {/* Search Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Search Container */}
            <motion.div
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-[70] px-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="bg-[#0a0a10] border border-blue-500/30 rounded-xl shadow-2xl shadow-blue-500/10 overflow-hidden">
                {/* Input Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10">
                  <Search className="w-5 h-5 text-blue-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    placeholder="Search planets, moons..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                  />
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block px-2 py-1 bg-white/10 rounded text-xs text-gray-400 font-mono">ESC</span>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar" ref={listRef}>
                  {filteredItems.length > 0 ? (
                    <div className="py-2">
                      {filteredItems.map((item, index) => {
                        const Icon = item.icon;
                        const isSelected = index === activeIndex;

                        return (
                          <motion.button
                            key={`${item.type}-${item.name}`}
                            className={`w-full text-left px-4 py-3 flex items-center gap-4 transition-colors ${
                              isSelected ? 'bg-blue-600/20' : 'hover:bg-white/5'
                            }`}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setActiveIndex(index)}
                          >
                            <div className={`p-2 rounded-full ${
                              item.type === 'Planet' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium">{item.name}</div>
                              <div className="text-xs text-gray-400">
                                {item.type === 'Moon' ? `Moon of ${item.parentPlanet}` : item.displayStats?.classification || 'Planet'}
                              </div>
                            </div>
                            {isSelected && (
                              <ChevronRight className="w-4 h-4 text-blue-400" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : query ? (
                    <div className="p-8 text-center text-gray-500">
                      No results found for &quot;{query}&quot;
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-400 mb-2">Type to search the solar system</p>
                      <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-white/5 rounded">Planets</span>
                        <span className="px-2 py-1 bg-white/5 rounded">Moons</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
