## 2024-05-24 - Fix circular button focus states
**Learning:** Global CSS focus-visible rules with fixed border-radius break focus rings on circular UI elements, looking unpolished and confusing during keyboard navigation.
**Action:** Always apply explicit Tailwind focus utilities (`focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full`) to circular interactive elements to ensure the focus ring matches the element's shape.
