import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useSignIn } from '@clerk/expo/legacy';
import { useClerk } from '@clerk/expo';
import { styled } from 'nativewind';
import '@/global.css';

const SafeAreaView = styled(RNSafeAreaView);

type SignInStep = 'email' | 'password' | 'code';

/**
 * Multi-step sign-in screen backed by Clerk.
 * Guides the user through email → password → optional second-factor code,
 * handling session-exist conflicts and field-level validation errors.
 */
const SignIn = () => {
    const { isLoaded, signIn, setActive } = useSignIn();
    const { signOut } = useClerk();
    const [step, setStep] = useState<SignInStep>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLoading = !isLoaded || isSubmitting;

    /** Validate an email address format; returns an error message or an empty string. */
    const validateEmail = (value: string) => {
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
    };

    /** Validate that a password is non-empty; returns an error message or an empty string. */
    const validatePassword = (value: string) => {
        if (!value.trim()) return 'Password is required';
        return '';
    };

    /** Validate a 6-digit verification code; returns an error message or an empty string. */
    const validateCode = (value: string) => {
        if (!value.trim()) return 'Verification code is required';
        if (!/^\d{6}$/.test(value.replace(/\s/g, ''))) return 'Enter the 6-digit code';
        return '';
    };

    /** Advance from the email step to the password step after validating the email. */
    const handleEmailNext = () => {
        const emailErr = validateEmail(email);
        if (emailErr) {
            setFieldErrors({ email: emailErr });
            return;
        }
        setFieldErrors({});
        setStep('password');
    };

    /**
     * Submit the password and perform the sign-in flow.
     * Creates a sign-in attempt, verifies the first factor (password),
     * and handles second-factor preparation if required.
     */
    const handlePasswordSubmit = async () => {
        const passErr = validatePassword(password);
        if (passErr) {
            setFieldErrors({ password: passErr });
            return;
        }
        setFieldErrors({});

        setIsSubmitting(true);
        try {
            // Step 1: Create the sign-in attempt with the email identifier
            console.log('[SignIn] Creating sign-in attempt');
            await signIn!.create({ identifier: email.trim() });

            // Step 2: Attempt the password as the first factor
            const result = await signIn!.attemptFirstFactor({
                strategy: 'password',
                password,
            });

            if (result.firstFactorVerification.error) {
                const { error } = result.firstFactorVerification;
                if (error.code === 'form_password_incorrect') {
                    setFieldErrors({ password: 'Incorrect password. Please try again.' });
                } else {
                    setFieldErrors({ password: error.message || 'Something went wrong.' });
                }
                return;
            }

            // Step 3: If sign-in is complete (no MFA/Client Trust), activate session and navigate
            if (result.status === 'complete') {
                await setActive!({ session: result.createdSessionId });
                router.replace('/');
                return;
            }

            // Step 4: If MFA or Client Trust is needed, prepare and send the email code
            if (
                result.status === 'needs_second_factor' ||
                result.status === 'needs_client_trust'
            ) {
                await result.prepareSecondFactor({ strategy: 'email_code' });
                setStep('code');
                return;
            }

            setFieldErrors({ password: 'Sign-in interrupted. Please try again.' });
        } catch (err: any) {
            console.error('[SignIn] Unexpected error:', err);
            // If the user is already signed in, sign out the existing session and require re-entry
            if (err?.errors?.[0]?.code === 'session_exists') {
                try {
                    await signOut();
                } catch (signOutErr: any) {
                    console.error('[SignIn] Sign-out failed:', signOutErr);
                    setFieldErrors({
                        password:
                            'Session conflict. Please sign out of other devices and try again.',
                    });
                    return;
                }
                // Reset state to require credential re-entry
                setStep('email');
                setEmail('');
                setPassword('');
                setFieldErrors({});
                return;
            }
            const errCode = err?.errors?.[0]?.code;
            if (errCode === 'form_password_incorrect') {
                setFieldErrors({ password: 'Incorrect password. Please try again.' });
            } else {
                setFieldErrors({ password: err?.message || 'Something went wrong.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Verify the second-factor email code and complete sign-in.
     * Activates the session on success and navigates to the home screen.
     */
    const handleCodeVerify = async () => {
        const codeErr = validateCode(code);
        if (codeErr) {
            setFieldErrors({ code: codeErr });
            return;
        }
        setFieldErrors({});

        setIsSubmitting(true);
        try {
            console.log('[SignIn] Verifying email code (second factor)...');
            await signIn!.attemptSecondFactor({
                strategy: 'email_code',
                code: code.replace(/\s/g, ''),
            });

            if (signIn!.secondFactorVerification.error) {
                const { error } = signIn!.secondFactorVerification;
                console.error('[SignIn] Code verification error:', error);
                setFieldErrors({ code: 'Invalid verification code. Please try again.' });
                setIsSubmitting(false);
                return;
            }

            console.log('[SignIn] Code verified, status:', signIn!.status);

            if (signIn!.status === 'complete') {
                console.log('[SignIn] Sign-in complete, activating session...');
                await setActive!({ session: signIn!.createdSessionId });
                console.log('[SignIn] Session activated, navigating to index');
                router.replace('/');
            } else {
                console.log('[SignIn] Unexpected status after code verify:', signIn!.status);
                setFieldErrors({ code: 'Sign-in interrupted. Please try again.' });
            }
        } catch (err: any) {
            console.error('[SignIn] Unexpected error during code verify:', err);
            // If the user is already signed in, sign out the existing session and require re-entry
            if (err?.errors?.[0]?.code === 'session_exists') {
                try {
                    await signOut();
                } catch (signOutErr: any) {
                    console.error('[SignIn] Sign-out failed:', signOutErr);
                    setFieldErrors({
                        code:
                            'Session conflict. Please sign out of other devices and try again.',
                    });
                    return;
                }
                // Reset state to require credential re-entry
                setStep('email');
                setEmail('');
                setPassword('');
                setCode('');
                setFieldErrors({});
                return;
            }
            setFieldErrors({ code: err?.message || 'Invalid verification code.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    /** Navigate back to the previous sign-in step or leave the screen. */
    const handleBack = () => {
        setFieldErrors({});
        if (step === 'password') {
            setStep('email');
        } else if (step === 'code') {
            setStep('password');
        } else {
            router.back();
        }
    };

    /** Return the screen title for the current sign-in step. */
    const getScreenTitle = () => {
        if (step === 'email') return 'Welcome back';
        if (step === 'password') return 'Enter your password';
        return 'Check your email';
    };

    /** Return the subtitle text for the current sign-in step. */
    const getScreenSubtitle = () => {
        if (step === 'email') return 'Sign in to manage your subscriptions';
        if (step === 'password') return `We'll send a verification code to\n${email}`;
        return `A 6-digit code has been sent to\n${email}`;
    };

    /** Return the button label for the current sign-in step. */
    const getButtonLabel = () => {
        if (step === 'email') return 'Continue';
        if (step === 'password') return 'Sign in';
        return 'Verify code';
    };

    /** Dispatch the action for the primary button on the current step. */
    const handleButtonPress = () => {
        if (step === 'email') handleEmailNext();
        else if (step === 'password') handlePasswordSubmit();
        else handleCodeVerify();
    };

    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="auth-scroll"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View className="auth-content">
                        {/* Brand */}
                        <View className="auth-brand-block">
                            <View className="auth-logo-wrap">
                                <View className="auth-logo-mark">
                                    <Text className="auth-logo-mark-text">R</Text>
                                </View>
                                <View>
                                    <Text className="auth-wordmark">Reccurly</Text>
                                    <Text className="auth-wordmark-sub">Subscription tracker</Text>
                                </View>
                            </View>
                        </View>

                        {/* Title */}
                        <Text className="auth-title">{getScreenTitle()}</Text>
                        <Text className="auth-subtitle">{getScreenSubtitle()}</Text>

                        {/* Form Card */}
                        <View className="auth-card">
                            <View className="auth-form">
                                {step === 'email' && (
                                    <View className="auth-field">
                                        <Text className="auth-label">Email address</Text>
                                        <TextInput
                                            className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
                                            placeholder="you@example.com"
                                            placeholderTextColor="rgba(0,0,0,0.3)"
                                            value={email}
                                            onChangeText={(text) => {
                                                setEmail(text);
                                                if (fieldErrors.email) setFieldErrors({});
                                            }}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            autoComplete="email"
                                            textContentType="emailAddress"
                                        />
                                        {fieldErrors.email && (
                                            <Text className="auth-error">{fieldErrors.email}</Text>
                                        )}
                                    </View>
                                )}

                                {step === 'password' && (
                                    <View className="auth-field">
                                        <Text className="auth-label">Password</Text>
                                        <TextInput
                                            className={`auth-input ${fieldErrors.password ? 'auth-input-error' : ''}`}
                                            placeholder="Enter your password"
                                            placeholderTextColor="rgba(0,0,0,0.3)"
                                            value={password}
                                            onChangeText={(text) => {
                                                setPassword(text);
                                                if (fieldErrors.password) setFieldErrors({});
                                            }}
                                            secureTextEntry
                                            autoCorrect={false}
                                            autoComplete="password"
                                            textContentType="password"
                                        />
                                        {fieldErrors.password && (
                                            <Text className="auth-error">{fieldErrors.password}</Text>
                                        )}
                                    </View>
                                )}

                                {step === 'code' && (
                                    <View className="auth-field">
                                        <Text className="auth-label">Verification code</Text>
                                        <TextInput
                                            className={`auth-input ${fieldErrors.code ? 'auth-input-error' : ''}`}
                                            placeholder="123 456"
                                            placeholderTextColor="rgba(0,0,0,0.3)"
                                            value={code}
                                            onChangeText={(text) => {
                                                const cleaned = text.replace(/[^0-9\s]/g, '').slice(0, 7);
                                                setCode(cleaned);
                                                if (fieldErrors.code) setFieldErrors({});
                                            }}
                                            keyboardType="number-pad"
                                            textContentType="oneTimeCode"
                                            maxLength={7}
                                        />
                                        {fieldErrors.code && (
                                            <Text className="auth-error">{fieldErrors.code}</Text>
                                        )}
                                        <Text className="auth-helper">
                                            Didn&apos;t receive it? Check your spam folder.
                                        </Text>
                                    </View>
                                )}

                                {/* Submit button */}
                                <Pressable
                                    className={`auth-button ${isLoading ? 'auth-button-disabled' : ''}`}
                                    onPress={handleButtonPress}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#081126" />
                                    ) : (
                                        <Text className="auth-button-text">{getButtonLabel()}</Text>
                                    )}
                                </Pressable>

                                {/* Back button */}
                                {(step === 'password' || step === 'code') && (
                                    <Pressable onPress={handleBack} className="items-center mt-2">
                                        <Text className="text-sm font-sans-semibold text-muted-foreground">
                                            ← Back
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>

                        {/* Divider */}
                        <View className="auth-divider-row">
                            <View className="auth-divider-line" />
                            <Text className="auth-divider-text">or</Text>
                            <View className="auth-divider-line" />
                        </View>

                        {/* Sign up link */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Don&apos;t have an account?</Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <Pressable>
                                    <Text className="auth-link">Create one</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;