import "@/global.css";
import React from 'react';
import {Text, View, Image, Pressable, ActivityIndicator} from 'react-native';
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useAuth, useUser} from "@clerk/expo";
import {router} from "expo-router";
import images from "@/constants/images";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
    const {user} = useUser();
    const {signOut} = useAuth();
    const [isSigningOut, setIsSigningOut] = React.useState(false);

    const profileImage = user?.imageUrl ?? images.avatar;
    const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? '';
    const userName = user?.firstName
        ? `${user.firstName}${user?.lastName ? ' ' + user.lastName : ''}`
        : user?.username ?? userEmail ?? '';
    const accountId = user?.id ?? '';
    const joinedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})
        : '';

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            router.replace('/(auth)/sign-in');
        } catch (err) {
            console.error('[Settings] Sign out error:', err);
            setIsSigningOut(false);
        }
    };

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#ea7a53" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="settings-content">
                <Text className="settings-title">Settings</Text>

                <View className="settings-profile-card">
                    <Image
                        source={{uri: typeof profileImage === 'string' ? profileImage : undefined}}
                        defaultSource={images.avatar}
                        className="settings-avatar"
                    />
                    <View className="settings-profile-info">
                        {userName ? <Text className="settings-profile-name" numberOfLines={1}>{userName}</Text> : null}
                        <Text className="settings-profile-email" numberOfLines={1}>{userEmail}</Text>
                    </View>
                    <Text className="settings-chevron">›</Text>
                </View>

                <View className="settings-section">
                    <View className="settings-details-menu">
                        <Text className="settings-details-title">Account</Text>
                        <View className="settings-detail-row">
                            <Text className="settings-detail-label">Account ID</Text>
                            <Text className="settings-detail-value" numberOfLines={1} adjustable>{accountId}</Text>
                        </View>
                        {joinedDate ? (
                            <View className="settings-detail-row">
                                <Text className="settings-detail-label">Joined</Text>
                                <Text className="settings-detail-value">{joinedDate}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View className="settings-section">
                    <Pressable className="settings-signout-button" onPress={handleSignOut} disabled={isSigningOut}>
                        {isSigningOut ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text className="settings-signout-text">Sign out</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Settings;