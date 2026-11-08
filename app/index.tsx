import { useAuth } from "@clerk/expo";
import { ActivityIndicator, View, Text } from "react-native";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";

/**
 * Route guard that redirects unauthenticated users to sign-in
 * and authenticated users to the tabs screen.
 * Treats pending Clerk sessions as signed-out so the redirect
 * behavior matches the tabs layout guard.
 */
export default function Index() {
    const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: true });
    const hasRedirected = useRef(false);
    const [authTimeout, setAuthTimeout] = useState(false);

    // Fallback: if Clerk takes more than 5 seconds, skip waiting
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('[Index] Clerk auth timeout — proceeding without waiting');
            setAuthTimeout(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        console.log('[Index] Auth state:', { isLoaded, isSignedIn, authTimeout });
    }, [isLoaded, isSignedIn, authTimeout]);

    useEffect(() => {
        // Redirect when auth is loaded OR when timeout fires
        if ((isLoaded || authTimeout) && !hasRedirected.current) {
            hasRedirected.current = true;
            if (!isSignedIn) {
                console.log('[Index] Navigating to sign-in');
                router.replace('/(auth)/sign-in');
            } else {
                console.log('[Index] Navigating to tabs');
                router.replace('/(tabs)');
            }
        }
    }, [isLoaded, isSignedIn, authTimeout]);

    if (!isLoaded && !authTimeout) {
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