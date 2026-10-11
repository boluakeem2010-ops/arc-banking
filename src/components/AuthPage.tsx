import { useEffect, useState, type FormEvent } from 'react';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

type Props = {
  mode: AuthMode;
  busy: boolean;
  error: string;
  notice: string;
  resetToken: string;
  onModeChange: (mode: AuthMode) => void;
  onHome: () => void;
  onSignIn: (email: string, password: string) => void;
  onSignUp: (name: string, email: string, password: string) => void;
  onTryDemo: () => void;
  onForgotPassword: (email: string) => void;
  onResetPassword: (email: string, token: string, password: string) => void;
};

export function AuthPage({
  mode,
  busy,
  error,
  notice,
  resetToken,
  onModeChange,
  onHome,
  onSignIn,
  onSignUp,
  onTryDemo,
  onForgotPassword,
  onResetPassword,
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (resetToken) setToken(resetToken);
  }, [resetToken]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'signup') onSignUp(name, email, password);
    if (mode === 'signin') onSignIn(email, password);
    if (mode === 'forgot') onForgotPassword(email);
    if (mode === 'reset') onResetPassword(email, token, password);
  };

  const heading = {
    signin: 'Welcome back.',
    signup: 'Create your account.',
    forgot: 'Forgot your password?',
    reset: 'Choose a new password.',
  }[mode];
  const subtitle = {
    signin: 'Sign in to see your Arc demo dashboard.',
    signup: 'Set up a private demo account to continue.',
    forgot: 'Enter your email and we’ll prepare a demo reset link.',
    reset: 'Set a new password for your demo account.',
  }[mode];

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <a className="brand auth-brand" href="#">
          <span className="brand-mark">a</span>
          <span>arc<span className="brand-dot">.</span></span>
        </a>
        <span className="auth-kicker">PRIVATE BANKING, MADE SIMPLE</span>
        <h1 id="auth-title">{heading}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {error ? <p className="auth-message auth-error" role="alert">{error}</p> : null}
        {notice ? <p className="auth-message auth-notice" role="status">{notice}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <>
              <label htmlFor="auth-name">Full name</label>
              <input id="auth-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
            </>
          ) : null}

          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
          />

          {mode === 'reset' ? (
            <>
              <label htmlFor="auth-token">Demo reset token</label>
              <input id="auth-token" autoComplete="one-time-code" value={token} onChange={(event) => setToken(event.target.value)} required />
            </>
          ) : null}

          {mode === 'signin' || mode === 'signup' || mode === 'reset' ? (
            <>
              <label htmlFor="auth-password">{mode === 'reset' ? 'New password' : 'Password'}</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={10}
                maxLength={128}
              />
              {mode !== 'signin' ? <small className="auth-hint">Use at least 10 characters.</small> : null}
            </>
          ) : null}

          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : {
              signin: 'Sign in',
              signup: 'Create demo account',
              forgot: 'Get demo reset link',
              reset: 'Reset password',
            }[mode]}
            {!busy ? <span>→</span> : null}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'signin' ? (
            <>
              <button type="button" onClick={() => onModeChange('forgot')}>Forgot password?</button>
              <p>New to Arc? <button type="button" onClick={() => onModeChange('signup')}>Create account</button></p>
              <button className="auth-demo-button" type="button" onClick={onTryDemo} disabled={busy}>
                {busy ? 'Please wait…' : 'Explore the demo account'}
              </button>
            </>
          ) : mode === 'signup' ? (
            <p>Already have an account? <button type="button" onClick={() => onModeChange('signin')}>Sign in</button></p>
          ) : (
            <p><button type="button" onClick={() => onModeChange('signin')}>Back to sign in</button></p>
          )}
          <button className="auth-home-link" type="button" onClick={onHome}>Back to home</button>
        </div>
        <p className="auth-demo-note">Demo only · No real bank or credit bureau is contacted.</p>
      </section>
    </main>
  );
}
