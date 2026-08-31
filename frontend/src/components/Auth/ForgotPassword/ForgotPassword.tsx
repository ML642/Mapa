import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services';
import { getAuthErrorMessage, getAuthServerMessage } from '../authErrors';
import ForgotPasswordRequest from './ForgotPasswordRequest';
import ForgotPasswordVerify from './ForgotPasswordVerify';
import ForgotPasswordConfirm from './ForgotPasswordConfirm';

type Step = 'request' | 'verify' | 'confirm';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const errorMessageRef = useRef<string | null>(null);

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    const serverMessage = getAuthServerMessage(error);
    if (serverMessage) {
      return serverMessage;
    }
    const msg = getAuthErrorMessage(error, fallback);
    return msg === fallback ? serverMessage || fallback : msg;
  }, []);

  const handleRequestSubmit = async (submittedEmail: string) => {
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(submittedEmail);
      setEmail(submittedEmail);
      setStep('verify');
    } catch (error) {
      errorMessageRef.current = getErrorMessage(error, 'Unable to send the code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (verifiedEmail: string, code: string) => {
    setIsLoading(true);
    try {
      const result = await authService.verifyPasswordResetCode(verifiedEmail, code);
      setResetToken(result.resetToken);
      setStep('confirm');
    } catch (error) {
      errorMessageRef.current = getErrorMessage(error, 'The code is invalid. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await authService.requestPasswordReset(email);
    } catch (error) {
      errorMessageRef.current = getErrorMessage(error, 'Unable to resend the code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleConfirmSubmit = async (password: string) => {
    setIsLoading(true);
    try {
      await authService.confirmPasswordReset(resetToken, password);
      navigate('/login');
    } catch (error) {
      errorMessageRef.current = getErrorMessage(error, 'Unable to save your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const apiError = errorMessageRef.current;
  errorMessageRef.current = null;

  return (
    <>
      {step === 'request' && (
        <ForgotPasswordRequest
          onSubmit={handleRequestSubmit}
          isLoading={isLoading}
          apiError={apiError}
        />
      )}
      {step === 'verify' && (
        <ForgotPasswordVerify
          email={email}
          onSubmit={handleVerifySubmit}
          onResend={handleResendCode}
          isLoading={isLoading}
          isResending={isResending}
          apiError={apiError}
        />
      )}
      {step === 'confirm' && (
        <ForgotPasswordConfirm
          onSubmit={handleConfirmSubmit}
          isLoading={isLoading}
          apiError={apiError}
        />
      )}
    </>
  );
}
