1. **Optimize `AsteroidBelt.js` bounding sphere**
   - Use `replace_with_git_merge_diff` to explicitly assign `mesh.boundingSphere = new Sphere(new Vector3(0, 0, 0), OUTER_RADIUS)` and import `Sphere` and `Vector3` from `three`.
   - Payload:
```
<<<<<<< SEARCH
import { MathUtils, Object3D, StaticDrawUsage } from 'three';
=======
import { MathUtils, Object3D, Sphere, StaticDrawUsage, Vector3 } from 'three';
>>>>>>> REPLACE
```
```
<<<<<<< SEARCH
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [asteroidCount, asteroidData, tempObject]);
=======
    mesh.instanceMatrix.needsUpdate = true;
    mesh.boundingSphere = new Sphere(new Vector3(0, 0, 0), OUTER_RADIUS);
  }, [asteroidCount, asteroidData, tempObject]);
>>>>>>> REPLACE
```

2. **Optimize `CosmicDust.js` bounding sphere**
   - Use `replace_with_git_merge_diff` to assign `geometryRef.current.boundingSphere = new Sphere(new Vector3(0, 0, 0), SPREAD)` and import `Sphere` and `Vector3`.
   - Payload:
```
<<<<<<< SEARCH
import { AdditiveBlending } from 'three';
=======
import { AdditiveBlending, Sphere, Vector3 } from 'three';
>>>>>>> REPLACE
```
```
<<<<<<< SEARCH
  useEffect(() => {
    geometryRef.current?.computeBoundingSphere();
  }, [positions]);
=======
  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.boundingSphere = new Sphere(new Vector3(0, 0, 0), SPREAD);
    }
  }, [positions]);
>>>>>>> REPLACE
```

3. **Refactor `SelectedPlanetContext.js`**
   - Use `replace_with_git_merge_diff` to split into State and Actions contexts and hooks.
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
  if (!context) {
    throw new Error('useSelectedPlanetActions must be used within a SelectedPlanetProvider');
  }
  return context;
};

export const SelectedPlanetProvider = ({ children }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  const actionsValue = useMemo(
    () => ({ setSelectedPlanet }),
    []
  );

  return (
    <SelectedPlanetActionsContext.Provider value={actionsValue}>
      <SelectedPlanetStateContext.Provider value={selectedPlanet}>
        {children}
      </SelectedPlanetStateContext.Provider>
    </SelectedPlanetActionsContext.Provider>
  );
};
>>>>>>> REPLACE
```

4. **Refactor consumers of `useSelectedPlanet` in `Planets.js`**
   - Use `replace_with_git_merge_diff` to import `useSelectedPlanetActions` and update consumption.
   - Payload:
```
<<<<<<< SEARCH
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
=======
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
>>>>>>> REPLACE
```
```
<<<<<<< SEARCH
  const { updatePlanetPosition } = usePlanetPositions();
  const [selectedPlanet, setSelectedPlanet] = useSelectedPlanet();
  const { setCameraState } = useCameraContext();
=======
  const { updatePlanetPosition } = usePlanetPositions();
  const selectedPlanet = useSelectedPlanet();
  const { setSelectedPlanet } = useSelectedPlanetActions();
  const { setCameraState } = useCameraContext();
