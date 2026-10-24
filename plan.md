1. Use the `replace_with_git_merge_diff` tool to modify `./components/solar-system/contexts/SelectedPlanetContext.js` to split the context into `SelectedPlanetContext` and `SelectedPlanetActionsContext`. Add `useSelectedPlanetActions` hook.
```
<<<<<<< SEARCH
const SelectedPlanetContext = createContext(undefined);

export const useSelectedPlanet = () => {
  const context = useContext(SelectedPlanetContext);
  if (!context) {
    throw new Error('useSelectedPlanet must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const SelectedPlanetProvider = ({ children }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const value = useMemo(
    () => [selectedPlanet, setSelectedPlanet],
    [selectedPlanet]
  );

  return (
    <SelectedPlanetContext.Provider value={value}>
      {children}
    </SelectedPlanetContext.Provider>
  );
};
=======
const SelectedPlanetContext = createContext(undefined);
const SelectedPlanetActionsContext = createContext(undefined);

export const useSelectedPlanet = () => {
  const context = useContext(SelectedPlanetContext);
  if (context === undefined) {
    throw new Error('useSelectedPlanet must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const useSelectedPlanetActions = () => {
  const context = useContext(SelectedPlanetActionsContext);
  if (context === undefined) {
    throw new Error('useSelectedPlanetActions must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const SelectedPlanetProvider = ({ children }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const value = useMemo(() => selectedPlanet, [selectedPlanet]);
  const actionsValue = useMemo(() => ({ setSelectedPlanet }), []);

  return (
    <SelectedPlanetContext.Provider value={value}>
      <SelectedPlanetActionsContext.Provider value={actionsValue}>
        {children}
      </SelectedPlanetActionsContext.Provider>
    </SelectedPlanetContext.Provider>
  );
};
>>>>>>> REPLACE
```

2. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/celestial/Moons.js` to correctly use the separated hooks and avoid array destructuring for `useSelectedPlanet`.
```
<<<<<<< SEARCH
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
=======
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
>>>>>>> REPLACE
```
and
```
<<<<<<< SEARCH
  const { currentJulianDateRef } = useSimulationClock();
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
=======
  const { currentJulianDateRef } = useSimulationClock();
  const selectedPlanet = useSelectedPlanet();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { setCameraState } = useCameraContext();
>>>>>>> REPLACE
```

3. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/celestial/Planets.js` to correctly use the separated hooks and avoid array destructuring for `useSelectedPlanet`.
```
<<<<<<< SEARCH
import { usePlanetPositions } from '../contexts/PlanetPositionsContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
=======
import { usePlanetPositions } from '../contexts/PlanetPositionsContext';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
>>>>>>> REPLACE
```
and
```
<<<<<<< SEARCH
}) {
  const { updatePlanetPosition } = usePlanetPositions();
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
=======
}) {
  const { updatePlanetPosition } = usePlanetPositions();
  const selectedPlanet = useSelectedPlanet();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { setCameraState } = useCameraContext();
>>>>>>> REPLACE
```

4. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/celestial/Sun.js` to only use `useSelectedPlanetActions`.
```
<<<<<<< SEARCH
import { AdditiveBlending, Color, TextureLoader } from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
=======
import { AdditiveBlending, Color, TextureLoader } from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
>>>>>>> REPLACE
```
and
```
<<<<<<< SEARCH
  const outerGlowRef = useRef(null);

  const [, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
=======
  const outerGlowRef = useRef(null);

  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { setCameraState } = useCameraContext();
>>>>>>> REPLACE
```

5. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/motion/CameraController.js` to correctly use `useSelectedPlanet` without destructuring.
```
<<<<<<< SEARCH
  const scratchRef = useRef(new Vector3());
  const zeroRef = useRef(new Vector3());

  const { camera, size } = useThree();
  const [selectedPlanet] = useSelectedPlanet();
  const { planetPositionsRef } = usePlanetPositions();
=======
  const scratchRef = useRef(new Vector3());
  const zeroRef = useRef(new Vector3());

  const { camera, size } = useThree();
  const selectedPlanet = useSelectedPlanet();
  const { planetPositionsRef } = usePlanetPositions();
>>>>>>> REPLACE
```

6. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/ui/ControlMenu.js` to correctly use the separated hooks and avoid array destructuring for `useSelectedPlanet`.
```
<<<<<<< SEARCH
import { motion, useAnimationControls } from 'framer-motion';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
=======
import { motion, useAnimationControls } from 'framer-motion';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
>>>>>>> REPLACE
```
and
```
<<<<<<< SEARCH
const ControlMenu = () => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
=======
const ControlMenu = () => {
  const selectedPlanet = useSelectedPlanet();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { cameraState, setCameraState } = useCameraContext();
>>>>>>> REPLACE
```

7. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/ui/DeepLinkHandler.js` to correctly use the separated hooks and avoid array destructuring for `useSelectedPlanet`.
```
<<<<<<< SEARCH
import planetsData from '../lib/planetsData';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
=======
import planetsData from '../lib/planetsData';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
>>>>>>> REPLACE
```
and
```
<<<<<<< SEARCH
const DeepLinkHandler = () => {
  const hasInitializedRef = useRef(false);
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
=======
const DeepLinkHandler = () => {
  const hasInitializedRef = useRef(false);
  const selectedPlanet = useSelectedPlanet();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { cameraState, setCameraState } = useCameraContext();
>>>>>>> REPLACE
```

8. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/ui/KeyboardHandler.js` to correctly use the separated hooks and avoid array destructuring for `useSelectedPlanet`.
```
<<<<<<< SEARCH
import { useCallback, useEffect } from 'react';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
=======
import { useCallback, useEffect } from 'react';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
>>>>>>> REPLACE
```
and
```
<<<<<<< SEARCH
const KeyboardHandler = () => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
=======
const KeyboardHandler = () => {
  const selectedPlanet = useSelectedPlanet();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { cameraState, setCameraState } = useCameraContext();
>>>>>>> REPLACE
```

9. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/ui/PlanetDetail.js` to correctly use `useSelectedPlanet` without destructuring.
```
<<<<<<< SEARCH
const PlanetDetail = () => {
  const [selectedPlanet] = useSelectedPlanet();
  const { cameraState } = useCameraContext();
=======
const PlanetDetail = () => {
  const selectedPlanet = useSelectedPlanet();
  const { cameraState } = useCameraContext();
>>>>>>> REPLACE
```

10. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/ui/PlanetDetailBoundary.js` to correctly use `useSelectedPlanet` without destructuring.
```
<<<<<<< SEARCH
 */
export default function PlanetDetailBoundary() {
  const [selectedPlanet] = useSelectedPlanet();
  const detailKey = selectedPlanet
=======
 */
export default function PlanetDetailBoundary() {
  const selectedPlanet = useSelectedPlanet();
  const detailKey = selectedPlanet
>>>>>>> REPLACE
```

11. Use the `replace_with_git_merge_diff` tool to update `./components/solar-system/ui/PlanetMenu.js` to correctly use the separated hooks and avoid array destructuring for `useSelectedPlanet`.
```
<<<<<<< SEARCH
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
=======
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
>>>>>>> REPLACE
```
and
```
<<<<<<< SEARCH
const PlanetMenu = ({ planets }) => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { overrideSpeedFactor } = useSpeedControlActions();
=======
const PlanetMenu = ({ planets }) => {
  const selectedPlanet = useSelectedPlanet();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { overrideSpeedFactor } = useSpeedControlActions();
>>>>>>> REPLACE
```

12. Use the `write_file` tool to create/append a performance journal entry in `.jules/bolt.md` with the following explicit payload:
`## 2024-10-24 - Split SelectedPlanetContext for performance
**Learning:** Combining frequently updating state and stable setters in a single React Context causes heavy 3D components to unnecessarily re-render, wasting GPU/CPU cycles.
**Action:** Split them into separate State and Actions contexts, and exposed dedicated hooks for components that only need to dispatch actions.`

13. Use the `run_in_bash_session` tool to execute `cat .jules/bolt.md` to verify the journal entry was created successfully.

14. Use the `run_in_bash_session` tool to execute `pnpm install && pnpm run lint && pnpm run typecheck && pnpm run test:science && pnpm run build && pnpm run test:smoke && git restore package-lock.json && rm -f pnpm-lock.yaml` to verify the changes.

15. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

16. Use the `submit` tool to submit the changes with the following arguments:
- branch_name: `perf/split-selected-planet-context`
- title: `⚡ Bolt: Split SelectedPlanetContext to prevent unnecessary re-renders`
- commit_message: `perf: Split SelectedPlanetContext for performance`
- description: `**What**: Split SelectedPlanetContext into SelectedPlanetContext (state only) and SelectedPlanetActionsContext (setter only).\n**Why**: Combining frequently updating state and stable setters in a single React Context causes heavy 3D components to unnecessarily re-render, wasting GPU/CPU cycles.\n**Impact**: Reduces unnecessary re-renders in components that only need to dispatch actions (like Sun.js) or access state (like CameraController.js).\n**Measurement**: Improved frame stability and reduced CPU usage during planet selection.`
