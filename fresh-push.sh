#!/bin/bash
cd /home/runner/workspace

echo "=== Creating clean export ==="

# Create temp directory
rm -rf /tmp/clean-export
mkdir -p /tmp/clean-export

# Copy only essential files (no git history, no large files)
cp -r client /tmp/clean-export/
cp -r server /tmp/clean-export/
cp -r shared /tmp/clean-export/
cp -r python /tmp/clean-export/
cp package.json /tmp/clean-export/
cp package-lock.json /tmp/clean-export/
cp tsconfig.json /tmp/clean-export/
cp tailwind.config.ts /tmp/clean-export/
cp postcss.config.js /tmp/clean-export/
cp drizzle.config.ts /tmp/clean-export/
cp theme.json /tmp/clean-export/
cp .gitignore /tmp/clean-export/
cp replit.md /tmp/clean-export/ 2>/dev/null
cp design_guidelines.md /tmp/clean-export/ 2>/dev/null

# Remove any accidentally copied large files
rm -rf /tmp/clean-export/client/public/project.b64 2>/dev/null

# Calculate size
echo "Clean export size:"
du -sh /tmp/clean-export

# Initialize fresh git repo
cd /tmp/clean-export
git init
git add -A
git commit -m "VetJobScraper - Clean export"

# Get token and push
echo ""
echo "=== Pushing to GitHub ==="
TOKEN=$(cd /home/runner/workspace && npx tsx -e "
import { getGitHubToken } from './server/services/github-push.ts';
getGitHubToken().then(t => console.log(t));
" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Failed to get GitHub token."
  exit 1
fi

git push "https://x-access-token:${TOKEN}@github.com/Asow1885/VetJobScraper.git" master:main --force

echo ""
echo "=== Done! ==="
echo "Download at: https://github.com/Asow1885/VetJobScraper"
