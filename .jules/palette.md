## 2025-02-23 - Focus Styles Fix
**Learning:** The application sets global `*:focus-visible` to `border-radius: 4px;` in `app/globals.css`. Circular interactive elements like buttons that are using `rounded-full` will lose their shape when focused because the global selector applies standard rectangular borders.
**Action:** Add explicit `focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full` utility classes on all circular interactive elements to override this behavior and maintain the correct form.
