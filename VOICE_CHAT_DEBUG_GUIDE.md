# NewMe Voice Chat Debugging Guide

## Overview
The NewMe voice chat feature uses **OpenAI's Realtime API** with **WebRTC** for real-time voice conversations. This guide will help you debug and test the functionality.

## Architecture

```
User Browser (Chat.tsx)
    ↓
RealtimeChat Utility (RealtimeAudio.ts)
    ↓
Supabase Edge Function (realtime-token)
    ↓
OpenAI Realtime API
    ↓
WebRTC Connection (Audio Streaming)
```

## Verification Steps

### 1. Check Edge Function Status ✅
```bash
npx supabase functions list
```
**Expected:** `realtime-token` should show as `ACTIVE`

### 2. Verify Secrets Are Set ✅
```bash
npx supabase secrets list
```
**Expected:** `OPENAI_API_KEY` should be present

### 3. Test Edge Function Directly ✅
```bash
SUPABASE_URL=$(cat .env | grep VITE_SUPABASE_URL | cut -d'"' -f2)
SUPABASE_KEY=$(cat .env | grep VITE_SUPABASE_ANON_KEY | cut -d'"' -f2)

curl -X POST "${SUPABASE_URL}/functions/v1/realtime-token" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json"
```
**Expected:** JSON response with `client_secret.value` and `expires_at`

### 4. Test in Browser
1. Open your deployed app or run locally:
   ```bash
   npm run dev
   ```

2. Navigate to the NewMe Voice Chat page

3. Open **Browser DevTools** (F12) → **Console**

4. Click "Start Conversation"

5. Grant microphone permissions when prompted

## Expected Console Logs (Success Path)

```
Requesting ephemeral token...
Ephemeral token received, expires at: [timestamp]
Requesting microphone access...
Microphone access granted
Data channel opened
Connecting to OpenAI Realtime API...
OpenAI API response status: 201
WebRTC connection established successfully
Starting audio recording...
AudioRecorder: Requesting microphone permissions...
AudioRecorder: Microphone permissions granted
AudioRecorder: AudioContext created
AudioRecorder: Audio processing pipeline connected
Audio recording started successfully
Received event: session.created
Received event: conversation.created
Remote track received: audio
```

## Common Issues & Solutions

### Issue 1: "Permission denied" Error
**Symptoms:** Microphone access denied
**Solutions:**
- Click the lock icon in browser address bar
- Allow microphone permissions for the site
- Try in Incognito/Private mode (fresh permissions)
- On Chrome: chrome://settings/content/microphone
- On Firefox: about:preferences#privacy → Permissions → Microphone

### Issue 2: "Failed to get ephemeral token"
**Symptoms:** Console shows error getting token
**Solutions:**
1. Check OpenAI API Key is valid:
   ```bash
   # Update the secret
   npx supabase secrets set OPENAI_API_KEY=sk-your-actual-key
   
   # Redeploy the function
   npx supabase functions deploy realtime-token
   ```
2. Verify OpenAI account has:
   - Active subscription/credits
   - Access to GPT-4o Realtime API (requires API access tier)
   - Billing enabled

### Issue 3: "Failed to connect: 401"
**Symptoms:** OpenAI API returns 401 Unauthorized
**Solutions:**
- API key is invalid or expired
- API key doesn't have access to Realtime API
- Update `OPENAI_API_KEY` in Supabase secrets

### Issue 4: "Failed to connect: 429"
**Symptoms:** Too many requests / Rate limit
**Solutions:**
- OpenAI account out of credits
- Rate limit exceeded
- Wait and try again
- Check OpenAI dashboard: https://platform.openai.com/usage

### Issue 5: "Browser doesn't support audio recording"
**Symptoms:** getUserMedia not available
**Solutions:**
- Use HTTPS (required for microphone access)
- Use modern browser: Chrome 74+, Firefox 66+, Safari 12+
- Check if running locally, use `localhost` not `127.0.0.1`

### Issue 6: WebRTC Connection Fails
**Symptoms:** No audio playback, connection drops
**Solutions:**
- Check firewall/network blocks WebRTC
- Disable VPN temporarily
- Try different network (mobile hotspot)
- Check browser WebRTC settings

## Manual Testing Checklist

