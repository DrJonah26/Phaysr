#!/bin/bash
# Opens one Terminal tab per service (macOS). On Linux/Windows run
# `pnpm dev` from the repo root instead.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for pkg in backend app demo-site widget; do
  osascript -e "tell app \"Terminal\" to do script \"cd '$ROOT/$pkg' && pnpm run dev\""
done

osascript -e 'tell app "Terminal" to do script "stripe listen --forward-to localhost:3000/billing/webhook"'
