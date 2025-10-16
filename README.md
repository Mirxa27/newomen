# Newomen - AI-Powered Couples Relationship Platform

A comprehensive relationship wellness platform powered by AI, designed to help couples strengthen their relationships through personalized assessments, challenges, AI conversations, and wellness resources.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
newomen/
├── src/                          # Source code
│   ├── components/              # React components
│   │   ├── features/           # Feature-specific components
│   │   │   ├── ai/            # AI chat, voice, assessments
│   │   │   ├── admin/         # Admin panel components
│   │   │   ├── community/     # Community features
│   │   │   ├── couples/       # Couples challenges
│   │   │   ├── dashboard/     # Dashboard widgets
│   │   │   ├── gamification/  # Badges, achievements
│   │   │   ├── notifications/ # Notification system
│   │   │   ├── onboarding/    # User onboarding
│   │   │   ├── profile/       # User profiles
│   │   │   ├── sessions/      # Live sessions
│   │   │   ├── subscription/  # Payment & subscriptions
│   │   │   └── wellness/      # Wellness features
│   │   ├── shared/            # Shared/reusable components
│   │   │   ├── layout/        # Layout components
│   │   │   └── ui/            # UI primitives (buttons, cards, etc.)
│   │   └── ui/                # Shadcn UI components
│   ├── hooks/                  # Custom React hooks
│   │   ├── features/          # Feature-specific hooks
│   │   └── shared/            # Shared hooks
│   ├── integrations/           # Third-party integrations
│   │   └── supabase/          # Supabase client & types
│   ├── lib/                    # Utility libraries
│   │   ├── features/          # Feature utilities
│   │   └── shared/            # Shared utilities
│   ├── pages/                  # Page components (routes)
│   │   ├── features/          # Feature pages
│   │   │   ├── ai/           # AI features
│   │   │   ├── admin/        # Admin pages
│   │   │   ├── assessment/   # Assessments
│   │   │   ├── community/    # Community
│   │   │   ├── dashboard/    # Dashboard
│   │   │   ├── profile/      # Profile
│   │   │   └── wellness/     # Wellness hub
│   │   └── public/           # Public pages (landing, about)
│   ├── services/              # Business logic & API services
│   │   ├── features/         # Feature services
│   │   │   ├── ai/          # AI services
│   │   │   ├── assessment/  # Assessment services
│   │   │   ├── auth/        # Authentication
│   │   │   ├── community/   # Community services
│   │   │   └── wellness/    # Wellness services
│   │   └── shared/          # Shared services
│   │       └── core/        # Core services (error handling, etc.)
│   ├── styles/               # Global styles
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── supabase/                  # Supabase backend
│   ├── functions/            # Edge Functions
│   ├── migrations/           # Database migrations
│   └── templates/            # Email templates
├── public/                    # Static assets
├── docs/                      # Documentation
│   ├── deployment/           # Deployment guides
│   ├── development/          # Development docs
│   ├── ios/                  # iOS app documentation
│   └── guides/               # User guides
├── ios/                       # iOS native app (Capacitor)
├── scripts/                   # Build & deployment scripts
└── tests/                     # Test suites
    ├── e2e/                  # End-to-end tests
    ├── integration/          # Integration tests
    └── unit/                 # Unit tests
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS
- **Shadcn/ui** - Component library
- **Framer Motion** - Animations
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Zustand** - Client state management

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Edge Functions (Deno)
  - Storage

### AI Services
- **OpenAI** - GPT models for chat & assessments
- **Z.AI** - Alternative AI provider
- **WebRTC** - Real-time voice chat

### Mobile
- **Capacitor** - Native mobile wrapper
- **iOS** - Native iOS support

## 🔑 Key Features

### AI-Powered Features
- **AI Companion Chat** - Real-time voice and text conversations
- **AI Assessments** - Personalized relationship assessments with AI analysis
- **Couples Challenges** - AI-generated questions and compatibility analysis
- **Conflict Resolution** - AI-guided conflict resolution sessions

### Community
- **Discussion Forums** - Community posts and discussions
- **Live Sessions** - Group wellness sessions
- **Provider Directory** - Find relationship counselors and wellness providers

### Wellness
- **Wellness Library** - Articles, videos, and resources
- **Daily Affirmations** - Personalized affirmations
- **Podcast Hub** - Curated relationship podcasts
- **Card Readings** - Daily guidance cards

### Gamification
- **Achievements** - Earn badges and rewards
- **Streaks** - Daily engagement tracking
- **Leaderboards** - Community rankings
- **Points System** - Earn points for activities

### Admin Panel
- **User Management** - Manage users and permissions
- **Content Management** - Manage articles, resources
- **AI Configuration** - Configure AI providers and models
- **Analytics** - Platform usage analytics
- **System Health** - Monitor system performance

## 🌐 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# AI Providers
VITE_OPENAI_API_KEY=your_openai_key
VITE_ZAI_API_KEY=your_zai_key

# Optional
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SOCIAL_LOGIN=true
```

## 📱 Mobile App (iOS)

```bash
# Sync with iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build iOS app
# See docs/ios/iOS_BUILD_GUIDE.md
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run integration tests
npm run test:integration
```

## 🚢 Deployment

### Web App
```bash
# Build for production
npm run build

# Deploy to Vercel (recommended)
vercel deploy

# Or deploy to your hosting provider
```

### Supabase Functions
```bash
# Deploy all functions
supabase functions deploy --project-ref your_project_ref

# Deploy specific function
supabase functions deploy function-name --project-ref your_project_ref
```

### iOS App
See `docs/ios/IOS_APP_STORE_SUBMISSION.md` for detailed instructions.

## 📚 Documentation

- **[Deployment Guide](docs/deployment/DEPLOYMENT_STATUS.md)** - Production deployment checklist
- **[iOS Build Guide](docs/ios/iOS_BUILD_GUIDE.md)** - iOS app build instructions
- **[Start Here](docs/guides/START_HERE.md)** - Getting started guide
- **[API Documentation](docs/api/)** - API reference

## 🔐 Security

- Row Level Security (RLS) enabled on all Supabase tables
- JWT-based authentication
- Secure API key management
- CORS properly configured
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Copyright © 2025 Newomen. All rights reserved.

## 🆘 Support

For support, email support@newomen.me or join our community forum.

---

**Built with ❤️ by the Newomen Team**

