# 🧪 Supabase Edge Functions - Test Suite

## 📊 Function Status Overview

| Function | Status | Z.AI | Purpose | Version |
|----------|--------|------|---------|---------|
| **ai-assessment-processor** | ✅ ACTIVE | ✅ Yes | AI assessment analysis | v8 |
| **couples-challenge-analyzer** | ✅ ACTIVE | ✅ Yes | Couples challenge analysis | v34 |
| **gamification-engine** | ✅ ACTIVE | ❌ No | Crystals & achievements | v37 |
| **realtime-token** | ✅ ACTIVE | ❌ No | Realtime auth tokens | v96 |
| **ai-content-builder** | ✅ ACTIVE | ❌ No | Content generation | v72 |
| **provider-discovery** | ✅ ACTIVE | ❌ No | Provider search | v71 |
| **paypal-create-order** | ✅ ACTIVE | ❌ No | Payment processing | v62 |
| **paypal-capture-order** | ✅ ACTIVE | ❌ No | Payment capture | v63 |
| **community-operations** | ✅ ACTIVE | ❌ No | Community features | v3 |
| **quiz-processor** | ✅ ACTIVE | ❌ No | Quiz processing | v3 |
| **ai-generate** | ✅ ACTIVE | ❌ No | AI content generation | v5 |

---

## ✅ Recent Updates (Oct 12, 2025)

### **1. ai-assessment-processor** - v8 ✅
**Fixed:** Z.AI API key retrieval
- Changed from env vars to database function
- Uses `get_provider_api_key_by_type('zai')`
- Enhanced error handling
- **Status:** DEPLOYED & TESTED

### **2. couples-challenge-analyzer** - v34 ✅
**Fixed:** Z.AI API key retrieval (JUST DEPLOYED)
- Updated to match ai-assessment-processor
- Uses database function for API key
- Consistent error handling
- **Status:** DEPLOYED (needs testing)

---

## 🧪 Test Scenarios

### **Priority 1: Z.AI Functions (CRITICAL)**

#### **Test 1: AI Assessment Processor**
```bash
# Prerequisites:
# - User account created
# - Assessment available
# - Z.AI API key configured ✅

# Test Flow:
1. Login to: https://newomen-3xoxj6l69-mirxa27s-projects.vercel.app/auth
2. Navigate to: /assessments
3. Select any assessment
4. Complete all questions
5. Submit assessment

# Expected Result:
✅ Score displayed (0-100)
✅ Personalized feedback shown
✅ Insights provided
✅ Recommendations listed
✅ Strengths identified
✅ Growth areas highlighted
✅ Gamification triggered if passing

# Check Logs:
Dashboard → Edge Functions → ai-assessment-processor → Logs
Look for: "Assessment processed successfully with Z.AI"

# Verify in Database:
SELECT * FROM assessment_attempts WHERE is_ai_processed = true ORDER BY completed_at DESC LIMIT 1;
```

#### **Test 2: Couples Challenge Analyzer**
```bash
# Prerequisites:
# - Two user accounts
# - Couples challenge template created
# - Z.AI API key configured ✅

# Test Flow:
1. User A creates couples challenge
2. User A invites User B
3. User B accepts invitation
4. Both users complete their responses
5. Submit for analysis

# Expected Result:
✅ Overall alignment score (0-100)
✅ Individual insights for both partners
✅ Growth opportunities identified
✅ Conversation starters suggested
✅ Relationship strengths highlighted
✅ Gamification rewards for both

# Check Logs:
Dashboard → Edge Functions → couples-challenge-analyzer → Logs
Look for: "Analyzing question X with Z.AI..."

# Verify in Database:
SELECT * FROM couples_challenges WHERE status = 'analyzed' ORDER BY updated_at DESC LIMIT 1;
```

---

### **Priority 2: Payment Functions**

#### **Test 3: PayPal Order Creation**
```bash
# Test Flow:
1. Navigate to: /pricing
2. Select a plan
3. Click "Subscribe"
4. Verify PayPal modal opens

# Expected Result:
✅ PayPal order created
✅ Order ID returned
✅ Payment modal displays
✅ No errors in console

# Check Logs:
Dashboard → Edge Functions → paypal-create-order → Logs
```

#### **Test 4: PayPal Order Capture**
```bash
# Test Flow:
1. Complete payment in PayPal modal
2. Return to app
3. Verify subscription status

# Expected Result:
✅ Payment captured successfully
✅ User subscription updated
✅ Access granted to premium features
✅ Receipt generated

# Check Logs:
Dashboard → Edge Functions → paypal-capture-order → Logs
```

---

### **Priority 3: Gamification**

#### **Test 5: Gamification Engine**
```bash
# Test Flow:
1. Complete an assessment (score ≥ passing)
2. Check crystal balance
3. Check achievements

# Expected Result:
✅ Crystals awarded
✅ Achievement unlocked
✅ Level progress updated
✅ Notification displayed

# Check Logs:
Dashboard → Edge Functions → gamification-engine → Logs

# Verify in Database:
SELECT * FROM crystal_transactions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 5;
SELECT * FROM user_achievements WHERE user_id = 'YOUR_USER_ID' ORDER BY unlocked_at DESC LIMIT 5;
```

---

### **Priority 4: Realtime & Community**

#### **Test 6: Realtime Token Generation**
```bash
# Test Flow:
1. Login to app
2. Navigate to NewMe chat
3. Start conversation
4. Send message

# Expected Result:
✅ Realtime connection established
✅ Token generated successfully
✅ Messages sent/received in real-time
✅ No connection errors

# Check Logs:
Dashboard → Edge Functions → realtime-token → Logs
```

#### **Test 7: Community Operations**
```bash
# Test Flow:
1. Navigate to: /community
2. Create new post
3. Comment on post
4. Like/react to content

# Expected Result:
✅ Post created successfully
✅ Comments displayed in real-time
✅ Likes/reactions updated
✅ Moderation working (if applicable)

# Check Logs:
Dashboard → Edge Functions → community-operations → Logs
```

---

## 🔍 Database Verification Queries

### **Check Z.AI Configuration**
```sql
-- Verify API key exists
SELECT 
  COUNT(*) as configured 
FROM provider_api_keys 
WHERE provider_id = '00000000-0000-0000-0000-000000000001'::uuid;
-- Should return: 1

-- Test the function
SELECT public.get_provider_api_key_by_type('zai');
-- Should return: Your API key (if admin)
```

### **Check Recent AI Usage**
```sql
-- Last 10 AI-processed items
SELECT 
  provider_name,
  model_name,
  tokens_used,
  cost_usd,
  processing_time_ms,
  success,
  created_at
FROM ai_usage_logs
ORDER BY created_at DESC
LIMIT 10;
```

### **Check User Progress**
```sql
-- Recent assessment completions
SELECT 
  ua.user_id,
  a.title as assessment_title,
  ua.best_score,
  ua.total_attempts,
  ua.is_completed,
  ua.completion_date
FROM user_assessment_progress ua
JOIN assessments_enhanced a ON ua.assessment_id = a.id
ORDER BY ua.last_attempt_at DESC
LIMIT 10;
```

### **Check Gamification Activity**
```sql
-- Recent crystal transactions
SELECT 
  user_id,
  amount,
  transaction_type,
  description,
  created_at
FROM crystal_transactions
ORDER BY created_at DESC
LIMIT 20;

-- Recent achievements
SELECT 
  ua.user_id,
  a.title,
  a.description,
  a.crystal_reward,
  ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
ORDER BY ua.unlocked_at DESC
LIMIT 10;
```

---

## 🛠️ Manual Test Checklist

### **Pre-Test Setup**
- [ ] Z.AI API key configured in database
- [ ] Test user accounts created
- [ ] Assessments available
- [ ] PayPal sandbox configured (if testing payments)
- [ ] Browser dev tools open (Console + Network tabs)

### **Core Feature Tests**

#### **AI Assessments** 🎯
- [ ] User can view available assessments
- [ ] Assessment questions load correctly
- [ ] User can answer all questions
- [ ] Submission works without errors
- [ ] AI analysis returns within 10 seconds
- [ ] Results display correctly formatted
- [ ] Score calculated accurately
- [ ] Feedback is personalized
- [ ] Insights are relevant
- [ ] Recommendations are actionable
- [ ] Gamification triggers (if passing)
- [ ] Progress saved to user profile

#### **Couples Challenges** 💑
- [ ] User can create challenge
- [ ] Partner invitation sent
- [ ] Partner can accept invitation
- [ ] Both users can submit responses
- [ ] AI analysis processes both responses
- [ ] Alignment score displayed
- [ ] Individual insights for each partner
- [ ] Conversation starters provided
- [ ] Both users receive gamification rewards

#### **Gamification** 🎮
- [ ] Crystals awarded correctly
- [ ] Achievement unlocks work
- [ ] Level progression updates
- [ ] Notifications display
- [ ] Crystal balance accurate
- [ ] Transaction history visible

