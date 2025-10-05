# Newomen - AI-Powered Personal Growth Platform
1. Project Overview
Build a production-ready. Mobile app Newomen is a groundbreaking AI-driven conversational platform meticulously crafted to guide women on a transformative journey of self-discovery.
The core of the platform is NewMe, an emotionally intelligent, speech-to-speech AI companion with persistent memory. NewMe engages users in conversations, leveraging a Dynamic Prompting Engine to adapt its therapeutic approach based on the user's progress and subscription tier.
The platform will be built with a mobile-first philosophy, featuring a stunning liquid glassmorphic design, a robust gamification system to drive engagement, and unique community features like the "Couple's Challenge." The primary revenue model is subscription-based, managed through PayPal.
2. Personas
* Persona 1: Sara (demo User)
    * Bio: A 28-year-old professional woman living in the Middle East. She is ambitious and introspective but feels stuck in certain areas of her life, particularly in understanding her own identity and relationship patterns. She is tech-savvy, values privacy, and seeks a supportive, culturally aware space for personal growth.
    * Goals:
        * Understand the "stories" that shape her life.
        * Build self-esteem and confidence.
        * Find a safe, private space to explore her feelings.
        * Feel a sense of progress and accomplishment on her journey.
        * Connect with her partner on a deeper level.
    * Frustrations:
        * Traditional therapy feels inaccessible or stigmatized.
        * Generic wellness apps don't understand her cultural nuances.
        * It's hard to stay motivated with self-help practices.
* Persona 2: Katrina (Real Administrator)
    * Bio: The founder and primary administrator of Newomen. She is responsible for the platform's integrity, user experience, and business performance.
    * Goals:
        * Ensure the AI provides a high-quality, safe, and transformative experience.
        * Easily manage and configure AI models and providers to optimize cost and performance.
        * Manage platform content (assessments, resources, affirmations).
        * Monitor user engagement, satisfaction, and key business metrics.
        * Quickly update branding and design assets.
