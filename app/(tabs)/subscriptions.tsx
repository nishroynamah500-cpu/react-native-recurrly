import "@/global.css";
import {FlatList, KeyboardAvoidingView, Platform, Text, TextInput, View, Keyboard} from 'react-native';
import React, {useState, useMemo} from 'react';
import {SafeAreaView as RNSafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {styled} from "nativewind";
import SubscriptionCard from "@/components/SubscriptionCard";
import {useSubscriptionStore} from "@/lib/subscriptionStore";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const {subscriptions} = useSubscriptionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return subscriptions;
    }
    const query = searchQuery.toLowerCase().trim();
    return subscriptions.filter(
      (sub) =>
        sub.name.toLowerCase().includes(query) ||
        (sub.category?.toLowerCase().includes(query)) ||
        (sub.plan?.toLowerCase().includes(query))
    );
  }, [searchQuery, subscriptions]);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'height'}
        keyboardVerticalOffset={insets.top}
        style={{flex: 1}}
      >
        <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Text className="mb-4 text-2xl font-sans-bold text-primary">Subscriptions</Text>
            <View className="mb-4">
              <TextInput
                className="rounded-2xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
                placeholder="Search subscriptions..."
                placeholderTextColor="rgba(0, 0, 0, 0.6)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>
          </>
        }
        renderItem={({item}) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((currentId) =>
                currentId === item.id ? null : item.id
              )
            }
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="py-4 text-sm font-sans-medium text-black/60">
            {searchQuery.trim()
              ? 'No subscriptions match your search.'
              : 'No subscriptions yet.'}
          </Text>
        }
        contentContainerClassName="pb-30"
        keyboardShouldPersistTaps="never"
        onScroll={() => Keyboard.dismiss()}
        scrollEventThrottle={16}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Subscriptions;