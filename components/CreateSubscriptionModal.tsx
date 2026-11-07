import "@/global.css"
import {useState} from "react";
import {Modal, View, Text, TextInput, Pressable, KeyboardAvoidingView, ScrollView, Platform} from "react-native";
import clsx from "clsx";
import dayjs from "dayjs";
import {icons} from "@/constants/icons";

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

const CATEGORIES = ["Entertainment", "AI Tools", "Developer Tools", "Design", "Productivity", "Cloud", "Music", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
    "Entertainment": "#f5c542",
    "AI Tools": "#b8d4e3",
    "Developer Tools": "#e8def8",
    "Design": "#b8e8d0",
    "Productivity": "#f5c542",
    "Cloud": "#b8d4e3",
    "Music": "#e8def8",
    "Other": "#f6eecf",
};

interface CreateSubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (subscription: Subscription) => void;
}

export default function CreateSubscriptionModal({visible, onClose, onSubmit}: CreateSubscriptionModalProps) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [frequency, setFrequency] = useState<"Monthly" | "Yearly">("Monthly");
    const [category, setCategory] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = "Name is required";
        }

        const parsedPrice = parseFloat(price);
        if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
            newErrors.price = "Price must be a positive number";
        }

        if (!category) {
            newErrors.category = "Please select a category";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const startDate = dayjs();
        const renewalDate = frequency === "Monthly"
            ? startDate.add(1, "month")
            : startDate.add(1, "year");

        const subscription: Subscription = {
            id: generateId(),
            name: name.trim(),
            price: parsedPrice,
            category: category ?? undefined,
            status: "active",
            startDate: startDate.toISOString(),
            renewalDate: renewalDate.toISOString(),
            icon: icons.wallet,
            billing: frequency,
            color: CATEGORY_COLORS[category ?? ""] ?? "#f6eecf",
        };

        onSubmit(subscription);
        resetForm();
    };

    const resetForm = () => {
        setName("");
        setPrice("");
        setFrequency("Monthly");
        setCategory(null);
        setErrors({});
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <Pressable className="modal-overlay" onPress={onClose}>
                <Pressable className="modal-container" onPress={(e) => e.stopPropagation()}>
                    <View className="modal-header">
                        <Text className="modal-title">New Subscription</Text>
                        <Pressable className="modal-close" onPress={onClose}>
                            <Text className="modal-close-text">×</Text>
                        </Pressable>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={0}
                    >
                        <ScrollView className="modal-body" keyboardShouldPersistTaps="handled">
                            <View>
                                <Text className="auth-label">Name</Text>
                                <TextInput
                                    className={clsx("auth-input", errors.name && "auth-input-error")}
                                    placeholder="e.g. Spotify"
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (errors.name) setErrors((prev) => ({...prev, name: ""}));
                                    }}
                                    placeholderTextColor="rgba(0,0,0,0.6)"
                                />
                                {errors.name ? <Text className="auth-error">{errors.name}</Text> : null}
                            </View>

                            <View>
                                <Text className="auth-label">Price</Text>
                                <TextInput
                                    className={clsx("auth-input", errors.price && "auth-input-error")}
                                    placeholder="0.00"
                                    value={price}
                                    keyboardType="decimal-pad"
                                    onChangeText={(text) => {
                                        setPrice(text);
                                        if (errors.price) setErrors((prev) => ({...prev, price: ""}));
                                    }}
                                    placeholderTextColor="rgba(0,0,0,0.6)"
                                />
                                {errors.price ? <Text className="auth-error">{errors.price}</Text> : null}
                            </View>

                            <View>
                                <Text className="auth-label">Frequency</Text>
                                <View className="picker-row">
                                    {(["Monthly", "Yearly"] as const).map((option) => (
                                        <Pressable
                                            key={option}
                                            className={clsx(
                                                "picker-option",
                                                frequency === option && "picker-option-active"
                                            )}
                                            onPress={() => setFrequency(option)}
                                        >
                                            <Text className={clsx(
                                                "picker-option-text",
                                                frequency === option && "picker-option-text-active"
                                            )}>
                                                {option}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text className="auth-label">Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="category-scroll">
                                    <View className="flex-row flex-wrap gap-2">
                                        {CATEGORIES.map((cat) => (
                                            <Pressable
                                                key={cat}
                                                className={clsx(
                                                    "category-chip",
                                                    category === cat && "category-chip-active"
                                                )}
                                                onPress={() => {
                                                    setCategory(cat);
                                                    if (errors.category) setErrors((prev) => ({...prev, category: ""}));
                                                }}
                                            >
                                                <Text className={clsx(
                                                    "category-chip-text",
                                                    category === cat && "category-chip-text-active"
                                                )}>
                                                    {cat}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </ScrollView>
                                {errors.category ? <Text className="auth-error">{errors.category}</Text> : null}
                            </View>

                            <Pressable
                                className={clsx("auth-button", !name.trim() || !price || !category && "auth-button-disabled")}
                                onPress={handleSubmit}
                            >
                                <Text className="auth-button-text">Create Subscription</Text>
                            </Pressable>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
