import {Tabs, router} from "expo-router";
import {tabs} from "@/constants/data";
import clsx from "clsx";
import {Image, View, ActivityIndicator} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useAuth} from "@clerk/expo";
import React, {useEffect, useRef, useState} from "react";
import {colors, components} from "@/constants/theme"
import '@/global.css'

const tabBar = components.tabBar;

export default function TabLayout() {
    const {isLoaded, isSignedIn} = useAuth();
    const hasRedirected = useRef(false);
    const [authTimeout, setAuthTimeout] = useState(false);

    // Fallback: if Clerk takes more than 5 seconds, skip waiting
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('[TabLayout] Clerk auth timeout — proceeding without waiting');
            setAuthTimeout(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // Redirect unauthenticated users to sign-in
    useEffect(() => {
        if ((isLoaded || authTimeout) && !isSignedIn && !hasRedirected.current) {
            hasRedirected.current = true;
            router.replace('/(auth)/sign-in');
        }
    }, [isLoaded, isSignedIn, authTimeout]);

    // Show spinner while Clerk is loading (with timeout fallback)
    if (!isLoaded && !authTimeout) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#ea7a53" />
            </View>
        );
    }

    return <TabLayoutContent />;
}

function TabLayoutContent() {
    const insets = useSafeAreaInsets();
    const TabIcon = ({focused, icon}: TabIconProps) => {
        return (
            <View className="tabs-icon">
                <View className={clsx('tabs-pill', focused &&
                    'tabs-active')}>
                    <Image source={icon} resizeMode="contain" className="tabs-glyph"/>

                </View>

            </View>
        );
    };
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle:{
                position: 'absolute',
                bottom: Math.max(insets.bottom,tabBar.horizontalInset ),
                height: tabBar.height,
                marginHorizontal: tabBar.horizontalInset,
                borderRadius: tabBar.radius,
                backgroundColor: colors.primary,
                borderTopWidth:0,
                elevation:0,

            },

            tabBarItemStyle: {
                paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6
            },
            tabBarIconStyle:{
                width: tabBar.iconFrame,
                height: tabBar.iconFrame,
                alignItems: 'center'
            }

        }}>
            {tabs.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({focused}) => (
                            <TabIcon focused={focused} icon={tab.icon}/>

                        )
                    }}/>
            ))}
        </Tabs>
    )
}