'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight } from 'lucide-react';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import planetsData from '../lib/planetsData';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const [, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControl();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Filter planets and moons
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchLower = query.toLowerCase();
    const matches = [];

    planetsData.forEach(planet => {
      // Check planet name
      if (planet.name.toLowerCase().includes(searchLower)) {
        matches.push({
          type: 'planet',
          data: planet,
          label: planet.name,
          subLabel: planet.displayStats.classification
        });
      }

      // Check moons
      if (planet.moons) {
        planet.moons.forEach(moon => {
          if (moon.name.toLowerCase().includes(searchLower)) {
            matches.push({
              type: 'moon',
              data: { ...moon, parentPlanet: planet, isMoon: true },
              label: moon.name,
              subLabel: `Moon of ${planet.name}`
            });
          }
        });
      }
    });

    return matches.slice(0, 8); // Limit results
  }, [query]);

  const handleSelect = useCallback((item) => {
    if (item.type === 'planet') {
      setSelectedPlanet(item.data);
    } else {
      setSelectedPlanet(item.data);
    }

    overrideSpeedFactor();
    setCameraState('ZOOMING_IN');
    onClose();
  }, [setSelectedPlanet, overrideSpeedFactor, setCameraState, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0) {
          handleSelect(results[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, activeIndex, onClose, handleSelect]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gray-900/90 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header / Input */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Find planet or moon..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                />
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {results.length > 0 ? (
                  <div className="py-2">
                    {results.map((item, index) => (
                      <button
                        key={`${item.type}-${item.label}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors
                          ${index === activeIndex ? 'bg-blue-600/20' : 'hover:bg-gray-800/50'}
                        `}
                      >
                        <div>
                          <div className={`font-medium ${index === activeIndex ? 'text-blue-300' : 'text-gray-200'}`}>
                            {item.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.subLabel}
                          </div>
                        </div>
                        {index === activeIndex && (
                          <ChevronRight className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  query && (
                    <div className="p-8 text-center text-gray-500">
                      No results found for &quot;{query}&quot;
                    </div>
                  )
                )}

                {!query && (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    Type to search the solar system...
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 bg-black/20 text-[10px] text-gray-500 border-t border-gray-800 flex justify-between">
                <span>Navigate with arrows</span>
                <span>Select with Enter</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
