#!/bin/bash
# This script pushes the project to GitHub using the connected integration

cd /home/runner/workspace

# Get token securely
TOKEN=$(npx tsx -e "
import { getGitHubToken } from './server/services/github-push.ts';
getGitHubToken().then(t => console.log(t));
" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Failed to get GitHub token. Make sure GitHub is connected."
  exit 1
fi

# Push to GitHub
git push "https://x-access-token:${TOKEN}@github.com/Asow1885/VetJobScraper.git" main --force

echo ""
echo "Done! Download your project at: https://github.com/Asow1885/VetJobScraper"
