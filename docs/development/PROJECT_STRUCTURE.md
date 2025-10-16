# Project Structure Documentation

## Overview

This document provides a detailed explanation of the Newomen codebase structure, following best practices for React/TypeScript applications with clear separation of concerns.

## Architecture Principles

### 1. Feature-Based Organization
The codebase is organized by features rather than technical layers, making it easier to:
- Locate related code
- Scale the application
- Develop features independently
- Maintain code boundaries

### 2. Separation of Concerns
- **Components** - Presentational logic (UI)
- **Services** - Business logic & API calls
- **Hooks** - Reusable stateful logic
- **Types** - TypeScript definitions
- **Utils** - Pure utility functions

### 3. Shared vs Feature Code
- **Feature code** - Specific to a single feature
- **Shared code** - Used across multiple features

## Directory Structure

### `/src/components/`

UI components following the Atomic Design principle:

#### `features/` - Feature-Specific Components
Components tied to specific features, not reusable across the app.

```
features/
├── ai/                    # AI chat, voice, assessments
│   ├── ChatInterface.tsx  # Main chat UI
│   ├── Composer.tsx       # Message input
│   ├── TranscriptPane.tsx # Conversation display
│   ├── Waveform.tsx       # Audio visualization
│   └── SessionHUD.tsx     # Session info display
├── admin/                 # Admin panel components
├── community/             # Community features
├── couples/               # Couples challenges
├── dashboard/             # Dashboard widgets
├── gamification/          # Badges, achievements
├── notifications/         # Notification UI
├── onboarding/           # User onboarding flows
├── profile/              # User profiles
├── sessions/             # Live sessions
├── subscription/         # Payment UI
└── wellness/             # Wellness features
```

#### `shared/` - Shared Components
Reusable components used across multiple features.

```
shared/
├── layout/               # Layout components
│   ├── MainLayout.tsx   # Main app layout
│   ├── Header.tsx       # App header
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── Footer.tsx       # App footer
└── ui/                  # UI primitives
    ├── ErrorBoundary.tsx
    ├── LoadingSpinner.tsx
    └── EmptyState.tsx
```

#### `ui/` - Shadcn UI Components
Base UI components from Shadcn/ui (buttons, cards, dialogs, etc.).

### `/src/hooks/`

Custom React hooks for reusable stateful logic.

```
hooks/
├── features/             # Feature-specific hooks
│   ├── ai/
│   │   ├── useAIAgent.ts      # AI agent logic
│   │   ├── useChat.ts         # Chat functionality
│   │   └── useRealtimeClient.ts # Voice chat
│   ├── community/
│   │   └── useCouplesChallenge.ts
│   └── wellness/
│       └── useWellnessContent.ts
└── shared/              # Shared hooks
    ├── ui/
    │   ├── use-toast.ts       # Toast notifications
    │   └── use-mobile.ts      # Mobile detection
    └── core/
        └── useAuth.ts         # Authentication
```

### `/src/services/`

Business logic and API communication layer.

```
services/
├── features/            # Feature services
│   ├── ai/
│   │   ├── OpenAIService.ts           # OpenAI integration
│   │   ├── ZAIService.ts              # Z.AI integration
│   │   ├── UnifiedAIAssessmentService.ts # Assessment logic
│   │   └── CompatibilityScoringService.ts
│   ├── assessment/
│   │   ├── AssessmentService.ts       # Assessment CRUD
│   │   └── AssessmentBusinessLogic.ts # Assessment rules
│   ├── auth/
│   │   └── AuthService.ts             # Authentication
│   ├── community/
│   │   ├── CommunityService.ts        # Posts, comments
│   │   └── CommunityModerationService.ts
│   └── wellness/
│       └── WellnessContentService.ts
└── shared/             # Shared services
    └── core/
        ├── ErrorHandlingService.ts    # Global error handling
        └── AnalyticsService.ts        # Analytics tracking
```

**Service Layer Responsibilities:**
- API calls to Supabase
- Data transformation
- Business logic
- Error handling
- Caching strategies

### `/src/pages/`

Page components that map to routes.

```
pages/
├── features/           # Feature pages
│   ├── ai/
│   │   ├── Chat.tsx           # /chat
│   │   └── RealtimeChatPage.tsx # /realtime-chat
│   ├── admin/
│   │   ├── AdminDashboard.tsx  # /admin
│   │   └── UserManagement.tsx  # /admin/users
│   ├── assessment/
│   │   ├── Assessment.tsx      # /assessment/:id
│   │   └── Assessments.tsx     # /assessments
│   ├── community/
│   │   ├── Community.tsx       # /community
│   │   └── PostPage.tsx        # /community/post/:id
│   ├── dashboard/
│   │   └── Dashboard.tsx       # /dashboard
│   ├── profile/
│   │   └── Profile.tsx         # /profile
│   └── wellness/
│       └── WellnessHub.tsx     # /wellness
└── public/            # Public pages
    ├── Landing.tsx            # /
    ├── AboutUs.tsx            # /about
    ├── PrivacyPolicy.tsx      # /privacy
    └── TermsOfService.tsx     # /terms
```

