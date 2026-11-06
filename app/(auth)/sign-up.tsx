import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useSignUp } from '@clerk/expo';
import { styled } from 'nativewind';

const SafeAreaView = styled(RNSafeAreaView);
import '@/global.css';

type SignUpStep = 'form' | 'code';

const SignUp = () => {
    const { signUp, fetchStatus } = useSignUp();
    const [step, setStep] = useState<SignUpStep>('form');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [code, setCode] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLoading = fetchStatus === 'fetching' || isSubmitting;

    const validateName = (value: string) => {
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
    };

    const validateEmail = (value: string) => {
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
    };

    const validatePassword = (value: string, confirm?: string) => {
        if (!value.trim()) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Include at least one number';
        if (confirm && value !== confirm) return 'Passwords do not match';
        return '';
    };

    const validateCode = (value: string) => {
        if (!value.trim()) return 'Verification code is required';
        if (!/^\d{6}$/.test(value.replace(/\s/g, ''))) return 'Enter the 6-digit code';
        return '';
    };

    const handleSignUp = async () => {
        const nameErr = validateName(name);
        const emailErr = validateEmail(email);
        const passErr = validatePassword(password, confirmPassword);

        const errs: Record<string, string> = {};
        if (nameErr) errs.name = nameErr;
        if (emailErr) errs.email = emailErr;
        if (passErr) errs.password = passErr;

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }
        setFieldErrors({});

        setIsSubmitting(true);
        try {
            console.log('[SignUp] Creating account with email:', email.trim());
            const { error } = await signUp!.password({
                emailAddress: email.trim(),
                password: password,
            });
            console.log('[SignUp] signUp.password() result:', { error: !!error, status: signUp?.status });
            if (error) {
                console.error('[SignUp] Error creating account:', error);
                if (error.code === 'form_identifier_exists') {
                    setFieldErrors({ email: 'An account with this email already exists.' });
                } else if (error.code === 'form_password_pwned') {
                    setFieldErrors({ password: 'This password is too common. Choose a stronger one.' });
                } else {
                    setFieldErrors({ email: error.message || 'Something went wrong. Please try again.' });
                }
                return;
            }

            console.log('[SignUp] Sending email verification code...');
            const { error: sendError } = await signUp!.verifications.sendEmailCode();
            console.log('[SignUp] sendEmailCode() result:', { error: !!sendError });
            if (sendError) {
                console.error('[SignUp] Error sending code:', sendError);
                setFieldErrors({ email: 'Couldn\'t send verification code. Please try again.' });
                return;
            }

            console.log('[SignUp] Code sent, moving to verification step');
            setStep('code');
        } catch (err: any) {
            console.error('[SignUp] Unexpected error:', err);
            setFieldErrors({ email: err?.message || 'Something went wrong. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async () => {
        const codeErr = validateCode(code);
        if (codeErr) {
            setFieldErrors({ code: codeErr });
            return;
        }
        setFieldErrors({});

        setIsSubmitting(true);
        try {
            console.log('[SignUp] Verifying code:', code.replace(/\s/g, ''));
            const { error } = await signUp!.verifications.verifyEmailCode({
                code: code.replace(/\s/g, ''),
            });
            console.log('[SignUp] verifyEmailCode() result:', { error: !!error, status: signUp?.status });
            if (error) {
                console.error('[SignUp] Error verifying code:', error);
                setFieldErrors({ code: 'Invalid verification code. Please try again.' });
                return;
            }

            console.log('[SignUp] Code verified, finalizing sign-up...');
            const { error: finalizeError } = await signUp!.finalize();
            console.log('[SignUp] finalize() result:', { error: !!finalizeError });
            if (finalizeError) {
                console.error('[SignUp] Error finalizing:', finalizeError);
                setFieldErrors({ code: finalizeError.message || 'Something went wrong.' });
                return;
            }

            console.log('[SignUp] Sign-up completed, navigating to tabs');
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error('[SignUp] Unexpected error during verify:', err);
            setFieldErrors({ code: err?.message || 'Invalid verification code.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        setFieldErrors({});
        if (step === 'code') {
            setStep('form');
        } else {
            router.back();
        }
    };

    const getScreenTitle = () => {
        if (step === 'form') return 'Create your account';
        return 'Verify your email';
    };

    const getScreenSubtitle = () => {
        if (step === 'form') return 'Start tracking your subscriptions today';
        return `A 6-digit code has been sent to\n${email}`;
    };

    const getButtonLabel = () => {
        if (step === 'form') return 'Create account';
        return 'Verify & sign in';
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
                                {step === 'form' && (
                                    <>
                                        <View className="auth-field">
                                            <Text className="auth-label">Full name</Text>
                                            <TextInput
                                                className={`auth-input ${fieldErrors.name ? 'auth-input-error' : ''}`}
                                                placeholder="John Doe"
                                                placeholderTextColor="rgba(0,0,0,0.3)"
                                                value={name}
                                                onChangeText={(text) => {
                                                    setName(text);
                                                    if (fieldErrors.name) setFieldErrors({});
                                                }}
                                                autoCapitalize="words"
                                                autoComplete="name"
                                                textContentType="name"
                                            />
                                            {fieldErrors.name && (
                                                <Text className="auth-error">{fieldErrors.name}</Text>
                                            )}
                                        </View>

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

                                        <View className="auth-field">
                                            <Text className="auth-label">Password</Text>
                                            <TextInput
                                                className={`auth-input ${fieldErrors.password ? 'auth-input-error' : ''}`}
                                                placeholder="Min. 8 characters"
                                                placeholderTextColor="rgba(0,0,0,0.3)"
                                                value={password}
                                                onChangeText={(text) => {
                                                    setPassword(text);
                                                    if (fieldErrors.password) setFieldErrors({});
                                                    if (confirmPassword) {
                                                        const err = validatePassword(text, confirmPassword);
                                                        if (err) setFieldErrors((prev) => ({ ...prev, password: err }));
                                                        else setFieldErrors((prev) => {
                                                            const { password: _, ...rest } = prev;
                                                            return rest;
                                                        });
                                                    }
                                                }}
                                                secureTextEntry
                                                autoCorrect={false}
                                                autoComplete="password-new"
                                                textContentType="newPassword"
                                            />
                                            {fieldErrors.password && (
                                                <Text className="auth-error">{fieldErrors.password}</Text>
                                            )}
                                            {!fieldErrors.password && (
                                                <Text className="auth-helper">
                                                    Must include uppercase, lowercase, and a number.
                                                </Text>
                                            )}
                                        </View>

                                        <View className="auth-field">
                                            <Text className="auth-label">Confirm password</Text>
                                            <TextInput
                                                className={`auth-input ${fieldErrors.confirmPassword ? 'auth-input-error' : ''}`}
                                                placeholder="Re-enter your password"
                                                placeholderTextColor="rgba(0,0,0,0.3)"
                                                value={confirmPassword}
                                                onChangeText={(text) => {
                                                    setConfirmPassword(text);
                                                    if (fieldErrors.confirmPassword) setFieldErrors({});
                                                    if (password) {
                                                        const err = validatePassword(password, text);
                                                        if (err) setFieldErrors((prev) => ({ ...prev, confirmPassword: err }));
                                                        else setFieldErrors((prev) => {
                                                            const { confirmPassword: _, ...rest } = prev;
                                                            return rest;
                                                        });
                                                    }
                                                }}
                                                secureTextEntry
                                                autoCorrect={false}
                                                autoComplete="password-new"
                                                textContentType="newPassword"
                                            />
                                            {fieldErrors.confirmPassword && (
                                                <Text className="auth-error">{fieldErrors.confirmPassword}</Text>
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
                                    onPress={step === 'form' ? handleSignUp : handleVerify}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#081126" />
                                    ) : (
                                        <Text className="auth-button-text">{getButtonLabel()}</Text>
                                    )}
                                </Pressable>

                                {/* Back button */}
                                {step === 'code' && (
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

                        {/* Sign in link */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Already have an account?</Text>
                            <Link href="/(auth)/sign-in" asChild>
                                <Pressable>
                                    <Text className="auth-link">Sign in</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUp;