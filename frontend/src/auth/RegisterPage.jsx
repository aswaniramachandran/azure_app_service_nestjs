import AuthLayout from './AuthLayout.jsx';

export default function RegisterPage({
  onSubmit,
  onNavigate,
  form,
  onChange,
  error,
  message,
  submitting,
}) {
  return (
    <AuthLayout mode="register" onNavigate={onNavigate}>
      <div className="auth-form-content">
        <h2>Create your account</h2>
        <p className="auth-form-subtitle">Fill in the details below to get started.</p>
        <form className="auth-form auth-page-form" onSubmit={onSubmit}>
          <label>
            Full name
            <span className="auth-input-wrap"><i>♙</i><input name="name" value={form.name} onChange={onChange} required autoComplete="name" placeholder="Your full name" /></span>
          </label>
          <label>
            Email address
            <span className="auth-input-wrap"><i>✉</i><input name="email" type="email" value={form.email} onChange={onChange} required autoComplete="email" placeholder="Enter your email" /></span>
          </label>
          <label>
            Password
            <span className="auth-input-wrap"><i>♙</i><input name="password" type="password" value={form.password} onChange={onChange} required minLength={6} autoComplete="new-password" placeholder="Create a password" /></span>
          </label>
          <label>
            Confirm password
            <span className="auth-input-wrap"><i>♙</i><input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} required minLength={6} autoComplete="new-password" placeholder="Confirm your password" /></span>
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'} <span>→</span>
          </button>
        </form>
        <div className="auth-divider"><span>OR</span></div>
        <button className="auth-google-button" type="button" disabled title="Google sign-in is not configured">
          <b>G</b> Continue with Google
        </button>
        <p className="auth-terms">By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
        <p className="auth-mobile-switch">Already have an account? <button type="button" onClick={() => onNavigate('login')}>Sign in</button></p>
      </div>
    </AuthLayout>
  );
}
