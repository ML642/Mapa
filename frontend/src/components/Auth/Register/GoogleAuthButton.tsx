// GoogleAuthButton.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import type { AuthResponse } from '../../../services';
import { authService, writeAuthenticatedSession } from '../../../services';
import { getAuthErrorMessage } from '../authErrors';

interface GoogleAuthButtonProps {
    onSuccess?: (response: AuthResponse) => void;
    onFailure?: (error: unknown) => void;
    text?: string;
    disabled?: boolean;
    useDefaultErrorAlert?: boolean;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
    onSuccess,
    onFailure,
    text = "Sign in with Google",
    disabled = false,
    useDefaultErrorAlert = true,
}) => {
    const reportFailure = (error: unknown) => {
        onFailure?.(error);

        if (useDefaultErrorAlert) {
            alert(getAuthErrorMessage(error, 'Unable to sign in with Google. Please try again.'));
        }
    };

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const data = await authService.googleAuthUser({
                    accessToken: tokenResponse.access_token
                });
                onSuccess?.(data);

                if (data.redirect) {
                    writeAuthenticatedSession({ accessToken: data.accessToken, user: data.user });
                    window.location.href = data.redirect;
                } else {
                    if (data.accessToken) {
                        writeAuthenticatedSession({ accessToken: data.accessToken, user: data.user });
                        window.location.href = '/';
                    }
                }
            } catch (error) {
                console.error('Google auth error:', error);
                reportFailure(error);
            }
        },
        onError: (error) => {
            console.error('Google auth failed:', error);
            reportFailure(error);
        },
        flow: 'implicit',
    });

    return (
        <motion.button
            type="button"
            disabled={disabled}
            onClick={() => {
                if (!disabled) {
                    login();
                }
            }}
            className='btn-surface flex w-full flex-row items-center rounded-[12px] px-[20px] py-[12px] transition-shadow duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60'
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                <path d="M22.81 12.6865C22.81 11.9065 22.74 11.1565 22.61 10.4365H12.25V14.6965H18.17C17.91 16.0665 17.13 17.2265 15.96 18.0065V20.7765H19.53C21.61 18.8565 22.81 16.0365 22.81 12.6865Z" fill="#4285F4" />
                <path d="M12.2497 23.4361C15.2197 23.4361 17.7097 22.4561 19.5297 20.7761L15.9597 18.0061C14.9797 18.6661 13.7297 19.0661 12.2497 19.0661C9.38969 19.0661 6.95969 17.1361 6.08969 14.5361H2.42969V17.3761C4.23969 20.9661 7.94969 23.4361 12.2497 23.4361Z" fill="#34A853" />
                <path d="M6.09 14.5268C5.87 13.8668 5.74 13.1668 5.74 12.4368C5.74 11.7068 5.87 11.0068 6.09 10.3468V7.50684H2.43C1.68 8.98684 1.25 10.6568 1.25 12.4368C1.25 14.2168 1.68 15.8868 2.43 17.3668L5.28 15.1468L6.09 14.5268Z" fill="#FBBC05" />
                <path d="M12.2497 5.81652C13.8697 5.81652 15.3097 6.37652 16.4597 7.45652L19.6097 4.30652C17.6997 2.52652 15.2197 1.43652 12.2497 1.43652C7.94969 1.43652 4.23969 3.90652 2.42969 7.50652L6.08969 10.3465C6.95969 7.74652 9.38969 5.81652 12.2497 5.81652Z" fill="#EA4335" />
            </svg>
            <span className='relative left-[-25px] flex-1 text-center text-[12px] font-[400] tracking-[-0.48px] text-brand'>
                {text}
            </span>
        </motion.button>
    );
};

export default GoogleAuthButton;
