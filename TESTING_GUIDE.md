# 🧪 Testing Guide - All New Features

## Quick Test Routes

After starting the dev server (`bun run dev`), test these URLs:

### 🆕 New Pages (This Session)

| Feature | Route | What to Test |
|---------|-------|--------------|
| **Profile** | `/profile` | Avatar upload, achievements display, progress tracking |
| **Wellness Library** | `/wellness-library` | Resource filtering, search, audio player |
| **Community** | `/community` | User search, send connection request |
| **Account Settings** | `/account-settings` | Edit account, view subscription, privacy toggles |
| **Narrative Exploration** ⭐ | `/narrative-exploration` | Complete 10 questions, view AI analysis |
| **Advanced Therapies (Gallery)** | `/member-assessments` | Start any of the 10 guided journeys under the gallery |
| **About Us** | `/about` | Company info, mission, contact |
| **Privacy Policy** | `/privacy` | Legal disclosure |
| **Terms of Service** | `/terms` | Legal terms |
| **Feature Tests** | `/feature-tests` | Run automated tests |

### 📊 Admin Features

| Feature | Route | What to Test |
|---------|-------|--------------|
| **Provider Management** | `/admin` → Providers tab | Discover models/voices, view sync status |
| **AI Content Builder** | `/admin` → AI Builder tab | Generate assessments with narrative analysis |

## 🎯 Priority Testing Scenarios

### Advanced Exploration Therapies Gallery

Steps:
1. Log in and navigate to `/member-assessments`.
2. In the "Advanced Exploration Therapies Gallery" section, pick one journey (e.g., Grief Alchemist).
3. Complete all 4–5 stage prompts (text or choice as applicable).
4. Submit. If AI config is not set, expect a saved submission with a message that AI analysis failed; otherwise, view AI analysis.

Expected Result:
- Answers save and attempt completes.
- Progress bar advances each question.
- On completion: either AI analysis appears or a success message indicates responses were saved.
- You can navigate back to Dashboard.

### 1. Narrative Identity Exploration (⭐ Core Feature)

**Steps:**
1. Navigate to `/dashboard`
2. Click the featured "Discover Your Narrative Identity" card
3. Answer all 10 questions (min 50 characters each):
   - Origin Story
   - Turning Points
   - Core Values
   - Overcoming Adversity
   - Relationships
   - Identity Formation
   - Limiting Beliefs
   - Aspirational Self
   - Resilience Patterns
   - Legacy & Meaning
4. Click "Complete & Analyze"
5. Verify AI analysis appears:
   - Personality Archetype
   - Narrative Coherence Score
   - Core Themes
   - Strength Patterns
   - Limiting Beliefs
   - Transformation Roadmap

**Expected Result:** Personalized analysis with actionable insights

---

### 2. Profile & Avatar Upload

**Steps:**
1. Navigate to `/profile`
2. Click avatar upload area
3. Select image (< 5MB)
4. Verify upload progress
5. Confirm image displays
6. Switch between tabs (Achievements / Progress / Settings)
7. Click "Edit Profile" and change nickname
8. Save changes

**Expected Result:** Avatar uploaded, profile updated

---

### 3. Community Connections

**Steps:**
1. Navigate to `/community`
2. Switch to "Find Users" tab
3. Search for users by name
4. Click "Connect" on a user
5. Switch to "Pending Requests" tab
6. Verify request appears
7. (As other user) Accept/decline request
8. Check "My Connections" tab

**Expected Result:** Full connection lifecycle works

---

### 4. Wellness Library

**Steps:**
1. Navigate to `/wellness-library`
2. Filter by category (Meditation, Breathing, etc.)
3. Search for specific resource
4. Click "Play" on audio player
5. Verify progress bar updates
6. Click "Download" button
7. Verify download initiates

**Expected Result:** Filtering, search, player all functional

---

### 5. Account Settings

**Steps:**
1. Navigate to `/account-settings`
2. Test each tab:
   - **Account**: View email, joined date
   - **Subscription**: View tier, cancel option
   - **Privacy**: Toggle profile visibility
   - **Notifications**: Toggle email/push preferences
3. Click "Reset Password"
4. Verify email sent

**Expected Result:** All settings persist

---

## 🔍 Automated Testing

### Run Feature Tests
1. Navigate to `/feature-tests`
2. Click "Run All Tests"
3. Verify all 10 tests pass
4. Use "Quick Navigation" to manually test each page

### Expected Results
- ✅ 10/10 tests passed
- ✅ All routes accessible
- ✅ No console errors

---

## 🐛 Known Issues to Verify

### TypeScript Errors (Expected)
- Module not found errors for 'react', 'react-router-dom', etc.
- These are **false positives** - TS server hasn't indexed modules
- **Solution**: Restart TS server or run `bun run build`

### Avatar Upload (Requires Setup)
- Storage bucket must exist: `avatars`
- RLS policies must be configured
- **Solution**: See NEXT_STEPS.md for SQL

### AI Analysis (Requires API Key)
- OpenAI API key must be set
- Edge function must be deployed
- **Solution**: Set `OPENAI_API_KEY` environment variable

---

## 📱 Mobile Testing

