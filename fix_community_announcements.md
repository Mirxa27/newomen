# Fix Community Announcements Database Issue

## Problem
The community announcement system is showing an error: "Announcement system requires database setup. Please run the migration first."

## Solution
The database migration for community chat and announcements needs to be applied to the Supabase database.

## Steps to Fix

### Option 1: Apply Migration via Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/sql
2. Copy and paste the contents of `apply_community_migration.sql`
3. Run the SQL script

### Option 2: Apply Migration via CLI (if credentials work)
```bash
cd /Users/abdullahmirxa/Documents/GitHub/newomen
npx supabase db push --include-all
```

### Option 3: Manual Database Connection
If the above methods don't work, the migration needs to be applied manually through the Supabase dashboard.

## What the Migration Creates

The migration creates the following tables:
- `community_chat_rooms` - Chat rooms for different topics
- `community_chat_messages` - Messages in chat rooms
- `community_announcements` - Community announcements
- `community_announcement_reads` - Track which users have read announcements
- `community_challenge_announcements` - Challenge-specific announcements
- `community_assessment_announcements` - Assessment-specific announcements
- `community_quiz_announcements` - Quiz-specific announcements

## After Migration
Once the migration is applied, the community announcement system should work properly and users will be able to:
- Create announcements
- View announcements
- Mark announcements as read
- Participate in community chat

## Verification
After applying the migration, verify that:
1. The error message disappears
2. Users can create announcements
3. The announcement list loads properly
4. Chat rooms are available
