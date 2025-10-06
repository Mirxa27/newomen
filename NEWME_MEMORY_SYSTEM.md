# NewMe Memory System - Complete Documentation

## Overview

The NewMe Memory System provides persistent, user-specific memory capabilities for the NewMe voice agent, enabling it to remember conversations, track emotional patterns, store user preferences, and maintain context across multiple sessions.

## Architecture

### Database Schema

The system consists of **5 core tables**:

#### 1. `newme_conversations`
Tracks individual conversation sessions.

**Fields:**
- `id` (UUID, PK): Unique conversation identifier
- `user_id` (UUID, FK): Reference to user_profiles
- `started_at` (timestamp): Conversation start time
- `ended_at` (timestamp, nullable): Conversation end time
- `duration_seconds` (integer): Total conversation duration
- `message_count` (integer): Number of messages exchanged
- `topics_discussed` (text[]): Array of conversation topics
- `emotional_tone` (text): Overall emotional tone (positive, neutral, negative, mixed)
- `suggested_assessments` (text[]): Assessments suggested during conversation
- `key_insights` (text[]): Important insights from conversation
- `summary` (text): AI-generated conversation summary
- `metadata` (JSONB): Additional flexible data storage

**Indexes:**
- `user_id` (for fetching user's conversations)
- `started_at` (for chronological ordering)

#### 2. `newme_messages`
Stores individual messages within conversations.

**Fields:**
- `id` (UUID, PK): Unique message identifier
- `conversation_id` (UUID, FK): Reference to newme_conversations
- `role` (text): Message role (user, assistant, system)
- `content` (text): Message content
- `timestamp` (timestamp): Message timestamp
- `audio_duration_ms` (integer): Voice message duration in milliseconds
- `sentiment_score` (decimal): Sentiment analysis score (-1 to 1)
- `emotion_detected` (text): Detected emotion from message
- `metadata` (JSONB): Additional message data

**Indexes:**
- `conversation_id` (for fetching conversation messages)
- `timestamp` (for chronological ordering)

#### 3. `newme_user_memories`
Persistent memories about the user across all conversations.

**Fields:**
- `id` (UUID, PK): Unique memory identifier
- `user_id` (UUID, FK): Reference to user_profiles
- `memory_type` (text): Type of memory (see Memory Types below)
- `memory_key` (text): Memory identifier/name
- `memory_value` (text): Memory content
- `context` (text): Additional context about the memory
- `importance_score` (integer): Importance rating (1-10)
- `first_mentioned_at` (timestamp): When memory was first created
- `last_referenced_at` (timestamp): When memory was last used
- `reference_count` (integer): How many times referenced
- `source_conversation_id` (UUID, FK): Original conversation where memory was created
- `is_active` (boolean): Whether memory is currently active
- `created_at` (timestamp): Record creation time
- `updated_at` (timestamp): Last update time

**Memory Types:**
- `personal_detail`: Basic information about the user
- `life_event`: Significant life events
- `relationship`: Information about relationships
- `work_context`: Career and work-related details
- `emotional_pattern`: Recurring emotional patterns
- `assessment_insight`: Insights from completed assessments
- `goal`: User's goals and aspirations
- `preference`: User preferences and likes/dislikes
- `achievement`: User accomplishments
- `challenge`: Current challenges or struggles

**Indexes:**
- `user_id` (for fetching user memories)
- `memory_type` (for filtering by type)
- `importance_score` (for sorting by importance)
- `is_active` (for filtering active memories)

#### 4. `newme_emotional_snapshots`
Tracks user's emotional journey over time.

**Fields:**
- `id` (UUID, PK): Unique snapshot identifier
- `user_id` (UUID, FK): Reference to user_profiles
- `conversation_id` (UUID, FK, nullable): Related conversation
- `snapshot_date` (timestamp): When snapshot was taken
- `primary_emotion` (text): Main emotion detected
- `emotion_intensity` (decimal): Intensity of emotion (0-1)
- `triggers` (text[]): What triggered the emotion
- `coping_strategies` (text[]): Strategies user mentioned
- `notes` (text): Additional notes
- `created_at` (timestamp): Record creation time

**Indexes:**
- `user_id` (for fetching user's emotional journey)
- `snapshot_date` (for chronological ordering)

#### 5. `newme_assessment_tracking`
Links assessment suggestions to completions.

**Fields:**
- `id` (UUID, PK): Unique tracking identifier
- `user_id` (UUID, FK): Reference to user_profiles
- `assessment_name` (text): Name of the assessment
- `suggested_in_conversation_id` (UUID, FK, nullable): Conversation where suggested
- `suggested_at` (timestamp): When suggestion was made
- `completed_at` (timestamp, nullable): When assessment was completed
- `completion_status` (text): Status (suggested, started, completed, skipped)
- `key_insights` (text[]): Insights from the assessment
- `follow_up_discussed` (boolean): Whether results were discussed
- `created_at` (timestamp): Record creation time
- `updated_at` (timestamp): Last update time

**Indexes:**
- `user_id` (for fetching user's assessment tracking)
- `completion_status` (for filtering by status)

### Security (Row-Level Security)

All tables have RLS policies ensuring:
1. **Users can only access their own data** (filtered by `user_id`)
2. **Admins can view all data** (users with admin role)
3. **Write operations are restricted** to the data owner

### Helper Functions

#### `get_newme_user_context(user_id UUID) RETURNS JSONB`

Aggregates complete user context for AI conversations:

**Returns:**
```json
{
  "user_id": "uuid",
  "total_conversations": 42,
  "total_messages": 385,
  "last_conversation_date": "2025-12-31T12:00:00Z",
  "recent_memories": [
    {
      "memory_type": "preference",
      "memory_key": "nickname",
      "memory_value": "Jen",
      "importance_score": 8,
      "last_referenced_at": "2025-12-30T10:00:00Z"
    }
  ],
  "recent_emotions": [
    {
      "primary_emotion": "hopeful",
      "emotion_intensity": 0.75,
      "snapshot_date": "2025-12-30T15:00:00Z"
    }
  ],
  "suggested_assessments": [
    {
      "assessment_name": "Self-Compassion Assessment",
      "suggested_at": "2025-12-28T09:00:00Z",
      "completion_status": "suggested"
    }
  ],
  "memory_count_by_type": {
    "personal_detail": 5,
    "goal": 3,
    "preference": 7
  }
}
```

## TypeScript Integration

### Service Layer: `NewMeMemoryService.ts`

The service provides a clean API for memory operations:

```typescript
import { newMeMemoryService } from '@/services/NewMeMemoryService';

// Get complete user context
const context = await newMeMemoryService.getUserContext(userId);

// Create conversation
const conversation = await newMeMemoryService.createConversation({
  user_id: userId,
  topics_discussed: ['career', 'relationships'],
  emotional_tone: 'positive'
});

// Add message
await newMeMemoryService.addMessage({
  conversation_id: conversation.id,
  role: 'user',
  content: 'I feel really good about my progress',
  timestamp: new Date().toISOString()
});

// Save memory
await newMeMemoryService.saveMemory({
  user_id: userId,
  memory_type: 'preference',
  memory_key: 'nickname',
  memory_value: 'Jen',
  importance_score: 8
});

// Track emotional snapshot
await newMeMemoryService.createEmotionalSnapshot({
  user_id: userId,
  conversation_id: conversation.id,
  primary_emotion: 'hopeful',
  emotion_intensity: 0.75,
  triggers: ['career progress', 'new opportunity']
});

// Track assessment suggestion
await newMeMemoryService.trackAssessmentSuggestion(
  userId,
  'Self-Compassion Assessment',
  conversation.id
);
```

### Type Definitions: `newme-memory-types.ts`

All database types are fully typed with TypeScript interfaces:

```typescript
import type {
  NewMeConversation,
  NewMeMessage,
  NewMeUserMemory,
  NewMeEmotionalSnapshot,
  NewMeAssessmentTracking,
  NewMeUserContext,
  CreateMemoryInput,
  NewMeMemoryType,
  AssessmentCompletionStatus
} from '@/types/newme-memory-types';
```

## AI Service Integration

### Enhanced `generateNewMeResponse()`

The AI service automatically loads user context from the memory system:

```typescript
import { aiService } from '@/utils/AIService';

const response = await aiService.generateNewMeResponse(
  userMessage,          // Current message
  userId,              // User ID
  conversationHistory, // Recent messages in session
  conversationId       // Optional: existing conversation ID
);

// Response includes conversation ID for tracking
console.log(response.conversationId);
```

**What happens automatically:**
1. Loads user context via `getUserContext()`
2. Creates or retrieves active conversation
3. Builds context-aware prompt with:
   - User's nickname
   - Recent memories (top 5 by importance)
   - Days since last conversation
   - Recent emotional patterns
   - Previously suggested assessments
4. Sends message to OpenAI GPT-4 Turbo
5. Stores both user and assistant messages in database
6. Returns response with conversation ID

### Context Integration Example

When NewMe generates a response, it has access to:

```typescript
// User's preferred nickname
"- User's preferred nickname: Jen"

// Important memories
"- Important memories:
  * preference: nickname = Jen
  * goal: career_goal = Become a UX designer
  * emotional_pattern: stress_trigger = work deadlines"

// Conversation history
"- Last conversation: 3 days ago"

// Emotional patterns
"- Recent emotional patterns: hopeful, anxious, determined"

// Assessment tracking
"- Previously suggested assessments: Self-Compassion Assessment"
```

### Personalized Greetings

```typescript
const greeting = await aiService.getNewMeGreeting(userId);
```

**Greeting Types:**
- **First Time**: Warm welcome for new users
- **After Long Break** (>7 days): Acknowledges time away, references last topic
- **Returning**: Friendly continuation from recent conversation

## Usage Examples

### Starting a Voice Conversation

```typescript
import { aiService } from '@/utils/AIService';
import { newMeMemoryService } from '@/services/NewMeMemoryService';

// Get personalized greeting
const greeting = await aiService.getNewMeGreeting(userId);
console.log(greeting); // "Hey there! It's so good to see you back..."

// User sends first message
const response1 = await aiService.generateNewMeResponse(
  "Hi! I'm feeling a bit overwhelmed today",
  userId,
  []
);

// Continue conversation (NewMe remembers context)
const response2 = await aiService.generateNewMeResponse(
  "It's work deadlines again...",
  userId,
  [
    { role: 'user', content: "Hi! I'm feeling a bit overwhelmed today" },
    { role: 'assistant', content: response1.content }
  ],
  response1.conversationId
);
```

### Viewing User's Emotional Journey

```typescript
const emotionalJourney = await newMeMemoryService.getEmotionalJourney(userId, 30);

emotionalJourney.forEach(snapshot => {
  console.log(`${snapshot.snapshot_date}: ${snapshot.primary_emotion} (${snapshot.emotion_intensity})`);
  console.log(`Triggers: ${snapshot.triggers.join(', ')}`);
});

// Output:
// 2025-12-30: hopeful (0.75)
// Triggers: career progress, new opportunity
//
// 2025-12-28: anxious (0.65)
// Triggers: upcoming deadline, presentation nerves
```

### Tracking Assessment Completions

```typescript
// Get assessment tracking
const assessments = await newMeMemoryService.getAssessmentTracking(userId);

assessments.forEach(assessment => {
  console.log(`${assessment.assessment_name}: ${assessment.completion_status}`);
  if (assessment.completed_at) {
    console.log(`Completed: ${assessment.completed_at}`);
    console.log(`Insights: ${assessment.key_insights.join(', ')}`);
  }
});
```

### Ending a Conversation

```typescript
// Update conversation with summary and insights
const messages = await newMeMemoryService.getMessages(conversationId);
const insights = newMeMemoryService.extractKeyInsights(messages);

await newMeMemoryService.updateConversation(conversationId, {
  ended_at: new Date().toISOString(),
  duration_seconds: calculateDuration(),
  key_insights: insights,
  summary: "User discussed work stress and discovered new coping strategies."
});
```

## Best Practices

### Memory Management

1. **Set Appropriate Importance Scores**
   - 1-3: Low importance (casual preferences)
   - 4-7: Medium importance (significant details)
   - 8-10: High importance (critical information)

2. **Update Reference Counts**
   - The system automatically updates `last_referenced_at` and `reference_count` when memories are used
   - This helps identify the most relevant memories

3. **Deactivate Outdated Memories**
   ```typescript
   await newMeMemoryService.deactivateMemory(memoryId);
   ```

### Conversation Flow

1. **Start with Greeting**
   - Always use `getNewMeGreeting()` to personalize the start

2. **Maintain Conversation ID**
   - Pass the same `conversationId` throughout a session
   - This enables proper message threading

3. **End Properly**
   - Update conversation with end time and summary
   - Extract and store key insights

### Performance Optimization

1. **Limit Context Loading**
   - `getUserContext()` loads top 10 memories by importance
   - Top 5 recent emotions
   - Recent assessments

2. **Index Usage**
   - All queries use indexed fields
   - Composite indexes on common query patterns

3. **Batch Operations**
   - When possible, batch memory saves
   - Use JSONB metadata for flexible data

## Future Enhancements

### Planned Features

1. **Automatic Memory Extraction**
   - Use NLP to extract memories from conversations
   - Sentiment analysis for emotion detection

2. **Memory Consolidation**
   - Merge duplicate or similar memories
   - Archive old, low-importance memories

3. **Advanced Context Building**
   - Vector embeddings for semantic search
   - Conversation topic clustering

4. **Privacy Controls**
   - User-controlled memory deletion
   - Granular privacy settings
   - Export user data

## Troubleshooting

### Common Issues

**Problem**: TypeScript errors about missing table types
**Solution**: Run `npx supabase gen types typescript --linked` to regenerate types

**Problem**: RLS policy denying access
**Solution**: Ensure user is authenticated and `user_id` matches session

**Problem**: Memory not appearing in context
**Solution**: Check `is_active = true` and `importance_score` >= 5

## Deployment

### Initial Setup

1. **Deploy Migration**
   ```bash
   npx supabase db push
   ```

2. **Generate Types**
   ```bash
   npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

3. **Verify RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'newme_%';
   ```

### Production Monitoring

- Monitor `newme_conversations.duration_seconds` for session length
- Track `newme_user_memories.reference_count` for memory relevance
- Analyze `newme_emotional_snapshots` for user well-being trends

## Support

For issues or questions:
- Check logs in Supabase Dashboard
- Review RLS policies if access denied
- Ensure user authentication is working
- Verify OpenAI API configuration in Admin Panel

---

**Version**: 1.0.0  
**Last Updated**: December 31, 2024  
**Author**: NewWomen Development Team
