## 2024-10-14 - Redundant screen reader announcements on responsive hidden text
**Learning:** Using Tailwind's responsive hiding classes (e.g., `hidden sm:inline`) on meaningful text next to a decorative icon causes screen readers to announce the icon redundantly or incorrectly when the text is hidden.
**Action:** When hiding text that makes an icon-only button accessible on smaller viewports, ensure the parent button has an `aria-label` and apply `aria-hidden="true"` to the wrapper of the decorative icon to prevent redundant announcements.
