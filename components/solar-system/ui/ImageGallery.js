// ImageGallery.js - full-screen image viewer with zoom and navigation
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './ImageGallery.module.css';
import { ArrowLeftIcon, CloseIcon } from './SpaceIcons';

export default function ImageGallery({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const closeButtonRef = useRef(null);

  const currentImage = images[currentIndex];

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((previous) => (previous + 1) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((previous) => (previous - 1 + images.length) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'z':
        case 'Z':
          event.preventDefault();
          setIsZoomed((current) => !current);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const onTouchStart = (event) => {
    touchEndRef.current = null;
    touchStartRef.current = event.targetTouches[0]?.clientX ?? null;
  };

  const onTouchMove = (event) => {
    touchEndRef.current = event.targetTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = () => {
    const touchStart = touchStartRef.current;
    const touchEnd = touchEndRef.current;
    if (touchStart == null || touchEnd == null || isZoomed) return;

    const distance = touchStart - touchEnd;
    const minimumSwipeDistance = 50;

    if (distance > minimumSwipeDistance) {
      goToNext();
    } else if (distance < -minimumSwipeDistance) {
      goToPrevious();
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!currentImage) return null;

  return (
    <div
      className={styles.galleryOverlay}
      onClick={handleBackdropClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="NASA image gallery"
    >
      <div className={styles.galleryHeader}>
        <div>
          <p className={styles.galleryLabel}>NASA imagery</p>
          <div className={styles.imageCounter} aria-live="polite">
            {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </div>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close image gallery"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className={`${styles.imageContainer} ${isZoomed ? styles.zoomed : ''}`}>
        <button
          type="button"
          className={styles.imageWrapper}
          onClick={() => setIsZoomed((current) => !current)}
          aria-label={isZoomed ? 'Zoom image out' : 'Zoom image in'}
          aria-pressed={isZoomed}
        >
          <Image
            src={currentImage.url}
            alt={currentImage.alt || currentImage.title || 'NASA image'}
            fill
            sizes="100vw"
            className={styles.galleryImage}
            quality={95}
            priority
          />
        </button>
      </div>

      {currentImage.caption && (
        <div className={styles.imageCaption}>
          <p>{currentImage.caption}</p>
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navPrevious}`}
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navNext}`}
            onClick={goToNext}
            aria-label="Next image"
          >
            <ArrowLeftIcon className="h-5 w-5 rotate-180" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className={styles.thumbnailStrip} aria-label="Gallery thumbnails">
          {images.map((image, index) => (
            <button
              type="button"
              key={`${image.url}-${index}`}
              className={`${styles.thumbnail} ${index === currentIndex ? styles.thumbnailActive : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                setIsZoomed(false);
              }}
              aria-label={`View image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            >
              <Image
                src={image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                width={80}
                height={60}
                className={styles.thumbnailImage}
              />
            </button>
          ))}
        </div>
      )}

      <div className={styles.controlsHint} aria-hidden="true">
        {isZoomed ? 'Tap to fit' : 'Tap to inspect'}
        {images.length > 1 ? ' · Swipe or use arrow keys' : ''}
        {' · Esc to close'}
      </div>
    </div>
  );
}
