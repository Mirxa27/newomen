# Newomen - AI-Powered Personal Growth Platform

A comprehensive React + TypeScript application built with Vite, featuring AI-powered assessments, community features, and mobile support via Capacitor.

## Project Structure

### Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets
├── ios/                    # iOS app configuration
├── supabase/              # Database configuration and migrations
├── database/              # Database scripts and migrations
├── deployment/            # Deployment scripts and configurations
├── tests/                 # Test files organized by type
├── config/                # Configuration files
├── docs/                  # Documentation
└── scripts/               # Build and utility scripts
```

### Source Code Organization (`src/`)

#### Components (`src/components/`)
Organized by feature and shared components:
```
├── features/
│   ├── ai/                # AI-related components (chat, voice, agents)
│   ├── auth/              # Authentication and onboarding
│   ├── admin/             # Admin panel components
│   ├── assessment/        # Assessment and evaluation components
│   ├── community/         # Community and social features
│   └── payment/           # Payment and subscription components
└── shared/
    ├── ui/                # Reusable UI components
    ├── layout/            # Layout components
    └── forms/             # Form components
```

#### Pages (`src/pages/`)
Organized by feature and page type:
```
├── features/
│   ├── ai/                # AI-related pages
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin panel pages
│   ├── assessment/        # Assessment pages
│   ├── community/         # Community pages
│   ├── dashboard/         # Dashboard and profile pages
│   └── payment/           # Payment pages
└── shared/
    ├── public/            # Public pages (landing, about, etc.)
    └── mobile/            # Mobile-specific pages
```

#### Services (`src/services/`)
Business logic organized by feature:
```
├── features/
│   ├── ai/                # AI services
│   ├── auth/              # Authentication services
│   ├── admin/             # Admin services
│   ├── assessment/        # Assessment services
│   ├── community/         # Community services
│   └── payment/           # Payment services
└── shared/
    ├── core/              # Core services
    └── integrations/      # Third-party integrations
```

#### Hooks (`src/hooks/`)
Custom React hooks organized by feature:
```
├── features/
│   ├── ai/                # AI-related hooks
│   ├── auth/              # Authentication hooks
│   ├── admin/             # Admin hooks
│   ├── community/         # Community hooks
│   └── assessment/        # Assessment hooks
└── shared/
    ├── ui/                # UI-related hooks
    └── core/              # Core utility hooks
```

#### Library (`src/lib/`)
Utility functions and configurations:
```
├── features/
│   ├── ai/                # AI utilities
│   ├── auth/              # Authentication utilities
│   └── assessment/        # Assessment utilities
└── shared/
    ├── core/              # Core utilities
    ├── utils/              # General utilities
    ├── types/              # Type definitions
    └── validation/         # Validation schemas
```

#### Types (`src/types/`)
TypeScript type definitions:
```
├── features/
│   ├── ai/                # AI-related types
│   └── assessment/        # Assessment types
└── shared/
    └── core/              # Core types
```

#### Utils (`src/utils/`)
Utility functions:
```
├── features/
│   └── mobile/            # Mobile-specific utilities
└── shared/
    └── core/              # Core utilities
```

### Database (`database/`)
```
├── migrations/            # Database migration scripts
├── scripts/               # Database setup and utility scripts
├── seeds/                 # Database seed data
└── tests/                 # Database tests
```

### Deployment (`deployment/`)
```
├── scripts/               # Deployment scripts
└── configs/               # Deployment configurations
```

### Tests (`tests/`)
```
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests
```

### Configuration (`config/`)
```
├── environment/           # Environment configurations
└── build/                 # Build configurations
```

## Key Features

- **AI-Powered Assessments**: Comprehensive personality and wellness assessments
- **Community Features**: Social interactions and challenges
- **Mobile Support**: iOS and Android apps via Capacitor
- **Admin Panel**: Complete administrative interface
- **Payment Integration**: PayPal and subscription management
- **Real-time Features**: Live chat and notifications

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Radix UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Mobile**: Capacitor
- **State Management**: TanStack Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **AI Integration**: Multiple AI providers

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Mobile Development

```bash
# Sync with mobile platforms
npm run cap:sync

# Open iOS project
npm run ios:build

# Open Android project
npm run android:build
```

## Database Management

```bash
# Check database status
npm run db:status

# Run database tests
npm run db:test
```

## Architecture Principles

1. **Feature-Based Organization**: Code is organized by business features rather than technical layers
2. **Separation of Concerns**: Clear separation between UI, business logic, and data layers
3. **Reusability**: Shared components and utilities are clearly identified
4. **Scalability**: Structure supports easy addition of new features
5. **Maintainability**: Clear naming conventions and logical grouping
6. **Type Safety**: Comprehensive TypeScript usage throughout
7. **Testing**: Organized test structure supporting different test types
8. **Documentation**: Clear documentation and README files