### `/src/types/`

TypeScript type definitions.

```
types/
├── features/           # Feature types
│   ├── ai/
│   │   └── ai-types.ts
│   ├── assessment/
│   │   └── assessment-types.ts
│   └── community/
│       └── community-types.ts
└── shared/            # Shared types
    └── database.types.ts  # Generated from Supabase
```

### `/src/integrations/`

Third-party service integrations.

```
integrations/
└── supabase/
    ├── client.ts          # Supabase client setup
    ├── types.ts           # Generated types
    └── tables/            # Table-specific queries
        ├── profiles.ts
        ├── assessments.ts
        └── community_posts.ts
```

### `/src/lib/`

Utility libraries and helpers.

```
lib/
├── features/          # Feature utilities
│   ├── assessment/
│   │   └── scoring-utils.ts
│   └── wellness/
│       └── content-utils.ts
└── shared/           # Shared utilities
    ├── utils/
    │   ├── cn.ts             # className utility
    │   └── date-utils.ts     # Date formatting
    └── constants/
        └── app-constants.ts  # App-wide constants
```

### `/supabase/`

Backend code and configuration.

```
supabase/
├── functions/         # Edge Functions (Deno)
│   ├── ai-assessment-helper/
│   ├── couples-challenge-analyzer/
│   └── realtime-token/
├── migrations/        # Database migrations
│   ├── 001_initial_schema.sql
│   └── 002_add_ai_config.sql
└── templates/        # Email templates
    ├── welcome.html
    └── password-reset.html
```

### `/docs/`

Project documentation.

```
docs/
├── deployment/       # Deployment guides
├── development/      # Development docs
├── ios/             # iOS documentation
├── guides/          # User guides
└── api/             # API documentation
```

## Naming Conventions

### Files
- **Components:** PascalCase - `ChatInterface.tsx`
- **Hooks:** camelCase with `use` prefix - `useChat.ts`
- **Services:** PascalCase with `Service` suffix - `AIService.ts`
- **Types:** kebab-case with `types` suffix - `ai-types.ts`
- **Utils:** kebab-case - `date-utils.ts`

### Code
- **Components:** PascalCase - `function ChatInterface() {}`
- **Hooks:** camelCase - `function useChat() {}`
- **Functions:** camelCase - `function formatDate() {}`
- **Constants:** UPPER_SNAKE_CASE - `const MAX_RETRIES = 3;`
- **Types/Interfaces:** PascalCase - `interface User {}`

## Import Order

```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports (aliases)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/shared/core/useAuth';
import { AIService } from '@/services/features/ai/AIService';

// 3. Relative imports
import { ChatMessage } from './ChatMessage';

// 4. Types
import type { Message } from '@/types/features/ai/ai-types';

// 5. Styles (if any)
import './styles.css';
```

## Best Practices

### 1. Component Organization
```typescript
// Imports
import { useState } from 'react';

// Types
interface Props {
  title: string;
}

// Component
export function MyComponent({ title }: Props) {
  // 1. State hooks
  const [count, setCount] = useState(0);
  
  // 2. Custom hooks
  const { user } = useAuth();
  
  // 3. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 4. Event handlers
  const handleClick = () => {
    // ...
  };
  
  // 5. Render helpers
  const renderContent = () => {
    // ...
  };
  
  // 6. JSX
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### 2. Service Organization
```typescript
// Service class with clear responsibilities
export class MyService {
  // 1. Private properties
  private apiKey: string;
  
  // 2. Constructor
  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY;
  }
  
  // 3. Public methods (API)
  async fetchData(id: string) {
    try {
      return await this.performFetch(id);
    } catch (error) {
      this.handleError(error);
    }
  }
  
  // 4. Private helper methods
  private async performFetch(id: string) {
    // Implementation
  }
  
  private handleError(error: unknown) {
    // Error handling
  }
}
```

### 3. Error Handling
- Use try-catch in services
- Use Error Boundaries in components
- Use ErrorHandlingService for global errors
- Log errors with context

### 4. Type Safety
- Define explicit types for all props
- Avoid `any` - use `unknown` if necessary
- Use discriminated unions for complex states
- Generate types from Supabase schema

## Adding New Features

When adding a new feature, follow this structure:

```
1. Create feature directory in src/components/features/
2. Create service in src/services/features/
3. Create hooks in src/hooks/features/
4. Create types in src/types/features/
5. Create pages in src/pages/features/
6. Add routes in App.tsx
7. Add tests in tests/
```

## Code Quality Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Vite** - Build optimization

## Performance Considerations

- Lazy load pages with React.lazy()
- Memoize expensive calculations with useMemo()
- Memoize callbacks with useCallback()
- Use React.memo() for expensive components
- Implement virtual scrolling for long lists
- Optimize images and assets
- Use Suspense for async components

## Testing Strategy

- **Unit Tests** - Test services, hooks, utilities
- **Integration Tests** - Test feature flows
- **E2E Tests** - Test critical user journeys

---

For questions or suggestions about the project structure, contact the development team.

