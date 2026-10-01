## 2024-05-24 - React Context Re-Renders
**Learning:** React Contexts (`SelectedPlanetContext`, `CameraContext`, `SpeedControlContext`) are consumed by multiple UI components (`PlanetMenu`, `ControlMenu`, `SpeedControl`). Several of these UI components (`PlanetMenu`, `ControlMenu`, `SpeedControl`, `ExitButton`) aren't wrapped in `React.memo()`. This means anytime a parent renders, these UI components re-render even if their props haven't changed.
**Action:** Wrap these pure UI components with `React.memo` to optimize React rendering performance.
