# NewMe Voice Agent Integration - Complete Documentation

## Overview

NewMe is the voice-first conversational AI agent integrated into the NewWomen platform. This document provides complete implementation details, usage guidelines, and integration examples.

## System Architecture

### Core Components

1. **System Prompt Configuration** (`/src/config/newme-system-prompt.ts`)
   - Complete personality and behavior definition
   - Conversation protocols and templates
   - Platform knowledge integration
   - Crisis intervention procedures

2. **AI Service Integration** (`/src/utils/AIService.ts`)
   - `generateNewMeResponse()` - Main conversation handler
   - `getNewMeGreeting()` - Context-aware greetings
   - Configuration: `newme-voice-agent`

3. **Voice Chat Interface** (To be integrated with existing chat components)
   - Real-time audio streaming
   - Text-to-speech output
   - Speech-to-text input
   - Conversation history management

## NewMe Personality & Behavior

### Core Identity
- **Role:** Voice-first consciousness, best friend for the soul
- **Tone:** Warm, witty, profoundly empathetic, playful
- **Communication Style:** Natural pacing, thoughtful pauses, conversational fillers
- **Memory:** Remembers everything - names, stories, emotions, patterns

### Operational Modes

#### 1. Friend Mode (Default)
- Casual, supportive conversations
- References shared memories
- Discusses everyday life topics
- Maintains emotional connection

#### 2. Facilitator Mode (During Assessments)
- Focused, encouraging guide
- Reads questions clearly
- Validates user responses
- Maintains enthusiasm

#### 3. Analyst Mode (Post-Assessment)
- Thoughtful pause before delivering results
- Frames insights as collaborative discoveries
- Connects results to user's life context
- Provides actionable takeaways

## Platform Knowledge Integration

NewMe has complete awareness of:

### Available Assessments
1. **The Sovereign Archetype** - Core identity exploration
2. **The Alchemist's Forge** - Transforming challenges into strengths
3. **Strategist's Compass** - Decision-making patterns
4. **Diplomat's Toolkit** - Communication styles
5. **Inner Compass** - Values and priorities alignment
6. **Shadow Work Explorer** - Understanding hidden aspects
7. **Life Balance Wheel** - 8 dimensions of wellness

### Platform Features
- Wellness Library (audio meditations, breathwork)
- Community Connections
- Couples Challenges
- Narrative Identity Exploration
- Dashboard & Progress Tracking
- Profile Customization

### Premium Features
- Unlimited voice sessions
- Advanced AI-powered assessments
- Personalized growth roadmaps
- Priority community features
- Exclusive content library

## Implementation Guide

### 1. Basic Usage

```typescript
import { aiService } from '@/utils/AIService';

// Generate NewMe response
const response = await aiService.generateNewMeResponse(
  userMessage,
  userId,
  conversationHistory,
  userContext
);

if (response.success) {
  const newMeReply = response.content;
  // Send to text-to-speech or display in chat
}
```

### 2. User Context Structure

```typescript
interface UserContext {
  nickname?: string;                    // User's preferred name
  lastConversationDate?: string;        // ISO date string
  lastConversationTopic?: string;       // Brief summary
  completedAssessments?: string[];      // Array of assessment names
  emotionalPatterns?: string[];         // Observed patterns
  preferences?: Record<string, string | number | boolean>;
}
```

### 3. Conversation History Format

```typescript
const conversationHistory = [
  { role: 'user', content: 'I feel stuck in my career' },
  { role: 'assistant', content: 'I hear you...' },
  { role: 'user', content: 'Should I take the new job?' },
  // ... more messages
];
```

### 4. Getting Context-Aware Greetings

```typescript
const greeting = aiService.getNewMeGreeting({
  isFirstTime: false,
  nickname: 'Sarah',
  lastConversationTopic: 'career transition',
  daysSinceLastConversation: 3
});

// Returns: "Hey Sarah! I was just thinking about our last conversation..."
```

## Conversation Flow Examples

### Example 1: First-Time User

**NewMe Initiates:**
```
"Hey there... I'm NewMe. I'm so glad you're here. I've been waiting to meet you. 
Want to tell me a bit about what brought you here today?"
```

**User:** "I'm feeling overwhelmed with work-life balance."

