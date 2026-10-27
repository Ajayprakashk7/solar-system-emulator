'use client';

import PlanetDetail from './PlanetDetail';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';

/**
 * Remount the detail state machine when the selected celestial body changes.
 * This lets PlanetDetail keep request/UI state local without synchronously
 * clearing a long list of state variables from an effect on every selection.
 */
export default function PlanetDetailBoundary() {
  const selectedPlanet = useSelectedPlanet();
  const detailKey = selectedPlanet
    ? `${selectedPlanet.isMoon ? 'moon' : 'body'}:${selectedPlanet.parentPlanet || ''}:${selectedPlanet.id ?? selectedPlanet.name}`
    : 'none';

  return <PlanetDetail key={detailKey} />;
}
