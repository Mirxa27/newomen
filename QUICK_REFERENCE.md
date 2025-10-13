# 🚀 NewWomen Platform - Quick Reference Guide

## 📋 Essential Commands

### Development
```bash
# Start development server
npm run dev

# Run production build
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Deployment
```bash
# Verify deployment readiness
./verify-deployment.sh

# Manual deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

### Git Workflow
```bash
# Check status
git status

# Stage all changes
git add -A

# Commit changes
git commit -m "Your message"

# Push to deploy
git push origin main
```

## 🗄️ Database Access

### Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe

### Connection Details
```env
VITE_SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co
VITE_SUPABASE_PROJECT_ID=fkikaozubngmzcrnhkqe
```

### Common Queries
```sql
-- View community posts
SELECT * FROM community_posts ORDER BY created_at DESC;

-- View users
SELECT id, email, nickname FROM user_profiles;

-- View announcements
SELECT * FROM community_announcements WHERE is_active = true;
```

## 🔐 Admin Access

### Admin User
- **Email:** admin@newomen.me
- **Dashboard:** `/admin`
- **Features:** User management, content, AI config, analytics

### Admin Routes
- `/admin` - Overview
- `/admin/users` - User management
- `/admin/content` - Content management
- `/admin/announcements` - Announcements (NEW)
- `/admin/ai-config` - AI configuration
- `/admin/analytics` - Analytics

## 🌟 Key Features

### Community Posts
- **Location:** Community page
- **Database:** `community_posts` table
- **Katerina's Posts:** 7 posts with 189-248 likes each
- **Types:** story, question, achievement, resource, general

### Announcements
- **Admin Panel:** `/admin/announcements`
- **Public View:** Community page
- **Types:** general, challenge, assessment, quiz, maintenance, feature
- **Priority:** low, normal, high, urgent

### Voice Training
- **Route:** `/voice-training`
- **Provider:** Real-time AI
- **Features:** Conversation, emotional analysis, memory

### Assessments
- **Member Route:** `/assessments`
- **Public Route:** `/public-assessments`
- **AI Scoring:** Automated with feedback

## 🔧 Environment Variables

### Required (Frontend)
```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```

### Optional (Backend/Server)
```env
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_DB_PASSWORD=<db-password>
```

## 📊 Monitoring

### Vercel Dashboard
**URL:** https://vercel.com/team_a7jwzFVJrcEgqDf5HJXD7sZ3/newomen

### Check Deployment Status
1. Visit Vercel dashboard
2. Look for latest deployment
3. Check build logs if needed
4. Monitor performance metrics

### Error Tracking
- Check browser console
- Review Vercel logs: `vercel logs`
- Check Supabase logs in dashboard
- Monitor real-time errors

## 🐛 Common Issues & Fixes

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Type Errors
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix and rebuild
npm run build
```

### Environment Issues
```bash
# Verify .env file exists
cat .env

# Check required variables
grep VITE_ .env
```

### Deployment Not Triggering
1. Check Vercel dashboard is connected to GitHub
2. Verify main branch is set for auto-deploy
3. Try manual deploy: `vercel --prod`

## 📱 Testing Checklist

### Basic Flow
- [ ] Landing page loads
- [ ] User can sign up
- [ ] User can log in
- [ ] Dashboard displays correctly
- [ ] Community feed shows posts
- [ ] Katerina's posts visible with likes

### Admin Flow
- [ ] Admin can log in
- [ ] User management works
- [ ] Can create announcements
- [ ] Announcements display on frontend
- [ ] Analytics loads

### Mobile Testing
- [ ] Responsive on phone
- [ ] Touch interactions work
- [ ] Navigation functional
- [ ] Forms are usable

## 🔄 Update Workflow

### Making Changes
1. Create feature branch
2. Make changes
3. Test locally
4. Commit and push
5. Create PR (creates preview deployment)
6. Review and test preview
7. Merge to main (auto-deploys to production)

### Hotfix Process
1. Create hotfix branch from main
2. Make minimal fix
3. Test thoroughly
4. Push and merge immediately
5. Monitor deployment

## 📚 Documentation

### Project Docs
- `README.md` - Project overview
- `DEPLOYMENT_READY.md` - Complete deployment guide
- `DEPLOYMENT_SUMMARY.txt` - Quick summary
- `QUICK_REFERENCE.md` - This file

### Code Documentation
- Components: `src/components/`
- Pages: `src/pages/`
- Hooks: `src/hooks/`
- Types: `src/integrations/supabase/types.ts`

## 🎯 Performance Targets

### Lighthouse Scores
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 95+

### Load Times
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s

## 🆘 Emergency Contacts

### Services Status
- Vercel: https://www.vercel-status.com/
- Supabase: https://status.supabase.com/

### Support
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- GitHub Issues: Create issue in repository

## 💡 Pro Tips

1. **Always test locally before deploying**
   ```bash
   npm run build && npm run preview
   ```

2. **Use preview deployments for testing**
   - Every PR gets a preview URL
   - Test thoroughly before merging

3. **Monitor bundle size**
   - Keep `dist/` under 10MB
   - Check build output for large files

4. **Keep dependencies updated**
   ```bash
   npm outdated
   npm update
   ```

5. **Regular backups**
   - Export database regularly
   - Keep local copies of important data

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| Production Site | [Deployed URL] |
| Vercel Dashboard | https://vercel.com/team_a7jwzFVJrcEgqDf5HJXD7sZ3/newomen |
| Supabase Dashboard | https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe |
| GitHub Repo | https://github.com/Mirxa27/newomen |

## 🎊 Current Deployment

**Latest Commit:** c0c5848  
**Status:** ✅ Deployed  
**Build:** Production  
**Features:**
- 7 community posts by Katerina (189-248 likes each)
- Admin announcements system
- AI couples challenge service
- Complete documentation

---

*Last Updated: October 13, 2025*

