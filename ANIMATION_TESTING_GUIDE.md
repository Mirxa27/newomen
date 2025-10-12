# Landing Page Animation Testing Guide

## ✅ Comprehensive Testing Checklist

### 1. Visual Animation Tests

#### Hero Section
- [ ] **Floating Badge Animation**
  - Badge should smoothly float up and down
  - Sparkle icon should pulse
  - Animation should be continuous and smooth

- [ ] **Title Fade-In**
  - Title should fade in from opacity 0 to 1
  - Text should slide down slightly (y: -20 to 0)
  - Duration: ~0.8s
  - Should complete before description appears

- [ ] **Gradient Text Animation**
  - "Newomen" text should have animated gradient
  - Background position should shift continuously
  - Smooth color transitions

- [ ] **CTA Buttons**
  - Hover: Scale to 1.05
  - Click: Scale to 0.95
  - Smooth spring animations
  - Arrow icon should translate on hover

- [ ] **Background Gradients**
  - Two circular gradients should animate
  - Movement should be smooth and organic
  - Colors: primary and accent
  - Duration: 8-10s loops

- [ ] **Trust Indicators**
  - Should fade in after other elements
  - Icons should be visible and colored
  - Text should be readable

#### Features Section
- [ ] **Section Header**
  - Fades in when scrolling into view
  - Smooth y-axis translation

- [ ] **Feature Cards (6 total)**
  - Each card should fade in sequentially
  - Stagger delay: 0.1s between each
  - Hover effect: Scale to 1.05
  - Icon rotation on hover: 360°
  - Smooth transitions (0.3-0.6s)

#### Stats Section
- [ ] **Stat Cards (4 total)**
  - Cards appear with spring animation
  - Numbers should bounce slightly
  - Sequential appearance with stagger
  - Scale from 0 to 1

#### Pricing Section
- [ ] **Section Header**
  - Fades in on scroll

- [ ] **Pricing Cards (3 total)**
  - Sequential appearance
  - Featured card has "Most Popular" badge
  - Hover: Scale 1.05 + translate Y -10px
  - Featured price should pulse continuously

- [ ] **Feature List Items**
  - Each item fades in sequentially
  - Slight x-axis translation (left to right)

#### CTA Section
- [ ] **Background Gradient**
  - Animated gradient should shift
  - Smooth color transitions

- [ ] **Floating Button**
  - Continuous up/down animation
  - Hover: Scale 1.05
  - Click: Scale 0.95
  - Icon should move on hover

#### Footer
- [ ] **Footer Columns**
  - Each column fades in sequentially
  - Stagger effect across 4 columns
  - Links have hover color transition

---

### 2. Performance Tests

#### Animation Performance
- [ ] **Frame Rate**
  - Animations should run at 60 FPS
  - No jank or stuttering
  - Use Chrome DevTools Performance tab

- [ ] **CPU Usage**
  - CPU usage should stay reasonable (<30%)
  - No sustained high CPU usage

- [ ] **Memory Usage**
  - No memory leaks
  - Memory should stabilize after initial load

#### Load Testing
- [ ] **Initial Page Load**
  - First contentful paint < 2s
  - Time to interactive < 3s
  - Framer Motion library loads quickly

- [ ] **Bundle Size**
  - Landing.tsx bundle < 150KB gzipped
  - Framer Motion added ~40-50KB

---

### 3. Cross-Browser Tests

Test on the following browsers:

- [ ] **Chrome/Chromium**
  - Latest version
  - Check animations are smooth
  - Check console for errors

- [ ] **Firefox**
  - Latest version
  - Verify gradient animations
  - Check spring animations

- [ ] **Safari**
  - Latest version (MacOS/iOS)
  - Test backdrop-filter (glass effect)
  - Verify transform animations

- [ ] **Edge**
  - Latest version
  - Check Chromium compatibility

---

### 4. Responsive Tests

#### Mobile (375px - 767px)
- [ ] Animations work on small screens
- [ ] No horizontal scroll
- [ ] Touch interactions work
- [ ] CTA buttons are accessible
- [ ] Text is readable
- [ ] Cards stack vertically

#### Tablet (768px - 1023px)
- [ ] Grid layouts adjust properly
- [ ] Animations remain smooth
- [ ] Touch interactions work
- [ ] Navigation is usable

#### Desktop (1024px+)
- [ ] Full animation experience
- [ ] Hover states work
- [ ] Multi-column layouts display correctly
- [ ] Background gradients visible

---

### 5. Accessibility Tests

