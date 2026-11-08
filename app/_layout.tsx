import * as React from 'react';
import {useEffect} from "react";
import {SplashScreen, Stack } from "expo-router";
import "@/global.css";
import {useFonts} from "expo-font";
import {ClerkProvider} from "@clerk/expo";
import {tokenCache} from "@clerk/expo/token-cache";
import {View, Text} from "react-native";
import {SubscriptionStoreProvider} from "@/lib/subscriptionStore";

// Prevent splash screen from auto-hiding — must be called at module scope before any render
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

/**
 * Error boundary that catches render-time errors and displays
 * a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {hasError: boolean; error: Error | null}
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error) {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background p-5">
          <Text className="text-red-500 text-center font-sans-bold text-xl mb-4">Something went wrong</Text>
          <Text className="text-muted-foreground text-center mx-auto max-w-[300]">{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * Renders the root stack navigator after fonts are loaded.
 * Hides the splash screen once fonts are ready; shows the splash
 * while loading to avoid a flash of unstyled content.
 */
function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
  });

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch((e) => {
        console.log('[RootLayout] Error hiding splash:', e);
      });
    }
  }, [fontsLoaded, fontError]);

  if (fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text className="text-red-500 text-center font-sans-bold text-lg">Font loading error</Text>
        <Text className="text-muted-foreground text-center mt-2">{String(fontError)}</Text>
      </View>
    );
  }

  // Keep splash visible until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{headerShown: false}} />
  );
}

/**
 * Root layout that wraps the app with Clerk auth and subscription store.
 * Guards against missing Clerk publishable key and provides an error boundary.
 */
export default function RootLayout() {
  if (!publishableKey) {
    return (
      <ErrorBoundary>
        <View className="flex-1 items-center justify-center bg-background p-5">
          <Text className="text-red-500 text-center font-sans-bold text-xl mb-4">Clerk Configuration Required</Text>
          <Text className="text-muted-foreground text-center mx-auto max-w-[300]">
            Add your Clerk Publishable Key to the .env file as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
          </Text>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <SubscriptionStoreProvider>
          <AppContent />
        </SubscriptionStoreProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
