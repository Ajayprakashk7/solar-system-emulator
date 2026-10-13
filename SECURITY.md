# Security Policy

## Supported version

Security fixes are applied to the current `main` branch. Older commits, abandoned branches, and unmerged experimental pull requests are not supported releases.

## Reporting a vulnerability

Please do not publish sensitive vulnerabilities, credentials, private tokens, or exploit details in a public issue.

Preferred process:

1. Use GitHub's private vulnerability reporting / Security Advisory feature for this repository when available.
2. Include the affected component, reproduction steps, impact, and a minimal proof of concept where appropriate.
3. Remove API keys, tokens, personal data, and unrelated environment information from logs or screenshots.

If private vulnerability reporting is unavailable, open a minimal public issue asking for a private contact channel without disclosing exploit details.

## Credentials

- Never commit `.env.local` or real API keys.
- NASA credentials must remain server-side in `NASA_API_KEY`.
- Do not use `NEXT_PUBLIC_*` for secrets; variables with that prefix are exposed to browser code.
- If a credential is committed or published, treat it as compromised and rotate/revoke it. Removing it from the latest commit is not sufficient because Git history may still contain it.

## Dependency and platform security

Security updates should be handled as focused maintenance changes, validated with lint, type checking, production build, and relevant runtime testing before merge.
