import { KeyRound, ShieldCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../features/session/useSession';
import { normalizeErrorMessage } from '../shared/lib/utils';
import { Button, Field, InlineMessage, Input } from '../shared/ui';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useSession();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(form);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(normalizeErrorMessage(submitError, 'Failed to sign in'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-page__hero">
        <div className="login-brand">
          <span>Admin</span>
          <strong>mapa</strong>
        </div>
        <div className="login-page__copy">
          <h1>Admin workspace for the event map.</h1>
          <p>
            Review events, manage user access, monitor content quality, and keep the live catalog in shape.
          </p>
        </div>

        <div className="login-page__meta">
          <div className="login-page__meta-card">
            <ShieldCheck size={18} />
            <div>
              <strong>Protected access</strong>
              <span>Only staff accounts with moderation rights can enter the workspace.</span>
            </div>
          </div>
          <div className="login-page__meta-card">
            <KeyRound size={18} />
            <div>
              <strong>Persistent session</strong>
              <span>Your session is restored automatically when access is still valid.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <header className="login-panel__header">
          <span className="page-eyebrow">Admin access</span>
          <h2>Sign in</h2>
          <p>Use an account with at least the `moderator` role.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <Field label="Email">
            <Input
              autoComplete="email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="admin@my-mapa.by"
              type="email"
              value={form.email}
            />
          </Field>

          <Field label="Password">
            <Input
              autoComplete="current-password"
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="••••••••"
              type="password"
              value={form.password}
            />
          </Field>

          {error ? <InlineMessage title="Sign-in error" tone="danger">{error}</InlineMessage> : null}

          <Button disabled={submitting || !form.email || !form.password} type="submit">
            {submitting ? 'Signing in…' : 'Open admin panel'}
          </Button>
        </form>
      </section>
    </div>
  );
};