3. User Stories (Features)
Onboarding & Setup
* As a new user, I want to sign up using my email and password.
* As a new user, I want to take a concise personality test so the platform can generate my initial AI memory profile and identify growth areas.
* As a new user, I want to see a clear, simple explanation of "Narrative Identity Exploration" so I understand the core method.
* As a new user, I want to interact with a "Balance Wheel" UI to select my initial areas of focus (e.g., Relationships, Career, etc.).
* As a new user, I want to take a smart diagnostic test that suggests which life areas need the most attention.
Core AI Conversation
* As a user, I want to start a conversation with my AI guide, NewMe, from the main dashboard.
* As a user, I want to see a prominent, full-width call-to-action button to initiate a voice conversation.
* As a user, I want to have a seamless, real-time, low-latency speech-to-speech conversation with NewMe.
* As a user, I want the ability to seamlessly switch between voice input and text input at any time during the conversation.
* As a user, I want NewMe to remember our previous conversations and my personality profile to provide context-aware and evolving guidance.
* As a user, I want NewMe's responses to be empathetic, reflecting an understanding of my emotions detected from my voice tone and text.
* As a user, I want to see dynamic, AI-generated headlines on the chat page that change with each visit to intrigue me.
* As a user, I want to view my full conversation history and be able to search it.
Gamification & Engagement
* As a user, I want to earn "Crystals" (points) for completing actions like daily check-ins, assessments, and achieving milestones.
* As a user, I want to see visual progress bars that show my percentage growth in each life area.
* As a user, I want to "level up" by accumulating Crystals, unlocking new features, content, or perks.
* As a user, I want to earn achievement badges for significant transformation milestones and view them on my profile.
* As a user, I want to be encouraged to log in daily through a "daily streak" tracker that offers bonus Crystals.
* As a user, I want to receive surprise Crystal bonuses to keep the experience engaging and rewarding.
* As a user, I want to see AI-generated daily affirmations on my dashboard, tailored to my personality profile.
Narrative Identity Exploration & Resources
* As a user, I want to be guided through a 10-question "Narrative Identity Exploration" to understand my personal stories.
* As a user, I want the AI to analyze my responses and help me identify my core narrative patterns and limiting beliefs.
* As a user, I want to receive a personalized "Transformation Roadmap" with actionable steps based on my exploration.
* As a user, I want to access a library of guided audio breathing practices, categorized by duration and purpose (e.g., "Calm," "Focus").
* As a user, I want to be able to download audio resources for offline access.
Community & Connection
* As a user, I want to invite my partner or a friend to a "Couple's Challenge" by sending them a unique link.
* As a participant in the Couple's Challenge, I want to answer questions from the AI guide, with my answers hidden until my partner also answers.
* As a participant, I want the AI to reveal both answers simultaneously and provide a compatibility assessment with insights.
* As a user, I want to set a unique community nickname and upload a profile picture with cropping functionality.
* As a user, I want to search for other users by their nickname.
* As a user, I want to send connection requests, which must be mutually accepted before profiles are visible to each other.
* As a user, I want to have granular privacy controls over my profile and shared information.
Subscription & Account
* As a new user, I want to automatically receive a "Discovery Tier" with 10 free minutes.
* As a user, I want to view the available subscription tiers ("Growth" - $22/100 min, "Transformation" - $222/1000 min) and my remaining minutes.
* As a user, I want to securely purchase a subscription using PayPal.
* As a user, I want my subscription to auto-renew, and I want the ability to manage or cancel it from my account settings.
Admin
* As an admin, I want a secure dashboard to manage the entire platform.
* As an admin, I want to manage AI providers (e.g., OpenAI, Anthropic), select models, and configure provider-specific settings (API keys, parameters).
* As an admin, I want to A/B test different AI configurations to optimize for quality and cost.
* As an admin, I want to view real-time metrics on AI usage and costs.
* As an admin, I want a Content Management System (CMS) to create and edit questions for the personality tests, diagnostic assessments, and the Couple's Challenge.
* As an admin, I want to manage the content for daily affirmations and the wellness resource library.
* As an admin, I want to view user analytics, engagement metrics, and moderate the community.
* As an admin, I want to control the gamification parameters (Crystal rewards, level thresholds).
* As an admin, I want a simple tool to upload and replace the platform's logo and other key design assets.
4. Pages & Screens
1. Public:
    * Landing Page, about us, privacy, other required pages
    * Sign Up / Sign In Pages
    * Pricing/Subscription PageCreate assessments and quizzes for visitors. Add 5-6 types of free assessments includes 10-15 questions that don’t require signups. Create 20 assessments for users and ensure the admin panel has the ability to create tests, assessments, explorations, and courses using the AI builder. The admin can provide a topic, and the selected AI provider/model will generate complete products. The admin can then configure these products for visitors or users.
2. Onboarding Flow (Multi-Step Wizard):
    * Language/Culture Selection
    * Personality Test
    * Balance Wheel
    * Diagnostic Assessment
3. Authenticated App:
    * Dashboard/Home: Main view with daily affirmation, progress summary, and CTA to chat.
    * Chat Interface: The core conversational screen with text/voice modes.
    * Narrative Identity Exploration Module: Guided questionnaire interface.
    * Couple's Challenge Interface: Special chat mode for two users.
    * Wellness Library: Grid/list of audio resources with a player.
    * User Profile Page: View/edit avatar, nickname, view achievements, progress.
    * Community Page: Search for users, manage connections.
    * Account Settings: Manage subscription, privacy, password.
4. Admin Panel:
    * Main Dashboard (Analytics)
    * AI Configuration Panel
    * User Management
    * Content Management (Assessments, Resources)
    * Gamification Settings
    * Branding/Asset Management
