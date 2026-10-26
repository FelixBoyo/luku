import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import SplashScreen from '../screens/auth/SplashScreen';
import LandingScreen from '../screens/auth/LandingScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import PasswordResetScreen from '../screens/auth/PasswordResetScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import OnboardingCompleteScreen from '../screens/auth/OnboardingCompleteScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthStackProps = {
    initialRouteName?: keyof AuthStackParamList;
    passwordResetToken?: string;
    verifyOtpEmail?: string;
};

const AuthStack: React.FC<AuthStackProps> = ({
    initialRouteName = 'Splash',
    passwordResetToken,
    verifyOtpEmail,
}) => (
    <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false, animation: 'fade' }}
    >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen
            name="VerifyOtp"
            component={VerifyOtpScreen}
            initialParams={verifyOtpEmail ? { email: verifyOtpEmail } : undefined}
        />
        <Stack.Screen
            name="PasswordReset"
            component={PasswordResetScreen}
            initialParams={
                passwordResetToken ? { recoveryToken: passwordResetToken } : undefined
            }
        />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
);

export default AuthStack;
