## 2024-05-24 - Interactive Component Focus and Hover Styles
**Learning:** Found that some UI components like SpeedControl use React state (`isHovering`) to handle hover styles which causes re-renders and is not as performant or simple as CSS pseudo-classes. Also noticed missing `focus-visible` outlines on custom interactive `div` elements acting as buttons.
**Action:** Replace `isHovering` React state with Tailwind `hover:` classes. Add `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-blue-500` to custom `role="button"` elements.
