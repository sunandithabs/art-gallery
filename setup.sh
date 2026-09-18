#!/bin/bash
set -e

echo "🎨 Anagha's Art Gallery — Local Setup"
echo "======================================"

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VER=$(node -e "console.log(parseInt(process.version.slice(1)))")
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌ Node.js 18+ required (you have $(node -v))"
  exit 1
fi

# Use npm if pnpm not available (pnpm preferred)
if command -v pnpm &>/dev/null; then
  PKG="pnpm"
else
  echo "ℹ️  pnpm not found, using npm. To install pnpm: npm i -g pnpm"
  PKG="npm"
fi

echo "📦 Installing dependencies with $PKG..."
$PKG install

echo ""
echo "✅ Done! Run the site:"
echo ""
echo "  DEV (live reload):  $PKG run dev:local"
echo "  PROD (built):       $PKG run build:local && $PKG run start"
echo ""
echo "Then open http://localhost:3000"
