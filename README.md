# 🌟 Newomen - AI-Powered Personal Growth Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://newomen.me)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E)](https://supabase.com/)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com/Mirxa27/new-mind-nexus)

Transform your life with **Newomen**, an emotionally intelligent AI companion designed for personal growth, meaningful connections, and lasting transformation.

🌐 **Live Site**: [newomen.me](https://newomen.me)

---

## ✨ Features

### 🎯 Core Features
- **AI Voice Conversations**: Real-time voice chat with emotionally intelligent AI using OpenAI Realtime API
- **Personality Assessments**: Deep personality insights with Big Five, MBTI-style, and narrative assessments
- **Narrative Identity Exploration**: Unique AI-powered journey to discover your authentic self through storytelling
- **Progress Tracking**: Visual dashboards showing your personal growth journey
- **Gamification System**: Earn crystals, unlock achievements, and level up as you grow

### 🤝 Community Features
- **Connection Hub**: Find and connect with like-minded individuals
- **Couples Challenge**: Interactive assessment for couples with AI compatibility analysis
- **Wellness Library**: Curated collection of meditation, affirmations, and breathing exercises with **real audio playback**

### 💳 Subscription & Payments
- **PayPal Integration**: Secure payment processing for subscription plans
- **Growth Plan**: $22 for 100 conversation minutes
- **Transformation Plan**: $222 for 1000 conversation minutes
- **Real-time subscription management**: Upgrade, cancel, view usage

### 👤 User Experience
- **Glassmorphism UI**: Modern, elegant design with liquid glass effects
- **Mobile-First**: Responsive design with floating claymorphism navigation
- **Secure Authentication**: Powered by Supabase Auth with row-level security
- **Profile Customization**: Avatar uploads, bio, interests, and progress tracking
- **Data Export**: GDPR-compliant data export functionality

### 🛡️ Admin Features
- **Content Management**: Manage affirmations, challenges, assessments
- **AI Configuration**: Sync providers, manage models and voices
- **Analytics Dashboard**: Monitor platform usage and user engagement
- **Session Management**: Live session monitoring with mute controls

---

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **TailwindCSS** for styling
- **Shadcn/ui** component library
- **React Router** for navigation
- **Recharts** for data visualization
- **React Query** for data fetching

### Backend
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with Row Level Security (RLS)
- **Supabase Edge Functions** (Deno) for serverless API endpoints

### AI Integration
- **OpenAI Realtime API** for voice conversations
- **OpenAI GPT-4o** for content generation and analysis
- **ElevenLabs** for voice synthesis (optional)

### Payment Processing
- **PayPal SDK** for subscription payments
- **Custom Edge Functions** for payment handling

---

## 🛠️ Development

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- PayPal Developer account (optional, for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/Mirxa27/new-mind-nexus.git
cd new-mind-nexus

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
# Required
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project.supabase.co

# Optional - for PayPal payments
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
```

See `.env.example` for complete list.

### Database Setup

```bash
# Install Supabase CLI
npm i supabase --save-dev

# Link to your project
npx supabase link --project-ref your_project_ref

# Push migrations
npx supabase db push

# Create storage buckets
npx supabase storage create avatars --public
```

### Edge Functions Setup

Configure secrets in Supabase Dashboard:

```bash
# Required for AI features
OPENAI_API_KEY=sk-...

# Optional for payments
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_SECRET=your-secret
PAYPAL_MODE=sandbox  # or 'live' for production
```

Deploy functions:

```bash
supabase functions deploy ai-content-builder
supabase functions deploy provider-discovery
supabase functions deploy realtime-token
supabase functions deploy paypal-create-order
supabase functions deploy paypal-capture-order
```

---

## 📦 Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Mirxa27/new-mind-nexus)

### Manual Deployment

```bash
# Build for production
npm run build

# Preview build locally
npm run preview

# Deploy with Vercel CLI
vercel --prod
```

See `DEPLOYMENT_PRODUCTION.md` for complete deployment guide.

---

## 🗂️ Project Structure

```
new-mind-nexus/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # Header, Footer, MainLayout
│   │   ├── chat/         # Chat interface components
│   │   ├── ui/           # Shadcn/ui components
│   │   └── PayPalButton.tsx  # ✨ NEW: PayPal integration
│   ├── pages/            # Route pages
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── Profile.tsx
│   │   ├── WellnessLibrary.tsx  # ✨ Real audio resources
│   │   ├── AccountSettings.tsx  # ✨ PayPal integration
│   │   ├── NarrativeIdentityExploration.tsx
│   │   └── admin/        # Admin pages
│   │       ├── ContentManagement.tsx  # ✨ Affirmations & Challenges
│   │       ├── AIConfiguration.tsx    # ✨ Provider sync
│   │       └── SessionsLive.tsx       # ✨ Session mute
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── integrations/     # Supabase integration
│   └── data/             # Static data and assessments
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
│       ├── ai-content-builder/
│       ├── provider-discovery/
│       ├── realtime-token/
│       ├── paypal-create-order/    # ✨ NEW
│       └── paypal-capture-order/   # ✨ NEW
├── public/               # Static assets
├── dist/                 # Build output
├── FEATURES_COMPLETED.md      # ✨ Implementation report
├── PAYPAL_SETUP.md           # ✨ PayPal guide
└── DEPLOYMENT_PRODUCTION.md  # ✨ Deployment guide
```

---

## 📚 Documentation

- **[FEATURES_COMPLETED.md](FEATURES_COMPLETED.md)** - Complete list of implemented features
- **[PAYPAL_SETUP.md](PAYPAL_SETUP.md)** - PayPal integration setup guide
- **[DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md)** - Production deployment guide
- **[.env.example](.env.example)** - Environment variables reference

---

## 🎨 Design System

### Color Palette
- **Primary**: Liquid glass gradients (purple to pink)
- **Secondary**: Warm earth tones for claymorphism
- **Accent**: Crystal blue highlights

### Typography
- **Headings**: System font stack with gradient effects
- **Body**: Inter/SF Pro for optimal readability

### Effects
- **Glassmorphism**: Translucent cards with backdrop blur
- **Claymorphism**: Soft, tactile mobile UI elements
- **Animations**: Smooth transitions and micro-interactions

---

## 📝 Database Schema

### Core Tables
- `user_profiles` - User profile information
- `user_memory_profiles` - AI conversation memory
- `sessions` - Voice chat sessions
- `messages` - Conversation messages
- `assessments` - Personality assessments
- `assessment_results` - User assessment responses
- `achievements` - Gamification achievements
- `crystal_transactions` - Reward system

### Admin Tables
- `providers` - AI service providers
- `models` - AI models configuration
- `voices` - Voice synthesis options
- `agents` - AI agent configurations

---

## 🔒 Security

- **Row Level Security (RLS)**: All tables protected with PostgreSQL RLS policies
- **Authentication**: Secure JWT-based auth via Supabase
- **API Keys**: Environment variables for sensitive credentials
- **Admin Access**: Email-based admin authorization (`admin@newomen.me`)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Team

**Founder & Creator**: Katrina  
**Platform**: Newomen AI Personal Growth  
**Contact**: admin@newomen.me

---

## 🌐 Links

- **Website**: [newomen.me](https://newomen.me)
- **Documentation**: Coming soon
- **Support**: admin@newomen.me

---

## 🙏 Acknowledgments

- **Supabase** for the amazing backend platform
- **OpenAI** for cutting-edge AI capabilities
- **Vercel** for seamless deployment
- **Shadcn/ui** for beautiful component library
- **TailwindCSS** for flexible styling

---

**Made with 💜 by the Newomen Team**
