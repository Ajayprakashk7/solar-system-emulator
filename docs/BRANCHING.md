# Branching and Pull Request Policy

`main` is the single long-lived branch for Solar System Emulator. Every other branch is temporary and should exist only while its task is active.

## Rules

1. **One task, one branch, one pull request.** Do not create multiple automated branches for the same bug, optimization, or accessibility change.
2. **Search before creating work.** Check open issues and pull requests for the same problem first. Continue an existing branch when the goal is identical.
3. **Branch from the latest `main`.** Update from `main` before opening a pull request when the base has moved.
4. **Keep branches short-lived.** Merge or close the pull request promptly and delete its branch immediately afterward.
5. **No long-lived agent branches.** Tool-generated branches follow exactly the same lifecycle as human-created branches.
6. **Require green CI.** Lint, TypeScript, and production build checks must pass before merge.
7. **Prefer one coherent fix over competing micro-PRs.** Review alternatives, choose the best implementation, and consolidate it once.
8. **Do not use branches as an archive.** Git history already preserves commits. Stale experiments should be closed and their refs deleted.
9. **Do not develop directly on stale branches.** If old work is worth reviving, start a fresh branch from current `main` and selectively re-apply the relevant commits.

## Recommended naming

Use a short purpose-based name:

- `feat/<feature>`
- `fix/<bug>`
- `perf/<optimization>`
- `a11y/<improvement>`
- `docs/<topic>`
- `chore/<maintenance>`

Avoid branch names that are only an agent name, generic label, or opaque numeric task identifier.

## Normal lifecycle

```text
main
  └─ short-lived branch
       └─ pull request
            ├─ CI passes
            ├─ review / squash merge
            └─ delete branch
```

The repository should normally contain `main` plus only a small number of branches attached to active pull requests.

## Repository cleanup utility

The repository includes a guarded cleanup command for exceptional situations where stale branches have accumulated.

Preview first:

```bash
npm run repo:branches
```

This lists every branch that would be removed while preserving the repository's default `main` branch.

After reviewing the list, apply the cleanup:

```bash
npm run repo:branches:apply
```

The apply command:

- verifies that `main` is still the default branch;
- requires authenticated GitHub CLI access;
- requires typing `DELETE` before changing remote refs;
- deletes only non-`main` branches in this repository;
- verifies that only `main` remains when it finishes.

For normal development, do **not** wait for bulk cleanup. Delete each short-lived branch as soon as its pull request is merged or abandoned.

## Repository setting

Enable GitHub's **Automatically delete head branches** setting so merged pull request branches are removed automatically. This is a backup hygiene control, not a replacement for keeping the pull request backlog clean.
