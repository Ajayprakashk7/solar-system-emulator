#!/usr/bin/env bash
set -euo pipefail

REPO="Ajayprakashk7/solar-system-emulator"
DEFAULT_BRANCH="main"
REQUIRED_CHECK_CONTEXT="Validate (Node 22)"
# GitHub's official Actions app ID. Binding the required check to the app
# prevents unrelated commit statuses with the same context from satisfying it.
REQUIRED_CHECK_APP_ID=15368
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
if [[ "$actual_default" != "$DEFAULT_BRANCH" ]]; then
  echo "Refusing hardening: default branch is '$actual_default', expected '$DEFAULT_BRANCH'." >&2
  exit 1
fi

cat <<EOF
Repository: $REPO
Default branch: $DEFAULT_BRANCH

This utility will:
  - enable automatic deletion of merged pull-request branches;
  - use squash merge as the only merge strategy;
  - protect main from force-pushes and deletion;
  - require pull requests for changes to main;
  - require the '$REQUIRED_CHECK_CONTEXT' GitHub Actions check to pass and be up to date;
  - require conversation resolution before merge;
  - require linear history.
EOF

if [[ "$MODE" == "--dry-run" ]]; then
  echo
  echo "Dry run only. Re-run with --apply after reviewing the settings above."
  exit 0
fi

read -r -p "Apply these repository settings? Type HARDEN to continue: " confirmation
if [[ "$confirmation" != "HARDEN" ]]; then
  echo "Cancelled."
  exit 1
fi

echo "Updating repository merge and branch-cleanup settings..."
gh api --method PATCH "repos/$REPO" \
  -F delete_branch_on_merge=true \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false >/dev/null

echo "Protecting $DEFAULT_BRANCH..."
gh api --method PUT "repos/$REPO/branches/$DEFAULT_BRANCH/protection" --input - >/dev/null <<JSON
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {
        "context": "$REQUIRED_CHECK_CONTEXT",
        "app_id": $REQUIRED_CHECK_APP_ID
      }
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
JSON

echo
echo "Repository hardening applied."
echo "Verify with: gh api repos/$REPO/branches/$DEFAULT_BRANCH/protection"
