---
sessionId: session-261107-085533-1ngq
---

# Technical Design

### Current Implementation
`app/(tabs)/subscriptions.tsx` wraps `FlatList` in a `KeyboardAvoidingView` with `behavior="padding"` (iOS) / `height` (Android) and `keyboardVerticalOffset={0}`. The `SafeAreaView` is the root with `flex-1`, `KeyboardAvoidingView` has `style={{flex: 1}}`, and `FlatList` sits inside with `ListHeaderComponent` for the title + search bar.

### Problem
On iOS, `KeyboardAvoidingView` with `behavior="padding"` adds padding to the bottom, but because the `SafeAreaView` already applies `flex-1` and the `KeyboardAvoidingView` also uses `flex: 1`, the padding adjustment may not propagate correctly to the `FlatList`. The `keyboardVerticalOffset={0}` assumes no extra offset is needed, but the `SafeAreaView` insets + `KeyboardAvoidingView` nesting can cause the offset to be incorrect.

### Status
### ✓ Step 1: Fix keyboard avoidance offset using safe area insets