/**
 * Accessibility utilities and hooks
 */

import { useEffect, useState, useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const getReducedMotionSnapshot = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

const getReducedMotionServerSnapshot = (): boolean => false;

const subscribeToReducedMotion = (onStoreChange: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
};

/**
 * Hook to detect if user prefers reduced motion.
 * Media queries are external browser state, so useSyncExternalStore keeps the
 * React snapshot in sync without a state-setting effect or hydration mismatch.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation<T>(
  items: T[],
  onSelect: (item: T) => void,
  enabled: boolean = true
) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (items[focusedIndex]) {
            onSelect(items[focusedIndex]);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, items, focusedIndex, onSelect]);

  return { focusedIndex, setFocusedIndex };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  window.setTimeout(() => {
    announcement.remove();
  }, 1000);
}

/**
 * Get ARIA label for celestial body
 */
export function getCelestialBodyLabel(body: Record<string, unknown>): string {
  if (body.isSun) {
    return 'Sun, G-type main-sequence star, center of our solar system';
  }

  if (body.isMoon) {
    return `${body.name}, moon of ${body.parentPlanet}, ${body.composition || 'natural satellite'}`;
  }

  const { name, displayStats } = body as {
    name?: string;
    displayStats?: {
      classification?: string;
      meanDistanceFromSun?: number;
      numberOfMoons?: number;
    };
  };
  const classification = displayStats?.classification || 'celestial body';
  const distance = displayStats?.meanDistanceFromSun
    ? `${displayStats.meanDistanceFromSun} AU from Sun`
    : '';
  const moons = displayStats?.numberOfMoons
    ? `with ${displayStats.numberOfMoons} moon${displayStats.numberOfMoons !== 1 ? 's' : ''}`
    : '';

  return `${name}, ${classification}${distance ? ', ' + distance : ''}${moons ? ', ' + moons : ''}`;
}

/**
 * Focus trap for modals
 */
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const focusableElements = document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);
}