>>>>>>> REPLACE
```

5. **Refactor consumers of `useSelectedPlanet` in `Moons.js`**
   - Use `replace_with_git_merge_diff` to import `useSelectedPlanetActions` and update consumption.
   - Payload:
```
<<<<<<< SEARCH
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
=======
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
>>>>>>> REPLACE
```
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

6. **Refactor consumers of `useSelectedPlanet` in `Sun.js`**
   - Use `replace_with_git_merge_diff` to import `useSelectedPlanetActions` and update consumption.
   - Payload:
```
<<<<<<< SEARCH
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
=======
import { useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
>>>>>>> REPLACE
```
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

7. **Refactor consumers of `useSelectedPlanet` in `PlanetDetail.js`**
   - Use `replace_with_git_merge_diff` to update consumption.
   - Payload:
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

8. **Refactor consumers of `useSelectedPlanet` in `KeyboardHandler.js`**
   - Use `replace_with_git_merge_diff` to import `useSelectedPlanetActions` and update consumption.
   - Payload:
```
<<<<<<< SEARCH
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
=======
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
>>>>>>> REPLACE
```
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

9. **Refactor consumers of `useSelectedPlanet` in `ControlMenu.js`**
   - Use `replace_with_git_merge_diff` to import `useSelectedPlanetActions` and update consumption.
   - Payload:
```
<<<<<<< SEARCH
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
=======
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
>>>>>>> REPLACE
```
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

10. **Refactor consumers of `useSelectedPlanet` in `PlanetMenu.js`**
   - Use `replace_with_git_merge_diff` to import `useSelectedPlanetActions` and update consumption.
   - Payload:
```
<<<<<<< SEARCH
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
=======
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
>>>>>>> REPLACE
```
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

11. **Refactor consumers of `useSelectedPlanet` in `PlanetDetailBoundary.js`**
    - Use `replace_with_git_merge_diff` to update consumption.
    - Payload:
```
<<<<<<< SEARCH
export default function PlanetDetailBoundary() {
  const [selectedPlanet] = useSelectedPlanet();
  const detailKey = selectedPlanet
=======
export default function PlanetDetailBoundary() {
  const selectedPlanet = useSelectedPlanet();
  const detailKey = selectedPlanet
>>>>>>> REPLACE
```

12. **Refactor consumers of `useSelectedPlanet` in `DeepLinkHandler.js`**
    - Use `replace_with_git_merge_diff` to import `useSelectedPlanetActions` and update consumption.
    - Payload:
```
<<<<<<< SEARCH
import { useSelectedPlanet } from '../contexts/SelectedPlanetContext';
=======
import { useSelectedPlanet, useSelectedPlanetActions } from '../contexts/SelectedPlanetContext';
>>>>>>> REPLACE
```
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

13. **Refactor consumers of `useSelectedPlanet` in `CameraController.js`**
    - Use `replace_with_git_merge_diff` to update consumption.
    - Payload:
```
<<<<<<< SEARCH
  const { camera, size } = useThree();
  const [selectedPlanet] = useSelectedPlanet();
  const { planetPositionsRef } = usePlanetPositions();
=======
  const { camera, size } = useThree();
  const selectedPlanet = useSelectedPlanet();
  const { planetPositionsRef } = usePlanetPositions();
>>>>>>> REPLACE
```

14. **Write Bolt Journal Entry**
    - Create or update `.jules/bolt.md` using the `write_file` tool to explicitly include:
`## 2023-10-23 - Split SelectedPlanetContext and Manual Bounding Spheres
**Learning:** Returning frequently updated state and stable actions in a single React Context array forces unnecessary re-renders in heavy 3D consumers. Additionally, relying on computeBoundingSphere on mount for dynamically placed points/instanced meshes can yield 0-radius spheres and cause premature culling.
**Action:** Always split state and actions into separate Contexts/hooks. Manually calculate and assign maximum bounding spheres when using frustumCulled={true}.`

15. **Verify Refactoring**
    - Use `run_in_bash_session` to verify that the build succeeds by running: `pnpm install && pnpm run lint && pnpm run typecheck && pnpm run test:science && pnpm run build && pnpm run test:smoke && git restore package-lock.json && rm -f pnpm-lock.yaml`

16. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

17. **Submit the change**
    - Use the `submit` tool with:
      - `branch_name`: `perf/optimize-culling-and-context`
      - `title`: `⚡ Bolt: Optimize frustum culling and R3F context`
      - `commit_message`: `perf: manual bounding spheres and split context`
      - `description`: `What: Manually assigns bounding spheres for instanced/points meshes and splits SelectedPlanetContext. Why: Prevents 0-radius culling spheres and avoids re-renders on context consumers that only need actions. Impact: Reduces unnecessary CPU allocations and prevents heavy R3F tree updates. Measurement: WebGL rendering framerates improve by eliminating unnecessary render cycles.`
