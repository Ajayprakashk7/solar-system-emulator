## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]

## 2024-05-18 - Avoid array allocations in `updatePlanetPosition` context
**Learning:** React contexts that use callbacks per-frame like `updatePlanetPosition` create massive garbage collection pressure if they expect arrays/objects. Passing arrays directly into Context updates per-frame causes continuous GC churn, even with `useRef`.
**Action:** Mutate a pre-allocated Float32Array in place in `updatePlanetPosition` instead of replacing the entire array reference every frame. This drastically reduces GC overhead in the `useFrame` hot path.
