#!/bin/bash

# Quick iOS Project Rebuild
set -e

echo "🔧 Rebuilding iOS Project..."

# Create capacitor.config.json for CLI
cat > capacitor.config.json << 'EOF'
{
  "appId": "me.newomen.app",
  "appName": "Newomen",
  "webDir": "dist"
}
EOF

# Add iOS platform
npx cap add ios

# Sync project
npx cap sync ios

echo "✅ iOS project rebuilt!"