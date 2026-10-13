// PlanetDetail.js - responsive planet facts and NASA imagery
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { nasaAPI } from '../services/nasaAPI';
import ImageGallery from './ImageGallery';

const formatNumber = (value) => {
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
};

const Stat = ({ label, value }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
    <dt className="text-[11px] font-medium uppercase tracking-wide text-white/45">{label}</dt>
    <dd className="mt-1 text-sm leading-snug text-white/90">{value}</dd>
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
            className="fixed left-2 right-2 z-40 max-h-[58dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:left-5 sm:right-auto sm:top-20 sm:bottom-auto sm:max-h-[calc(100dvh-6rem)] sm:w-[min(32rem,calc(100vw-2.5rem))] sm:p-5"
            style={{ bottom: 'calc(5.75rem + env(safe-area-inset-bottom))' }}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <header className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  {displayedPlanet.name}
                </h1>
                {displayedPlanet.isMoon && displayedPlanet.parentPlanet && (
                  <p className="mt-1 text-sm font-medium text-blue-300">
                    Moon of {displayedPlanet.parentPlanet}
                  </p>
                )}
                <p className="mt-1 text-sm font-medium text-purple-300 sm:text-base">
                  {displayedPlanet.isMoon
                    ? moonDetailedInfo?.composition || 'Natural satellite'
                    : displayedPlanet.displayStats?.classification}
                </p>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="min-h-11 shrink-0 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-medium text-white/85 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                aria-label={`Share ${displayedPlanet.name}`}
              >
                {shareStatus || 'Share'}
              </button>
            </header>

            {loadingNASA && !nasaImage && (
              <div className="mb-4" role="status" aria-live="polite">
                <div className="aspect-[3/2] w-full max-w-sm animate-pulse rounded-xl bg-white/10" />
                <p className="mt-2 text-xs text-white/45">Loading NASA imagery…</p>
              </div>
            )}

            {nasaImage && (
              <figure className="mb-5">
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="group relative block aspect-[3/2] w-full max-w-sm overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label={`Open ${nasaImage.title || displayedPlanet.name} image`}
                >
                  <Image
                    src={nasaImage.url}
                    alt={nasaImage.title || `NASA image of ${displayedPlanet.name}`}
                    fill
                    sizes="(max-width: 640px) calc(100vw - 2rem), 384px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 text-left text-[11px] text-white/80 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Open image
                  </span>
                </button>
                <figcaption className="mt-1.5 max-w-sm text-[11px] leading-relaxed text-white/45">
                  {[nasaImage.title, nasaImage.photographer].filter(Boolean).join(' — ')}
                </figcaption>
              </figure>
            )}

            <section aria-labelledby="facts-heading">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 id="facts-heading" className="text-sm font-semibold text-white">
                  Key facts
                </h2>
                <span className="text-[10px] uppercase tracking-wide text-white/35">Reference values</span>
              </div>
              <dl className="grid grid-cols-2 gap-2">
                {stats.map(([label, value]) => (
                  <Stat key={label} label={label} value={value} />
                ))}
              </dl>
            </section>

            {hasMoons && !displayedPlanet.isMoon && (
              <section className="mt-5 border-t border-white/10 pt-4" aria-labelledby="moons-heading">
                <button
                  type="button"
                  onClick={() => setShowMoons((current) => !current)}
                  aria-expanded={showMoons}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  <span>
                    <span id="moons-heading" className="block text-sm font-semibold text-blue-200">
                      Notable moons
                    </span>
                    <span className="block text-[11px] text-white/40">
                      {displayedPlanet.moons.length} highlighted of {displayedPlanet.displayStats?.numberOfMoons} known
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-lg text-white/55">
                    {showMoons ? '−' : '+'}
                  </span>
                </button>

                {showMoons && (
                  <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                      {displayedPlanet.moons.map((moon) => (
                        <button
                          type="button"
                          key={moon.name}
                          onClick={() => handleMoonClick(moon)}
                          aria-pressed={selectedMoon === moon.name}
                          className={`min-h-11 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                            selectedMoon === moon.name
                              ? 'border-blue-400/50 bg-blue-500/15'
                              : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                          }`}
                        >
                          <span className="block text-sm font-medium text-white/90">{moon.name}</span>
                          <span className="mt-0.5 block text-[11px] text-white/45">{moon.surfaceDetail}</span>
                        </button>
                      ))}
                    </div>

                    {loadingMoon && (
                      <p className="rounded-xl bg-blue-500/10 p-3 text-xs text-blue-100" role="status">
                        Loading {selectedMoon} details…
                      </p>
                    )}

                    {selectedMoon && moonDetailedInfo && !loadingMoon && (
                      <div className="rounded-xl border border-blue-400/15 bg-blue-950/50 p-3">
                        <h3 className="text-sm font-semibold text-blue-100">{selectedMoon}</h3>
                        {moonDetailedInfo.description && (
                          <p className="mt-1.5 text-xs leading-relaxed text-white/65">
                            {moonDetailedInfo.description}
                          </p>
                        )}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          {[
                            ['Diameter', moonDetailedInfo.diameter],
                            ['Orbital period', moonDetailedInfo.orbitalPeriod],
                            ['Mass', moonDetailedInfo.mass],
                            ['Discovered', moonDetailedInfo.discovered],
                          ]
                            .filter(([, value]) => value)
                            .map(([label, value]) => (
                              <div key={label}>
                                <div className="text-white/40">{label}</div>
                                <div className="mt-0.5 text-white/80">{value}</div>
                              </div>
                            ))}
                        </div>
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
                            className="mt-3 min-h-11 w-full rounded-lg bg-blue-600/80 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
              <section className="mt-5 border-t border-white/10 pt-4" aria-labelledby="learn-heading">
                <h2 id="learn-heading" className="text-sm font-semibold text-blue-200">
                  Did you know?
                </h2>
                <ul className="mt-2 space-y-1.5 pl-4 text-xs leading-relaxed text-white/65 marker:text-blue-400">
                  {funFacts.slice(0, 5).map((fact) => (
                    <li key={fact} className="list-disc">
                      {fact}
                    </li>
                  ))}
                </ul>
                {missions.length > 0 && (
                  <p className="mt-3 text-xs leading-relaxed text-white/55">
                    <span className="font-semibold text-purple-300">Missions: </span>
                    {missions.join(', ')}
                  </p>
                )}
              </section>
            )}

            <p className="mt-5 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/35">
              Visual sizes and orbital distances are intentionally scaled for exploration; fact values use real-world reference units.
            </p>
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
