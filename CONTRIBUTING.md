# Contributing to Solar System Emulator

Thank you for your interest in contributing to the **Solar System Emulator**! 🚀 We welcome contributions from everyone, whether you're fixing bugs, adding features, improving documentation, or suggesting ideas.

This guide will help you get started quickly and ensure your contributions align with the project's standards.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Guidelines](#development-guidelines)
  - [Branch Naming](#branch-naming)
  - [Commit Messages](#commit-messages)
  - [Code Style](#code-style)
  - [TypeScript Guidelines](#typescript-guidelines)
  - [Component Guidelines](#component-guidelines)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Questions & Support](#questions--support)
- [License](#license)

---

## Code of Conduct

We expect all contributors to be respectful and professional. By participating, you agree to:

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

Please report any unacceptable behavior to [ajayprakashk7@gmail.com](mailto:ajayprakashk7@gmail.com).

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **NASA API Key** (optional but recommended) — [Get one here](https://api.nasa.gov/)

### Local Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/solar-system-emulator.git
   cd solar-system-emulator
   ```

3. **Add upstream remote** (to sync with the main repo)

   ```bash
   git remote add upstream https://github.com/Ajayprakashk7/solar-system-emulator.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   # Add your NASA API key to .env.local
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue using our [Bug Report template](https://github.com/Ajayprakashk7/solar-system-emulator/issues/new?template=bug_report.md) with:

- **Clear, descriptive title**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Browser/device information** (e.g., Chrome 120, iPhone 15)
- **Screenshots or screen recordings** (if applicable)
- **Console errors** (copy from browser DevTools)

### Suggesting Features

Feature requests are welcome! Use our [Feature Request template](https://github.com/Ajayprakashk7/solar-system-emulator/issues/new?template=feature_request.md) and:

- **Check if the feature has already been requested** (search existing issues)
- **Clearly describe the feature** and its benefits
- **Provide examples or mockups** if possible
- **Explain the use case** — why is this valuable?

### Submitting Pull Requests

Follow these steps to contribute code:

#### 1. Sync with upstream

```bash
git checkout main
git pull upstream main
```

#### 2. Create a feature branch

Use descriptive branch names (see [Branch Naming](#branch-naming)):

```bash
git checkout -b feat/add-pluto-support
```

#### 3. Make your changes

- Follow the [Code Style](#code-style) guidelines
- Add **TypeScript types** for new features
- Include **JSDoc comments** for utilities
- Test on **desktop and mobile**
- Update documentation if needed

#### 4. Test your changes

```bash
npm run lint        # ESLint check
npm run build       # Production build test
npx tsc --noEmit    # TypeScript type check
npm run dev         # Manual testing
```

#### 5. Commit your changes

Use [Conventional Commits](#commit-messages):

```bash
git add .
git commit -m "feat: add Pluto as a dwarf planet option"
```

#### 6. Push to your fork

```bash
git push origin feat/add-pluto-support
```

#### 7. Create a Pull Request

- Go to your fork on GitHub
- Click **"Compare & pull request"**
- Fill out the [PR template](https://github.com/Ajayprakashk7/solar-system-emulator/blob/main/.github/PULL_REQUEST_TEMPLATE.md)
- **Provide a clear description** of changes
- **Reference related issues** (e.g., "Closes #42")
- **Include screenshots** for UI changes
- **Ensure all CI checks pass**

---

## Development Guidelines

### Branch Naming

Use descriptive branch names with these prefixes:

| Prefix       | Purpose                                  | Example                          |
|--------------|------------------------------------------|----------------------------------|
| `feat/`      | New features                             | `feat/add-asteroid-belt`         |
| `fix/`       | Bug fixes                                | `fix/mars-rotation-speed`        |
| `docs/`      | Documentation updates                    | `docs/update-contributing-guide` |
| `style/`     | Code style changes (no logic change)     | `style/format-planet-component`  |
| `refactor/`  | Code refactoring                         | `refactor/extract-moon-hook`     |
| `test/`      | Adding or updating tests                 | `test/add-orbit-calculation`     |
| `chore/`     | Maintenance tasks (deps, config)         | `chore/upgrade-nextjs-15`        |
| `perf/`      | Performance improvements                 | `perf/optimize-texture-loading`  |

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history:

**Format:**
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code formatting (no logic change)
- `refactor:` — Code refactoring
- `perf:` — Performance improvements
- `test:` — Adding/updating tests
- `chore:` — Maintenance tasks

**Examples:**
```bash
feat: add Jupiter's Europa moon with subsurface ocean
fix: resolve planet collision detection on mobile
docs: update README with Vercel deployment steps
perf: reduce texture memory usage by 40%
refactor: extract orbital mechanics into separate hook
```

### Code Style

- **JavaScript/TypeScript:** Follow the ESLint configuration
- **Formatting:** Use Prettier (runs automatically on save)
- **Naming conventions:**
  - `camelCase` for variables and functions
  - `PascalCase` for React components and TypeScript types
  - `UPPER_SNAKE_CASE` for constants
- **File naming:**
  - Components: `PlanetCard.tsx`
  - Utilities: `calculateOrbit.ts`
  - Hooks: `useKeyboardControls.ts`

### TypeScript Guidelines

- **Add types for all new functions and components**
- Use **interfaces** over `type` for object shapes
- **Avoid `any`** — use `unknown` if type is truly unknown
- **Export types** that might be reused

**Example:**
```typescript
interface PlanetProps {
  name: string;
  radius: number;
  orbitSpeed: number;
  texture: string;
}

export function Planet({ name, radius, orbitSpeed, texture }: PlanetProps) {
  // ...
}
```

### Component Guidelines

- **Keep components focused** and single-purpose
- Extract reusable logic into **custom hooks**
- Use **React contexts sparingly** (prefer props or state management)
- Prefer **composition over props drilling**
- **Memoize expensive components** with `React.memo()`
- **Dispose Three.js resources properly** to avoid memory leaks

### Performance

- Test on **low-end devices**
- Use `React.memo()` for expensive components
- **Dispose Three.js geometries/materials** in cleanup
- Profile with **Chrome DevTools** before optimizing
- Measure FPS on mobile (target 55-60 FPS)

### Accessibility

- Include **ARIA labels** for interactive elements
- Ensure **keyboard navigation** works
- Test with **screen readers** (VoiceOver, NVDA)
- Maintain **color contrast ratios** (WCAG 2.1 AA)

### Documentation

- Add **JSDoc comments** for utilities and complex functions
- Update **README.md** for new features
- Include **inline comments** for complex logic
- Document **breaking changes** in PR description

---

## Testing

Before submitting a PR, test your changes:

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Build test
npm run build

# Manual testing
npm run dev
```

**Test on multiple browsers and devices:**

- ✅ Desktop Chrome/Edge
- ✅ Desktop Safari
- ✅ Desktop Firefox
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

---

## Project Structure

```
solar-system-emulator/
├── app/                       # Next.js App Router
│   ├── api/nasa/              # NASA API proxy routes
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   ├── solar-system/          # 3D solar system components
│   │   ├── celestial/         # Planets, moons, sun
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── motion/            # Animation utilities
│   │   ├── services/          # NASA API services
│   │   ├── ui/                # UI components
│   │   └── utils/             # Utility functions
│   └── ui/                    # Shared UI components
├── config/                    # Configuration files
├── lib/                       # Core libraries and utilities
├── public/                    # Static assets (images, textures)
│   ├── images/
│   │   ├── bodies/            # Planet textures
│   │   └── moons/             # Moon textures
└── scripts/                   # Build and utility scripts
```

---

## Questions & Support

- **Have a question?** Open a [GitHub Discussion](https://github.com/Ajayprakashk7/solar-system-emulator/discussions)
- **Found a bug?** Create an [Issue](https://github.com/Ajayprakashk7/solar-system-emulator/issues/new?template=bug_report.md)
- **Want to chat?** Reach out to [Ajay Prakash](mailto:ajayprakashk7@gmail.com)

Before opening a new issue:
- Search existing issues and PRs
- Check the documentation
- Review closed issues for similar problems

---

## License

By contributing to Solar System Emulator, you agree that your contributions will be licensed under the **MIT License**. See [LICENSE](https://github.com/Ajayprakashk7/solar-system-emulator/blob/main/LICENSE) for details.

---

<div align="center">

**Thank you for contributing to Solar System Emulator! 🌌🚀**

Maintained by [Ajay Prakash](https://github.com/Ajayprakashk7)

</div>
