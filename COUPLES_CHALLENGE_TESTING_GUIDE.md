# Couples Challenge Testing Guide

## Prerequisites

1. **Admin Access**: Log in as an admin user
2. **Test Users**: Create at least 2 test user accounts (for initiator and partner)
3. **Challenge Templates**: Ensure there are active challenge templates in the database

## Setup: Create Challenge Templates (Admin)

1. Navigate to **Admin Panel** → **Content Management**
2. Click on the **"Challenges"** tab
3. Create a test challenge template:
   - **Title**: "Communication Challenge"
   - **Category**: "communication"
   - **Description**: "Test your communication patterns"
   - **Question**: "What does effective communication mean to you?"
4. Add more questions by clicking "Create Template" multiple times
5. Verify templates are saved by refreshing the page

## Test Case 1: Browse Available Challenges

**Steps:**
1. Log in as a regular user (not admin)
2. From the dashboard, click on **"Couple's Challenge"** card
3. You should be redirected to `/couples-challenge`

**Expected Result:**
- ✅ Page loads successfully
- ✅ Shows a list of available challenge templates
- ✅ Each template displays: title, description, category, and number of questions
- ✅ Templates are clickable cards with hover effects

**If No Templates Show:**
- Check if templates are marked as `is_active = true` in the database
- Check browser console for errors
- Verify the query: `SELECT * FROM challenge_templates WHERE is_active = true`

## Test Case 2: Create a New Challenge

**Steps:**
1. From the challenge selection page, click on any challenge template
2. Wait for the challenge to be created

**Expected Result:**
- ✅ Toast notification: "Challenge Created! Share the link with your partner to get started."
- ✅ Automatically redirected to `/couples-challenge/{challengeId}`
- ✅ Challenge page loads with questions from the selected template
- ✅ URL contains a valid UUID (e.g., `/couples-challenge/12345678-abcd-...`)

**Database Verification:**
```sql
SELECT 
  id, 
  initiator_id, 
  status, 
  question_set->>'title' as title,
  jsonb_array_length(question_set->'questions') as question_count
FROM couples_challenges
ORDER BY created_at DESC
LIMIT 5;
```

Should show the newly created challenge with:
- `status = 'pending'`
- `question_set` contains template data
- `initiator_id` matches your user ID

## Test Case 3: Answer Questions (Initiator)

**Steps:**
1. On the challenge page, you should see all questions
2. Type answers in the textarea for each question
3. Click **"Save Responses"**

**Expected Result:**
- ✅ Toast notification: "Responses Saved! Waiting for your partner."
- ✅ Your answers persist (refresh page to verify)
- ✅ You can see your own answers
- ✅ Partner's responses show as "not answered yet"
- ✅ Lock icon shows next to questions partner hasn't answered

**Database Verification:**
```sql
SELECT 
  id,
  status,
  responses
FROM couples_challenges
WHERE id = '{your-challenge-id}';
```

The `responses` field should contain your answers:
```json
{
  "0": {
    "initiator_response": "Your answer to question 1"
  },
  "1": {
    "initiator_response": "Your answer to question 2"
  }
}
```

## Test Case 4: Share Challenge with Partner

**Steps:**
1. Copy the challenge URL from your browser
2. Log out
3. Log in as a different user (partner account)
4. Navigate to the copied URL
5. Answer all questions
6. Click **"Save Responses"**

**Expected Result:**
- ✅ Partner sees the same questions
- ✅ Partner can enter their own answers
- ✅ Partner cannot see initiator's answers yet
- ✅ After both complete, status changes to "completed"

**Database Verification:**
```sql
SELECT 
  id,
  status,
  responses,
  completed_at
FROM couples_challenges
WHERE id = '{your-challenge-id}';
```

Should show:
- `status = 'completed'`
- `completed_at` timestamp is set
- `responses` contains both initiator and partner responses

## Test Case 5: View Completed Challenge

