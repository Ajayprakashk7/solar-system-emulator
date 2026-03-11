// PlanetDetail.js - Enhanced with NASA API integration
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { nasaAPI } from '../services/nasaAPI';
import ImageGallery from './ImageGallery';

const PlanetDetail = () => {
  const [selectedPlanet] = useSelectedPlanet();
  const { cameraState } = useCameraContext();
  const [displayedPlanet, setDisplayedPlanet] = useState(selectedPlanet);
  const [nasaImage, setNasaImage] = useState(null);
  const [educationalContent, setEducationalContent] = useState(null);
  const [loadingNASA, setLoadingNASA] = useState(false);
  const [showMoons, setShowMoons] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedMoon, setSelectedMoon] = useState(null);
  const [moonDetailedInfo, setMoonDetailedInfo] = useState(null);

  useEffect(() => {
    if (cameraState === 'DETAIL_VIEW') {
      setDisplayedPlanet(selectedPlanet);
    }
  }, [cameraState, selectedPlanet]);

  // Fetch NASA data when planet OR moon is selected
  useEffect(() => {
    const fetchNASAData = async () => {
      if (!displayedPlanet) return;
      
      // Handle moon selection
      if (displayedPlanet.isMoon) {
        setLoadingNASA(true);
        try {
          const [imageData, eduContent, detailedInfo] = await Promise.all([
            nasaAPI.getMoonImage(displayedPlanet.name),
            nasaAPI.getMoonEducationalContent(displayedPlanet.name),
            nasaAPI.getMoonDetailedInfo(displayedPlanet.name)
          ]);
          
          setNasaImage(imageData);
          setEducationalContent(eduContent);
          setMoonDetailedInfo(detailedInfo);
          setSelectedMoon(displayedPlanet.name);
        } catch (err) {
          console.warn('[PlanetDetail] Moon data fetch failed:', err);
        } finally {
          setLoadingNASA(false);
        }
        return;
      }
      
      // Handle planet selection (including Sun)
      setLoadingNASA(true);
      try {
        // Fetch planet image and educational content in parallel
        const [imageData, eduContent] = await Promise.all([
          nasaAPI.getPlanetImage(displayedPlanet.name),
          nasaAPI.getPlanetEducationalContent(displayedPlanet.name)
        ]);
        
        setNasaImage(imageData);
        setEducationalContent(eduContent);
        // Reset moon state when viewing planet
        setSelectedMoon(null);
        setMoonDetailedInfo(null);
      } catch (err) {
        console.warn('[PlanetDetail] NASA data fetch failed:', err);
      } finally {
        setLoadingNASA(false);
      }
    };
    
    if (displayedPlanet && cameraState === 'DETAIL_VIEW') {
      fetchNASAData();
    }
  }, [displayedPlanet, cameraState]);

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // Handle image click to open gallery
  const handleImageClick = () => {
    if (nasaImage) {
      setGalleryImages([{
        url: nasaImage.url,
        alt: nasaImage.title,
        caption: `${nasaImage.title} - ${nasaImage.photographer}`
      }]);
      setGalleryOpen(true);
    }
  };

  // Handle moon click to fetch and display detailed information
  const handleMoonClick = async (moon) => {
    setSelectedMoon(moon.name);
    
    try {
      const detailedInfo = await nasaAPI.getMoonDetailedInfo(moon.name);
      setMoonDetailedInfo(detailedInfo);
      
      // If there are gallery images, prepare them for viewing
      if (detailedInfo?.gallery && detailedInfo.gallery.length > 0) {
        const moonGalleryImages = detailedInfo.gallery.map(img => ({
          url: img.url,
          alt: img.title,
          caption: img.caption || img.title
        }));
        setGalleryImages(moonGalleryImages);
        setGalleryOpen(true);
      }
    } catch (err) {
      console.error('[PlanetDetail] Failed to fetch moon details:', err);
    }
  };

  const shouldDisplayDetails = cameraState === 'DETAIL_VIEW';

  const hasMoons = displayedPlanet?.moons && displayedPlanet.moons.length > 0;

  return (
    <AnimatePresence>
      {shouldDisplayDetails && (
        <motion.div
          key={displayedPlanet ? displayedPlanet.name : 'empty'}
          className='absolute z-40
                     left-4 right-4 top-16
                     sm:left-5 sm:right-5 sm:top-20 sm:mt-4 
                     max-w-[95vw] sm:max-w-[500px]
                     max-h-[80vh] overflow-y-auto
                     pb-20'
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Mobile-optimized title */}
          <h1 className='tracking-tight font-semibold opacity-90 text-white
                         text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl
                         mb-2 sm:mb-4'>
            {displayedPlanet ? displayedPlanet.name : ''}
          </h1>
          
          {/* Moon subtitle showing parent planet */}
          {displayedPlanet?.isMoon && displayedPlanet?.parentPlanet && (
            <h4 className='tracking-tight mb-1 sm:mb-2 ml-1 text-blue-400 font-semibold
                           text-base sm:text-lg md:text-xl'>
              Moon of {displayedPlanet.parentPlanet}
            </h4>
          )}
          
          <h4 className='tracking-tight mb-3 sm:mb-5 ml-1 text-purple-400 font-semibold
                         text-lg sm:text-xl md:text-2xl'>
            {displayedPlanet?.isMoon 
              ? (moonDetailedInfo?.composition || 'Natural satellite')
              : displayedPlanet?.displayStats.classification
            }
          </h4>
          
          {/* NASA Image */}
          {nasaImage && (
            <div className='mb-4 ml-2'>
              <div 
                className='relative w-full max-w-[300px] h-[200px] cursor-pointer hover:opacity-90 transition-opacity'
                onClick={handleImageClick}
              >
                <Image 
                  src={nasaImage.url} 
                  alt={nasaImage.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className='rounded-lg shadow-lg object-cover'
                  loading='lazy'
                />
                <div className='absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center opacity-0 hover:opacity-100'>
                  <span className='text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full'>
                    Click to enlarge
                  </span>
                </div>
              </div>
              <p className='text-xs text-gray-400 mt-1'>
                {nasaImage.title} - {nasaImage.photographer}
              </p>
            </div>
          )}
                {educationalContent.atmosphere && (
                  <div>
                    <h4 className="text-white text-sm font-semibold mb-2">Atmosphere</h4>
                    <p className="text-gray-300 text-sm">
                      {educationalContent.atmosphere}
                    </p>
                  </div>
                )}
          
          {loadingNASA && !nasaImage && (
            <div className='ml-2 mb-4'>
              <div className='animate-pulse bg-gray-700 w-[300px] h-[200px] rounded-lg'></div>
              <p className='text-xs text-gray-400 mt-1'>Loading NASA imagery...</p>
            </div>
          )}
          
          {/* Mobile-responsive details */}
          <div className='ml-2 text-gray-200'>
            {/* Moon stats (when a moon is selected) */}
            {displayedPlanet?.isMoon && moonDetailedInfo && (
              <ul className='text-xs sm:text-sm space-y-1 w-full sm:w-64 block lg:hidden'>
                <li>
                  <p>
                    <span className='font-semibold'>Diameter: </span>
                    <span>{moonDetailedInfo.diameter}</span>
                  </p>
                </li>
                <li>
                  <p>
                    <span className='font-semibold'>Orbital Period: </span>
                    <span>{moonDetailedInfo.orbitalPeriod}</span>
                  </p>
                </li>
                <li>
                  <p>
                    <span className='font-semibold'>Mass: </span>
                    <span>{moonDetailedInfo.mass}</span>
                  </p>
                </li>
                <li>
                  <p>
                    <span className='font-semibold'>Discovered: </span>
                    <span>{moonDetailedInfo.discovered}</span>
                  </p>
                </li>
                <li>
                  <p className='text-xs text-gray-300 mt-2'>
                    {moonDetailedInfo.description}
                  </p>
                </li>
              </ul>
            )}
            
            {/* Planet stats (when a planet is selected) */}
            {!displayedPlanet?.isMoon && (
              <ul className='text-xs sm:text-sm space-y-1 w-full sm:w-64 block lg:hidden'>
              <li>
                <p>
                  <span className='font-semibold'>Distance: </span>
                  <span>
                    {displayedPlanet?.isSun 
                      ? 'Center of Solar System' 
                      : `${displayedPlanet?.displayStats.meanDistanceFromSun} AU`
                    }
                  </span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Radius: </span>
                  <span>{displayedPlanet?.displayStats.accurateRadius} km</span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Moons: </span>
                  <span>{displayedPlanet?.displayStats.numberOfMoons}</span>
                  {hasMoons && (
                    <button
                      onClick={() => setShowMoons(!showMoons)}
                      className='ml-2 text-blue-400 underline text-xs'
                    >
                      {showMoons ? 'Hide' : 'Show'} Details
                    </button>
                  )}
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Temperature: </span>
                  <span>{displayedPlanet?.displayStats.surfaceTemp}</span>
                </p>
              </li>
            </ul>
            )}
            
            {/* Moons section */}
            {hasMoons && showMoons && (
              <div className='mt-3 p-3 bg-gray-800 bg-opacity-50 rounded-lg lg:hidden'>
                <h5 className='text-sm font-semibold text-blue-300 mb-2'>
                  Notable Moons ({displayedPlanet.moons.length})
                </h5>
                <ul className='text-xs space-y-2'>
                  {displayedPlanet.moons.map((moon, idx) => (
                    <li 
                      key={idx} 
                      className='flex justify-between items-center p-2 bg-gray-700 bg-opacity-30 rounded cursor-pointer hover:bg-opacity-50 transition-all'
                      onClick={() => handleMoonClick(moon)}
                    >
                      <span className='text-gray-300 font-medium'>{moon.name}</span>
                      <span className='text-gray-500 text-[10px]'>{moon.surfaceDetail}</span>
                    </li>
                  ))}
                </ul>
                {selectedMoon && moonDetailedInfo && (
                  <div className='mt-3 p-3 bg-blue-900 bg-opacity-40 rounded-lg'>
                    <h6 className='text-sm font-semibold text-blue-200 mb-2'>{selectedMoon}</h6>
                    <p className='text-xs text-gray-300 mb-2'>{moonDetailedInfo.description}</p>
                    <div className='text-xs space-y-1'>
                      <p><span className='font-semibold'>Diameter:</span> {moonDetailedInfo.diameter}</p>
                      <p><span className='font-semibold'>Orbital Period:</span> {moonDetailedInfo.orbitalPeriod}</p>
                      <p><span className='font-semibold'>Discovered:</span> {moonDetailedInfo.discovered}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Educational content */}
            {educationalContent && (
              <div className='mt-3 p-3 bg-blue-900 bg-opacity-30 rounded-lg lg:hidden'>
                <h5 className='text-sm font-semibold text-blue-300 mb-2'>
                  {displayedPlanet?.isMoon ? 'Notable Facts' : 'Fun Facts'}
                </h5>
                <ul className='text-xs space-y-1 list-disc list-inside'>
                  {educationalContent.funFacts.slice(0, 3).map((fact, idx) => (
                    <li key={idx} className='text-gray-300'>{fact}</li>
                  ))}
                </ul>
                {educationalContent.missions && (
                  <div className='mt-2'>
                    <span className='text-xs font-semibold text-purple-300'>
                      {displayedPlanet?.isMoon ? 'Exploration: ' : 'Active Missions: '}
                    </span>
                    <span className='text-xs text-gray-400'>
                      {educationalContent.missions.join(', ')}
                    </span>
                  </div>
                )}
                {educationalContent.atmosphere && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="text-white text-sm font-semibold mb-2">Atmosphere</h4>
                    <p className="text-gray-300 text-sm">
                      {educationalContent.atmosphere}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Full details for larger screens */}
            {/* Moon details for desktop */}
            {displayedPlanet?.isMoon && moonDetailedInfo && (
              <ul className='text-sm w-full max-w-md hidden lg:block space-y-1'>
                <li>
                  <p>
                    <span className='font-semibold'>Diameter: </span>
                    <span>{moonDetailedInfo.diameter}</span>
                  </p>
                </li>
                <li>
                  <p>
                    <span className='font-semibold'>Mass: </span>
                    <span>{moonDetailedInfo.mass}</span>
                  </p>
                </li>
                <li>
                  <p>
                    <span className='font-semibold'>Orbital Period: </span>
                    <span>{moonDetailedInfo.orbitalPeriod}</span>
                  </p>
                </li>
                <li>
                  <p>
                    <span className='font-semibold'>Discovered: </span>
                    <span>{moonDetailedInfo.discovered}</span>
                  </p>
                </li>
                <li>
                  <p>
                    <span className='font-semibold'>Composition: </span>
                    <span>{moonDetailedInfo.composition}</span>
                  </p>
                </li>
                <li>
                  <p>
                    <span className='font-semibold'>Surface Features: </span>
                    <span>{moonDetailedInfo.surfaceFeatures}</span>
                  </p>
                </li>
              </ul>
            )}
            
            {/* Planet details for desktop */}
            {!displayedPlanet?.isMoon && (
            <ul className='text-sm w-full max-w-md hidden lg:block space-y-1'>
              <li>
                <p>
                  <span className='font-semibold'>Orbital Period: </span>
                  <span>
                    {displayedPlanet?.isSun 
                      ? 'N/A (Center of Solar System)' 
                      : `${displayedPlanet?.displayStats.orbitalPeriod} Earth days`
                    }
                  </span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Mean Distance from Sun: </span>
                  <span>
                    {displayedPlanet?.isSun 
                      ? 'N/A (This is the Sun)' 
                      : `${displayedPlanet?.displayStats.meanDistanceFromSun} AU`
                    }
                  </span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Radius: </span>
                  <span>{displayedPlanet?.displayStats.accurateRadius} km</span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Mass: </span>
                  <span>{displayedPlanet?.displayStats.mass} Earth masses</span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Surface Gravity: </span>
                  <span>{displayedPlanet?.displayStats.surfaceGravity} g</span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Rotation Period: </span>
                  <span>{displayedPlanet?.displayStats.rotationPeriod} Earth hours</span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Axial Tilt: </span>
                  <span>{displayedPlanet?.displayStats.axialTilt}°</span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Number of Moons: </span>
                  <span>{displayedPlanet?.displayStats.numberOfMoons}</span>
                  {hasMoons && (
                    <button
                      onClick={() => setShowMoons(!showMoons)}
                      className='ml-2 text-blue-400 underline text-sm'
                    >
                      {showMoons ? 'Hide' : 'Show'} Details
                    </button>
                  )}
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Atmospheric Composition: </span>
                  <span>{displayedPlanet?.displayStats.atmosphericComposition}</span>
                </p>
              </li>
              <li>
                <p>
                  <span className='font-semibold'>Surface Temperature: </span>
                  <span>{displayedPlanet?.displayStats.surfaceTemp}</span>
                </p>
              </li>
              {/* Special fields for Sun */}
              {displayedPlanet?.isSun && (
                <>
                  <li>
                    <p>
                      <span className='font-semibold'>Core Temperature: </span>
                      <span>{displayedPlanet?.displayStats.coreTemp}</span>
                    </p>
                  </li>
                  <li>
                    <p>
                      <span className='font-semibold'>Age: </span>
                      <span>{displayedPlanet?.displayStats.age}</span>
                    </p>
                  </li>
                  <li>
                    <p>
                      <span className='font-semibold'>Type: </span>
                      <span>{displayedPlanet?.displayStats.type}</span>
                    </p>
                  </li>
                </>
              )}
            </ul>
            )}

            {/* Moons section - desktop */}
            {hasMoons && showMoons && !displayedPlanet?.isMoon && (
              <div className='mt-4 p-4 bg-gray-800 bg-opacity-50 rounded-lg hidden lg:block'>
                <h5 className='text-base font-semibold text-blue-300 mb-3'>
                  Notable Moons ({displayedPlanet.moons.length})
                </h5>
                <div className='grid grid-cols-2 gap-3'>
                  {displayedPlanet.moons.map((moon, idx) => (
                    <div 
                      key={idx} 
                      className='text-sm p-2 bg-gray-700 bg-opacity-30 rounded cursor-pointer hover:bg-opacity-50 transition-all hover:scale-105'
                      onClick={() => handleMoonClick(moon)}
                    >
                      <span className='font-semibold text-gray-300 block'>{moon.name}</span>
                      <p className='text-xs text-gray-500 mt-1'>{moon.surfaceDetail}</p>
                    </div>
                  ))}
                </div>
                {selectedMoon && moonDetailedInfo && (
                  <div className='mt-4 p-4 bg-blue-900 bg-opacity-40 rounded-lg'>
                    <h6 className='text-base font-semibold text-blue-200 mb-2'>{selectedMoon}</h6>
                    <p className='text-sm text-gray-300 mb-3'>{moonDetailedInfo.description}</p>
                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      <div>
                        <p className='font-semibold text-gray-200'>Diameter</p>
                        <p className='text-gray-400'>{moonDetailedInfo.diameter}</p>
                      </div>
                      <div>
                        <p className='font-semibold text-gray-200'>Orbital Period</p>
                        <p className='text-gray-400'>{moonDetailedInfo.orbitalPeriod}</p>
                      </div>
                      <div>
                        <p className='font-semibold text-gray-200'>Mass</p>
                        <p className='text-gray-400'>{moonDetailedInfo.mass}</p>
                      </div>
                      <div>
                        <p className='font-semibold text-gray-200'>Discovered</p>
                        <p className='text-gray-400'>{moonDetailedInfo.discovered}</p>
                      </div>
                    </div>
                    {moonDetailedInfo.notableFacts && (
                      <div className='mt-3 pt-3 border-t border-gray-600'>
                        <p className='font-semibold text-gray-200 mb-2'>Notable Facts</p>
                        <ul className='text-sm space-y-1 list-disc list-inside'>
                          {moonDetailedInfo.notableFacts.slice(0, 3).map((fact, i) => (
                            <li key={i} className='text-gray-400'>{fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {moonDetailedInfo.gallery && moonDetailedInfo.gallery.length > 0 && (
                      <button
                        onClick={() => handleMoonClick(displayedPlanet.moons.find(m => m.name === selectedMoon))}
                        className='mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium'
                      >
                        View {selectedMoon} Gallery ({moonDetailedInfo.gallery.length} images)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Educational content - desktop */}
            {educationalContent && (
              <div className='mt-4 p-4 bg-blue-900 bg-opacity-30 rounded-lg hidden lg:block'>
                <h5 className='text-base font-semibold text-blue-300 mb-3'>
                  {displayedPlanet?.isMoon ? 'Exploration & Facts' : 'Did You Know?'}
                </h5>
                <ul className='text-sm space-y-2 list-disc list-inside'>
                  {educationalContent.funFacts.map((fact, idx) => (
                    <li key={idx} className='text-gray-300'>{fact}</li>
                  ))}
                </ul>
                {educationalContent.missions && (
                  <div className='mt-3 pt-3 border-t border-gray-700'>
                    <span className='text-sm font-semibold text-purple-300'>Active Missions: </span>
                    <span className='text-sm text-gray-400'>
                      {educationalContent.missions.join(', ')}
                    </span>
                  </div>
                )}
                {educationalContent.nextEvents && (
                  <div className='mt-2'>
                    <span className='text-sm font-semibold text-green-300'>Upcoming: </span>
                    <span className='text-sm text-gray-400'>
                      {educationalContent.nextEvents}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Image Gallery Modal */}
      {galleryOpen && galleryImages.length > 0 && (
        <ImageGallery
          images={galleryImages}
          initialIndex={0}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </AnimatePresence>
  );
};

export default PlanetDetail;
