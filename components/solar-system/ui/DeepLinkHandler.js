'use client';

import { useEffect, useState } from 'react';
import planetsData from '../lib/planetsData';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';

const DeepLinkHandler = () => {
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControl();

  useEffect(() => {
    if (hasInitialized || cameraState !== 'FREE') return;

    const requestedBody = new URLSearchParams(window.location.search).get('body');
    const matchingPlanet = requestedBody
      ? planetsData.find(
          (planet) => planet.name.toLowerCase() === requestedBody.trim().toLowerCase()
        )
      : null;

    setHasInitialized(true);

    if (matchingPlanet) {
      setSelectedPlanet(matchingPlanet);
      overrideSpeedFactor();
      setCameraState('ZOOMING_IN');
    }
  }, [cameraState, hasInitialized, overrideSpeedFactor, setCameraState, setSelectedPlanet]);

  useEffect(() => {
    if (!hasInitialized) return;

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
  }, [cameraState, hasInitialized, selectedPlanet]);

  return null;
};

export default DeepLinkHandler;
