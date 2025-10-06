# NewMe Memory System - Quick Reference

## Quick Start

### Import Service
```typescript
import { newMeMemoryService } from '@/services/NewMeMemoryService';
import { aiService } from '@/utils/AIService';
```

### Start a Conversation
```typescript
// Get personalized greeting
const greeting = await aiService.getNewMeGreeting(userId);

// Send first message
const response = await aiService.generateNewMeResponse(
  "Hi! I need some support today",
  userId,
  []  // Empty conversation history
);

// Continue conversation
const response2 = await aiService.generateNewMeResponse(
  "I'm feeling anxious about work",
  userId,
  [
    { role: 'user', content: "Hi! I need some support today" },
    { role: 'assistant', content: response.content }
  ],
  response.conversationId  // Pass ID for continuity
);
```

### Save a Memory
```typescript
await newMeMemoryService.saveMemory({
  user_id: userId,
  memory_type: 'preference',        // See Memory Types below
  memory_key: 'nickname',
  memory_value: 'Jen',
  importance_score: 10,              // 1-10 scale
  context: 'User prefers Jen over Jennifer'
});
```

### Track Emotions
```typescript
await newMeMemoryService.createEmotionalSnapshot({
  user_id: userId,
  conversation_id: conversationId,
  primary_emotion: 'anxious',
  emotion_intensity: 0.75,           // 0-1 scale
  triggers: ['work deadline', 'presentation'],
  coping_strategies: ['deep breathing', 'walk']
});
```

### Track Assessment
```typescript
// When NewMe suggests an assessment
const tracking = await newMeMemoryService.trackAssessmentSuggestion(
  userId,
  'Self-Compassion Assessment',
  conversationId
);

// When user completes it
await newMeMemoryService.updateAssessmentTracking(tracking.id, {
  completed_at: new Date().toISOString(),
  completion_status: 'completed',
  key_insights: ['High self-criticism', 'Needs mindfulness practice']
});
```

---

## Memory Types

| Type | Use For | Examples |
|------|---------|----------|
| `personal_detail` | Basic info | nickname, age, location |
| `life_event` | Significant events | job change, moving, breakup |
| `relationship` | People in user's life | partner, friend, family |
| `work_context` | Career details | job title, work challenges |
| `emotional_pattern` | Recurring emotions | anxiety triggers, joy sources |
| `assessment_insight` | Assessment results | MBTI type, values |
| `goal` | User aspirations | career goal, health goal |
| `preference` | Likes/dislikes | communication style |
| `achievement` | Accomplishments | promotion, milestone |
| `challenge` | Current struggles | work stress, relationship issue |

---

## Common Queries

### Get User Context
```typescript
const context = await newMeMemoryService.getUserContext(userId);
// Returns: nickname, last_conversation_date, important_memories, emotional_patterns, completed_assessments
```

### Get Conversation History
```typescript
const conversations = await newMeMemoryService.getConversationHistory(userId, 10);
conversations.forEach(conv => {
  console.log(`${conv.started_at}: ${conv.summary}`);
});
```

### Get Messages
```typescript
const messages = await newMeMemoryService.getMessages(conversationId);
messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

### Get Emotional Journey
```typescript
const emotions = await newMeMemoryService.getEmotionalJourney(userId, 30);
emotions.forEach(snapshot => {
  console.log(`${snapshot.snapshot_date}: ${snapshot.primary_emotion} (${snapshot.emotion_intensity})`);
});
```

### Get Assessment Tracking
```typescript
const assessments = await newMeMemoryService.getAssessmentTracking(userId);
const suggested = assessments.filter(a => a.completion_status === 'suggested');
const completed = assessments.filter(a => a.completion_status === 'completed');
```

---

## Best Practices

### Importance Scoring
- **10**: Critical info (nickname, major life events)
- **7-9**: Very important (goals, key relationships)
- **4-6**: Important (preferences, patterns)
- **1-3**: Nice to know (casual details)

### Memory Keys
Use descriptive, searchable keys:
- ✅ Good: `career_goal`, `stress_trigger`, `partner_name`
- ❌ Bad: `thing1`, `data`, `misc`

### Conversation Flow
1. Start with `getNewMeGreeting(userId)`
2. Create/get conversation on first message
3. Pass `conversationId` for all subsequent messages
4. Update conversation with summary when ending
5. Create emotional snapshot if significant emotions discussed

### Performance
- Limit conversation history to 10-20 recent messages
- `getUserContext()` already limits to top 10 memories
- Use pagination for long conversation histories

---

## Database Tables

### `newme_conversations`
Tracks sessions with topics, emotional tone, insights, summary

### `newme_messages`
Individual messages with role, content, sentiment, emotion

### `newme_user_memories`
Persistent memories with type, importance, reference count

### `newme_emotional_snapshots`
Emotional states with intensity, triggers, coping strategies

### `newme_assessment_tracking`
Assessment suggestions linked to completions and insights

---

## Security

**Row-Level Security (RLS):**
- Users can only access their own data
- Admin role has full access for support

**To Test:**
```sql
-- Should only return current user's data
SELECT * FROM newme_conversations;
SELECT * FROM newme_messages;
SELECT * FROM newme_user_memories;
```

---

## Troubleshooting

### Types Not Found
```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### RLS Denying Access
- Verify user is authenticated: `supabase.auth.getSession()`
- Check user_id matches session: `session.user.id === userId`

