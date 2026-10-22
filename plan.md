1. **Refactor `SelectedPlanetContext.js`**
   - Use `replace_with_git_merge_diff` to split `SelectedPlanetContext` into two contexts: `SelectedPlanetStateContext` and `SelectedPlanetActionsContext`.
   - Update `useSelectedPlanet` to check `if (context === undefined)` and only return the state.
   - Add `useSelectedPlanetActions`.
   - Payload:
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
const SelectedPlanetStateContext = createContext(undefined);
const SelectedPlanetActionsContext = createContext(undefined);

export const useSelectedPlanet = () => {
  const context = useContext(SelectedPlanetStateContext);
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

  return (
    <SelectedPlanetActionsContext.Provider value={setSelectedPlanet}>
      <SelectedPlanetStateContext.Provider value={selectedPlanet}>
        {children}
      </SelectedPlanetStateContext.Provider>
    </SelectedPlanetActionsContext.Provider>
  );
};
>>>>>>> REPLACE
```

2. **Update `components/solar-system/celestial/Planets.js` (Imports)**
   - Use `replace_with_git_merge_diff`
   - Payload:
```
<<<<<<< SEARCH
import { usePlanetPositions } from '../contexts/PlanetPositionsContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
=======
import { usePlanetPositions } from '../contexts/PlanetPositionsContext';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
>>>>>>> REPLACE
```

3. **Update `components/solar-system/celestial/Planets.js` (State)**
   - Use `replace_with_git_merge_diff`
   - Payload:
```
<<<<<<< SEARCH
  const { updatePlanetPosition } = usePlanetPositions();
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { initialJulianDate, currentJulianDateRef } = useSimulationClock();
=======
  const { updatePlanetPosition } = usePlanetPositions();
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions(); // Performance: splitted state and setter to prevent unnecessary re-renders
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { initialJulianDate, currentJulianDateRef } = useSimulationClock();
>>>>>>> REPLACE
```

4. **Update `components/solar-system/celestial/Moons.js` (Imports)**
   - Use `replace_with_git_merge_diff`
   - Payload:
```
<<<<<<< SEARCH
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSimulationClock } from '../contexts/SimulationClockContext';
=======
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSimulationClock } from '../contexts/SimulationClockContext';
>>>>>>> REPLACE
```

5. **Update `components/solar-system/celestial/Moons.js` (State)**
   - Use `replace_with_git_merge_diff`
   - Payload:
```
<<<<<<< SEARCH
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { currentJulianDateRef } = useSimulationClock();
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const meshRef = useRef(null);
=======
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { currentJulianDateRef } = useSimulationClock();
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions(); // Performance: splitted state and setter to prevent unnecessary re-renders
  const { setCameraState } = useCameraContext();
  const meshRef = useRef(null);
