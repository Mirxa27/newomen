# 🌟 Newomen - AI-Powered Personal Growth Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://newomen.me)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E)](https://supabase.com/)

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
- **Wellness Library**: Curated collection of meditation, affirmations, and breathing exercises

### 👤 User Experience
- **Glassmorphism UI**: Modern, elegant design with liquid glass effects
- **Mobile-First**: Responsive design with floating claymorphism navigation
- **Secure Authentication**: Powered by Supabase Auth with row-level security
- **Profile Customization**: Avatar uploads, bio, interests, and progress tracking

---

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **TailwindCSS** for styling
- **Shadcn/ui** component library
- **React Router** for navigation
- **Recharts** for data visualization

### Backend
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with Row Level Security (RLS)
- **Supabase Edge Functions** for serverless API endpoints

### AI Integration
- **OpenAI Realtime API** for voice conversations
- **OpenAI GPT-4** for content generation and analysis
- **ElevenLabs** for voice synthesis (optional)

---

## 🛠️ Development

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/Mirxa27/new-mind-nexus.git
cd new-mind-nexus

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and OpenAI credentials

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Database Setup

```bash
# Install Supabase CLI
npm i supabase --save-dev

# Link to your project
npx supabase link --project-ref your_project_ref

# Push migrations
npx supabase db push
```

---

## 📦 Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

3. **Configure Domain**:
   - Add `newomen.me` in Vercel dashboard
   - Update DNS settings to point to Vercel

4. **Set Environment Variables**:
   - Add all environment variables in Vercel dashboard
   - Ensure `VITE_` prefix for client-side variables

### Environment Variables in Vercel
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENAI_API_KEY`

---

## 🗂️ Project Structure

```
new-mind-nexus/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # Header, Footer, MainLayout
│   │   ├── chat/         # Chat interface components
│   │   └── ui/           # Shadcn/ui components
│   ├── pages/            # Route pages
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── Profile.tsx
│   │   └── admin/        # Admin pages
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── integrations/     # Supabase integration
│   └── data/             # Static data and assessments
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
├── public/               # Static assets
└── dist/                 # Build output
```

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
