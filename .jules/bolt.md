## 2025-02-28 - Split Contexts for Performance
**Learning:** Returning a frequently changing state (like selected planet) alongside a static setter function in the same React context causes unnecessary re-renders in heavy 3D component consumers that only need to dispatch actions.
**Action:** Always split frequently changing state and stable actions into separate React contexts to prevent unnecessary renders in consumer components.