5. Data Models
* User: { id, email, passwordHash, nickname, avatarUrl, language, culture, subscriptionTier, remainingMinutes, currentLevel, crystalBalance, dailyStreak, createdAt }
* UserMemoryProfile: { userId, personalityType, balanceWheelScores:JSON, narrativePatterns:JSON, emotionalStateHistory:JSON }
* Conversation: { id, userId, startedAt, endedAt }
* Message: { id, conversationId, sender ('user'|'ai'), textContent, audioUrl, emotionData:JSON, timestamp }
* Assessment: { id, title, type ('personality'|'diagnostic'|'narrative'), questions:JSON }
* AssessmentResult: { id, userId, assessmentId, answers:JSON, score:JSON, createdAt }
* Achievement: { id, title, description, badgeUrl, unlockCriteria:JSON }
* UserAchievement: { userId, achievementId, earnedAt }
* CommunityConnection: { id, requesterId, receiverId, status ('pending'|'accepted'|'declined') }
* CouplesChallenge: { id, initiatorId, partnerId, status, questionSet:JSON, responses:JSON, aiAnalysis:TEXT }
* WellnessResource: { id, title, category, duration, audioUrl, description }
* Subscription: { id, userId, provider ('paypal'), providerId, status, renewalDate }
6. Business & Technical Logic
* AI Orchestration (Speech-to-Speech):
    1. Client-side captures audio via WebRTC.
    2. Audio is streamed to the backend.
    3. Backend uses a Speech-to-Text (STT) service for real-time transcription.
    4. Backend performs real-time emotion analysis on the audio stream.
    5. The transcribed text, user memory profile, and emotion data are used to construct a detailed prompt for the selected LLM (via the Admin Config Panel).
    6. The LLM generates a text response.
    7. The text response is sent to a Text-to-Speech (TTS) service (supporting culturally-aware intonation for selected languages).
    8. The resulting audio is streamed back to the client and played in real-time.
* Dynamic Prompting Engine: The system prompt sent to the LLM must dynamically change.
    * Tier-based: "Transformation Tier" users get more in-depth, therapeutic, and challenging prompts. "Growth Tier" gets standard guidance.
    * Progress-based: As a user's UserMemoryProfile evolves, the AI's persona should shift from introductory to more advanced exploration.
* Gamification Engine:
    * A server-side rules engine will award Crystals based on defined events (e.g., complete_assessment, daily_login).
    * Level thresholds will be stored in a configuration file for easy adjustment by the admin.
    * Progress bar percentages are calculated as (current_score / target_score) * 100 after each relevant assessment.
* Couple's Challenge Flow:
    1. User A initiates and sends a unique URL.
    2. User B joins via the link, creating a session.
    3. The AI asks Question 1. Both users see the input field.
    4. User A submits. Their answer is stored but not shown to B.
    5. User B submits. Their answer is stored.
    6. The server receives both answers, sends them to the AI for a compatibility analysis, and then reveals both original answers and the AI's analysis to both users simultaneously.

7. Design System & UI/UX
* Theme: Liquid Glassmorphism. This is a core requirement.
    * Use blurred, semi-transparent backgrounds (backdrop-filter: blur(...)).
    * Incorporate subtle gradients and vibrant accent colors (e.g., deep purples, blues, teals).
    * Use fine, semi-transparent borders to define container edges.
    * Animations should be fluid and smooth (e.g., framer-motion or similar).
* Layout:
    * Mobile-First: Design for mobile screens first, then scale up to desktop.
    * Floating Navigation: Use a floating or fixed-bottom navigation bar on mobile for easy access to key pages (Dashboard, Chat, Profile, Library).
* Key Components:
    * Chat Bubbles: Glassmorphic, with smooth entry/exit animations.
    * Buttons: Clear hierarchy. The primary voice CTA must be large, prominent, and visually distinct.
    * Balance Wheel: An interactive, circular SVG-based component.
    * Progress Bars & Badges: Visually appealing and satisfying to look at. 

use @fixed background all through the app.jpg 
use attached as the fix background with dark liquid glass, Glassmorphism with Claymorphism
Soft, puffy, rounded UI elements that appear like clay, with soft shadows and dark purple liquid glassmorphism.