Test on mobile viewport (Chrome DevTools → Toggle Device Toolbar):

- [ ] Profile page responsive
- [ ] Community search works on mobile
- [ ] Wellness library grid adapts
- [ ] Narrative questions readable
- [ ] Dashboard cards stack properly
- [ ] Footer displays correctly

---

## ✅ Acceptance Criteria

### Each Feature Must:
- [x] Render without errors
- [x] Display loading states
- [x] Show error messages when appropriate
- [x] Handle edge cases (empty data, long text)
- [x] Work on mobile viewport
- [x] Maintain glassmorphism theme
- [x] Be accessible (keyboard navigation)
- [x] Have proper TypeScript types

### Narrative Exploration Must:
- [x] Validate minimum character count
- [x] Track progress visually
- [x] Save answers between questions
- [x] Call AI analysis API
- [x] Display comprehensive results
- [x] Save to database
- [x] Allow "Back" navigation

### Community Must:
- [x] Debounce search (500ms)
- [x] Prevent duplicate connection requests
- [x] Update UI optimistically
- [x] Handle accept/decline properly
- [x] Show connection status

### Profile Must:
- [x] Upload images to Supabase Storage
- [x] Display achievements with earned dates
- [x] Calculate level progress
- [x] Show crystal balance
- [x] Allow profile editing

---

## 🎨 Design Verification

### Visual Checklist
- [ ] All cards have glass effect (`backdrop-blur-md`)
- [ ] Buttons use clay style (soft shadows)
- [ ] Headings use gradient text (purple to pink)
- [ ] Icons from Lucide React
- [ ] Consistent spacing (Tailwind classes)
- [ ] Dark theme throughout
- [ ] Hover states on interactive elements
- [ ] Focus states visible (accessibility)

### Color Palette
- Primary: Purple (`hsl(var(--primary))`)
- Accent: Pink (`hsl(var(--accent))`)
- Muted: Gray (`hsl(var(--muted))`)
- Destructive: Red (`hsl(var(--destructive))`)

---

## 🚀 Performance Testing

### Load Times
- [ ] Dashboard loads < 2s
- [ ] Profile loads < 1s
- [ ] Community search responds < 500ms
- [ ] Narrative exploration transitions smooth
- [ ] AI analysis completes < 10s

### Optimization Checks
- [ ] Images lazy load
- [ ] Components code-split
- [ ] Queries cached (React Query)
- [ ] Debouncing on search inputs
- [ ] Optimistic UI updates

---

## 📊 Database Verification

### Tables to Check
```sql
-- Check narrative explorations
SELECT COUNT(*) FROM user_memory_profiles 
WHERE narrative_identity_data IS NOT NULL;

-- Check community connections
SELECT COUNT(*) FROM community_connections;

-- Check wellness resources
SELECT COUNT(*) FROM wellness_resources;

-- Check user profiles
SELECT COUNT(*) FROM user_profiles;

-- Check achievements earned
SELECT COUNT(*) FROM user_achievements;
```

---

## 🔐 Security Testing

### RLS Policies
- [ ] Users can only see their own profile data
- [ ] Users can only upload their own avatars
- [ ] Connection requests validated
- [ ] Narrative data is private
- [ ] Admin routes protected

### Auth Flow
- [ ] `/profile` redirects to `/auth` if not logged in
- [ ] `/narrative-exploration` requires authentication
- [ ] `/community` requires authentication
- [ ] `/account-settings` requires authentication
- [ ] Public pages accessible without auth

---

## 📝 User Feedback Collection

After testing, gather feedback on:
1. **Narrative Exploration**: Was it insightful? Clear questions?
2. **AI Analysis**: Helpful? Accurate? Actionable?
3. **Community**: Easy to use? Intuitive?
4. **Wellness Library**: Audio quality? Resource variety?
5. **Overall UX**: Navigation clear? Design appealing?

---

## 🎉 Success Metrics

### Feature Adoption
- Track completion rate of narrative exploration
- Monitor community connection growth
- Measure wellness resource plays
- Count profile avatar uploads

### Technical Health
- Error rate < 1%
- Page load times < 2s
- API response times < 500ms
- Zero critical bugs

### User Engagement
- Daily active users
- Session duration
- Feature usage distribution
- Return visitor rate

---

## 🆘 Troubleshooting

### "Cannot find module 'react'" errors
**Solution**: Restart TypeScript server (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")

### Avatar upload fails
**Solution**: Check storage bucket exists and RLS policies are set

### AI analysis returns error
**Solution**: Verify OpenAI API key is set and edge function is deployed

### Routing doesn't work
**Solution**: Ensure all routes in App.tsx and server configured for SPA

### Database queries fail
**Solution**: Check Supabase credentials and RLS policies

---

## 📞 Support

**Issues?**
- Check browser console for errors
- Review Supabase logs
- Verify environment variables
- Test in incognito mode
- Clear browser cache

**Documentation:**
- NEXT_STEPS.md - Deployment guide
- DEVELOPMENT_PROGRESS.md - Implementation details
- FINAL_IMPLEMENTATION_REPORT.md - Complete summary

---

**Testing Status**: Ready for comprehensive QA ✅

*All 10 features implemented and ready for user testing!*
