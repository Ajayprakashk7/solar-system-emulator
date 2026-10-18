'use client';

import { useEffect, useRef } from 'react';
import planetsData from '../lib/planetsData';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext, useCameraActions } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';

const DeepLinkHandler = () => {
  const hasInitializedRef = useRef(false);
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions();
  const cameraState = useCameraContext();
  const setCameraState = useCameraActions();
  const { overrideSpeedFactor } = useSpeedControlActions();

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
