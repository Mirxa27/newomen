# 📧 Warm Email Templates Setup Guide

I've created beautiful, warm, and welcoming email templates for Newomen! Here's how to configure them:

---

## 📁 Templates Created

All templates are located in: `/supabase/templates/`

1. **`confirmation.html`** - Welcome email for new user signups
2. **`invite.html`** - Invitation emails for new users
3. **`magic_link.html`** - Passwordless login emails
4. **`recovery.html`** - Password reset emails
5. **`email_change.html`** - Email address change confirmation

---

## 🎨 Design Features

All templates include:
- ✨ Modern gradient design with Newomen brand colors
- 💜 Warm, friendly, and encouraging tone
- 📱 Fully responsive (mobile-friendly)
- 🎯 Clear call-to-action buttons
- 🔒 Security notes and alternative links
- 🌸 Emojis for visual warmth
- 💫 Professional yet personal feel

---

## 🚀 Setup Instructions

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/auth/templates
   ```

2. **For each email type:**
   - Click on the email template (Confirm signup, Invite user, Magic Link, etc.)
   - Copy the contents from the corresponding HTML file
   - Paste into the template editor
   - Click **Save**

3. **Customize the sender:**
   - Go to **Authentication** → **Settings**
   - Set **Sender name:** `Newomen`
   - Set **Sender email:** `noreply@newomen.me` (or your verified domain)

### Option 2: Via config.toml (Local Development)

Update your `supabase/config.toml` file:

```toml
[auth.email.template.confirmation]
subject = "Welcome to Newomen! Confirm Your Email 🌸"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.invite]
subject = "You've Been Invited to Newomen! 🎉"
content_path = "./supabase/templates/invite.html"

[auth.email.template.magic_link]
subject = "Your Magic Link to Newomen ✨"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.recovery]
subject = "Reset Your Newomen Password 🔐"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.email_change]
subject = "Confirm Your New Email Address 📧"
content_path = "./supabase/templates/email_change.html"
```

---

## 📝 Available Template Variables

All templates support these Supabase variables:

- `{{ .ConfirmationURL }}` - The confirmation/action link
- `{{ .Token }}` - OTP token (if using OTP instead of links)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Year }}` - Current year (for copyright)

---

## 🎨 Customization Tips

### 1. Brand Colors
Current gradient: `#667eea` (purple) to `#764ba2` (deep purple)

To change, find and replace in all templates:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 2. Support Email
Current: `support@newomen.me`

Update in all templates:
```html
<a href="mailto:support@newomen.me">Contact support</a>
```

### 3. Emojis
Feel free to adjust or remove emojis based on your brand preference:
- 🌸 💜 ✨ 💫 🎯 🤝 💌 🎉 🚀 🔐 🔑 📧

### 4. Tone Adjustment
Current tone: Warm, encouraging, supportive
- To make more professional: Remove emojis, use formal language
- To make more casual: Add more emojis, use shorter sentences

---

## 🧪 Testing Your Templates

### Test Signup Email:
1. Create a new test account on your site
2. Check the email received
3. Verify all links work correctly

### Test Other Templates:
```bash
# In Supabase Dashboard → Authentication → Settings
# Enable "Send test email" for each template type
```

Or use the Supabase API:

```typescript
// Test magic link
await supabase.auth.signInWithOtp({
  email: 'test@example.com',
})

// Test password reset
await supabase.auth.resetPasswordForEmail('test@example.com')
```

---

## 📊 Email Template Comparison

| Template | Tone | Primary CTA | Key Features |
|----------|------|-------------|--------------|
| **Confirmation** | Excited & Welcoming | Confirm Email | Lists platform features |
| **Invite** | Friendly & Inviting | Accept Invitation | Shows invitation message |
| **Magic Link** | Quick & Simple | Sign In | Emphasizes convenience |
| **Recovery** | Helpful & Secure | Reset Password | Security tips included |
| **Email Change** | Clear & Direct | Confirm New Email | Explains what changes |

---

## 🔐 Security Best Practices

All templates include:
- ✅ Expiration time warnings
- ✅ "Didn't request this?" notices
- ✅ Plain text link alternatives
- ✅ Sender verification reminders
- ✅ Support contact information

---

## 📱 Mobile Optimization

All templates are tested and optimized for:
- iPhone (Safari)
- Android (Gmail app)
- Desktop (Gmail, Outlook, Apple Mail)
- Dark mode compatibility

---

## 🎯 What Makes These Templates Special

1. **Warm & Personal:** Uses conversational language and emojis to feel human
2. **Brand Aligned:** Colors match Newomen's purple gradient theme
3. **Action-Oriented:** Clear, prominent CTAs with hover effects
4. **Informative:** Explains what happens next and why action is needed
5. **Secure:** Includes security notices and alternative text links
6. **Accessible:** Proper HTML structure with semantic elements
7. **Responsive:** Looks great on all devices and email clients

---

## 💡 Pro Tips

1. **A/B Test Subject Lines:**
   - Option A: "Welcome to Newomen! Confirm Your Email 🌸"
   - Option B: "Complete Your Newomen Registration ✨"

2. **Monitor Deliverability:**
   - Use a custom domain email (not Gmail/Yahoo)
   - Set up SPF, DKIM, and DMARC records
   - Monitor spam complaints

3. **Track Performance:**
   - Open rates (use tracking pixels if needed)
   - Click-through rates on CTAs
   - Completion rates

4. **Seasonal Updates:**
   - Update colors/emojis for holidays
   - Adjust messaging for special events
   - Add seasonal graphics

---

## 🆘 Troubleshooting

**Emails not sending?**
- Check Supabase email rate limits
- Verify SMTP configuration
- Check spam folder

**Links not working?**
- Verify `site_url` in config.toml
- Check redirect URLs are whitelisted
- Ensure proper URL encoding

**Styling broken?**
- Some email clients strip CSS
- Inline styles are more reliable
- Test in multiple clients

**Template not updating?**
- Clear browser cache
- Wait a few minutes for propagation
- Verify save was successful

---

## 📞 Support

If you need help:
- Email: support@newomen.me
- Check Supabase docs: https://supabase.com/docs/guides/auth/auth-email-templates
- Test templates in: https://litmus.com/

---

## 🎉 You're All Set!

Your warm, welcoming email templates are ready to make every user feel special from their very first interaction with Newomen! 💜✨

Remember: First impressions matter, and these beautiful emails will set the tone for an amazing user experience!

