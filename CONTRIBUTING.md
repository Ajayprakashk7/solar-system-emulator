# Contributing to Solar System Emulator

Thanks for contributing. This project favors focused, reviewable changes that improve correctness, performance, accessibility, scientific clarity, or maintainability without adding unnecessary UI or feature clutter.

## Requirements

- Node.js 22+
- npm
- Git
- A modern WebGL-capable browser
- NASA API key is optional for local development

The repository includes `.nvmrc`; with nvm you can run:

```bash
nvm use
```

## Local setup

```bash
git clone https://github.com/YOUR_USERNAME/solar-system-emulator.git
cd solar-system-emulator
npm ci
cp .env.local.example .env.local
npm run dev
```

If you use a NASA API key, keep it server-side:

```bash
NASA_API_KEY=your_key_here
```

Never commit credentials and never expose the NASA key through a `NEXT_PUBLIC_*` environment variable.

## Before starting work

1. Search existing issues and pull requests for the same task.
2. Do not create another branch if equivalent work is already active.
3. Start from the latest `main`.
4. Keep the scope small enough to review and validate confidently.

See [`docs/BRANCHING.md`](docs/BRANCHING.md) for the repository branch lifecycle.

## Branches

`main` is the only long-lived branch. Every other branch must be temporary.

Use purpose-based names such as:

```text
feat/deep-link-improvement
fix/camera-tracking
perf/asteroid-culling
a11y/keyboard-navigation
docs/readme
chore/dependencies
```

One task should have one branch and one pull request. Delete the branch immediately after the pull request is merged or abandoned.

## Development guidelines

- Preserve a smooth experience on desktop, tablet, and mobile.
- Test touch and keyboard interaction when changing UI behavior.
- Avoid unnecessary React state in per-frame or hover-only interactions.
- Avoid allocations and expensive work inside Three.js/R3F frame loops where practical.
- Prefer configuration/data-driven celestial definitions over duplicated component logic.
- Keep server secrets on the server.
- Validate external API inputs and fail with clear errors.
- Respect reduced-motion and constrained-device behavior.
- Do not add panels, toggles, visual effects, or data sources unless they make the core exploration experience meaningfully better.

## Validation

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
```

For runtime/UI changes, also run:

```bash
npm run dev
```

Then manually test the affected behavior at representative desktop and mobile viewport sizes.

## Pull requests

A good pull request should:

- solve one clear problem;
- explain the reason for the change, not only the implementation;
- mention performance or accessibility impact when relevant;
- include screenshots or recordings for meaningful visual changes;
- reference related issues;
- contain no secrets, generated build output, debug logging, or unrelated refactors;
- have green CI before merge.

Use the repository pull request template and prefer squash merging for small focused changes so `main` stays readable.

## Commit messages

Use concise Conventional Commit-style messages when practical:

```text
feat: add shareable body links
fix: keep camera locked to moving planet
perf: reduce asteroid frame-loop work
a11y: isolate shortcuts while modal is open
docs: update local setup
chore: refresh dependencies
```

## Reporting bugs

Please include:

- steps to reproduce;
- expected and actual behavior;
- browser, OS, and device information;
- screenshots or recordings where useful;
- relevant console errors without secrets or personal data.

## Feature requests

Explain the user problem first. Prefer additions that deepen the solar-system exploration experience rather than unrelated feature quantity.

## Security

Do not open a public issue containing credentials or a sensitive vulnerability. Follow the process in `SECURITY.md`.

## License

By contributing, you agree that your contribution may be distributed under the repository's MIT License.
