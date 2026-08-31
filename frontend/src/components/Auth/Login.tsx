import React, { useState } from 'react'
import { motion } from "framer-motion"
import { Link, useNavigate } from 'react-router-dom'
import GoogleAuthButton from './Register/GoogleAuthButton'
import { authService, writeAuthenticatedSession } from '../../services';
import AuthField from './AuthField';
import { LockFieldIcon, MailFieldIcon } from './AuthIcons';
import { AuthBrand, AuthCloseLink, AuthDivider, AuthInlineAlert } from './AuthUi';
import { getAuthErrorMessage } from './authErrors';

interface UserData {
    email: string;
    password: string;
}

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

const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData>({ email: '', password: '' });
    type LoginFieldErrors = Partial<Record<keyof UserData, string>>;
    const [errors, setErrors] = useState<LoginFieldErrors>({});
    const [formError, setFormError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (field: keyof UserData, value: string) => {
        setUserData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));

        if (formError) {
            setFormError('');
        }
    };

    const validateForm = () => {
        const newErrors: LoginFieldErrors = {};

        if (!userData.email.trim()) {
            newErrors.email = 'Email address is required';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                newErrors.email = 'Enter a valid email address';
            }
        }

        if (!userData.password) {
            newErrors.password = 'Password is required';
        } else if (userData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = Boolean(userData.email.trim() && userData.password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            setFormError('');
            const { accessToken, user } = await authService.loginUser(userData);

            if (!accessToken || !user) {
                throw new Error('Invalid server response');
            }

            writeAuthenticatedSession({ accessToken, user });

            navigate('/');
        } catch (error: unknown) {
            console.error('Sign-in error:', error);
            setFormError(getAuthErrorMessage(error, 'Unable to sign in. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = () => {
        setFormError('');
    };

    const handleGoogleFailure = (error: unknown) => {
        console.error('Google auth failed:', error);
        setFormError(getAuthErrorMessage(error, 'Unable to sign in with Google. Please try again.'));
    };

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
            <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-[max(24px,env(safe-area-inset-top,0px))]">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: "easeInOut",
                        delay: 0.1
                    }}
                    className="auth-card relative flex w-full max-w-[429px] min-w-0 flex-col rounded-[20px] p-6 sm:p-[32px]"
                >
                    {/* Logo */}
                    <motion.div
                        className='flex flex-col gap-[2.58px] items-center mb-[12px]'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <AuthBrand />
                    </motion.div>

                    <motion.h2
                        className="text-display text-center text-[22px] sm:text-[28px]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Welcome back!
                    </motion.h2>

                    <motion.div
                        className='flex flex-col w-full gap-[8px] mt-[18px]'
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    delayChildren: 0.4,
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        <GoogleAuthButton
                            onSuccess={handleGoogleSuccess}
                            onFailure={handleGoogleFailure}
                            text="Continue with Google"
                            disabled={isLoading}
                            useDefaultErrorAlert={false}
                        />
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                        <AuthDivider />
                    </motion.div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-[12px]">
                        {formError ? <AuthInlineAlert message={formError} /> : null}

                        <motion.div
                            className='flex flex-col gap-[12px]'
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        delayChildren: 0.8,
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="visible"
                        >

                            {/* email */}
                            <motion.div variants={formItemVariants}>
                                <AuthField
                                    id="email"
                                    label="Your email"
                                    type="email"
                                    value={userData.email}
                                    onChange={(value) => handleInputChange('email', value)}
                                    placeholder="Enter your email address"
                                    error={errors.email}
                                    icon={<MailFieldIcon />}
                                />
                            </motion.div>

                            {/* password */}
                            <motion.div variants={formItemVariants}>
                                <AuthField
                                    id="password"
                                    label="Password"
                                    type="password"
                                    value={userData.password}
                                    onChange={(value) => handleInputChange('password', value)}
                                    placeholder="Enter your password"
                                    error={errors.password}
                                    icon={<LockFieldIcon />}
                                    labelAction={
                                        <Link
                                            to="/forgot-password"
                                            className="shrink-0 whitespace-nowrap text-[12px] font-[400] tracking-[-0.48px] text-brand underline sm:relative sm:top-[6px]"
                                        >
                                            Forgot your password?
                                        </Link>
                                    }
                                />
                            </motion.div>
                        </motion.div>

                        <motion.button
                            type="submit"
                            disabled={!isFormValid || isLoading}
                            className="btn-primary mt-[16px] h-[44px] w-full rounded-[12px] text-[14px] font-[400] tracking-[-0.48px]"
                            whileHover={isFormValid && !isLoading ? { scale: 1.02 } : {}}
                            whileTap={isFormValid && !isLoading ? { scale: 0.98 } : {}}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.1 }}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in with email'}
                        </motion.button>
                    </form>

                    <motion.div
                        className="absolute right-3 top-3 sm:right-[20px] sm:top-[20px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <AuthCloseLink />
                    </motion.div>
                </motion.div>

                <motion.span
                    className="max-w-[429px] shrink-0 px-1 text-center text-[12px] text-brand-muted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    Don't have an account yet? <Link className='text-accent underline cursor-pointer' to='/register'>Sign up</Link>
                </motion.span>
            </div>
        </motion.div>
    )
}

export default Login;
