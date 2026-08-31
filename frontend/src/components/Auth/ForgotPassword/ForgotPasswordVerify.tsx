import { useState } from 'react';
import { motion } from 'framer-motion';
import { MailFieldIcon, LockFieldIcon } from '../AuthIcons';
import { AuthBrand, AuthCloseLink, AuthInlineAlert } from '../AuthUi';
import AuthField from '../AuthField';
import { forgotPasswordVerifySchema } from '../../../utils/validation';

interface ForgotPasswordVerifyProps {
  email: string;
  onSubmit: (email: string, code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  isResending: boolean;
  apiError?: string | null;
}

export default function ForgotPasswordVerify({
  email,
  onSubmit,
  onResend,
  isLoading,
  isResending,
  apiError,
}: ForgotPasswordVerifyProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const result = forgotPasswordVerifySchema.safeParse({ email, code });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError('');
    await onSubmit(result.data.email, result.data.code);
  };

  return (
    <div className="auth-page-shell flex min-h-[100dvh] w-full items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="auth-card relative flex w-full max-w-[429px] flex-col rounded-[20px] p-6 sm:p-8"
      >
        <motion.div
          className="mb-3 flex flex-col items-center gap-1"
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
          Verify your email address
        </motion.h2>

        <motion.p
          className="mt-2 text-center text-[12px] text-brand-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          We sent a verification code to {email}
        </motion.p>

        <motion.div
          className="mt-6 flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {(error || apiError) && <AuthInlineAlert message={error || apiError || ''} />}

          <AuthField
            id="verify-email"
            label="Your email"
            type="email"
            value={email}
            onChange={() => {}}
            disabled
            icon={<MailFieldIcon />}
          />

          <AuthField
            id="verify-code"
            label="Code from your email"
            type="text"
            value={code}
            onChange={(v) => { setCode(v); setError(''); }}
            placeholder="Enter the code"
            error={error}
            icon={<LockFieldIcon />}
          />

          <div className="flex items-center gap-1 text-[12px] text-brand-muted">
            <span>Didn't receive a code?</span>
            <button
              type="button"
              disabled={isResending}
              onClick={onResend}
              className="text-brand underline hover:text-accent disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend'}
            </button>
          </div>

          <button
            type="button"
            disabled={!code.trim() || isLoading}
            onClick={handleSubmit}
            className="btn-primary mt-2 h-[44px] w-full rounded-[12px] text-[14px]"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </motion.div>

        <motion.div
          className="absolute right-3 top-3 sm:right-5 sm:top-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <AuthCloseLink />
        </motion.div>
      </motion.div>
    </div>
  );
}
