# Testing Guide: Keyboard Footer Hide Feature

## Quick Test Instructions

### Prerequisites
- ✅ iOS device or simulator
- ✅ Android device or emulator  
- ✅ Mobile browser for web testing

### Test Scenarios

#### 1. Basic Keyboard Open/Close
**Steps**:
1. Open the app on mobile device
2. Navigate to any page with input fields (Profile, Chat, Community post)
3. Tap an input field
4. **Expected**: Footer slides down smoothly and disappears
5. Tap outside input or "Done"
6. **Expected**: Footer slides back up smoothly

**Result**: ✅ Pass / ❌ Fail

---

#### 2. Multiple Input Fields
**Steps**:
1. Go to Profile page (has multiple inputs)
2. Tap first input field
3. **Expected**: Footer hides
4. Tap next input field (keyboard stays open)
5. **Expected**: Footer remains hidden
6. Dismiss keyboard
7. **Expected**: Footer reappears

**Result**: ✅ Pass / ❌ Fail

---

#### 3. Textarea Fields
**Steps**:
1. Go to Community page
2. Tap "Create Post" or comment field
3. **Expected**: Footer hides when keyboard opens
4. Type multiline text
5. **Expected**: Footer stays hidden
6. Tap "Post" or dismiss
7. **Expected**: Footer reappears

**Result**: ✅ Pass / ❌ Fail

---

#### 4. Chat Input
**Steps**:
1. Go to Chat page
2. Tap message input at bottom
3. **Expected**: Footer hides, full keyboard visible
4. Type a message
5. **Expected**: Can see entire message while typing
6. Send message or dismiss keyboard
7. **Expected**: Footer reappears

**Result**: ✅ Pass / ❌ Fail

---

#### 5. Scroll While Keyboard Open
**Steps**:
1. Open a page with inputs and scrollable content
2. Open keyboard by tapping input
3. **Expected**: Footer hidden
4. Scroll the page content
5. **Expected**: Footer remains hidden while keyboard is open
6. Close keyboard
7. **Expected**: Footer reappears, normal scroll behavior resumes

**Result**: ✅ Pass / ❌ Fail

---

#### 6. Rapid Open/Close
**Steps**:
1. Tap input field to open keyboard
2. Immediately tap outside to close
3. Repeat 5 times quickly
4. **Expected**: No flickering, smooth animations each time
5. **Expected**: Footer always in correct state (hidden/shown)

**Result**: ✅ Pass / ❌ Fail

---

#### 7. Screen Rotation (iOS/Android)
**Steps**:
1. Open keyboard in portrait mode
2. **Expected**: Footer hidden
3. Rotate to landscape
4. **Expected**: Footer still hidden, layout adapts
5. Rotate back to portrait
6. **Expected**: Footer still hidden
7. Close keyboard
8. **Expected**: Footer reappears correctly

**Result**: ✅ Pass / ❌ Fail

---

#### 8. Different Keyboard Types
**Steps**:
Test with different input types:
- Default text (`<input type="text">`)
- Email (`<input type="email">`)
- Number (`<input type="number">`)
- URL (`<input type="url">`)
- Search (`<input type="search">`)

**Expected**: Footer hides for all keyboard types

**Result**: ✅ Pass / ❌ Fail

---

#### 9. Web Browser Testing
**Steps**:
1. Open app in mobile Chrome/Safari
2. Tap input field
3. **Expected**: Footer hides (using visualViewport detection)
4. Verify no console errors
5. Test on both iOS Safari and Android Chrome

**Result**: ✅ Pass / ❌ Fail

---

#### 10. Navigation While Keyboard Open
**Steps**:
1. Open keyboard on one page
2. **Expected**: Footer hidden
3. Navigate to different page using browser back/forward
4. **Expected**: Keyboard closes, footer reappears on new page
5. Return to original page
6. **Expected**: Footer in correct state

**Result**: ✅ Pass / ❌ Fail

---

## Visual Checklist

### Animations
- [ ] Footer slides down smoothly (200ms)
- [ ] Footer slides up smoothly (200ms)
- [ ] No jank or stuttering
- [ ] No visual glitches
- [ ] Opacity fades in/out properly

### Layout
- [ ] Input fields fully visible when keyboard open
- [ ] No content covered by keyboard
- [ ] Proper spacing around keyboard
- [ ] No layout shifts or jumps
- [ ] Content scrolls properly

