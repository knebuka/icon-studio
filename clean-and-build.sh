#!/bin/bash

# Icon Studio - Clean and Build Script
# クリーンビルドを実行するスクリプト

echo "Stopping Electron processes..."
pkill -f electron || true

echo "Cleaning dist folder..."
rm -rf dist

echo "Cleaning webpack cache..."
rm -rf node_modules/.cache || true

echo "Starting development server..."
npm run dev
