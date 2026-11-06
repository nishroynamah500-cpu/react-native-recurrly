import {Stack, router} from "expo-router";
import {useAuth} from "@clerk/expo";
import {View, ActivityIndicator} from "react-native";
import {useEffect, useRef} from "react";
import "@/global.css";

export default function AuthLayout() {
    const {isLoaded, isSignedIn} = useAuth();
    const hasRedirected = useRef(false);

    // Redirect authenticated users to the main app
    useEffect(() => {
        if (isLoaded && isSignedIn && !hasRedirected.current) {
            hasRedirected.current = true;
            router.replace('/(tabs)');
        }
    }, [isLoaded, isSignedIn]);

    // Show spinner while Clerk is loading
    if (!isLoaded) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#ea7a53" />
            </View>
        );
    }

    return <Stack screenOptions={{headerShown: false}} />;
}