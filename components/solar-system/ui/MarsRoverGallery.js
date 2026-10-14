'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { nasaAPI } from '../services/nasaAPI';
import ImageGallery from './ImageGallery';

const MarsRoverGallery = () => {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchPhoto = async () => {
      setLoading(true);
      try {
        const data = await nasaAPI.getMarsRoverPhoto();
        if (data && data.img_src) {
          setPhoto(data);
        } else {
          setError('No recent photos available.');
        }
      } catch (err) {
        console.warn('Failed to load Mars rover photo:', err);
        setError('Failed to load Mars rover photo.');
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, []);

  if (loading) {
    return (
      <div className="liquid-hero-skeleton" role="status" aria-live="polite">
        <div className="h-full w-full animate-pulse bg-white/[0.05]" />
        <span>Loading latest Curiosity photo…</span>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <p className="liquid-inline-status" role="status">
        {error || 'No photo available at this time.'}
      </p>
    );
  }

  return (
    <>
      <figure className="liquid-hero-figure mt-3">
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          className="liquid-hero-media group h-48"
          aria-label="Open Mars rover image"
        >
          <Image
            src={photo.img_src}
            alt={`Mars surface captured by ${photo.rover} rover`}
            fill
            sizes="(max-width: 639px) calc(100vw - 2.75rem), 390px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            loading="lazy"
          />
          <span className="liquid-hero-sheen" aria-hidden="true" />
          <span className="liquid-hero-badge">Latest from {photo.rover}</span>
          <span className="liquid-hero-open">Open image</span>
        </button>
        <figcaption className="liquid-image-caption">
          Taken by {photo.camera} on Earth date {photo.earth_date}
        </figcaption>
      </figure>

      {galleryOpen && (
        <ImageGallery
          images={[{
            url: photo.img_src,
            alt: `Mars surface captured by ${photo.rover} rover`,
            caption: `Taken by ${photo.camera} on Earth date ${photo.earth_date}`,
          }]}
          initialIndex={0}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
};

export default MarsRoverGallery;
