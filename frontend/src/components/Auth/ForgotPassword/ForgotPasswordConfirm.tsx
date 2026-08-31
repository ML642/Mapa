import { useState } from 'react';
import { motion } from 'framer-motion';
import { LockFieldIcon } from '../AuthIcons';
import { AuthBrand, AuthCloseLink, AuthInlineAlert } from '../AuthUi';
import AuthField from '../AuthField';
import { forgotPasswordConfirmSchema } from '../../../utils/validation';

interface ForgotPasswordConfirmProps {
  onSubmit: (password: string) => Promise<void>;
  isLoading: boolean;
  apiError?: string | null;
}

export default function ForgotPasswordConfirm({ onSubmit, isLoading, apiError }: ForgotPasswordConfirmProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const result = forgotPasswordConfirmSchema.safeParse({ password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    await onSubmit(result.data.password);
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
          New password
        </motion.h2>

        <motion.p
          className="mt-2 text-center text-[12px] text-brand-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Create a new password to sign in
        </motion.p>

        <motion.div
          className="mt-6 flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {(error || apiError) && <AuthInlineAlert message={error || apiError || ''} />}

          <AuthField
            id="new-password"
            label="New password"
            type="password"
            value={password}
            onChange={(v) => { setPassword(v); setError(''); }}
            placeholder="Enter a new password"
            error={error}
            icon={<LockFieldIcon />}
          />

          <AuthField
            id="confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); setError(''); }}
            placeholder="Repeat your password"
            icon={<LockFieldIcon />}
          />

          <button
            type="button"
            disabled={!password.trim() || !confirmPassword.trim() || isLoading}
            onClick={handleSubmit}
            className="btn-primary mt-2 h-[44px] w-full rounded-[12px] text-[14px]"
          >
            {isLoading ? 'Saving...' : 'Save password'}
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
