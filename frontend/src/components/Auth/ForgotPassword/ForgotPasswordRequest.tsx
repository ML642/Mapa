import { useState } from 'react';
import { motion } from 'framer-motion';
import { MailFieldIcon } from '../AuthIcons';
import { AuthBrand, AuthCloseLink, AuthInlineAlert } from '../AuthUi';
import AuthField from '../AuthField';
import { forgotPasswordRequestSchema } from '../../../utils/validation';

interface ForgotPasswordRequestProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  apiError?: string | null;
}

export default function ForgotPasswordRequest({ onSubmit, isLoading, apiError }: ForgotPasswordRequestProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const result = forgotPasswordRequestSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError('');
    await onSubmit(result.data.email);
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
          Reset your password
        </motion.h2>

        <motion.p
          className="mt-2 text-center text-[12px] text-brand-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Enter the email address associated with your account. We'll send you a password reset code.
        </motion.p>

        <motion.div
          className="mt-6 flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {(error || apiError) && <AuthInlineAlert message={error || apiError || ''} />}

          <AuthField
            id="reset-email"
            label="Your email"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); setError(''); }}
            placeholder="Enter your email address"
            error={error}
            icon={<MailFieldIcon />}
          />

          <button
            type="button"
            disabled={!email.trim() || isLoading}
            onClick={handleSubmit}
            className="btn-primary mt-2 h-[44px] w-full rounded-[12px] text-[14px]"
          >
            {isLoading ? 'Sending...' : 'Send code'}
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
