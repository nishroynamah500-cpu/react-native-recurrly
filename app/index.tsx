import { useAuth } from "@clerk/expo";
import { ActivityIndicator, View, Text } from "react-native";
import { useEffect, useRef } from "react";
import { router } from "expo-router";

export default function Index() {
    const { isLoaded, isSignedIn } = useAuth();
    const hasRedirected = useRef(false);

    useEffect(() => {
        console.log('[Index] Auth state:', { isLoaded, isSignedIn });
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (isLoaded && !hasRedirected.current) {
            hasRedirected.current = true;
            if (!isSignedIn) {
                console.log('[Index] Navigating to sign-in');
                router.replace('/(auth)/sign-in');
            } else {
                console.log('[Index] Navigating to tabs');
                router.replace('/(tabs)');
            }
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded) {
        console.log('[Index] Clerk still loading...');
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#ea7a53" />
                <Text className="text-muted-foreground mt-4 font-sans-medium">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator size="large" color="#ea7a53" />
            <Text className="text-muted-foreground mt-4 font-sans-medium">Navigating...</Text>
        </View>
    );
}