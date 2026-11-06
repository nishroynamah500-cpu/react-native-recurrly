---
sessionId: session-261106-163709-z92p
---

# Technical Design

### Current Implementation
`app/(tabs)/settings.tsx` is a minimal placeholder — just a `SafeAreaView` with a `Text` saying "Settings". No Clerk hooks, no interactivity.

### Key Decisions
- Use `useAuth().signOut()` from `@clerk/expo` to sign out.
- After sign-out, redirect to `/(auth)/sign-in` via `router.replace()`.
- Match the existing design system: warm accent color (`#ea7a53`), PlusJakartaSans fonts, and NativeWind `styled()` wrapper pattern.

### Proposed Changes
- **`app/(tabs)/settings.tsx`**: Add a settings screen with:
  - A header section showing the signed-in user's profile (avatar + email) using `useUser()`.
  - A settings menu section with a "Sign out" button.
  - `useAuth().signOut()` call on press, then `router.replace('/(auth)/sign-in')`.
  - All components wrapped with NativeWind `styled()` for proper className support.
- **`global.css`**: Add styles for the settings screen (header, menu list, sign-out button, etc.).

# Delivery Steps

### ✓ Step 1: Add logout button to settings screen
Build a settings screen with user profile header and a sign-out button that calls Clerk's `signOut()` and redirects to sign-in.
- Add `useAuth()` and `useUser()` from `@clerk/expo` to `app/(tabs)/settings.tsx`.
- Show user's avatar image and email at the top (matching the home screen pattern).
- Add a "Sign out" button that calls `auth.signOut()` then `router.replace('/(auth)/sign-in')`.
- Add matching NativeWind styles in `global.css` for the settings layout, menu items, and sign-out button.
- Wrap all React Native components with `styled()` from NativeWind for className support.