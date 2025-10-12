# 🧘 Wellness Library - Simple YouTube Setup

## Overview

The Wellness Library feature allows users to access curated wellness content from YouTube videos. It's designed to be **super simple** - just add YouTube links and they work!

---

## ✅ What's Already Done

- ✅ Database table (`wellness_resources`) exists
- ✅ Admin management page at `/admin/wellness-library`
- ✅ User-facing page at `/wellness-library`
- ✅ YouTube video playback (opens in new tab)
- ✅ Categories: Meditation, Breathing, Affirmations, Sleep, Focus, Relaxation, Mindfulness

---

## 🚀 Quick Setup (2 Steps)

### Step 1: Run the Seed Data Migration

This populates your library with 13 free wellness resources:

```bash
npx supabase db push
```

The migration file: `supabase/migrations/20251012000001_wellness_seed_data.sql`

**What it adds:**
- 3 Meditation videos (5-15 minutes)
- 2 Breathing exercises  
- 2 Affirmations
- 2 Sleep meditations
- 2 Focus sessions
- 2 Relaxation guides

### Step 2: Test It!

1. **Go to user page:** `http://localhost:5173/wellness-library`
2. **Browse resources** by category
3. **Click Play** - opens YouTube in new tab
4. **Returns automatically** when done

---

## 🎯 Adding More Resources

### Via Admin Panel

1. Login as admin
2. Go to `/admin/wellness-library`
3. Click "Add YouTube Resource"
4. Fill in:
   - **Title**: Name of the resource
   - **Category**: Select from dropdown
   - **Duration**: In seconds (e.g., 300 = 5 minutes)
   - **YouTube URL**: `https://www.youtube.com/watch?v=...`
   - **Description**: What this resource does

5. Click "Create"

**That's it!** No file uploads, no complex setup. Just paste YouTube URLs.

### Via SQL (Bulk Add)

```sql
INSERT INTO wellness_resources (
  title,
  category,
  duration,
  audio_url,
  youtube_url,
  description,
  audio_type,
  status
) VALUES (
  'Your Title Here',
  'meditation',  -- or breathing, affirmations, sleep, focus, relaxation
  600,           -- duration in seconds
  'https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
  'https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
  'Your description here',
  'youtube',
  'active'
);
```

---

## 📊 Database Schema

The `wellness_resources` table has these important fields:

```typescript
{
  id: string;              // Auto-generated UUID
  title: string;           // Resource name
  category: string;        // meditation, breathing, etc.
  duration: number;        // Seconds
  youtube_url: string;     // YouTube link
  audio_url: string;       // Same as youtube_url
  audio_type: 'youtube';   // Always 'youtube' for now
  description: string;     // What it does
  status: string;          // 'active' or 'inactive'
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

## 🎨 Features for Users

### On the Wellness Library Page:

1. **Search Bar** - Find resources by title or description
2. **Category Tabs** - Filter by category
3. **Resource Cards** showing:
   - Title and description
   - Category badge
   - Duration
   - Play button

4. **Click Play** → Opens YouTube in new tab
5. **Gamification** - Earns crystals when completed

### What Happens Behind the Scenes:

```typescript
// When user clicks play:
1. Extract YouTube video ID
2. Open in new tab: youtube.com/watch?v={id}
3. Track completion for gamification
4. Update usage statistics
```

---

## 🛠️ Customization

### Change Categories

Edit this array in `/src/pages/admin/WellnessLibraryManagement.tsx`:

```typescript
const CATEGORIES = [
  { value: "meditation", label: "Meditation" },
  { value: "breathing", label: "Breathing" },
  { value: "affirmations", label: "Affirmations" },
  { value: "sleep", label: "Sleep" },
  { value: "focus", label: "Focus" },
  { value: "relaxation", label: "Relaxation" },
  { value: "mindfulness", label: "Mindfulness" },
];
```

### Change Crystal Rewards

Edit `/src/lib/gamification-events.ts` to adjust crystals earned:

```typescript
export async function trackWellnessResourceCompletion(
  userId: string,
  resourceId: string
) {
  // Award crystals (default: 5)
  // Modify the reward amount here
}
```

---

## 🔧 Troubleshooting

### "No resources found"

**Solution 1**: Run the seed data migration
```bash
npx supabase db push
```

**Solution 2**: Add resources manually via admin panel

### "YouTube video not loading"

- Check if the YouTube URL is valid
- Make sure it's a public video (not private/unlisted)
- Test the URL in your browser first

### "Can't access admin panel"

Update your user role:
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = 'your-user-id';
```

---

## 📝 Example YouTube Resources to Add

Here are some great free wellness channels to pull from:

1. **Meditation:**
   - Headspace (sample videos)
   - The Honest Guys
   - Michael Sealey
   - Great Meditation

2. **Breathing:**
   - Wim Hof Method
   - Dr. Andrew Weil
   - Richie Bostock

3. **Sleep:**
   - Jason Stephenson  
   - Yellow Brick Cinema
   - The Mindful Movement

4. **Affirmations:**
   - Rising Higher Meditation
   - Your Youniverse

**Tip:** Always check the video licenses and use only content you have rights to share!

---

## 🎉 That's It!

You now have a fully functional wellness library that:

- ✅ Works with YouTube links only (super simple!)
- ✅ Has 13 pre-loaded resources
- ✅ Easy to manage via admin panel
- ✅ Tracks user engagement
- ✅ Awards crystals for completions
- ✅ Mobile responsive design

**No complex file uploads. No storage buckets. Just YouTube links. Simple!**

---

## 🚀 Next Steps

1. Run the seed data migration
2. Test the user-facing page
3. Add your own curated YouTube content
4. Monitor usage in admin analytics

**Questions?** Check the existing resources in the database for examples!

