import React, { useState } from 'react';
import GoogleAuthButton from './GoogleAuthButton';
import AuthField from '../AuthField';
import { LockFieldIcon, MailFieldIcon, UserFieldIcon } from '../AuthIcons';
import { AuthDivider } from '../AuthUi';
import { registerSchema } from '../../../utils/validation';

interface UserData {
    username: string;
    email: string;
    password: string;
    verificationPassword: string;
    agreement: boolean;
}

interface FirstProps {
    onSubmit: (data: { username: string; email: string; password: string; agreement: boolean }) => void;
    onGoogleFailure?: (error: unknown) => void;
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
}

type FirstFieldErrors = Partial<Record<keyof UserData, string>>;

const First = ({ onSubmit, onGoogleFailure, userData, updateUserData }: FirstProps) => {
    const [errors, setErrors] = useState<FirstFieldErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: FirstFieldErrors = {};

        const result = registerSchema.safeParse({
            username: userData.username.trim().replace(/\s+/g, ' '),
            email: userData.email.trim(),
            password: userData.password,
        });

        if (!result.success) {
            for (const issue of result.error.issues) {
                const field = issue.path[0] as string;
                if (!newErrors[field]) {
                    newErrors[field] = issue.message;
                }
            }
        }

        if (!userData.agreement) {
            newErrors.agreement = 'You must accept the terms.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setIsLoading(true);
            try {
                await onSubmit({
                    username: userData.username.trim().replace(/\s+/g, ' '),
                    email: userData.email.trim(),
                    password: userData.password,
                    agreement: userData.agreement
                });
            } catch (error) {
                console.error('Registration submission error:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleInputChange = (field: keyof UserData, value: string | boolean) => {
        updateUserData({ [field]: value });
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleGoogleSuccess = () => {};

    const handleGoogleFailure = (error: unknown) => {
        console.error('Google auth failed:', error);
        onGoogleFailure?.(error);
    };

    const isFormValid = Boolean(userData.username.trim() && userData.email.trim() && userData.password && userData.agreement);

    return (
        <>
            <h2 className='text-display mb-[12px] text-[24px]'>Welcome to Mapa!</h2>
            <p className='w-full max-w-full text-[12px] font-[400] tracking-[-0.48px] text-brand-border'>
                Sign up to use all features.
            </p>

            <div className='flex flex-col w-full gap-[8px] mt-[18px]'>
                <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onFailure={handleGoogleFailure}
                    text="Continue with Google"
                    disabled={isLoading}
                    useDefaultErrorAlert={false}
                />
            </div>

            <AuthDivider />

            {/* form */}
            <div className='flex flex-col gap-[12px]'>
                {/* username */}
                <AuthField
                    id="username"
                    label="Your name"
                    type="text"
                    value={userData.username}
                    onChange={(value) => handleInputChange('username', value)}
                    placeholder="Enter your name"
                    error={errors.username}
                    icon={<UserFieldIcon />}
                />

                {/* email */}
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

                {/* password */}
                <AuthField
                    id="password"
                    label="Password"
                    type="password"
                    value={userData.password}
                    onChange={(value) => handleInputChange('password', value)}
                    placeholder="Create a password"
                    error={errors.password}
                    icon={<LockFieldIcon />}
                />

                {/* Checkbox */}
                <div className="flex items-start gap-[8px]">
                    <input
                        type="checkbox"
                        id="agreement"
                        checked={userData.agreement}
                        onChange={(e) => handleInputChange('agreement', e.target.checked)}
                        className="mt-[4px] h-[18px] w-[18px] rounded-[8px] border border-brand accent-brand"
                    />
                    <label htmlFor="agreement" className="w-[337px] text-[12px] font-[400] tracking-[-0.48px] text-brand">
                        I accept{" "}
                        <a href="#" className="link-accent text-[12px] font-[400] tracking-[-0.48px]">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="link-accent text-[12px] font-[400] tracking-[-0.48px]">
                            Privacy Policy
                        </a>
                    </label>
                </div>
                {errors.agreement && <span className="text-feedback-error text-[10px] -mt-2">{errors.agreement}</span>}

                <button
                    type="button"
                    disabled={!isFormValid || isLoading}
                    onClick={handleSubmit}
                    className='btn-secondary mt-[8px] h-[44px] w-full max-w-full rounded-[12px] text-[14px] font-[400] tracking-[-0.48px]'
                >
                    {isLoading ? 'Sending...' : 'Sign up with email'}
                </button>
            </div>
        </>
    );
};

export default First;
