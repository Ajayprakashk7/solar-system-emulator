#!/usr/bin/env bash
set -euo pipefail

REPO="Ajayprakashk7/solar-system-emulator"
KEEP_BRANCH="main"
MODE="${1:---dry-run}"

if [[ "$MODE" != "--dry-run" && "$MODE" != "--apply" ]]; then
  echo "Usage: $0 [--dry-run|--apply]" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required: https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Authenticate first with: gh auth login" >&2
  exit 1
fi

actual_default="$(gh api "repos/$REPO" --jq '.default_branch')"
if [[ "$actual_default" != "$KEEP_BRANCH" ]]; then
  echo "Refusing cleanup: default branch is '$actual_default', expected '$KEEP_BRANCH'." >&2
  exit 1
fi

branches=()
while IFS= read -r branch; do
  branches+=("$branch")
done < <(gh api --paginate "repos/$REPO/branches?per_page=100" --jq '.[].name')

echo "Repository: $REPO"
echo "Default branch preserved: $KEEP_BRANCH"
echo "Branches found: ${#branches[@]}"

candidates=()
for branch in "${branches[@]}"; do
  [[ "$branch" == "$KEEP_BRANCH" ]] && continue
  candidates+=("$branch")
done

echo "Branches eligible for deletion: ${#candidates[@]}"

if [[ "$MODE" == "--dry-run" ]]; then
  printf '  %s\n' "${candidates[@]}"
  echo
  echo "Dry run only. Re-run with --apply after reviewing the list."
  exit 0
fi

if [[ "${#candidates[@]}" -eq 0 ]]; then
  echo "Nothing to delete."
  exit 0
fi

read -r -p "Delete all ${#candidates[@]} non-main branches from $REPO? Type DELETE to continue: " confirmation
if [[ "$confirmation" != "DELETE" ]]; then
  echo "Cancelled."
  exit 1
fi

deleted=0
failed=0
for branch in "${candidates[@]}"; do
  echo "Deleting $branch"
  if gh api --method DELETE "repos/$REPO/git/refs/heads/$branch" >/dev/null; then
    deleted=$((deleted + 1))
  else
    echo "Failed: $branch" >&2
    failed=$((failed + 1))
  fi
done

echo "Deleted: $deleted"
echo "Failed: $failed"

remaining=()
while IFS= read -r branch; do
  remaining+=("$branch")
done < <(gh api --paginate "repos/$REPO/branches?per_page=100" --jq '.[].name')

printf 'Remaining branch: %s\n' "${remaining[@]}"

if [[ "${#remaining[@]}" -ne 1 || "${remaining[0]}" != "$KEEP_BRANCH" ]]; then
  echo "Cleanup incomplete; review protected/failed refs above." >&2
  exit 1
fi

echo "Repository branch cleanup complete."
