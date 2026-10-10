## 2025-05-23 - Prevent UI component re-renders from state-based hover
**Learning:** The SpeedControl component was using useState to manage an isHovering state for visual feedback, triggering a full React component re-render on every mouse enter/leave event. In a performance-critical 3D application, this wastes cycles on the main thread.
**Action:** Replaced React state-driven hover effects with native CSS/Tailwind hover: pseudo-classes to offload the work to the browser's CSS engine and eliminate unnecessary re-renders.