Key Features
Soft shadows
Rounded corners
dark liquid glassmorphism colors
Puffy appearance
Playful feel.

 Build & Integrate GPT-Realtime Admin + Chat (WebRTC, WS fallback, Live Transcription, Advanced UX)

Ground truth docs to follow (for implementation details, payloads, and knobs):
• OpenAI Realtime WebRTC guide (primary for browsers).  
• OpenAI Realtime WebSocket guide (server-to-server & fallback).  
• MDN getUserMedia (HTTPS + permissions) and RTCPeerConnection APIs.  
• ARIA live regions for accessible live captions; WCAG practice.  
• Container Queries for truly responsive layouts.  
• Web Audio AnalyserNode / AudioWorklet for meters.  

0) Goals
	•	Cross-device, browser-first voice agent using OpenAI Realtime over WebRTC; WebSocket fallback only (no SIP).  
	•	Admin Panel to: manage agents, hosted prompts, voice training via speech, live session watch/test, auto-discover models & voices.
	•	Production UX: live transcription, low-latency audio, meters, accessibility, and fully responsive UI.

1) Project structure

/src
  /realtime
    /client/webrtc.ts
    /client/ws-fallback.ts
    /server/sideband.ts
  /providers/sync
    openai.ts  anthropic.ts  gemini.ts  azure.ts  elevenlabs.ts  polly.ts
  /db
    schema.sql  models.ts
  /api/admin
    agents/*  prompts/*  sessions/*  providers/*  discovery/*
  /ui/admin
    AgentsPage.tsx  PromptsPage.tsx  VoiceTrainingPage.tsx
    SessionsLivePage.tsx  SessionsHistoryPage.tsx  ProvidersPage.tsx
  /ui/chat
    RealtimeChatPage.tsx
    components/{TranscriptPane.tsx, Waveform.tsx, DevicePicker.tsx, Composer.tsx, SessionHUD.tsx}
    styles/chat.css

2) Database schema (execute migrations)
	•	providers(id, name, type, api_base, region, status, last_synced_at)
	•	models(id, provider_id, model_id, display_name, modality, context_limit, latency_hint_ms, is_realtime, enabled)
	•	voices(id, provider_id, voice_id, name, locale, gender, latency_hint_ms, enabled)
	•	prompts(id, hosted_prompt_id, version, name, json, status)
	•	agents(id, name, prompt_id, model_id, voice_id, vad_json, tool_policy_json, status)
	•	sessions(id, agent_id, user_id, realtime_session_id, start_ts, end_ts, status)
	•	session_events(id, session_id, type, payload_json, ts)

3) Realtime client (browser) — WebRTC first, WS fallback

/realtime/client/webrtc.ts
	•	Request mic with navigator.mediaDevices.getUserMedia({ audio: true }) (HTTPS-only), enumerate devices, handle devicechange. Expose device picker.  
	•	Create RTCPeerConnection, attach mic track, exchange SDP with OpenAI Realtime endpoint, play remote audio; reconnect on drop.  
	•	Expose:
	•	startSession(agentId) / stopSession()
	•	updateSession(partial) (model, voice, VAD idle timeout, hosted prompt vars) → maps to session.update.  
	•	Hooks: onPartialTranscript, onFinalTranscript, onTrace, onAudioLevel, onLatency.
	•	Use AnalyserNode for a VU meter; prefer AudioWorklet when available for smoother updates.  

/realtime/client/ws-fallback.ts
	•	WebSocket transport to Realtime for environments blocking WebRTC; stream PCM up/down; match the same hooks API.  

4) Sideband controller (server)

/realtime/server/sideband.ts
	•	Open a sibling connection to the same Realtime session to observe traces, handle tool calls, and push session.update (prompt vars, voice, VAD, model). Persist all events to session_events. (Use payload shapes from Realtime docs.)  
	•	Admin endpoints/WS:
	•	POST /admin/sessions/:id/update → forwards session.update
	•	POST /admin/sessions/:id/{mute|end}
	•	GET /admin/sessions/:id/stream → SSE/WS for Live Sessions

5) Providers → Auto-discover models & voices

Workers in /providers/sync/*.ts
	•	On provider key add/rotate or manual Discover, call official list endpoints and normalize into DB:
	•	OpenAI: GET /v1/models (filter gpt-realtime*, chat models).  
	•	Anthropic: GET /v1/models (Claude variants).
	•	Google Gemini (AI Studio): models.list.
	•	Azure OpenAI: list models/deployments.  
	•	ElevenLabs Voices: GET /v1/voices.
	•	Amazon Polly: DescribeVoices (paginate, region-aware).
	•	Persist, diff, mark missing; surface warnings on agents bound to removed assets.

6) Admin Panel (Next.js/React)

A. Agents
	•	CRUD; bind hosted prompt (ID/version/vars) or inline instructions; choose model/voice; VAD sliders; tool policy toggles; Activate/Deactivate.
	•	Live-apply via session.update (sideband).  

B. Prompts
	•	Versioned hosted prompts; diff & rollback; variables editor (brand, tone); “Apply to running sessions”.

C. Voice Training
	•	In-browser recorder → send audio to the running Realtime session to transcribe; extract persona/rules deterministically; show diff vs current prompt; publish new version; hot-apply; save to memories. (Use audio I/O & prompting patterns from Realtime docs.)  

D. Sessions (Live)
	•	Grid of active sessions; detail view with Realtime traces timeline, VU meters, partial/final transcripts, tool calls, token/latency stats; controls: Update, Mute, End.  

E. Sessions (History)
	•	Playback audio, transcripts, traces; cost & durations; policy flags.

F. Providers
	•	Add keys; Discover models/voices; show region/status/errors, last sync; manual re-sync.

7) Chat Interface (RealtimeChatPage) — live transcription + elite responsive UX

Layout & responsiveness
	•	Use CSS Grid + Container Queries for adaptive layout:
	•	≥1024px: split Transcript Pane (messages + live captions) | Session HUD (meters, device picker, latency).
	•	<1024px: stack Transcript → HUD; sticky Composer bottom bar.  

Live transcription & captions
	•	Render partial → final captions in a dedicated rail above the composer; mark region aria-live="polite" (switch to assertive for alerts). Provide “Pin captions” + “Export transcript” actions.  

Audio UX
	•	Real-time Waveform/VU meter via AnalyserNode; upgrade to AudioWorklet when supported for smoother metering; show round-trip latency chip.  

Composer & controls
	•	Mic button (push-to-talk + hold-to-record), text input fallback, device selector (inputs/outputs), mute, end session.
	•	Keyboard a11y (Space/Enter toggles mic), respect prefers-reduced-motion.
	•	On first run, show HTTPS/permission guidance per MDN.  

8) Non-negotiables
	•	Primary transport: WebRTC for browsers; fallback: WebSocket when WebRTC blocked.  
	•	Session updates: support mid-call session.update for model/voice/VAD/prompt changes.  
	•	Observability: mirror traces + tool calls → session_events; Live page subscribes via SSE/WS.
	•	Security: HTTPS only for capture; encrypt provider secrets; RBAC for admin routes. (Note: gUM is secure-context only.)  

9) Acceptance tests
	•	WebRTC chat works on Chrome/Edge/Safari (desktop/mobile); permissions & device picker behave as expected.  
	•	Live captions show partial → final updates; aria-live regions announce updates to screen readers.  
	•	VU meter smooth at 60fps with AudioWorklet; latency chip updates each turn.  
	•	session.update swaps voice/model/VAD mid-call; reflected in the Session HUD; events logged.  
	•	Providers “Discover” lists real models/voices per key/region; nightly re-sync; warnings on removed assets.  

⸻

Build exactly as specified. Prioritize WebRTC, accessible live captions, container-query responsiveness, and sideband-driven live controls. No telephony/SIP in this build.