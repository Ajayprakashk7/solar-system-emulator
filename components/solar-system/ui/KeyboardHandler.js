'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
import planetsData from '../lib/planetsData';
import { useRouter } from 'next/navigation';

const KeyboardHandler = () => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
  const { speedFactor, setSpeedFactor, overrideSpeedFactor, restoreSpeedFactor } = useSpeedControl();
  const router = useRouter();

  // O(1) lookup for planet index
  const planetIdToIndexMap = useMemo(() => {
    const map = new Map();
    planetsData.forEach((p, index) => map.set(p.id, index));
    return map;
  }, []);

  const currentPlanetIndex = useMemo(() => {
    if (!selectedPlanet) return -1;
    const index = planetIdToIndexMap.get(selectedPlanet.id);
    return index !== undefined ? index : -1;
  }, [selectedPlanet, planetIdToIndexMap]);

  // Planet navigation
  const selectPlanetByIndex = useCallback((index) => {
    if (index >= 0 && index < planetsData.length) {
      const planet = planetsData[index];
      setSelectedPlanet(planet);
      overrideSpeedFactor();
      setCameraState('ZOOMING_IN');
    }
  }, [setSelectedPlanet, overrideSpeedFactor, setCameraState]);

  // Speed control functions
  const speedPresets = useMemo(() => [0, 0.5, 1, 2, 5], []);
  
  const currentSpeedIndex = useMemo(() => {
    const index = speedPresets.findIndex(speed => Math.abs(speedFactor - speed) < 0.1);
    return index !== -1 ? index : 2; // Default to normal speed if not found
  }, [speedFactor, speedPresets]);

  const cycleSpeedUp = useCallback(() => {
    const nextIndex = Math.min(currentSpeedIndex + 1, speedPresets.length - 1);
    setSpeedFactor(speedPresets[nextIndex]);
  }, [currentSpeedIndex, setSpeedFactor, speedPresets]);

  const cycleSpeedDown = useCallback(() => {
    const nextIndex = Math.max(currentSpeedIndex - 1, 0);
    setSpeedFactor(speedPresets[nextIndex]);
  }, [currentSpeedIndex, setSpeedFactor, speedPresets]);

  // Navigation functions
  const goHome = useCallback(() => {
    setCameraState('MOVING_TO_HOME');
    setSelectedPlanet(null);
    restoreSpeedFactor();
  }, [setCameraState, setSelectedPlanet, restoreSpeedFactor]);

  const exitView = useCallback(() => {
    if (selectedPlanet && cameraState === 'DETAIL_VIEW') {
      setCameraState('MOVING_TO_HOME');
      setSelectedPlanet(null);
      restoreSpeedFactor();
    }
  }, [selectedPlanet, cameraState, setCameraState, setSelectedPlanet, restoreSpeedFactor]);

  const exitSolarSystem = useCallback(() => {
    router.push('/secret/orbital-command-center');
  }, [router]);

  // Main keyboard event handler
  const handleKeyDown = useCallback((event) => {
    // Prevent default behavior for handled keys
    const handledKeys = [
      'Escape', 'Space', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8',
      'KeyS', 'KeyM', 'KeyV', 'KeyE', 'KeyJ', 'KeyU', 'KeyN', 'KeyP', 'KeyQ', 'KeyH', 'KeyR',
      'F1', 'Slash'
    ];

    if (handledKeys.includes(event.code)) {
      event.preventDefault();
    }

    // Skip if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.code) {
      // Navigation
      case 'Escape':
        if (selectedPlanet && cameraState === 'DETAIL_VIEW') {
          exitView();
        } else {
          exitSolarSystem();
        }
        break;

      case 'KeyH':
      case 'Home':
        goHome();
        break;

      // Speed Control
      case 'Space':
        setSpeedFactor(speedFactor === 0 ? 1 : 0); // Play/Pause
        break;

      case 'ArrowUp':
      case 'Equal': // + key
        cycleSpeedUp();
        break;

      case 'ArrowDown':
      case 'Minus': // - key
        cycleSpeedDown();
        break;

      case 'KeyR':
        setSpeedFactor(1); // Reset to normal speed
        break;

      // Planet Selection (Numbers 0-8)
      case 'Digit0':
        selectPlanetByIndex(0); // Sun
        break;
      case 'Digit1':
        selectPlanetByIndex(1); // Mercury
        break;
      case 'Digit2':
        selectPlanetByIndex(2); // Venus
        break;
      case 'Digit3':
        selectPlanetByIndex(3); // Earth
        break;
      case 'Digit4':
        selectPlanetByIndex(4); // Mars
        break;
      case 'Digit5':
        selectPlanetByIndex(5); // Jupiter
        break;
      case 'Digit6':
        selectPlanetByIndex(6); // Saturn
        break;
      case 'Digit7':
        selectPlanetByIndex(7); // Uranus
        break;
      case 'Digit8':
        selectPlanetByIndex(8); // Neptune
        break;

      // Planet Selection (Letter shortcuts)
      case 'KeyS':
        selectPlanetByIndex(0); // Sun
        break;
      case 'KeyM':
        selectPlanetByIndex(1); // Mercury
        break;
      case 'KeyV':
        selectPlanetByIndex(2); // Venus
        break;
      case 'KeyE':
        selectPlanetByIndex(3); // Earth
        break;
      case 'KeyJ':
        selectPlanetByIndex(4); // Mars (J for Jupiter-like, but Mars)
        break;
      case 'KeyU':
        selectPlanetByIndex(5); // Jupiter (U for jUpiter)
        break;
      case 'KeyN':
        selectPlanetByIndex(6); // Saturn (N for saturN)
        break;
      case 'KeyP':
        selectPlanetByIndex(7); // Uranus (P for uranuS, but P)
        break;
      case 'KeyQ':
        selectPlanetByIndex(8); // Neptune (Q for neptune)
        break;

      // Arrow key navigation through planets
      case 'ArrowLeft':
        if (selectedPlanet && currentPlanetIndex !== -1) {
          const prevIndex = currentPlanetIndex > 0 ? currentPlanetIndex - 1 : planetsData.length - 1;
          selectPlanetByIndex(prevIndex);
        } else {
          selectPlanetByIndex(0);
        }
        break;

      case 'ArrowRight':
        if (selectedPlanet && currentPlanetIndex !== -1) {
          const nextIndex = currentPlanetIndex < planetsData.length - 1 ? currentPlanetIndex + 1 : 0;
          selectPlanetByIndex(nextIndex);
        } else {
          selectPlanetByIndex(0);
        }
        break;

      default:
        break;
    }
  }, [
    selectedPlanet,
    cameraState,
    speedFactor,
    selectPlanetByIndex,
    cycleSpeedUp,
    cycleSpeedDown,
    goHome,
    exitView,
    exitSolarSystem,
    setSpeedFactor,
    currentPlanetIndex
  ]);

  // Attach keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // This component doesn't render anything
  return null;
};

export default KeyboardHandler;
