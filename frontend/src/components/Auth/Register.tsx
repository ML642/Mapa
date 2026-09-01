import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import First from './Register/First'
import Second from './Register/Second'
import Third from './Register/Third'
import PullToRefreshScrollView from '../Mobile/PullToRefreshScrollView';
import { Link } from 'react-router-dom'
import { authService, writeAuthenticatedSession } from '../../services';
import { AuthBrand, AuthCloseLink, AuthInlineAlert } from './AuthUi';
import { getAuthErrorMessage, getAuthServerMessage } from './authErrors';
import RegisterProgressBar from './Register/RegisterProgressBar';

interface UserData {
    username: string;
    email: string;
    password: string;
    verificationPassword: string;
    agreement: boolean;
}

type FeedbackState = {
    message: string;
    variant?: 'error' | 'info' | 'success';
};

const normalizeUsername = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const pageVariants = {
    initial: {
        opacity: 0,
        scale: 0.98,
        y: 20
    },
    in: {
        opacity: 1,
        scale: 1,
        y: 0
    },
    out: {
        opacity: 0,
        scale: 1.02,
        y: -20
    }
}

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
}

const Register: React.FC = () => {
    const [step, setStep] = useState(1)
    const [feedback, setFeedback] = useState<FeedbackState | null>(null)
    const [userData, setUserData] = useState<UserData>({
        username: '',
        email: '',
        password: '',
        verificationPassword: '',
        agreement: false
    })

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('first')) {
            const emailFromUrl = urlParams.get('first');
            setUserData(prev => ({
                ...prev,
                email: emailFromUrl || ''
            }));
            setStep(1);
        } else if (urlParams.has('second')) {
            const emailFromUrl = urlParams.get('second');
            setUserData(prev => ({
                ...prev,
                email: emailFromUrl || ''
            }));
            setStep(2);
        } else if (urlParams.has('third')) {
            const emailFromUrl = urlParams.get('third');
            setUserData(prev => ({
                ...prev,
                email: emailFromUrl || ''
            }));
            setStep(3);
        }
    }, []);

    const updateUserData = (newData: Partial<UserData>) => {
        if (feedback) {
            setFeedback(null)
        }
        setUserData(prev => ({ ...prev, ...newData }))
    }

    const goToNextStep = (nextStep: number, email: string) => {
        if (nextStep === 2) {
            window.history.pushState({}, '', `/register?second=${encodeURIComponent(email)}`);
            setStep(2);
        } else if (nextStep === 3) {
            window.history.pushState({}, '', `/register?third=${encodeURIComponent(email)}`);
            setStep(3);
        }
    }

    const handleFirstStepSubmit = async (data: { username: string; email: string; password: string; agreement: boolean }) => {
        const normalizedData = {
            ...data,
            username: normalizeUsername(data.username),
            email: normalizeEmail(data.email),
        };

        updateUserData(normalizedData);
        setFeedback(null);

        try {
            await authService.registerUser(normalizedData);
        } catch (error: unknown) {
            if (getAuthServerMessage(error) === 'Email already used') {
                try {
                    await authService.sendEmailVerificationCode(normalizedData.email);
                    goToNextStep(2, normalizedData.email);
                    return;
                } catch (sendError: unknown) {
                    console.error('Unable to resend verification code:', sendError);
                    setFeedback({
                        message: getAuthErrorMessage(
                            sendError,
                            'An account already exists, but we could not send a verification code. Please try again.',
                        ),
                    });
                    return;
                }
            }

            console.error('Registration submission error:', error);
            setFeedback({
                message: getAuthErrorMessage(error, 'Unable to create your account. Please try again.'),
            });
            return;
        }

        try {
            await authService.sendEmailVerificationCode(normalizedData.email);
            goToNextStep(2, normalizedData.email);
        } catch (error: unknown) {
            console.error('Unable to send verification code:', error);
            setFeedback({
                message: getAuthErrorMessage(error, 'Unable to send the verification code. Please try again.'),
            });
        }
    }

    const handleRegisterGoogleFailure = (error: unknown) => {
        setFeedback({
            message: getAuthErrorMessage(error, 'Unable to sign in with Google. Please try again.'),
        });
    };

    const handleSecondStepSubmit = async (data: { email: string; verificationPassword: string }) => {
        const normalizedEmail = normalizeEmail(data.email);
        const verificationCode = data.verificationPassword.trim();

        updateUserData({
            email: normalizedEmail,
            verificationPassword: verificationCode,
        });
        setFeedback(null);

        try {
            const response = await authService.verifyEmailCode({
                code: Number(verificationCode),
                email: normalizedEmail,
            });

            writeAuthenticatedSession({ accessToken: response.accessToken, user: response.user });

            goToNextStep(3, normalizedEmail);
        } catch (error: unknown) {
            console.error('Email verification error:', error);
            setFeedback({
                message: getAuthErrorMessage(error, 'Unable to verify your email address. Please try again.'),
            });
        }
    }

    const handleResendVerificationCode = async (email: string) => {
        const normalizedEmail = normalizeEmail(email);

        updateUserData({ email: normalizedEmail });
        setFeedback(null);

        try {
            await authService.sendEmailVerificationCode(normalizedEmail);
            setFeedback({
                message: 'A new verification code has been sent to your email address.',
                variant: 'success',
            });
        } catch (error: unknown) {
            console.error('Unable to resend verification code:', error);
            setFeedback({
                message: getAuthErrorMessage(error, 'Unable to resend the code. Please try again.'),
            });
            throw error;
        }
    };

    const handleThirdStepSubmit = async (data: { email: string; categories: string[] }) => {
        setFeedback(null);

        try {
            await authService.setUserInterests({
                categories: data.categories,
            });

            window.location.href = '/';
        } catch (error: unknown) {
            console.error('Unable to save categories:', error);
            setFeedback({
                message: getAuthErrorMessage(error, 'Unable to save your categories. Please try again.'),
            });
        }
    };

    const stepComponents = {
        1: <First
            onSubmit={handleFirstStepSubmit}
            onGoogleFailure={handleRegisterGoogleFailure}
            userData={userData}
            updateUserData={updateUserData}
        />,
        2: <Second
            onSubmit={handleSecondStepSubmit}
            onResendCode={handleResendVerificationCode}
            userData={userData}
            updateUserData={updateUserData}
        />,
        3: <Third
            onSubmit={handleThirdStepSubmit}
            userData={userData}
            updateUserData={updateUserData}
        />
    }

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            // @ts-ignore
            transition={pageTransition}
            className="auth-page-shell h-[100dvh] max-h-[100dvh] w-full shrink-0 overflow-hidden"
        >
            <PullToRefreshScrollView
                wrapperClassName="h-full"
                scrollClassName="h-full overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y"
                contentClassName="min-h-full"
            >
                <div className="flex min-h-full w-full flex-col items-center justify-center gap-6 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-[max(24px,env(safe-area-inset-top,0px))]">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="auth-card relative flex w-full max-w-[429px] min-w-0 flex-col rounded-[20px] p-6 max-[359px]:p-5 sm:p-[32px]"
                >
                    <motion.div
                        className='flex flex-col gap-[2.58px] items-center mb-[12px]'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <AuthBrand />
                    </motion.div>

                    {feedback ? (
                        <div className="mb-[16px]">
                            <AuthInlineAlert message={feedback.message} variant={feedback.variant} />
                        </div>
                    ) : null}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -60 }}
                            transition={{
                                duration: 0.5,
                                ease: [0.4, 0, 0.2, 1],
                                x: { type: "spring", stiffness: 300, damping: 30 }
                            }}
                            className="min-h-0 shrink-0"
                        >
                            {stepComponents[step as keyof typeof stepComponents]}
                        </motion.div>
                    </AnimatePresence>

                    <motion.div
                        className='mt-[36px] w-full'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <RegisterProgressBar step={step} />
                    </motion.div>

                    

                    <motion.div
                        className="absolute right-3 top-3 sm:right-[20px] sm:top-[20px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <AuthCloseLink />
                    </motion.div>
                </motion.div>

                {step < 2 && (
                    <motion.span
                        className="max-w-[429px] shrink-0 px-1 text-center text-[12px] text-brand-muted"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        Already have an account? <Link className='text-accent underline cursor-pointer' to='/login'>Sign in</Link>
                    </motion.span>
                )}
                </div>
            </PullToRefreshScrollView>
        </motion.div>
    )
}

export default Register
