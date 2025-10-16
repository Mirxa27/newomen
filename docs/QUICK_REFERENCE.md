# Newomen - Quick Reference Guide

## 🚀 Common Commands

### Development
```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types
```

### Mobile
```bash
npx cap sync ios         # Sync with iOS
npx cap open ios         # Open in Xcode
npx cap run ios          # Build & run on iOS
```

### Database
```bash
supabase start           # Start local Supabase
supabase stop            # Stop local Supabase
supabase db reset        # Reset local database
supabase migration new   # Create new migration
```

### Deployment
```bash
supabase functions deploy <name>  # Deploy Edge Function
vercel deploy                      # Deploy to Vercel
```

## 📁 Where to Find Things

### Code Organization
```
Need to find...                    Look in...
────────────────────────────────────────────────────────────
UI Components                      src/components/features/
Reusable Components               src/components/shared/
Base UI Elements                  src/components/ui/
Custom Hooks                      src/hooks/features/
Business Logic                    src/services/features/
API Calls                         src/services/features/
Type Definitions                  src/types/features/
Page Routes                       src/pages/features/
Utility Functions                 src/lib/shared/utils/
Constants                         src/lib/shared/constants/
Supabase Integration              src/integrations/supabase/
Edge Functions                    supabase/functions/
Database Migrations               supabase/migrations/
```

### Documentation
```
Need to know...                    Check...
────────────────────────────────────────────────────────────
Project Overview                   README.md
Project Structure                  docs/development/PROJECT_STRUCTURE.md
Deployment Guide                   docs/deployment/
iOS Build Process                  docs/ios/iOS_BUILD_GUIDE.md
Getting Started                    docs/guides/START_HERE.md
Cleanup History                    docs/development/CLEANUP_SUMMARY.md
```

## 🔑 Key Files

```
File                         Purpose
─────────────────────────────────────────────────────────────
package.json                 Dependencies & scripts
tsconfig.json                TypeScript configuration
vite.config.ts               Vite build configuration
tailwind.config.ts           Tailwind CSS configuration
capacitor.config.ts          Mobile app configuration
supabase/config.toml         Supabase configuration
.env.local                   Environment variables (create from .env.example)
```

## 🎯 Common Tasks

### Adding a New Feature

1. **Create component structure:**
   ```bash
   src/components/features/my-feature/
   ├── MyFeature.tsx
   ├── MyFeatureCard.tsx
   └── index.ts
   ```

2. **Create service:**
   ```bash
   src/services/features/my-feature/
   └── MyFeatureService.ts
   ```

3. **Create types:**
   ```bash
   src/types/features/my-feature/
   └── my-feature-types.ts
   ```

4. **Create page:**
   ```bash
   src/pages/features/my-feature/
   └── MyFeature.tsx
   ```

5. **Add route in `App.tsx`**

### Creating a New Edge Function

```bash
# Create function directory
mkdir -p supabase/functions/my-function

# Create index.ts
cat > supabase/functions/my-function/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Your logic here
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
EOF

# Deploy
supabase functions deploy my-function --project-ref <project-ref>
```

### Adding a New Page

1. **Create page component:**
   ```typescript
   // src/pages/features/my-feature/MyPage.tsx
   export default function MyPage() {
     return (
       <div className="container mx-auto p-6">
         <h1>My Page</h1>
       </div>
     );
   }
   ```

2. **Add route:**
   ```typescript
   // In App.tsx
   <Route path="/my-page" element={<MyPage />} />
   ```

3. **Add navigation:**
   ```typescript
   // In MainLayout.tsx or Sidebar.tsx
   <Link to="/my-page">My Page</Link>
   ```

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Type Errors
```bash
# Regenerate Supabase types
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Check for errors
npm run type-check
```

### iOS Build Issues
```bash
# Clean iOS build
cd ios/App
xcodebuild clean

# Resync Capacitor
cd ../..
npx cap sync ios
```

### CORS Errors
- Ensure Edge Function has proper CORS headers
- Add `apikey` header to fetch requests
- Check Supabase function logs in dashboard

## 🔐 Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional AI Providers
VITE_OPENAI_API_KEY=your-openai-key
VITE_ZAI_API_KEY=your-zai-key

# Optional Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SOCIAL_LOGIN=true
```

## 📊 Project Stats

```
Component Count:      150+
Edge Functions:       21
Database Tables:      40+
TypeScript Files:     500+
Lines of Code:        50,000+
```

## 🔗 Important URLs

```
Development:          http://localhost:5173
Supabase Dashboard:   https://supabase.com/dashboard
Vercel Dashboard:     https://vercel.com
Apple Developer:      https://developer.apple.com
```

## 📞 Support

- **Documentation:** `docs/`
- **Issues:** GitHub Issues
- **Email:** support@newomen.me

---

**Last Updated:** October 16, 2025