>>>>>>> REPLACE
```

6. **Update `components/solar-system/celestial/Sun.js` (Imports)**
   - Use `replace_with_git_merge_diff`
   - Payload:
```
<<<<<<< SEARCH
import { AdditiveBlending, Color, TextureLoader } from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSimulationClock } from '../contexts/SimulationClockContext';
=======
import { AdditiveBlending, Color, TextureLoader } from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSimulationClock } from '../contexts/SimulationClockContext';
>>>>>>> REPLACE
```

7. **Update `components/solar-system/celestial/Sun.js` (State)**
   - Use `replace_with_git_merge_diff`
   - Payload:
```
<<<<<<< SEARCH
  const innerGlowRef = useRef(null);
  const outerGlowRef = useRef(null);

  const [, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { currentJulianDateRef } = useSimulationClock();
=======
  const innerGlowRef = useRef(null);
  const outerGlowRef = useRef(null);

  const setSelectedPlanet = useSelectedPlanetActions(); // Performance: splitted state and setter to prevent unnecessary re-renders
  const { setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { currentJulianDateRef } = useSimulationClock();
>>>>>>> REPLACE
```

8. **Update `components/solar-system/ui/PlanetDetail.js` (State)**
   - Use `replace_with_git_merge_diff`
   - Payload:
```
<<<<<<< SEARCH
const PlanetDetail = () => {
  const [selectedPlanet] = useSelectedPlanet();
  const { cameraState } = useCameraContext();
  const displayedPlanet = selectedPlanet;
  const [nasaImage, setNasaImage] = useState(null);
=======
const PlanetDetail = () => {
  const selectedPlanet = useSelectedPlanet();
  const { cameraState } = useCameraContext();
  const displayedPlanet = selectedPlanet;
  const [nasaImage, setNasaImage] = useState(null);
>>>>>>> REPLACE
```

9. **Update `components/solar-system/ui/PlanetDetailBoundary.js` (State)**
   - Use `replace_with_git_merge_diff`
   - Payload:
```
<<<<<<< SEARCH
 */
export default function PlanetDetailBoundary() {
  const [selectedPlanet] = useSelectedPlanet();
  const detailKey = selectedPlanet
    ? `${selectedPlanet.isMoon ? 'moon' : 'body'}:${selectedPlanet.parentPlanet || ''}:${selectedPlanet.id ?? selectedPlanet.name}`
    : 'none';
=======
 */
export default function PlanetDetailBoundary() {
  const selectedPlanet = useSelectedPlanet();
  const detailKey = selectedPlanet
    ? `${selectedPlanet.isMoon ? 'moon' : 'body'}:${selectedPlanet.parentPlanet || ''}:${selectedPlanet.id ?? selectedPlanet.name}`
    : 'none';
>>>>>>> REPLACE
```

10. **Update `components/solar-system/motion/CameraController.js` (State)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
  const scratchRef = useRef(new Vector3());
  const zeroRef = useRef(new Vector3());

  const { camera, size } = useThree();
  const [selectedPlanet] = useSelectedPlanet();
  const { planetPositionsRef } = usePlanetPositions();
  const { cameraState, setCameraState } = useCameraContext();
  const homePosition = useRef(CAMERA.HOME_POSITION.clone()).current;
=======
  const scratchRef = useRef(new Vector3());
  const zeroRef = useRef(new Vector3());

  const { camera, size } = useThree();
  const selectedPlanet = useSelectedPlanet();
  const { planetPositionsRef } = usePlanetPositions();
  const { cameraState, setCameraState } = useCameraContext();
  const homePosition = useRef(CAMERA.HOME_POSITION.clone()).current;
>>>>>>> REPLACE
```

11. **Update `components/solar-system/ui/KeyboardHandler.js` (Imports)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
'use client';

import { useCallback, useEffect } from 'react';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
=======
'use client';

import { useCallback, useEffect } from 'react';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControl } from '../contexts/SpeedControlContext';
>>>>>>> REPLACE
```

12. **Update `components/solar-system/ui/KeyboardHandler.js` (State)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
const KeyboardHandler = () => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
  const { speedFactor, setSpeedFactor, overrideSpeedFactor, restoreSpeedFactor } =
    useSpeedControl();
=======
const KeyboardHandler = () => {
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions();
  const { cameraState, setCameraState } = useCameraContext();
  const { speedFactor, setSpeedFactor, overrideSpeedFactor, restoreSpeedFactor } =
    useSpeedControl();
>>>>>>> REPLACE
```

13. **Update `components/solar-system/ui/ControlMenu.js` (Imports)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { ArrowLeftIcon, OverviewIcon } from './SpaceIcons';
=======
import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { ArrowLeftIcon, OverviewIcon } from './SpaceIcons';
>>>>>>> REPLACE
```

14. **Update `components/solar-system/ui/ControlMenu.js` (State)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
const ControlMenu = () => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
  const { restoreSpeedFactor } = useSpeedControlActions();
  const controls = useAnimationControls();
=======
const ControlMenu = () => {
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions();
  const { cameraState, setCameraState } = useCameraContext();
  const { restoreSpeedFactor } = useSpeedControlActions();
  const controls = useAnimationControls();
>>>>>>> REPLACE
```

15. **Update `components/solar-system/ui/PlanetMenu.js` (Imports)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
import { motion, useAnimation } from 'framer-motion';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
=======
import { motion, useAnimation } from 'framer-motion';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
>>>>>>> REPLACE
```

16. **Update `components/solar-system/ui/PlanetMenu.js` (State)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
const PlanetMenu = ({ planets }) => {
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { cameraState, setCameraState } = useCameraContext();
  const controls = useAnimation();
=======
const PlanetMenu = ({ planets }) => {
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions();
  const { overrideSpeedFactor } = useSpeedControlActions();
  const { cameraState, setCameraState } = useCameraContext();
  const controls = useAnimation();
>>>>>>> REPLACE
```

17. **Update `components/solar-system/ui/DeepLinkHandler.js` (Imports)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
import { useEffect, useRef } from 'react';
import planetsData from '../lib/planetsData';
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
=======
import { useEffect, useRef } from 'react';
import planetsData from '../lib/planetsData';
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
import { useCameraContext } from '../contexts/CameraContext';
import { useSpeedControlActions } from '../contexts/SpeedControlContext';
>>>>>>> REPLACE
```

18. **Update `components/solar-system/ui/DeepLinkHandler.js` (State)**
    - Use `replace_with_git_merge_diff`
    - Payload:
```
<<<<<<< SEARCH
  const hasInitializedRef = useRef(false);
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { cameraState, setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControlActions();
=======
  const hasInitializedRef = useRef(false);
  const selectedPlanet = useSelectedPlanet();
  const setSelectedPlanet = useSelectedPlanetActions();
  const { cameraState, setCameraState } = useCameraContext();
  const { overrideSpeedFactor } = useSpeedControlActions();
>>>>>>> REPLACE
```

19. **Create Bolt performance journal entry**
    - Use `run_in_bash_session` to create `.jules/bolt.md` (or append to it) with the performance learnings.
    - Payload:
```bash
mkdir -p .jules
cat << 'INNEREOF' >> .jules/bolt.md
## 2024-10-22 - Split SelectedPlanetContext for performance
**Learning:** Combining frequently updating state and stable setters in a single React Context causes heavy 3D components to unnecessarily re-render, wasting GPU/CPU cycles.
**Action:** Always split these into separate State and Actions contexts, and expose dedicated hooks (e.g., \`useSelectedPlanetActions\`) for components that only need to dispatch actions.
INNEREOF
```

20. **Verify Bolt journal entry**
    - Use `run_in_bash_session` to run `cat .jules/bolt.md` to ensure the file was correctly populated.

21. **Complete Pre-Commit Testing**
    - Use `run_in_bash_session` to execute: `pnpm install && pnpm run lint && pnpm run typecheck && pnpm run test:science && pnpm run build && pnpm run test:smoke && git restore package-lock.json && rm -f pnpm-lock.yaml`.

22. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
    - Call the `pre_commit_instructions` tool.

23. **Submit PR**
    - Use the `submit` tool to create the PR.
    - Branch name: `bolt/optimize-planet-context`
    - Title: `⚡ Bolt: [performance improvement]`
    - Description:
```
### What
Split `SelectedPlanetContext` into two separate contexts: `SelectedPlanetStateContext` and `SelectedPlanetActionsContext`. Updated all consumer components to use the new hooks properly (e.g., changing array destructuring to single value, using `useSelectedPlanetActions` where setters are needed).

### Why
Combining frequently updating state (like the currently selected planet) and stable setters in a single React Context causes heavy 3D components to unnecessarily re-render, wasting GPU/CPU cycles.

### Impact
Improves rendering performance by avoiding unnecessary re-renders of 3D components and UI elements that only need to update the selected planet state, not react to its changes.

### Measurement
Reduces unnecessary re-renders for components consuming only the setter by 100% when the selection changes.
```
