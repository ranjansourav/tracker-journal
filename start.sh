#!/usr/bin/env bash
set -e
# Quick start helper for Tracker-Journal
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting Tracker-Journal..."
npm start
