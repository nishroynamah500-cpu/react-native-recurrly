import {createContext, useContext, useState, ReactNode} from "react";
import {HOME_SUBSCRIPTIONS} from "@/constants/data";

interface SubscriptionStoreContextType {
    subscriptions: Subscription[];
    addSubscription: (subscription: Subscription) => void;
}

const SubscriptionStoreContext = createContext<SubscriptionStoreContextType>({
    subscriptions: HOME_SUBSCRIPTIONS,
    addSubscription: () => {},
});

export function SubscriptionStoreProvider({children}: {children: ReactNode}) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);

    const addSubscription = (subscription: Subscription) => {
        setSubscriptions((prev) => [subscription, ...prev]);
    };

    return (
        <SubscriptionStoreContext.Provider value={{subscriptions, addSubscription}}>
            {children}
        </SubscriptionStoreContext.Provider>
    );
}

export function useSubscriptionStore() {
    return useContext(SubscriptionStoreContext);
}