- [ ] Edge Function `realtime-token` is deployed (ACTIVE)
- [ ] `OPENAI_API_KEY` secret is set
- [ ] Local build succeeds (`npm run build`)
- [ ] Browser console shows no TypeScript errors
- [ ] Navigate to NewMe Voice Chat page
- [ ] Click "Start Conversation"
- [ ] Microphone permission granted
- [ ] Console shows "WebRTC connection established successfully"
- [ ] Can hear AI voice response
- [ ] Can see transcript updating
- [ ] Session duration timer running
- [ ] Can send text messages
- [ ] Can end conversation cleanly

## Advanced Debugging

### Enable Verbose Logging
All logging has been enhanced in commit `850e4ea`. Check the console for detailed step-by-step logs.

### Check WebRTC Stats
```javascript
// In browser console while connected
const pc = document.querySelector('audio').srcObject.getTracks()[0].getSettings();
console.log('Audio track settings:', pc);
```

### Monitor Network Traffic
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket) or "media"
3. Look for connections to:
   - `api.openai.com/v1/realtime`
   - Your Supabase function endpoint

### Check OpenAI API Status
- Visit: https://status.openai.com/
- Verify Realtime API is operational

## Environment Requirements

### Browser Requirements
- **Chrome/Edge:** Version 74+ (recommended)
- **Firefox:** Version 66+
- **Safari:** Version 12+
- **HTTPS required** for microphone access (except localhost)

### OpenAI Requirements
- **API Key:** Valid OpenAI API key
- **Access Tier:** Must have access to GPT-4o Realtime API
- **Model:** `gpt-4o-realtime-preview-2024-12-17`
- **Billing:** Active with sufficient credits

### Supabase Requirements
- **Edge Functions:** Enabled and deployed
- **Secrets:** `OPENAI_API_KEY` configured
- **CORS:** Properly configured for your domain

## Testing Locally

```bash
# Start local Supabase (if testing locally)
npx supabase start

# Set local secret
npx supabase secrets set OPENAI_API_KEY=sk-your-key

# Deploy function locally
npx supabase functions deploy realtime-token --no-verify-jwt

# Start dev server
npm run dev

# Open browser to http://localhost:5173
```

## Production Testing

1. **Deploy to Vercel:**
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

2. **Verify Environment:**
   - Supabase production project configured
   - OPENAI_API_KEY set in production
   - Edge function deployed to production

3. **Test on Production URL:**
   - Open production URL (HTTPS required)
   - Test voice chat functionality

## Support Resources

- **OpenAI Realtime API Docs:** https://platform.openai.com/docs/guides/realtime
- **OpenAI API Status:** https://status.openai.com/
- **OpenAI API Keys:** https://platform.openai.com/api-keys
- **OpenAI Usage Dashboard:** https://platform.openai.com/usage
- **Supabase Dashboard:** https://supabase.com/dashboard
- **WebRTC Troubleshooting:** https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

## Current Status

✅ **Code Changes:**
- Enhanced logging in `RealtimeAudio.ts`
- Better error messages
- Detailed console output
- Commit: `850e4ea`

✅ **Infrastructure:**
- Edge Function deployed
- Secrets configured
- Build succeeds
- TypeScript errors resolved

⏳ **Next Steps:**
1. Open browser console
2. Test voice chat
3. Report specific error from console logs
4. Follow troubleshooting based on error type

## Quick Test Command

Run this to verify everything is working:

```bash
# From project root
cd /Users/abdullahmirxa/Documents/GitHub/newomen

# Test Edge Function
curl -X POST "$(cat .env | grep VITE_SUPABASE_URL | cut -d'"' -f2)/functions/v1/realtime-token" \
  -H "Authorization: Bearer $(cat .env | grep VITE_SUPABASE_ANON_KEY | cut -d'"' -f2)" \
  -H "Content-Type: application/json" | jq '.'

# If you see a JSON response with "client_secret", the backend is working!
```

## Getting Help

If you continue to experience issues:

1. **Collect these details:**
   - Browser name and version
   - Exact error message from console
   - Network errors from DevTools
   - Screenshots of console logs

2. **Check OpenAI Account:**
   - Verify API key validity
   - Check usage/billing status
   - Confirm Realtime API access

3. **Verify Configuration:**
   - Supabase secrets are correct
   - Environment variables are set
   - HTTPS is enabled (production)

---

**Last Updated:** 2025-01-06  
**Commit:** 850e4ea  
**Status:** Enhanced logging deployed, ready for testing
