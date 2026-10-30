// PlanetDetail.js - liquid-glass planet facts and NASA imagery
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { nasaAPI } from '../services/nasaAPI';
import ImageGallery from './ImageGallery';
import GlassButton from './GlassButton';
import GlassPanel from './GlassPanel';
import { ChevronIcon, ShareIcon } from './SpaceIcons';

const BODY_ACCENTS = {
  Sun: '255 190 92',
  Mercury: '188 191 198',
  Venus: '232 196 120',
  Earth: '92 166 255',
  Mars: '226 104 72',
  Jupiter: '216 178 143',
  Saturn: '238 211 155',
  Uranus: '143 220 232',
  Neptune: '92 118 255',
};

const formatNumber = (value) => {
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
};

const Metric = ({ label, value }) => (
  <div className="liquid-metric">
    <dt className="liquid-metric__label">{label}</dt>
    <dd className="liquid-metric__value">{value}</dd>
  </div>
);

const DataRow = ({ label, value }) => (
  <div className="liquid-data-row">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const PlanetDetail = () => {
  const selectedPlanet = useSelectedPlanet();
  const cameraState = useCameraContext();
  const displayedPlanet = selectedPlanet;
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
  const accent = BODY_ACCENTS[displayedPlanet?.name] || '137 197 255';
  const primaryStats = stats.slice(0, 4);
  const secondaryStats = stats.slice(4);

  return (
    <>
      <AnimatePresence>
        {shouldDisplayDetails && (
          <motion.aside
            key={displayedPlanet.name}
            aria-label={`${displayedPlanet.name} details`}
            className="liquid-detail-positioner"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassPanel accent={accent} className="liquid-detail-panel">
              <div className="liquid-sheet-handle sm:hidden" aria-hidden="true" />

              <div className="liquid-detail-scroll">
                <header className="liquid-detail-header">
                  <div className="min-w-0">
                    <p className="liquid-eyebrow">
                      {displayedPlanet.isMoon
                        ? 'Natural satellite'
                        : displayedPlanet.displayStats?.classification || 'Celestial body'}
                    </p>
                    <h1 className="liquid-detail-title">{displayedPlanet.name}</h1>
                    {displayedPlanet.isMoon && displayedPlanet.parentPlanet && (
                      <p className="liquid-detail-subtitle">Moon of {displayedPlanet.parentPlanet}</p>
                    )}
                  </div>

                  <GlassButton
                    onClick={handleShare}
                    iconOnly
                    aria-label={`Share ${displayedPlanet.name}`}
                    title={`Share ${displayedPlanet.name}`}
                    className="shrink-0"
                  >
                    <ShareIcon className="h-[17px] w-[17px]" />
                  </GlassButton>
                  <span className="sr-only" aria-live="polite">
                    {shareStatus}
                  </span>
                </header>

                {loadingNASA && !nasaImage && (
                  <div className="liquid-hero-skeleton" role="status" aria-live="polite">
                    <div className="h-full w-full animate-pulse bg-white/[0.05]" />
                    <span>Loading NASA imagery…</span>
                  </div>
                )}

                {nasaImage && (
                  <figure className="liquid-hero-figure">
                    <button
                      type="button"
                      onClick={handleImageClick}
                      className="liquid-hero-media group"
                      aria-label={`Open ${nasaImage.title || displayedPlanet.name} image`}
                    >
                      <Image
                        src={nasaImage.url}
                        alt={nasaImage.title || `NASA image of ${displayedPlanet.name}`}
                        fill
                        sizes="(max-width: 639px) calc(100vw - 2.75rem), 390px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                        loading="lazy"
                      />
                      <span className="liquid-hero-sheen" aria-hidden="true" />
                      <span className="liquid-hero-badge">NASA imagery</span>
                      <span className="liquid-hero-open">Open image</span>
                    </button>
                    <figcaption className="liquid-image-caption">
                      {[nasaImage.title, nasaImage.photographer].filter(Boolean).join(' — ')}
                    </figcaption>
                  </figure>
                )}

                <section className="liquid-section" aria-labelledby="facts-heading">
                  <div className="liquid-section-heading">
                    <div>
                      <p className="liquid-eyebrow">Reference values</p>
                      <h2 id="facts-heading">Key facts</h2>
                    </div>
                    <span>NASA & astronomy data</span>
                  </div>

                  {primaryStats.length > 0 && (
                    <dl className="liquid-metric-grid">
                      {primaryStats.map(([label, value]) => (
                        <Metric key={label} label={label} value={value} />
                      ))}
                    </dl>
                  )}

                  {secondaryStats.length > 0 && (
                    <dl className="liquid-data-list">
                      {secondaryStats.map(([label, value]) => (
                        <DataRow key={label} label={label} value={value} />
                      ))}
                    </dl>
                  )}
                </section>

                {hasMoons && !displayedPlanet.isMoon && (
                  <section className="liquid-section" aria-labelledby="moons-heading">
                    <button
                      type="button"
                      onClick={() => setShowMoons((current) => !current)}
                      aria-expanded={showMoons}
                      className="liquid-disclosure"
                    >
                      <span>
                        <span className="liquid-eyebrow">Satellite system</span>
                        <span id="moons-heading" className="liquid-disclosure__title">
                          Notable moons
                        </span>
                        <span className="liquid-disclosure__meta">
                          {displayedPlanet.moons.length} highlighted · {displayedPlanet.displayStats?.numberOfMoons} known
                        </span>
                      </span>
                      <ChevronIcon
                        className={`h-4 w-4 text-white/55 transition-transform duration-200 ${showMoons ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {showMoons && (
                      <div className="mt-3">
                        <div className="liquid-moon-list">
                          {displayedPlanet.moons.map((moon) => (
                            <button
                              type="button"
                              key={moon.name}
                              onClick={() => handleMoonClick(moon)}
                              aria-pressed={selectedMoon === moon.name}
                              className="liquid-moon-row"
                            >
                              <span>{moon.name}</span>
                              <span>{moon.surfaceDetail}</span>
                            </button>
                          ))}
                        </div>

                        {loadingMoon && (
                          <p className="liquid-inline-status" role="status">
                            Loading {selectedMoon} details…
                          </p>
                        )}

                        {selectedMoon && moonDetailedInfo && !loadingMoon && (
                          <div className="liquid-moon-detail">
                            <div>
                              <p className="liquid-eyebrow">Selected moon</p>
                              <h3>{selectedMoon}</h3>
                            </div>
                            {moonDetailedInfo.description && <p>{moonDetailedInfo.description}</p>}
                            <dl className="liquid-data-list liquid-data-list--compact">
                              {[
                                ['Diameter', moonDetailedInfo.diameter],
                                ['Orbital period', moonDetailedInfo.orbitalPeriod],
                                ['Mass', moonDetailedInfo.mass],
                                ['Discovered', moonDetailedInfo.discovered],
                              ]
                                .filter(([, value]) => value)
                                .map(([label, value]) => (
                                  <DataRow key={label} label={label} value={value} />
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
                                className="liquid-text-action"
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
                  <section className="liquid-section" aria-labelledby="learn-heading">
                    <div className="liquid-section-heading">
                      <div>
                        <p className="liquid-eyebrow">Context</p>
                        <h2 id="learn-heading">Field notes</h2>
                      </div>
                    </div>
                    <ul className="liquid-notes-list">
                      {funFacts.slice(0, 4).map((fact) => (
                        <li key={fact}>
                          <span aria-hidden="true" />
                          <p>{fact}</p>
                        </li>
                      ))}
                    </ul>
                    {missions.length > 0 && (
                      <p className="liquid-missions">
                        <span>Missions</span>
                        {missions.join(', ')}
                      </p>
                    )}
                  </section>
                )}

                <p className="liquid-detail-footnote">
                  Visual sizes and orbital distances are intentionally scaled for exploration. Reference values use real-world units.
                </p>
              </div>
            </GlassPanel>
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