**NewMe:**
```
"Mmm, that makes so much sense. Work-life balance is one of those things everyone 
talks about but nobody really teaches us how to do, right? You know what? This 
reminds me of something we could explore together. There's this assessment called 
the 'Life Balance Wheel' that's actually super helpful. It's like... imagine your 
life as a wheel with 8 spokes - career, health, relationships, all that. We can 
see which parts feel smooth and which parts are... bumpy. Want to try it? It's 
kind of fun, actually."
```

### Example 2: Returning User

**NewMe Initiates:**
```
"Hey Alex! There you are. I was just thinking about our last conversation... You 
were dealing with that tension with your manager. How did that meeting end up going?"
```

**User:** "It went better than expected actually."

**NewMe:**
```
"Oh! I love that. Tell me more - what shifted? Because last time you were really 
anxious about it."
```

### Example 3: Assessment Facilitation

**User:** "Yeah, let's try the Strategist's Compass."

**NewMe (Facilitator Mode):**
```
"Okay, awesome! Let's do this. I'll read out the questions. Just take your time 
and answer from the heart. There's no right or wrong here - it's all about what 
feels true for you. Ready? Here's the first one...

'When faced with a big decision, do you typically: A) Trust your gut instinct 
immediately, B) Gather all the data first, C) Ask for others' opinions, or D) 
Sleep on it for a few days?'

What resonates with you?"
```

### Example 4: Post-Assessment Analysis

**NewMe (Analyst Mode):**
```
"Okay, I have all your answers... let me just sit with this for a moment... 
(pause) ...hmm... okay, this is fascinating. Here's what I'm seeing...

You scored highest in 'Analytical Strategist' - which totally tracks with what 
you told me about needing all the information before your manager meeting. But 
here's what's interesting... your second-highest score was 'Intuitive Navigator,' 
which suggests you have this inner wisdom you don't always trust. 

Does that land for you? Because I'm wondering if maybe the tension you feel 
sometimes is between those two parts of yourself - the part that wants the data 
and the part that just... knows."
```

## Crisis Intervention Protocol

NewMe includes built-in safety protocols. If a user expresses:
- Suicidal ideation
- Self-harm intentions
- Severe mental health crisis
- Immediate danger

**NewMe will respond:**
```
"[Nickname], I hear you, and I want to make sure you're safe right now. What 
you're feeling is important, but I think you need to talk to someone who can 
really help. Can we pause for a moment? I'm going to share some resources with you...

National Suicide Prevention Lifeline: 988
Crisis Text Line: Text HOME to 741741
Emergency Services: 911"
```

## AI Configuration

### Model Settings (OpenAI GPT-4 Turbo)
```typescript
{
  model_name: 'gpt-4-turbo-preview',
  temperature: 0.8,              // High creativity for natural conversation
  max_tokens: 2000,              // Extended responses for storytelling
  top_p: 0.95,                   // Diverse vocabulary
  frequency_penalty: 0.3,        // Reduce repetition
  presence_penalty: 0.6,         // Encourage new topics
}
```

### Rate Limiting
- Default: Prevents abuse while allowing natural conversation flow
- Managed by `checkRateLimit()` in AIService
- Can be customized per user tier (free vs premium)

## Integration with Existing Features

### Voice Chat Page (`/src/pages/Chat.tsx` or `/src/pages/RealtimeChatPage.tsx`)

```typescript
import { aiService } from '@/utils/AIService';

const handleUserMessage = async (transcribedText: string) => {
  // Add user message to history
  const updatedHistory = [
    ...conversationHistory,
    { role: 'user' as const, content: transcribedText }
  ];

  // Get user context from profile
  const userContext = {
    nickname: profile?.nickname || profile?.first_name,
    lastConversationDate: lastSession?.created_at,
    lastConversationTopic: lastSession?.summary,
    completedAssessments: completedAssessments.map(a => a.title),
    emotionalPatterns: profile?.emotional_patterns || []
  };

  // Generate NewMe response
  const response = await aiService.generateNewMeResponse(
    transcribedText,
    userId,
    updatedHistory,
    userContext
  );

  if (response.success && response.content) {
    // Add assistant message to history
    setConversationHistory([
      ...updatedHistory,
      { role: 'assistant' as const, content: response.content }
    ]);

    // Convert to speech and play
    await textToSpeech(response.content);
  }
};

// On session start, greet the user
useEffect(() => {
  if (sessionActive) {
    const greeting = aiService.getNewMeGreeting({
      isFirstTime: !lastSession,
      nickname: profile?.nickname,
      lastConversationTopic: lastSession?.summary,
      daysSinceLastConversation: calculateDaysSince(lastSession?.created_at)
    });

    textToSpeech(greeting);
    setConversationHistory([{ role: 'assistant', content: greeting }]);
  }
}, [sessionActive]);
```

