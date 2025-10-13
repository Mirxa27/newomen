// Performance monitoring script
const fs = require('fs');
const path = require('path');

// Monitor bundle sizes
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath, { recursive: true });
    let totalSize = 0;
    
    files.forEach(file => {
        const filePath = path.join(distPath, file);
        if (fs.statSync(filePath).isFile()) {
            const size = fs.statSync(filePath).size;
            totalSize += size;
            if (size > 100000) { // Files larger than 100KB
                console.log(`⚠️ Large file: ${file} (${(size / 1024).toFixed(2)}KB)`);
            }
        }
    });
    
    console.log(`📦 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
}