### Performance
- [ ] No lag when opening keyboard
- [ ] No lag when closing keyboard
- [ ] Smooth scrolling with keyboard open
- [ ] No memory leaks (test extended usage)
- [ ] Battery usage normal

## Device-Specific Tests

### iOS Specific
- [ ] Works with iOS keyboard
- [ ] Works with third-party keyboards (SwiftKey, Gboard)
- [ ] Predictive text bar doesn't cause issues
- [ ] Split keyboard (iPad) works correctly
- [ ] Floating keyboard (iPad) works correctly

### Android Specific
- [ ] Works with stock keyboard
- [ ] Works with third-party keyboards (Gboard, SwiftKey, Samsung)
- [ ] Back button dismisses keyboard properly
- [ ] Navigation bar behavior correct
- [ ] Multi-window mode (if applicable)

## Console Verification

### Expected Log Messages
```
🎹 Keyboard will show with height: 350
✅ Keyboard detection active
🎹 Keyboard will hide
✅ Footer state updated
```

### No Errors
- [ ] No React errors
- [ ] No Capacitor errors
- [ ] No keyboard listener errors
- [ ] No hook cleanup errors

## Automated Testing Commands

### Run Build
```bash
npm run build
```

### Sync Capacitor
```bash
npx cap sync
```

### Open iOS
```bash
npx cap open ios
```

### Open Android
```bash
npx cap open android
```

### Test Web
```bash
npm run dev
# Then open in mobile browser or responsive mode
```

## Debugging Tips

### Check Keyboard State
Open browser console and run:
```javascript
// Check if keyboard class is applied
document.body.classList.contains('keyboard-open')

// Check keyboard height variable
getComputedStyle(document.body).getPropertyValue('--keyboard-height')
```

### Monitor Events
```javascript
// Listen for custom keyboard events
window.addEventListener('keyboard-show', (e) => {
  console.log('Keyboard opened:', e.detail);
});

window.addEventListener('keyboard-hide', () => {
  console.log('Keyboard closed');
});
```

### Verify Hook State
Add temporary logging in `useKeyboard.ts`:
```typescript
console.log('Keyboard state:', { isOpen, height });
```

## Known Limitations

### Expected Behavior
- Web browsers may have slight delay in detection (< 100ms)
- Some third-party keyboards may have different heights
- Split/floating keyboards (iPad) may not hide footer
- Browser address bar may affect detection on some devices

### Not Bugs
- ✅ Footer briefly visible on page load (intentional)
- ✅ Footer visible when no inputs focused (correct)
- ✅ Different animation timing on web vs native (expected)

## Success Criteria

### Must Pass
- ✅ All 10 test scenarios pass
- ✅ No console errors
- ✅ Smooth animations on all platforms
- ✅ Input fields fully visible

### Should Pass
- ✅ All device-specific tests pass
- ✅ No visual glitches
- ✅ Good performance metrics

## Reporting Issues

### Issue Template
```markdown
**Test Scenario**: [Number and name]
**Device**: [iPhone 14, Pixel 7, etc.]
**OS Version**: [iOS 17.1, Android 13, etc.]
**Browser** (if web): [Safari, Chrome]
**Keyboard Type**: [Stock, Third-party]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Steps to Reproduce**:
1. 
2. 
3. 

**Screenshots/Video**:
[Attach if possible]

**Console Errors**:
[Copy any error messages]
```

## Quick Fixes

### Footer Not Hiding
```typescript
// Verify in App.tsx
import { CapacitorUtils } from '@/utils/CapacitorUtils';

useEffect(() => {
  CapacitorUtils.addKeyboardListeners();
  return () => CapacitorUtils.removeKeyboardListeners();
}, []);
```

### Animations Stuttering
```css
/* Reduce animation duration in index.css */
body.keyboard-open .nav-responsive {
  transition: transform 0.15s ease-out, opacity 0.15s ease-out;
}
```

### Web Detection Not Working
```typescript
// Check visualViewport support
if (window.visualViewport) {
  console.log('✅ visualViewport supported');
} else {
  console.log('⚠️  Using fallback detection');
}
```

---

**Testing Status**: Ready for device testing
**Priority**: High (Core UX feature)
**Estimated Test Time**: 30 minutes