**Steps:**
1. After both partners complete the challenge
2. Reload the page

**Expected Result:**
- ✅ Shows "Challenge Complete!" with heart icon
- ✅ Displays all questions with both partners' answers side by side
- ✅ "Your Answer" and "Partner's Answer" columns are visible
- ✅ All responses are revealed to both partners

## Test Case 6: AI Analysis (Advanced)

**Prerequisites:**
- Z.AI API key configured in admin panel
- Edge function deployed

**Steps:**
1. Complete a challenge (both partners)
2. Trigger AI analysis:

```bash
curl -X POST \
  https://{your-project}.supabase.co/functions/v1/couples-challenge-analyzer \
  -H "Authorization: Bearer {your-anon-key}" \
  -H "Content-Type: application/json" \
  -d '{"challengeId": "{your-challenge-id}"}'
```

**Expected Result:**
- ✅ Edge function processes successfully
- ✅ Returns JSON with analysis, alignment score, insights
- ✅ Database `ai_analysis` field is populated
- ✅ Gamification crystals awarded to both users

**Database Verification:**
```sql
SELECT 
  id,
  ai_analysis,
  compatibility_score
FROM couples_challenges
WHERE id = '{your-challenge-id}';
```

## Common Issues and Solutions

### Issue: "Challenge data incomplete" Error

**Cause:** The `question_set` field is null or malformed

**Solution:**
```sql
UPDATE couples_challenges
SET question_set = '{
  "title": "Test Challenge",
  "description": "Test description",
  "category": "communication",
  "questions": ["Question 1", "Question 2", "Question 3"]
}'
WHERE id = '{challenge-id}';
```

### Issue: Template Selection Page is Empty

**Cause:** No active templates in database

**Solution:**
```sql
INSERT INTO challenge_templates (title, description, category, questions, is_active)
VALUES (
  'Communication Challenge',
  'Explore your communication styles',
  'communication',
  '["What does good communication mean to you?", "How do you handle conflicts?", "What makes you feel heard?"]'::jsonb,
  true
);
```

### Issue: Cannot See Partner's Responses

**Cause:** Challenge status is not 'completed'

**Solution:**
1. Verify both partners have answered all questions
2. Check the logic in `handleSubmit()` function
3. Manually update if needed:
```sql
UPDATE couples_challenges
SET status = 'completed',
    completed_at = NOW()
WHERE id = '{challenge-id}';
```

## Browser Console Debugging

Enable browser developer tools (F12) and check for:

1. **Network Errors:**
   - Check failed API calls to Supabase
   - Look for 400/500 status codes
   - Verify authentication tokens

2. **Console Errors:**
   - JavaScript errors in CouplesChallenge.tsx
   - Data parsing issues
   - Type mismatches

3. **Useful Console Commands:**
```javascript
// Check current challenge data
console.log('Challenge:', challenge);
console.log('Template:', template);
console.log('Responses:', responses);

// Check user ID
console.log('User ID:', userId);
console.log('Is Initiator:', userId === challenge?.initiator_id);
```

## Performance Testing

1. **Load Time:** Challenge page should load in < 2 seconds
2. **Response Save:** Should save responses in < 1 second
3. **Template List:** Should load templates in < 1 second

## Success Criteria

✅ Users can browse available challenge templates
✅ Users can create new challenges from templates
✅ Users can answer questions and save responses
✅ Partners can access the same challenge via shared link
✅ Both partners can see each other's responses after completion
✅ Status updates correctly throughout the flow
✅ AI analysis works when both partners complete the challenge
✅ No console errors during normal operation
✅ Responsive design works on mobile and desktop

## Additional Notes

- Challenge links should be shareable (can send URL to partner)
- Each challenge has a unique ID
- Challenges can expire (check `expires_at` field)
- Users can participate in multiple challenges
- The same user can be initiator in one challenge and partner in another

