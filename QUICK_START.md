# Quick Start

## Requirements

- Node.js 22 or newer
- npm
- A modern browser with WebGL support
- A NASA API key is optional; the app falls back to NASA's `DEMO_KEY` for local development

## Setup

```bash
git clone https://github.com/Ajayprakashk7/solar-system-emulator.git
cd solar-system-emulator
npm ci
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## NASA API key

If you have your own NASA API key, keep it server-side in `.env.local`:

```bash
NASA_API_KEY=your_key_here
```

Never use a `NEXT_PUBLIC_*` variable for the NASA key. Variables with that prefix are bundled for the browser and must be treated as public.

If no key is configured, the application uses NASA's more limited `DEMO_KEY`.

## Validate before committing

Run the same core checks used by CI:

```bash
npm run lint
npm run typecheck
npm run build
```

## Useful routes

The application proxies NASA requests through server-side routes rather than exposing an API key to the browser. Examples include:

```text
/api/nasa/planet/Earth
/api/nasa/moon/Europa
/api/nasa/apod
/api/nasa/neo
```

## Troubleshooting

If dependencies behave unexpectedly, use the lockfile rather than reinstalling arbitrary versions:

```bash
rm -rf node_modules
npm ci
```

If you changed environment variables, restart the development server.

## Repository workflow

`main` is the only long-lived branch. Use one short-lived branch per task, open one pull request, require green CI, then delete the branch after the pull request is merged or abandoned. See `docs/BRANCHING.md` for the full policy.
