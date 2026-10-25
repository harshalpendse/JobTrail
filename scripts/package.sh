#!/usr/bin/env bash
# scripts/package.sh
#
# Builds the ZIP to upload to the Chrome Web Store. Only the files the
# extension needs at runtime go in; docs, screenshots and store assets
# stay out.
#
# Usage: scripts/package.sh   ->   dist/jobtrail-v<version>.zip

set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json)
OUT="dist/jobtrail-v${VERSION}.zip"

mkdir -p dist
rm -f "$OUT"

zip -rq "$OUT" \
  manifest.json \
  background.js \
  content \
  popup \
  Dashboard \
  utils \
  icons \
  fonts \
  -x "*.DS_Store" "*/Thumbs.db"

echo "Packaged $OUT ($(du -h "$OUT" | cut -f1))"
