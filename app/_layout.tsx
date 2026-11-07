import * as React from 'react';
import {useEffect} from "react";
import {SplashScreen, Stack } from "expo-router";
import "@/global.css";
import {useFonts} from "expo-font";
import {ClerkProvider, useAuth} from "@clerk/expo";
import {tokenCache} from "@clerk/expo/token-cache";
import {View, Text} from "react-native";
import {SubscriptionStoreProvider} from "@/lib/subscriptionStore";

// Prevent splash screen from auto-hiding — must be called at module scope before any render
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

// Error Boundary component to catch and display errors
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

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
  });

  useAuth();

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
