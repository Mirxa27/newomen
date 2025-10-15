#!/bin/bash

# Final comprehensive import fix
echo "Performing final import fixes..."

# Find all TypeScript files and fix remaining import paths
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    # Fix remaining service imports
    sed -i '' 's|@/services/NewMeMemoryService|@/services/features/ai/NewMeMemoryService|g' "$file"
    sed -i '' 's|@/services/SubscriptionService|@/services/features/payment/SubscriptionService|g' "$file"
    sed -i '' 's|@/services/PaymentService|@/services/features/payment/PaymentService|g' "$file"
    sed -i '' 's|@/services/CommunityService|@/services/features/community/CommunityService|g' "$file"
    sed -i '' 's|@/services/AIAssessmentService|@/services/features/ai/AIAssessmentService|g' "$file"
    sed -i '' 's|@/services/AICouplesChallengeService|@/services/features/ai/AICouplesChallengeService|g' "$file"
    
    # Fix remaining type imports
    sed -i '' 's|@/types/newme-memory-types|@/types/features/ai/newme-memory-types|g' "$file"
    sed -i '' 's|@/types/assessment-types|@/types/features/assessment/assessment-types|g' "$file"
    sed -i '' 's|@/types/assessment-optimized|@/types/features/assessment/assessment-optimized|g' "$file"
    
    # Fix remaining lib imports
    sed -i '' 's|@/lib/utils|@/lib/shared/utils/utils|g' "$file"
    sed -i '' 's|@/lib/date-utils|@/lib/shared/utils/date-utils|g' "$file"
    sed -i '' 's|@/lib/form-utils|@/lib/shared/utils/form-utils|g' "$file"
    
    echo "Updated: $file"
done

echo "Final import fixes completed!"
