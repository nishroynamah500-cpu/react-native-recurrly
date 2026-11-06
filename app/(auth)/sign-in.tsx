import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useSignIn } from '@clerk/expo';
import { styled } from 'nativewind';
import '@/global.css';

const SafeAreaView = styled(RNSafeAreaView);

type SignInStep = 'email' | 'password' | 'code';
type CodeMode = 'mfa' | 'client_trust' | 'first_factor';

const SignIn = () => {
    const { signIn, fetchStatus } = useSignIn();
    const [step, setStep] = useState<SignInStep>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [codeMode, setCodeMode] = useState<CodeMode | null>(null);

    const isLoading = fetchStatus === 'fetching' || isSubmitting;

    const validateEmail = (value: string) => {
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
    };

    const validatePassword = (value: string) => {
        if (!value.trim()) return 'Password is required';
        return '';
    };

    const validateCode = (value: string) => {
        if (!value.trim()) return 'Verification code is required';
        if (!/^\d{6}$/.test(value.replace(/\s/g, ''))) return 'Enter the 6-digit code';
        return '';
    };

    const handleEmailNext = async () => {
        const emailErr = validateEmail(email);
        if (emailErr) {
            setFieldErrors({ email: emailErr });
            return;
        }
        setFieldErrors({});
        setStep('password');
    };

    const handlePasswordSubmit = async () => {
        const passErr = validatePassword(password);
        if (passErr) {
            setFieldErrors({ password: passErr });
            return;
        }
        setFieldErrors({});

        setIsSubmitting(true);
        try {
            console.log('[SignIn] Attempting sign-in with password');
            const { error } = await signIn!.password({ emailAddress: email.trim(), password });
            console.log('[SignIn] signIn.password() result:', { error: !!error, status: signIn?.status });
            if (error) {
                console.error('[SignIn] Error:', error);
                if (error.code === 'form_password_incorrect') {
                    setFieldErrors({ password: 'Incorrect password. Please try again.' });
                } else {
                    setFieldErrors({ password: error.message || 'Something went wrong.' });
                }
                return;
            }

            if (signIn!.status === 'needs_client_trust') {
                console.log('[SignIn] Device trust required, sending email code...');
                const emailCodeFactor = signIn!.supportedSecondFactors?.find(
                    (factor) => factor.strategy === 'email_code',
                );
                if (emailCodeFactor) {
                    const { error: sendError } = await signIn!.mfa.sendEmailCode();
                    if (sendError) {
                        setFieldErrors({ code: 'Couldn\'t send verification code.' });
                        return;
                    }
                    setCodeMode('client_trust');
                    setStep('code');
                } else {
                    setFieldErrors({ password: 'Verification required but no email factor found.' });
                }
            } else if (signIn!.status === 'needs_second_factor') {
                console.log('[SignIn] MFA required, sending email code...');
                const emailCodeFactor = signIn!.supportedSecondFactors?.find(
                    (factor) => factor.strategy === 'email_code',
                );
                if (emailCodeFactor) {
                    const { error: sendError } = await signIn!.mfa.sendEmailCode();
                    if (sendError) {
                        setFieldErrors({ code: 'Couldn\'t send verification code.' });
                        return;
                    }
                    setCodeMode('mfa');
                    setStep('code');
                } else {
                    setFieldErrors({ password: 'MFA required but no email factor found.' });
                }
            } else if (signIn!.status === 'needs_first_factor') {
                console.log('[SignIn] Needs first factor, sending email code...');
                const { error: sendError } = await signIn!.emailCode.sendCode();
                if (sendError) {
                    setFieldErrors({ code: 'Couldn\'t send verification code.' });
                    return;
                }
                setCodeMode('first_factor');
                setStep('code');
            } else if (signIn!.status === 'complete') {
                console.log('[SignIn] Sign-in complete, finalizing...');
                const { error: finalizeError } = await signIn!.finalize({
                    navigate: ({ session }) => {
                        if (session?.currentTask) {
                            console.log('[SignIn] Session has pending task:', session.currentTask);
                        }
                        console.log('[SignIn] Navigating to tabs');
                        router.replace('/(tabs)');
                    },
                });
                if (finalizeError) {
                    console.error('[SignIn] Finalize error:', finalizeError);
                    setFieldErrors({ password: finalizeError.message || 'Something went wrong.' });
                }
            } else {
                console.log('[SignIn] Unexpected status:', signIn!.status);
                setFieldErrors({ password: 'Sign-in interrupted. Please try again.' });
            }
        } catch (err: any) {
            console.error('[SignIn] Unexpected error:', err);
            setFieldErrors({ password: err?.message || 'Something went wrong.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCodeVerify = async () => {
        const codeErr = validateCode(code);
        if (codeErr) {
            setFieldErrors({ code: codeErr });
            return;
        }
        setFieldErrors({});

        setIsSubmitting(true);
        try {
            let error;

            // Device trust and MFA use mfa.verifyEmailCode, while first factor uses emailCode.verifyCode
            if (codeMode === 'client_trust' || codeMode === 'mfa') {
                console.log('[SignIn] Verifying MFA code (mode:', codeMode, ')...');
                const result = await signIn!.mfa.verifyEmailCode({ code: code.replace(/\s/g, '') });
                error = result.error;
            } else {
                console.log('[SignIn] Verifying email code (mode:', codeMode, ')...');
                const result = await signIn!.emailCode.verifyCode({ code: code.replace(/\s/g, '') });
                error = result.error;
            }

            if (error) {
                console.error('[SignIn] Code verification error:', error);
                setFieldErrors({ code: 'Invalid verification code. Please try again.' });
                return;
            }

            console.log('[SignIn] Code verified, status:', signIn!.status);

            if (signIn!.status === 'complete') {
                console.log('[SignIn] Sign-in complete, finalizing...');
                const { error: finalizeError } = await signIn!.finalize({
                    navigate: ({ session }) => {
                        if (session?.currentTask) {
                            console.log('[SignIn] Session has pending task:', session.currentTask);
                        }
                        console.log('[SignIn] Navigating to tabs');
                        router.replace('/(tabs)');
                    },
                });
                if (finalizeError) {
                    console.error('[SignIn] Finalize error:', finalizeError);
                    setFieldErrors({ code: finalizeError.message || 'Something went wrong.' });
                }
            } else if (signIn!.status === 'needs_second_factor') {
                console.log('[SignIn] Still needs MFA after code verification...');
                setFieldErrors({ code: 'Additional verification required. Please try again.' });
            }
        } catch (err: any) {
            console.error('[SignIn] Unexpected error during code verify:', err);
            setFieldErrors({ code: err?.message || 'Invalid verification code.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        setFieldErrors({});
        if (step === 'password') {
            setStep('email');
        } else if (step === 'code') {
            setStep('password');
            setCodeMode(null);
        } else {
            router.back();
        }
    };

    const getScreenTitle = () => {
        if (step === 'email') return 'Welcome back';
        if (step === 'password') return 'Enter your password';
        return 'Check your email';
    };

    const getScreenSubtitle = () => {
        if (step === 'email') return 'Sign in to manage your subscriptions';
        if (step === 'password') return `We'll send a verification code to\n${email}`;
        return `A 6-digit code has been sent to\n${email}`;
    };

    const getButtonLabel = () => {
        if (step === 'email') return 'Continue';
        if (step === 'password') return 'Sign in';
        return 'Verify code';
    };

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
                                    <>
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
                                    </>
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