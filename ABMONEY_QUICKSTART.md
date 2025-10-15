# 🚀 AB.MONEY Features - Quick Start Guide

## What's New?
Newomen now includes all AB.MONEY features: Meditation library, Affirmations, Habit tracking, Journaling, Tarot/Zen cards, and Community engagement.

## 📍 Accessing the Features

### For Users
1. Go to `/wellness-hub` in your app
2. Or click "Wellness Hub" in the main navigation (to be added)
3. Explore 8 feature tabs:
   - 🧘 Meditations
   - ✨ Affirmations
   - 🔥 Habits
   - 📔 Diaries
   - 🃏 Cards
   - 🎵 Audio
   - ♾️ Recipes
   - 🤝 Community

## 💻 For Developers

### Import Services
```typescript
import {
  MeditationService,
  AffirmationService,
  HabitTrackerService,
  DiaryService,
  CardReadingService,
} from '@/services/features/wellness';
```

### Import Components
```typescript
import {
  WellnessHub,
  MeditationLibrary,
  DailyAffirmationsWidget,
  HabitTrackerWidget,
} from '@/components/features/wellness';
```

## 📚 Common Tasks

### Get Today's Affirmation
```typescript
const affirmation = await AffirmationService.getTodaysAffirmation();
```

### Log a Meditation Session
```typescript
await MeditationService.logMeditationSession(
  meditationId,
  1200, // seconds
  userId
);
```

### Create a Habit
```typescript
await HabitTrackerService.createHabit(userId, {
  title: "Morning Meditation",
  category: "meditation",
  frequency: "daily",
  target_count: 1
});
```

### Record a Gratitude Entry
```typescript
await DiaryService.createGratitudeEntry(userId, {
  entry_date: new Date(),
  content: "I'm grateful for...",
  mood: "grateful",
  mood_score: 9,
  is_private: true
});
```

### Draw a Tarot Card
```typescript
const card = await CardReadingService.drawTarotCards(1);
// or
const reading = await CardReadingService.performThreeCardSpread(userId);
```

## 📊 Getting Statistics

### Meditation Stats
```typescript
const stats = await MeditationService.getMeditationStats(userId);
// { totalSessions, totalMinutes, uniqueMeditations }
```

### Habit Stats
```typescript
const stats = await HabitTrackerService.getHabitStats(userId);
// { totalHabits, totalStreak, averageCompletion, habits[] }
```

### Diary Stats
```typescript
const stats = await DiaryService.getUserDiaryStats(userId);
// { totalGratitudeEntries, averageMood, averageEnergy, averageClarity }
```

## 🎯 Integration Points

### Navigation Menu
Add to your navigation:
```tsx
<NavLink to="/wellness-hub">
  <Heart className="w-4 h-4" />
  Wellness Hub
</NavLink>
```

### Dashboard Widget
Add to dashboard:
```tsx
<DailyAffirmationsWidget />
<HabitTrackerWidget />
```

### Profile/Settings
Add user affirmation preferences:
```tsx
<AffirmationService.getUserAffirmationSettings(userId)>
```

## 🔐 Security Notes

- All features are user-scoped
- RLS policies ensure data isolation
- Authentication required for all operations
- Personal data is private by default

## 📱 Mobile Considerations

- All components are mobile-responsive
- Touch-friendly buttons
- Adaptive layouts for small screens
- Icons collapse on mobile navigation

## 🎨 Customization

### Styling
Components use Tailwind CSS and existing design system:
- Colors match brand palette
- Gradient backgrounds available
- Dark mode supported

### Extending
Add new meditation categories:
```typescript
// Update meditation seeding
INSERT INTO meditations (title, category, ...) VALUES (...)
```

## 🐛 Troubleshooting

### Meditations Not Loading
- Check database migrations ran
- Verify RLS policies
- Check user authentication

### Habits Not Tracking Streaks
- Ensure dates are correct
- Check habit_logs table
- Verify timezone settings

### Stats Not Updating
- Clear React Query cache
- Refresh page
- Check service error logs

## 📖 Full Documentation

For complete documentation, see:
- `ABMONEY_FEATURES.md` - Feature overview
- `ABMONEY_IMPLEMENTATION_COMPLETE.md` - Technical details

## 🎉 You're Ready!

The features are production-ready. Start integrating them into your app!

### Next Steps
1. Add Wellness Hub link to navigation
2. Test each feature
3. Customize colors/styling as needed
4. Deploy!

---

**Version**: 1.0.0
**Status**: Production Ready ✨
