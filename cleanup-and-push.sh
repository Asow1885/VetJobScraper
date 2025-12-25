#!/bin/bash
cd /home/runner/workspace

echo "=== Removing large files from git tracking ==="

# Remove large files from git index
git rm --cached ziCVuiNz 2>/dev/null
git rm --cached "attached_assets/Recording 2025-10-08 230112_1759957300844.mp4" 2>/dev/null
git rm --cached -r .pythonlibs 2>/dev/null
git rm --cached -r .cache 2>/dev/null
git rm --cached -r .upm 2>/dev/null
git rm --cached client/public/project.b64 2>/dev/null
git rm --cached project-export.zip 2>/dev/null

# Add updated .gitignore
git add .gitignore

# Commit changes
git commit -m "Remove large files to reduce repo size" 2>/dev/null || echo "Nothing to commit"

# Get token and push
echo ""
echo "=== Pushing to GitHub ==="
TOKEN=$(npx tsx -e "
import { getGitHubToken } from './server/services/github-push.ts';
getGitHubToken().then(t => console.log(t));
" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Failed to get GitHub token."
  exit 1
fi

git push "https://x-access-token:${TOKEN}@github.com/Asow1885/VetJobScraper.git" main --force

echo ""
echo "=== Done! ==="
echo "Download at: https://github.com/Asow1885/VetJobScraper"
