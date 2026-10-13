# Branching and Pull Request Policy

`main` is the single long-lived branch for Solar System Emulator. All other branches are temporary work branches and should be deleted after their pull request is merged or abandoned.

## Rules

1. **One task, one branch, one pull request.** Do not create multiple automated branches for the same bug, optimization, or accessibility change.
2. **Search before creating work.** Check open issues and pull requests for the same problem first. Continue an existing branch when the goal is identical.
3. **Branch from the latest `main`.** Rebase or update before opening a pull request when `main` has moved significantly.
4. **Keep branches short-lived.** Merge or close the pull request promptly; delete the branch immediately afterward.
5. **Do not use long-lived agent branches.** Names such as `bolt/*`, `palette/*`, `sentinel/*`, or tool-generated task IDs must follow the same lifecycle as human feature branches.
6. **Require green CI.** Lint, production build, and TypeScript checks must pass before merge.
7. **Prefer one consolidated fix over competing micro-PRs.** When several proposals solve the same underlying issue, review the alternatives and implement the best coherent solution once.
8. **Do not merge stale experiments just to preserve them.** Git history already preserves reviewed work; old experimental branches are not an archive.

## Recommended naming

Use a short purpose-based name:

- `feat/<feature>`
- `fix/<bug>`
- `perf/<optimization>`
- `a11y/<improvement>`
- `docs/<topic>`
- `chore/<maintenance>`

Avoid names that are only an agent name or opaque numeric task identifier.

## Normal lifecycle

```text
main
  └─ short-lived branch
       └─ pull request
            ├─ CI passes
            ├─ review / squash merge
            └─ delete branch
```

The repository should normally contain only `main` plus a small number of branches attached to active pull requests.