#### Motion Preferences
- [ ] **Reduced Motion**
  - Check `prefers-reduced-motion` media query
  - Consider adding: `@media (prefers-reduced-motion: reduce)`
  - Animations should be simplified or removed

#### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus states are visible
- [ ] Buttons can be activated with Enter/Space

#### Screen Readers
- [ ] Content is announced correctly
- [ ] ARIA labels are present where needed
- [ ] Heading hierarchy is logical (H1, H2, etc.)
- [ ] Links have descriptive text

---

### 6. User Experience Tests

#### Animation Timing
- [ ] No animations feel too slow (>1s for important elements)
- [ ] No animations feel too fast (<0.2s)
- [ ] Stagger timing feels natural
- [ ] User doesn't wait for animations unnecessarily

#### Visual Feedback
- [ ] User knows what's clickable (hover effects)
- [ ] Animations guide attention appropriately
- [ ] No distracting or excessive animations
- [ ] Animations enhance, don't hinder usability

---

### 7. Edge Cases

- [ ] **Slow Connection**
  - Test on 3G connection
  - Animations should still work
  - No broken states while loading

- [ ] **Old Devices**
  - Test on older mobile devices
  - Animations degrade gracefully if needed

- [ ] **Print View**
  - Page prints correctly
  - Animations don't break print layout

---

## Testing Tools

### Browser DevTools
```bash
# Open Chrome DevTools
Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows)

# Performance Tab
1. Click "Record"
2. Scroll through page
3. Stop recording
4. Check for:
   - Frame rate (should be ~60 FPS)
   - Long tasks (should be minimal)
   - Layout shifts

# Console Tab
- Check for errors
- Look for animation warnings
```

### Lighthouse Audit
```bash
# Run Lighthouse
1. Open Chrome DevTools
2. Click "Lighthouse" tab
3. Select "Performance"
4. Click "Analyze page load"

# Target Scores:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
```

### Manual Testing Script
```bash
# Start dev server
npm run dev

# Open in browser
http://localhost:5173

# Test checklist:
1. Scroll slowly through entire page
2. Hover over all interactive elements
3. Click all buttons
4. Resize browser window
5. Check mobile view (DevTools device mode)
6. Check console for errors
```

---

## Automated Test Run

```bash
# Install dependencies (if not done)
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run tests in watch mode (during development)
npm run test -- --watch
```

---

## Common Issues & Solutions

### Issue: Animations are janky
**Solution:**
- Use `will-change` CSS property
- Reduce number of simultaneous animations
- Optimize transform and opacity (GPU-accelerated)

### Issue: Animations don't trigger on scroll
**Solution:**
- Check `whileInView` is used correctly
- Verify `viewport={{ once: true }}` setting
- Ensure elements are in viewport

### Issue: Framer Motion not working
**Solution:**
- Check import: `import { motion } from 'framer-motion'`
- Verify installation: `npm list framer-motion`
- Clear cache: `npm run build` (fresh build)

### Issue: Animations too slow on mobile
**Solution:**
- Reduce `duration` values
- Simplify animations on mobile
- Use conditional animations based on device

---

## Performance Benchmarks

### Target Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Total Blocking Time**: < 300ms

### Animation-Specific
- **Frame Rate**: 60 FPS (16.67ms per frame)
- **Animation Duration**: 0.3s - 1s (optimal range)
- **Stagger Delay**: 0.05s - 0.15s
- **Hover Response**: < 100ms

---

## Sign-Off Checklist

Before deploying to production:

- [ ] All visual tests passed
- [ ] Performance tests passed
- [ ] Cross-browser tests passed
- [ ] Responsive tests passed
- [ ] Accessibility tests passed
- [ ] No console errors
- [ ] Lighthouse score >90
- [ ] User feedback incorporated
- [ ] Documentation updated
- [ ] Code reviewed

---

## Deployment Testing

After deployment:

1. **Test Production URL**
   ```
   https://newomen-o63c0qdc2-mirxa27s-projects.vercel.app
   ```

2. **Verify**
   - [ ] Animations load correctly
   - [ ] No 404 errors
   - [ ] Images load
   - [ ] Links work
   - [ ] CTA buttons navigate to /auth

3. **Monitor**
   - Check Vercel analytics
   - Monitor error logs
   - Watch user metrics

---

## Continuous Improvement

- Collect user feedback on animations
- Monitor performance metrics
- A/B test animation variations
- Keep animations updated with design trends
- Optimize based on analytics

---

Last Updated: October 12, 2025