### Memory Not Appearing
- Check `is_active = true`
- Verify `importance_score >= 5` (getUserContext threshold)
- Confirm memory was saved: `console.log(await saveMemory(...))`

### Conversation ID Missing
- Always save first response's `conversationId`
- Pass it to all subsequent messages in same session

---

## Example: Complete Conversation Flow

```typescript
// 1. User opens chat
const greeting = await aiService.getNewMeGreeting(userId);
displayMessage('assistant', greeting);

// 2. User sends first message
const userMessage1 = "I'm stressed about my career";
const response1 = await aiService.generateNewMeResponse(
  userMessage1,
  userId,
  []
);
displayMessage('user', userMessage1);
displayMessage('assistant', response1.content);

// Save conversation ID for this session
const sessionConversationId = response1.conversationId;

// 3. User continues conversation
const userMessage2 = "I want to switch to UX design";
const response2 = await aiService.generateNewMeResponse(
  userMessage2,
  userId,
  [
    { role: 'user', content: userMessage1 },
    { role: 'assistant', content: response1.content }
  ],
  sessionConversationId
);
displayMessage('user', userMessage2);
displayMessage('assistant', response2.content);

// 4. Save important memory
await newMeMemoryService.saveMemory({
  user_id: userId,
  memory_type: 'goal',
  memory_key: 'career_goal',
  memory_value: 'Switch to UX design',
  importance_score: 9,
  source_conversation_id: sessionConversationId
});

// 5. Track emotional state
await newMeMemoryService.createEmotionalSnapshot({
  user_id: userId,
  conversation_id: sessionConversationId,
  primary_emotion: 'hopeful',
  emotion_intensity: 0.7,
  triggers: ['career reflection', 'new possibilities']
});

// 6. NewMe suggests assessment
await newMeMemoryService.trackAssessmentSuggestion(
  userId,
  'Career Values Assessment',
  sessionConversationId
);

// 7. End conversation
await newMeMemoryService.updateConversation(sessionConversationId, {
  ended_at: new Date().toISOString(),
  summary: 'User discussed career stress and discovered goal to transition to UX design',
  key_insights: ['Ready for career change', 'Values creative work', 'Needs clarity on path']
});
```

---

## API Reference

### AIService Methods

#### `generateNewMeResponse(message, userId, history, conversationId?)`
Returns: `{ success, content, usage, cost_usd, conversationId }`

#### `getNewMeGreeting(userId)`
Returns: `string` (personalized greeting)

### NewMeMemoryService Methods

**Conversations:**
- `getUserContext(userId)` → NewMeUserContext
- `createConversation(input)` → NewMeConversation
- `updateConversation(id, updates)` → boolean
- `getConversationHistory(userId, limit)` → NewMeConversation[]
- `getActiveConversation(userId)` → NewMeConversation | null

**Messages:**
- `addMessage(input)` → NewMeMessage | null
- `getMessages(conversationId, limit?)` → NewMeMessage[]

**Memories:**
- `saveMemory(input)` → NewMeUserMemory | null (creates or updates)
- `getUserMemories(userId, type?)` → NewMeUserMemory[]
- `deactivateMemory(id)` → boolean

**Emotions:**
- `createEmotionalSnapshot(input)` → NewMeEmotionalSnapshot | null
- `getEmotionalJourney(userId, limit)` → NewMeEmotionalSnapshot[]

**Assessments:**
- `trackAssessmentSuggestion(userId, name, conversationId?)` → NewMeAssessmentTracking | null
- `updateAssessmentTracking(id, updates)` → boolean
- `getAssessmentTracking(userId)` → NewMeAssessmentTracking[]

**Utilities:**
- `calculateDaysSinceLastConversation(date)` → number
- `extractKeyInsights(messages)` → string[]

---

## Documentation

- **Full Guide**: `/NEWME_MEMORY_SYSTEM.md` (500+ lines)
- **Implementation Summary**: `/NEWME_IMPLEMENTATION_COMPLETE.md`
- **System Prompt**: `/src/config/newme-system-prompt.ts`

---

**For Support:** Check logs in Supabase Dashboard → Database → Logs
