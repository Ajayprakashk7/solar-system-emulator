// PlanetDetail.js - cinematic planet facts and NASA imagery
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { nasaAPI } from '../services/nasaAPI';
import ImageGallery from './ImageGallery';
import { ChevronIcon, ShareIcon } from './SpaceIcons';

const formatNumber = (value) => {
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
};

const Stat = ({ label, value }) => (
  <div className="space-stat">
    <dt className="space-kicker">{label}</dt>
    <dd className="mt-1 text-[13px] leading-snug text-white/[0.82]">{value}</dd>
  </div>
);

const PlanetDetail = () => {
  const [selectedPlanet] = useSelectedPlanet();
  const { cameraState } = useCameraContext();
  const [displayedPlanet, setDisplayedPlanet] = useState(selectedPlanet);
  const [nasaImage, setNasaImage] = useState(null);
  const [educationalContent, setEducationalContent] = useState(null);
  const [loadingNASA, setLoadingNASA] = useState(false);
  const [showMoons, setShowMoons] = useState(false);
  const [selectedMoon, setSelectedMoon] = useState(null);
  const [moonDetailedInfo, setMoonDetailedInfo] = useState(null);
  const [loadingMoon, setLoadingMoon] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [shareStatus, setShareStatus] = useState('');
  const moonRequestIdRef = useRef(0);

  useEffect(() => {
    if (!selectedPlanet) return;

    setDisplayedPlanet(selectedPlanet);
    setNasaImage(null);
    setEducationalContent(null);
    setShowMoons(false);
    setSelectedMoon(null);
    setMoonDetailedInfo(null);
    setGalleryOpen(false);
    setGalleryImages([]);
    setShareStatus('');
  }, [selectedPlanet]);

  useEffect(() => {
    if (!displayedPlanet || cameraState !== 'DETAIL_VIEW') return undefined;

    let cancelled = false;

    const fetchNASAData = async () => {
      setLoadingNASA(true);
      setNasaImage(null);
      setEducationalContent(null);

      try {
        if (displayedPlanet.isMoon) {
          const [imageData, eduContent, detailedInfo] = await Promise.all([
            nasaAPI.getMoonImage(displayedPlanet.name),
            nasaAPI.getMoonEducationalContent(displayedPlanet.name),
            nasaAPI.getMoonDetailedInfo(displayedPlanet.name),
          ]);

          if (cancelled) return;
          setNasaImage(imageData);
          setEducationalContent(eduContent);
          setMoonDetailedInfo(detailedInfo);
          setSelectedMoon(displayedPlanet.name);
          return;
        }

        const [imageData, eduContent] = await Promise.all([
          nasaAPI.getPlanetImage(displayedPlanet.name),
          nasaAPI.getPlanetEducationalContent(displayedPlanet.name),
        ]);

        if (cancelled) return;
        setNasaImage(imageData);
        setEducationalContent(eduContent);
      } catch (error) {
        if (!cancelled) {
          console.warn('[PlanetDetail] NASA data fetch failed:', error);
        }
      } finally {
        if (!cancelled) setLoadingNASA(false);
      }
    };

    fetchNASAData();
    return () => {
      cancelled = true;
    };
  }, [cameraState, displayedPlanet]);

  const openGallery = (images) => {
    const validImages = images.filter((image) => image?.url);
    if (validImages.length === 0) return;
    setGalleryImages(validImages);
    setGalleryOpen(true);
  };

  const handleImageClick = () => {
    if (!nasaImage) return;

    openGallery([
      {
        url: nasaImage.url,
        alt: nasaImage.title || `${displayedPlanet?.name} NASA image`,
        caption: [nasaImage.title, nasaImage.photographer].filter(Boolean).join(' — '),
      },
    ]);
  };

  const handleMoonClick = async (moon) => {
    if (!moon?.name) return;

    const requestId = moonRequestIdRef.current + 1;
    moonRequestIdRef.current = requestId;
    setSelectedMoon(moon.name);
    setMoonDetailedInfo(null);
    setLoadingMoon(true);

    try {
      const detailedInfo = await nasaAPI.getMoonDetailedInfo(moon.name);
      if (moonRequestIdRef.current === requestId) {
        setMoonDetailedInfo(detailedInfo);
      }
    } catch (error) {
      if (moonRequestIdRef.current === requestId) {
        console.warn(`[PlanetDetail] ${moon.name} details unavailable:`, error);
      }
    } finally {
      if (moonRequestIdRef.current === requestId) {
        setLoadingMoon(false);
      }
    }
  };

  const handleShare = async () => {
    if (!displayedPlanet) return;

    const url = new URL(window.location.href);
    const shareBody = displayedPlanet.isMoon
      ? displayedPlanet.parentPlanet || displayedPlanet.name
      : displayedPlanet.name;
    url.searchParams.set('body', shareBody);

    const shareData = {
      title: `${displayedPlanet.name} — Solar System Emulator`,
      text: `Explore ${displayedPlanet.name} in the interactive Solar System Emulator.`,
      url: url.toString(),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Shared');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        setShareStatus('Link copied');
      } else {
        setShareStatus('Copy the URL from your address bar');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setShareStatus('Unable to share');
      }
    }
  };

  const stats = useMemo(() => {
    if (!displayedPlanet) return [];

    if (displayedPlanet.isMoon && moonDetailedInfo) {
      return [
        ['Diameter', moonDetailedInfo.diameter],
        ['Mass', moonDetailedInfo.mass],
        ['Orbital period', moonDetailedInfo.orbitalPeriod],
        ['Discovered', moonDetailedInfo.discovered],
        ['Composition', moonDetailedInfo.composition],
        ['Surface', moonDetailedInfo.surfaceFeatures],
      ].filter(([, value]) => value);
    }

    const displayStats = displayedPlanet.displayStats;
    if (!displayStats) return [];

    const rotation = Number(displayStats.rotationPeriod);
    const rotationLabel = Number.isFinite(rotation)
      ? `${formatNumber(Math.abs(rotation))} Earth hours${rotation < 0 ? ' (retrograde)' : ''}`
      : displayStats.rotationPeriod;

    const commonStats = [
      [
        'Orbital period',
        displayedPlanet.isSun ? 'Solar System center' : `${formatNumber(displayStats.orbitalPeriod)} Earth days`,
      ],
      [
        'Distance from Sun',
        displayedPlanet.isSun ? '0 AU — Solar System center' : `${formatNumber(displayStats.meanDistanceFromSun)} AU`,
      ],
      ['Radius', `${formatNumber(displayStats.accurateRadius)} km`],
      ['Mass', `${formatNumber(displayStats.mass)} Earth masses`],
      ['Surface gravity', `${formatNumber(displayStats.surfaceGravity)} g`],
      ['Rotation period', rotationLabel],
      ['Axial tilt', `${formatNumber(displayStats.axialTilt)}°`],
      ['Known moons', formatNumber(displayStats.numberOfMoons)],
      ['Atmosphere', displayStats.atmosphericComposition],
      ['Temperature', displayStats.surfaceTemp],
    ];

    if (displayedPlanet.isSun) {
      commonStats.push(
        ['Core temperature', displayStats.coreTemp],
        ['Age', displayStats.age],
        ['Stellar type', displayStats.type]
      );
    }

    return commonStats.filter(([, value]) => value !== undefined && value !== null && value !== '');
  }, [displayedPlanet, moonDetailedInfo]);

  const hasMoons = Boolean(displayedPlanet?.moons?.length);
  const funFacts = educationalContent?.funFacts || [];
  const missions = educationalContent?.missions || [];
  const shouldDisplayDetails = cameraState === 'DETAIL_VIEW' && displayedPlanet;

  return (
    <>
      <AnimatePresence>
        {shouldDisplayDetails && (
          <motion.aside
            key={displayedPlanet.name}
            aria-label={`${displayedPlanet.name} details`}
            className="space-detail-shell fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto overscroll-contain px-5 pb-16 pt-3 sm:bottom-0 sm:left-0 sm:right-auto sm:top-0 sm:w-[34rem] sm:px-8 sm:pb-20 sm:pt-24"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="max-w-md">
              <header className="mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="space-kicker">
                      {displayedPlanet.isMoon ? 'Natural satellite' : 'Celestial body'}
                    </p>
                    <h1 className="mt-1 truncate text-5xl font-light tracking-[-0.055em] text-white sm:text-7xl">
                      {displayedPlanet.name}
                    </h1>
                    {displayedPlanet.isMoon && displayedPlanet.parentPlanet && (
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-white/[0.45]">
                        Moon of {displayedPlanet.parentPlanet}
                      </p>
                    )}
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/[0.62]">
                      {displayedPlanet.isMoon
                        ? moonDetailedInfo?.composition || 'Natural satellite'
                        : displayedPlanet.displayStats?.classification}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="space-control mt-1 shrink-0 px-3"
                    aria-label={`Share ${displayedPlanet.name}`}
                    title={`Share ${displayedPlanet.name}`}
                  >
                    <span className="space-control-icon">
                      <ShareIcon className="h-4 w-4" />
                    </span>
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
                <span className="sr-only" aria-live="polite">
                  {shareStatus}
                </span>
              </header>

              {loadingNASA && !nasaImage && (
                <div className="mb-7" role="status" aria-live="polite">
                  <div className="aspect-[16/10] w-full max-w-sm animate-pulse rounded-md bg-white/[0.06]" />
                  <p className="mt-2 text-[11px] text-white/[0.35]">Loading NASA imagery…</p>
                </div>
              )}

              {nasaImage && (
                <figure className="mb-7">
                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="group relative block aspect-[16/10] w-full max-w-sm overflow-hidden rounded-md border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    aria-label={`Open ${nasaImage.title || displayedPlanet.name} image`}
                  >
                    <Image
                      src={nasaImage.url}
                      alt={nasaImage.title || `NASA image of ${displayedPlanet.name}`}
                      fill
                      sizes="(max-width: 640px) calc(100vw - 2.5rem), 384px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent px-3 pb-2.5 pt-10 text-left text-[10px] uppercase tracking-[0.12em] text-white/[0.65] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      Open NASA image
                    </span>
                  </button>
                  <figcaption className="mt-2 max-w-sm text-[10px] leading-relaxed text-white/[0.35]">
                    {[nasaImage.title, nasaImage.photographer].filter(Boolean).join(' — ')}
                  </figcaption>
                </figure>
              )}

              <section aria-labelledby="facts-heading">
                <div className="mb-1 flex items-end justify-between gap-4">
                  <h2 id="facts-heading" className="text-sm font-medium text-white/[0.88]">
                    Reference data
                  </h2>
                  <span className="text-[9px] uppercase tracking-[0.14em] text-white/[0.28]">NASA & astronomy data</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-6">
                  {stats.map(([label, value]) => (
                    <Stat key={label} label={label} value={value} />
                  ))}
                </dl>
              </section>

              {hasMoons && !displayedPlanet.isMoon && (
                <section className="space-detail-section mt-7 pt-5" aria-labelledby="moons-heading">
                  <button
                    type="button"
                    onClick={() => setShowMoons((current) => !current)}
                    aria-expanded={showMoons}
                    className="flex min-h-11 w-full items-center justify-between text-left focus-visible:outline-none"
                  >
                    <span>
                      <span id="moons-heading" className="block text-sm font-medium text-white/[0.88]">
                        Notable moons
                      </span>
                      <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-white/[0.32]">
                        {displayedPlanet.moons.length} highlighted · {displayedPlanet.displayStats?.numberOfMoons} known
                      </span>
                    </span>
                    <ChevronIcon
                      className={`h-4 w-4 text-white/[0.45] transition-transform ${showMoons ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showMoons && (
                    <div className="mt-2">
                      <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                        {displayedPlanet.moons.map((moon) => (
                          <button
                            type="button"
                            key={moon.name}
                            onClick={() => handleMoonClick(moon)}
                            aria-pressed={selectedMoon === moon.name}
                            className="group flex min-h-11 w-full items-center justify-between gap-4 py-2.5 text-left focus-visible:outline-none"
                          >
                            <span
                              className={`text-sm transition-colors ${
                                selectedMoon === moon.name ? 'text-blue-200' : 'text-white/[0.72] group-hover:text-white'
                              }`}
                            >
                              {moon.name}
                            </span>
                            <span className="max-w-[55%] truncate text-[10px] text-white/30">
                              {moon.surfaceDetail}
                            </span>
                          </button>
                        ))}
                      </div>

                      {loadingMoon && (
                        <p className="py-3 text-xs text-white/[0.42]" role="status">
                          Loading {selectedMoon} details…
                        </p>
                      )}

                      {selectedMoon && moonDetailedInfo && !loadingMoon && (
                        <div className="mt-4 border-l border-blue-300/[0.35] pl-4">
                          <h3 className="text-sm font-medium text-white/90">{selectedMoon}</h3>
                          {moonDetailedInfo.description && (
                            <p className="mt-1.5 text-xs leading-relaxed text-white/[0.52]">
                              {moonDetailedInfo.description}
                            </p>
                          )}
                          <dl className="mt-3 grid grid-cols-2 gap-x-5">
                            {[
                              ['Diameter', moonDetailedInfo.diameter],
                              ['Orbital period', moonDetailedInfo.orbitalPeriod],
                              ['Mass', moonDetailedInfo.mass],
                              ['Discovered', moonDetailedInfo.discovered],
                            ]
                              .filter(([, value]) => value)
                              .map(([label, value]) => (
                                <Stat key={label} label={label} value={value} />
                              ))}
                          </dl>
                          {moonDetailedInfo.gallery?.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                openGallery(
                                  moonDetailedInfo.gallery.map((image) => ({
                                    url: image.url,
                                    alt: image.title || `${selectedMoon} NASA image`,
                                    caption: image.caption || image.title || '',
                                  }))
                                )
                              }
                              className="mt-3 text-xs font-medium text-blue-200/[0.85] underline decoration-blue-200/25 underline-offset-4 transition hover:text-blue-100 focus-visible:outline-none"
                            >
                              View NASA gallery ({moonDetailedInfo.gallery.length})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {funFacts.length > 0 && (
                <section className="space-detail-section mt-7 pt-5" aria-labelledby="learn-heading">
                  <h2 id="learn-heading" className="text-sm font-medium text-white/[0.88]">
                    Field notes
                  </h2>
                  <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-white/[0.52]">
                    {funFacts.slice(0, 5).map((fact) => (
                      <li key={fact} className="flex gap-3">
                        <span aria-hidden="true" className="mt-[0.45rem] h-px w-3 shrink-0 bg-white/25" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                  {missions.length > 0 && (
                    <p className="mt-4 text-xs leading-relaxed text-white/[0.42]">
                      <span className="space-kicker mr-2">Missions</span>
                      {missions.join(', ')}
                    </p>
                  )}
                </section>
              )}

              <p className="space-detail-section mt-7 pb-8 pt-4 text-[9px] leading-relaxed tracking-wide text-white/25">
                Visual sizes and orbital distances are intentionally scaled for exploration. Reference values use real-world units.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {galleryOpen && galleryImages.length > 0 && (
        <ImageGallery images={galleryImages} initialIndex={0} onClose={() => setGalleryOpen(false)} />
      )}
    </>
  );
};

export default PlanetDetail;