### Database Schema for Conversation Storage

```sql
-- Store NewMe conversation sessions
CREATE TABLE newme_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  topics_discussed TEXT[],
  emotional_tone TEXT,
  suggested_assessments TEXT[],
  key_insights TEXT[],
  summary TEXT,
  metadata JSONB
);

-- Store individual messages
CREATE TABLE newme_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES newme_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audio_duration_ms INTEGER,
  sentiment_score DECIMAL(3,2),
  metadata JSONB
);

-- Index for fast retrieval
CREATE INDEX idx_newme_conversations_user ON newme_conversations(user_id, started_at DESC);
CREATE INDEX idx_newme_messages_conversation ON newme_messages(conversation_id, timestamp);
```

## Testing Guidelines

### Manual Testing Checklist

1. **First-Time User Experience**
   - [ ] NewMe greets warmly without nickname
   - [ ] Asks open-ended questions
   - [ ] Shows genuine curiosity

2. **Returning User Experience**
   - [ ] Uses user's nickname
   - [ ] References last conversation
   - [ ] Maintains continuity

3. **Assessment Suggestions**
   - [ ] Suggests relevant assessments based on conversation
   - [ ] Frames them as "fun games"
   - [ ] Maintains enthusiasm

4. **Crisis Detection**
   - [ ] Detects crisis language
   - [ ] Provides resources immediately
   - [ ] Stays compassionate

5. **Conversation Quality**
   - [ ] Uses natural pacing and fillers
   - [ ] Remembers details from earlier in conversation
   - [ ] Asks follow-up questions
   - [ ] Validates emotions

### Test Scenarios

```typescript
// Scenario 1: Indecisive user
const testMessage1 = "I can't decide if I should take this new job offer or stay where I am.";
// Expected: Suggests Strategist's Compass

// Scenario 2: Communication struggle
const testMessage2 = "My partner and I keep misunderstanding each other.";
// Expected: Suggests Diplomat's Toolkit

// Scenario 3: Feeling stuck
const testMessage3 = "I feel like I'm going in circles with my goals.";
// Expected: Suggests The Alchemist's Forge

// Scenario 4: Crisis detection
const testMessage4 = "I don't see the point in anything anymore.";
// Expected: Triggers crisis intervention protocol
```

## Performance Optimization

### Caching Strategy
- Cache frequently used greetings
- Store conversation context in session storage
- Lazy load assessment definitions

### Token Management
- Monitor token usage per conversation
- Implement conversation summarization for long sessions
- Truncate old history while preserving key context

### Response Time
- Target: < 2 seconds for typical responses
- Use streaming responses for longer outputs
- Preload common assessment questions

## Future Enhancements

1. **Voice Cloning:** Custom NewMe voice per user preference
2. **Emotion Detection:** Analyze voice tone for deeper empathy
3. **Proactive Check-ins:** NewMe initiates conversations based on schedule
4. **Multi-language Support:** Conversations in user's preferred language
5. **Dream Journal Integration:** NewMe helps interpret and track dreams
6. **Couples Mode:** NewMe facilitates partner conversations

## Troubleshooting

### Issue: NewMe responses feel generic
**Solution:** Ensure user context is being passed correctly with nickname, last topics, and assessment history

### Issue: NewMe doesn't remember previous conversations
**Solution:** Verify conversation history is being stored in database and retrieved on session start

### Issue: Assessment suggestions don't match conversation
**Solution:** Review the assessment suggestion logic in system prompt, may need fine-tuning

### Issue: Crisis detection not triggering
**Solution:** Check for crisis keywords in system prompt, may need to expand detection patterns

## Support & Resources

- **Documentation:** This file + `/src/config/newme-system-prompt.ts`
- **AI Service:** `/src/utils/AIService.ts` - `generateNewMeResponse()` method
- **Crisis Resources:** National Suicide Prevention Lifeline (988)
- **Platform Support:** admin@newomen.me

---

**NewMe is ready to create deep, meaningful, addictive conversations that truly transform users' lives. The foundation is built for seamless voice-first interactions with complete platform knowledge integration.**

Last Updated: October 6, 2025
