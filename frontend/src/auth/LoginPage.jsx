import AuthLayout from './AuthLayout.jsx';

export default function LoginPage({
  onSubmit,
  onNavigate,
  email,
  password,
  onChange,
  error,
  message,
  submitting,
}) {
  return (
    <AuthLayout mode="login" onNavigate={onNavigate}>
      <div className="auth-form-content">
        <h2>Welcome back</h2>
        <p className="auth-form-subtitle">Enter your details to sign in to your account.</p>
        <form className="auth-form auth-page-form" onSubmit={onSubmit}>
          <label>
            Email address
            <span className="auth-input-wrap"><i>✉</i><input name="email" type="email" value={email} onChange={onChange} required autoComplete="email" placeholder="Enter your email" /></span>
          </label>
          <label>
            Password
            <span className="auth-input-wrap"><i>♙</i><input name="password" type="password" value={password} onChange={onChange} required autoComplete="current-password" placeholder="Enter your password" /></span>
          </label>
          <div className="auth-form-options">
            <label className="auth-checkbox"><input type="checkbox" /> Remember me</label>
            <span className="auth-muted-action">Forgot password?</span>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'} <span>→</span>
          </button>
        </form>
        <div className="auth-divider"><span>OR</span></div>
        <button className="auth-google-button" type="button" disabled title="Google sign-in is not configured">
          <b>G</b> Continue with Google
        </button>
        <p className="auth-mobile-switch">New to Stockroom? <button type="button" onClick={() => onNavigate('register')}>Create an account</button></p>
      </div>
    </AuthLayout>
  );
}
