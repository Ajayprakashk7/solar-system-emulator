'use client';

import { useEffect, useRef } from 'react';
import planetsData from '../lib/planetsData';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';

const DeepLinkHandler = () => {
  const hasInitializedRef = useRef(false);
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControl();

  useEffect(() => {
    if (hasInitializedRef.current || cameraState !== 'FREE') return;

    hasInitializedRef.current = true;

    const url = new URL(window.location.href);
    const requestedBody = url.searchParams.get('body');
    const matchingPlanet = requestedBody
      ? planetsData.find(
          (planet) => planet.name.toLowerCase() === requestedBody.trim().toLowerCase()
        )
      : null;

    if (matchingPlanet) {
      setSelectedPlanet(matchingPlanet);
      overrideSpeedFactor();
      setCameraState('ZOOMING_IN');
      return;
    }

    // Remove invalid deep-link values instead of leaving a URL that suggests a
    // body is selected when no matching body exists.
    if (requestedBody) {
      url.searchParams.delete('body');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [cameraState, overrideSpeedFactor, setCameraState, setSelectedPlanet]);

  useEffect(() => {
    if (!hasInitializedRef.current) return;

    const url = new URL(window.location.href);

    if (selectedPlanet && !selectedPlanet.isMoon) {
      if (url.searchParams.get('body') !== selectedPlanet.name) {
        url.searchParams.set('body', selectedPlanet.name);
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      }
      return;
    }

    if (!selectedPlanet && cameraState === 'FREE' && url.searchParams.has('body')) {
      url.searchParams.delete('body');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [cameraState, selectedPlanet]);

  return null;
};

export default DeepLinkHandler;
