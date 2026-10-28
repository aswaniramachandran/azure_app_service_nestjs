export default function AuthLayout({
  mode,
  children,
  onNavigate,
}) {
  const registering = mode === 'register';

  return (
    <main className={`auth-page ${registering ? 'auth-register-page' : 'auth-login-page'}`}>
      <section className="auth-hero">
        <a className="auth-brand" href="#">
          <span className="brand-mark"><span /><span /><span /></span>
          <span>stockroom</span>
        </a>

        <div className="auth-hero-content">
          <p className="auth-kicker">{registering ? 'GET STARTED' : 'WELCOME BACK'}</p>
          <h1>
            {registering ? <>Create your<br /><em>account</em></> : <>Sign in to your<br /><em>workspace</em></>}
          </h1>
          <p className="auth-hero-description">
            {registering
              ? 'Join Stockroom and take control of your inventory, orders and business growth.'
              : 'Manage your products, orders, customers and grow your business — all in one place.'}
          </p>
          <div className="auth-benefits">
            {(registering
              ? [['✦', 'Easy Setup', 'Get started in just a few minutes.'], ['♙', 'Manage Everything', 'Products, orders, customers & more.'], ['♥', 'Built for Growth', 'Scale your business with confidence.']]
              : [['▥', 'Track Sales & Revenue', 'Get real-time insights into your business.'], ['◇', 'Manage Inventory', 'Keep your stock always in check.'], ['⬡', 'Secure & Reliable', 'Your data is safe with us.']]
            ).map(([icon, title, description]) => (
              <div className="auth-benefit" key={title}>
                <span>{icon}</span>
                <div><strong>{title}</strong><small>{description}</small></div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-illustration" aria-hidden="true">
          <div className="auth-laptop">
            <div className="auth-screen">
              <div className="auth-screen-brand"><i /> stockroom</div>
              <div className="auth-screen-title">Sales overview</div>
              <div className="auth-screen-total">$18,642 <small>↑ 12.5%</small></div>
              <div className="auth-screen-chart"><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="auth-screen-bars"><i /><i /><i /><i /><i /></div>
            </div>
            <div className="auth-laptop-base" />
          </div>
          <div className="auth-phone"><div>▥</div><span>Orders</span><b>243</b></div>
          <div className="auth-box">▣</div>
          <div className="auth-headphones">◖ 🎧 ◗</div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-switch">
          {registering ? 'Already have an account?' : 'New to Stockroom?'}
          <button type="button" onClick={() => onNavigate(registering ? 'login' : 'register')}>
            {registering ? 'Sign in' : 'Create an account'} <span>→</span>
          </button>
        </div>
        {children}
      </section>
    </main>
  );
}
