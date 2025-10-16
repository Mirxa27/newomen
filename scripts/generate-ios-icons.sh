#!/bin/bash

# iOS Icon Generator Script
# Generates all required iOS icon sizes from the source Newomen icon

set -e

SOURCE_ICON="${PROJECT_ROOT}/src/assets/newomen-icon.png"
IOS_ASSETS_DIR="${PROJECT_ROOT}/ios/App/App/Assets.xcassets/AppIcon.appiconset"

echo "🎨 Generating iOS icons from Newomen icon..."

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Create AppIcon.appiconset directory if it doesn't exist
mkdir -p "$IOS_ASSETS_DIR"

# Install imagemagick if not present
if ! command -v convert &> /dev/null; then
    echo "📦 Installing ImageMagick..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    else
        echo "❌ Please install ImageMagick manually"
        exit 1
    fi
fi

# Function to generate icon
generate_icon() {
    local size=$1
    local filename=$2
    echo "  Generating ${filename} (${size}x${size}px)..."
    convert "$SOURCE_ICON" -resize ${size}x${size} "${IOS_ASSETS_DIR}/${filename}"
}

# Generate all required iOS icon sizes
echo "📐 Generating iOS app icons..."
generate_icon 60 "Icon-App-20x20@1x.png"
generate_icon 120 "Icon-App-20x20@2x.png"
generate_icon 180 "Icon-App-20x20@3x.png"
generate_icon 66 "Icon-App-22x22@1x.png"
generate_icon 132 "Icon-App-22x22@2x.png"
generate_icon 195 "Icon-App-22x22@3x.png"
generate_icon 29 "Icon-App-29x29@1x.png"
generate_icon 58 "Icon-App-29x29@2x.png"
generate_icon 87 "Icon-App-29x29@3x.png"
generate_icon 40 "Icon-App-40x40@1x.png"
generate_icon 80 "Icon-App-40x40@2x.png"
generate_icon 120 "Icon-App-40x40@3x.png"
generate_icon 60 "Icon-App-60x60@1x.png"
generate_icon 120 "Icon-App-60x60@2x.png"
generate_icon 180 "Icon-App-60x60@3x.png"
generate_icon 76 "Icon-App-76x76@1x.png"
generate_icon 152 "Icon-App-76x76@2x.png"
generate_icon 167 "Icon-App-83.5x83.5@2x.png"
generate_icon 1024 "Icon-App-1024x1024@1x.png"

# Create or update Contents.json
echo "📝 Updating Contents.json..."
cat > "${IOS_ASSETS_DIR}/Contents.json" << 'EOF'
{
  "images" : [
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20",
      "filename" : "Icon-App-20x20@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20",
      "filename" : "Icon-App-20x20@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29",
      "filename" : "Icon-App-29x29@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29",
      "filename" : "Icon-App-29x29@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40",
      "filename" : "Icon-App-40x40@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40",
      "filename" : "Icon-App-40x40@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60",
      "filename" : "Icon-App-60x60@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60",
      "filename" : "Icon-App-60x60@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "76x76",
      "filename" : "Icon-App-76x76@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "20x20",
      "filename" : "Icon-App-20x20@1x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "20x20",
      "filename" : "Icon-App-20x20@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "29x29",
      "filename" : "Icon-App-29x29@1x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "29x29",
      "filename" : "Icon-App-29x29@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "40x40",
      "filename" : "Icon-App-40x40@1x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "40x40",
      "filename" : "Icon-App-40x40@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76",
      "filename" : "Icon-App-76x76@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5",
      "filename" : "Icon-App-83.5x83.5@2x.png"
    },
    {
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024",
      "filename" : "Icon-App-1024x1024@1x.png"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

echo "✅ iOS icons generated successfully!"
echo "📍 Icons saved to: $IOS_ASSETS_DIR"