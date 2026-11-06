import * as React from 'react';
import {useEffect} from "react";
import {SplashScreen, Stack } from "expo-router";
import "@/global.css";
import {useFonts} from "expo-font";
import {ClerkProvider} from "@clerk/expo";
import {View, Text} from "react-native";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
console.log('[Clerk] Publishable key:', publishableKey ? `${publishableKey.slice(0, 10)}...` : 'MISSING');
if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

// Use in-memory cache for Expo Go compatibility.
// Switch to `import {tokenCache} from "@clerk/expo/token-cache"` when using a development build.
const tokenStore: Record<string, string> = {};
const tokenCache = {
  async getToken(key: string) {
    return tokenStore[key] ?? null;
  },
  async saveToken(key: string, value: string) {
    tokenStore[key] = value;
  },
};

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

export default function RootLayout() {
  const [fontsLoaded, fontError]= useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
  })

  useEffect(() => {
    if(fontsLoaded || fontError){
      SplashScreen.hideAsync()
    }
    },[fontsLoaded, fontError])

  if (fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text className="text-red-500 text-center font-sans-bold text-lg">Font loading error</Text>
        <Text className="text-muted-foreground text-center mt-2">{String(fontError)}</Text>
      </View>
    );
  }

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <Stack screenOptions={{headerShown: false}}/>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
