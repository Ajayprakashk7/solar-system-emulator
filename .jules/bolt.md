## 2023-10-24 - Avoid React State for Hover Effects
**Learning:** Using `useState` paired with `onMouseEnter` and `onMouseLeave` to trigger UI hover styles causes unnecessary component re-renders every time the mouse moves in or out.
**Action:** Always prefer native CSS pseudo-classes (e.g., Tailwind's `hover:` prefix) over React state for purely visual hover effects to minimize re-renders and improve frontend performance.
