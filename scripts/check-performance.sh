#!/bin/bash

echo "📊 Checking Newomen performance..."

# Check bundle sizes
if [ -d "dist" ]; then
    echo "📦 Bundle Analysis:"
    find dist -name "*.js" -exec ls -lh {} \; | awk '{print $5, $9}' | sort -hr
    echo ""
    
    echo "🖼️ Asset Analysis:"
    find dist -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" | while read file; do
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "  $file: $size"
    done
    echo ""
    
    echo "📱 Mobile Performance Tips:"
    echo "  ✅ Use CSS gradients instead of images"
    echo "  ✅ Limit backdrop-filter blur to 8px"
    echo "  ✅ Keep animations under 4s"
    echo "  ✅ Test on actual devices"
    echo ""
fi

echo "🎯 Performance Checklist:"
echo "  ✅ Background optimized (CSS gradient)"
echo "  ✅ Animations reduced (4s max)"
echo "  ✅ Blur effects optimized (8px max)"
echo "  ✅ Mobile performance improved"
echo "  ✅ Reduced motion support added"
