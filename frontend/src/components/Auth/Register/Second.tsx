import React, { useState } from 'react';
import AuthField from '../AuthField';
import { LockFieldIcon, MailFieldIcon } from '../AuthIcons';

interface UserData {
    username: string;
    email: string;
    password: string;
    verificationPassword: string;
    agreement: boolean;
}

interface SecondProps {
    onSubmit: (data: { email: string; verificationPassword: string }) => void;
    onResendCode: (email: string) => Promise<void> | void;
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
}

type SecondFieldErrors = Partial<Record<keyof UserData, string>>;

const Second = ({ onSubmit, onResendCode, userData, updateUserData }: SecondProps) => {
    const [errors, setErrors] = useState<SecondFieldErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const validateForm = () => {
        const newErrors: SecondFieldErrors = {};
        const normalizedVerificationCode = userData.verificationPassword.trim();

        if (!normalizedVerificationCode) {
            newErrors.verificationPassword = 'Enter the verification code';
        } else if (!/^\d{5}$/.test(normalizedVerificationCode)) {
            newErrors.verificationPassword = 'Enter the 5-digit code from your email';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setIsLoading(true);
            try {
                await onSubmit({
                    email: userData.email,
                    verificationPassword: userData.verificationPassword.trim()
                });
            } catch (error) {
                console.error('Email verification error:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleInputChange = (field: keyof UserData, value: string) => {
        updateUserData({ [field]: value });
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleResendCode = async () => {
        if (!userData.email || isResending) {
            return;
        }

        setIsResending(true);
        try {
            await onResendCode(userData.email);
        } catch (error) {
            console.error('Unable to resend verification code:', error);
        } finally {
            setIsResending(false);
        }
    };

    const isFormValid = Boolean(userData.verificationPassword.trim());

    return (
        <>
            <h2 className='text-display mb-[12px] text-start text-[28px]'>Verify your registration</h2>
            <p className='w-full max-w-full text-[12px] font-[400] tracking-[-0.48px] text-brand-border'>
                We sent a code to {userData.email || 'name@example.com'}
            </p>

            <div className='flex flex-col w-full gap-[8px] mt-[18px]'>
                <div className='flex flex-col gap-[12px]'>
                    <AuthField
                        id="email"
                        label="Your email"
                        type="email"
                        value={userData.email || 'name@example.com'}
                        onChange={() => undefined}
                        disabled
                        icon={<MailFieldIcon />}
                    />

                    <AuthField
                        id="verificationPassword"
                        label="Verification code"
                        type="password"
                        value={userData.verificationPassword}
                        onChange={(value) => handleInputChange('verificationPassword', value)}
                        placeholder="Enter the code from your email"
                        error={errors.verificationPassword}
                        icon={<LockFieldIcon />}
                    />

                    <span className='flex flex-row gap-[4px] text-[12px] font-[400] tracking-[-0.48px] text-brand-muted'>
                        Didn't receive a code?{' '}
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={!userData.email || isResending}
                            className='text-brand underline hover:text-accent'
                        >
                            {isResending ? 'Sending...' : 'Resend'}
                        </button>
                    </span>

                    <button
                        type="button"
                        disabled={!isFormValid || isLoading}
                        onClick={handleSubmit}
                        className='btn-secondary mt-[8px] h-[44px] w-full max-w-full rounded-[12px] text-[14px] font-[400] tracking-[-0.48px]'
                    >
                        {isLoading ? 'Verifying...' : 'Continue'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Second;