#### **Payments** 💳
- [ ] PayPal modal opens
- [ ] Order creation succeeds
- [ ] Payment processing works
- [ ] Order capture succeeds
- [ ] Subscription status updates
- [ ] Access granted immediately

#### **Realtime Features** ⚡
- [ ] NewMe chat connects
- [ ] Messages send/receive instantly
- [ ] Connection stable
- [ ] No timeout errors
- [ ] Voice chat works (if applicable)

#### **Community** 👥
- [ ] Posts load correctly
- [ ] Can create new posts
- [ ] Comments work
- [ ] Likes/reactions update
- [ ] Moderation functional

---

## 📊 Performance Benchmarks

### **Expected Response Times**

| Function | Expected Time | Acceptable Range |
|----------|---------------|------------------|
| ai-assessment-processor | 2-5 seconds | < 10 seconds |
| couples-challenge-analyzer | 3-8 seconds | < 15 seconds |
| gamification-engine | < 500ms | < 2 seconds |
| paypal-create-order | < 1 second | < 3 seconds |
| paypal-capture-order | 1-3 seconds | < 5 seconds |
| realtime-token | < 200ms | < 1 second |
| community-operations | < 500ms | < 2 seconds |

### **Cost Monitoring**

```sql
-- Daily AI costs
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🚨 Error Scenarios to Test

### **Test Error Handling**

1. **Invalid Input**
   - Submit empty assessment
   - Send invalid payment data
   - Create challenge without questions

2. **Network Issues**
   - Simulate slow connection
   - Test timeout handling
   - Verify retry logic

3. **Authentication**
   - Test expired tokens
   - Invalid user sessions
   - Permission checks

4. **API Failures**
   - Z.AI API down (simulate)
   - PayPal API errors
   - Database connection issues

**Expected:** Graceful error messages, no crashes, user guidance provided

---

## ✅ Success Criteria

### **All Functions PASS if:**
- [ ] No 500 errors in logs
- [ ] Response times within acceptable range
- [ ] User experience smooth and intuitive
- [ ] Error messages clear and helpful
- [ ] Data persists correctly in database
- [ ] Gamification triggers appropriately
- [ ] Costs remain within expected range
- [ ] No security vulnerabilities

### **Z.AI Functions PASS if:**
- [ ] API key retrieves successfully
- [ ] AI responses are relevant and helpful
- [ ] JSON parsing works consistently
- [ ] Error handling catches all edge cases
- [ ] Costs are < $0.005 per request

---

## 📝 Test Results Log

### **Test Session: [Date]**

| Test | Status | Notes | Issues |
|------|--------|-------|--------|
| AI Assessment | ⏳ Pending | | |
| Couples Challenge | ⏳ Pending | | |
| Gamification | ⏳ Pending | | |
| PayPal Create | ⏳ Pending | | |
| PayPal Capture | ⏳ Pending | | |
| Realtime Token | ⏳ Pending | | |
| Community Ops | ⏳ Pending | | |

**Overall Status:** ⏳ Testing in Progress

---

## 🔧 Quick Fixes

### **If AI Assessment Fails:**
```sql
-- Check API key
SELECT public.get_provider_api_key_by_type('zai');

-- Check recent errors
SELECT * FROM ai_usage_logs WHERE success = false ORDER BY created_at DESC LIMIT 5;
```

### **If Gamification Fails:**
```bash
# Check function logs
Dashboard → Edge Functions → gamification-engine → Logs

# Verify crystal transactions
SELECT * FROM crystal_transactions WHERE user_id = 'USER_ID' ORDER BY created_at DESC LIMIT 5;
```

### **If Payments Fail:**
```bash
# Verify PayPal credentials
# Check Supabase secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET

# Test PayPal API directly
curl -X POST https://api-m.sandbox.paypal.com/v2/checkout/orders \
  -H "Content-Type: application/json" \
  -u "CLIENT_ID:CLIENT_SECRET"
```

---

## 🎯 Priority Order for Testing

1. **CRITICAL:** ai-assessment-processor (Core feature, just fixed)
2. **CRITICAL:** couples-challenge-analyzer (Just updated, needs verification)
3. **HIGH:** gamification-engine (Affects user engagement)
4. **HIGH:** paypal functions (Revenue critical)
5. **MEDIUM:** realtime-token (User experience)
6. **MEDIUM:** community-operations (User engagement)
7. **LOW:** Other functions (Supporting features)

---

**Ready to Test!** 🚀

Start with AI Assessment Processor → Move to Couples Challenge → Then test supporting functions.

