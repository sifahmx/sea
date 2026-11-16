#!/usr/bin/env bash
# Auto-save to GitHub: runs when Claude finishes a response in this project.
# Commits any changed website files and pushes them to the GitHub remote.
# The data/ folder (trips, PINs, sessions) is excluded by .gitignore.

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

msg=""

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  files=$(git diff --cached --name-only | head -5 | tr '\n' ' ')
  count=$(git diff --cached --name-only | wc -l | tr -d ' ')
  git commit -q -m "Auto-save: update ${count} file(s) - ${files}" \
    -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || exit 0
  msg="Saved ${count} changed file(s)"
fi

# Push if a GitHub remote is set and there is anything unpushed
if git remote get-url origin >/dev/null 2>&1; then
  if [ -n "$(git log --oneline @{u}..HEAD 2>/dev/null)" ] || ! git rev-parse @{u} >/dev/null 2>&1; then
    if git push -q -u origin HEAD 2>/dev/null; then
      msg="${msg:+$msg, }pushed to GitHub"
    else
      msg="${msg:+$msg, }GitHub push failed (will retry next time)"
    fi
  fi
fi

[ -n "$msg" ] && printf '{"systemMessage": "Auto-save: %s"}\n' "$msg"
exit 0
