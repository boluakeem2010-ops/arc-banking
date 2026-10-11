type Props = {
  busy: boolean;
  error: string;
  onSignIn: () => void;
  onSignUp: () => void;
  onTryDemo: () => void;
};

export function LandingPage({ busy, error, onSignIn, onSignUp, onTryDemo }: Props) {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="brand landing-brand" href="#" aria-label="Arc home">
          <span className="brand-mark">a</span>
          <span>arc<span className="brand-dot">.</span></span>
        </a>
        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#features">Why Arc</a>
          <button type="button" onClick={onSignIn}>Sign in</button>
          <button className="landing-nav-cta" type="button" onClick={onSignUp}>Get started <span>→</span></button>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-eyebrow"><i></i> A clearer view of your money</span>
          <h1>Make room for the life you’re <em>building.</em></h1>
          <p>Everyday money, thoughtful tools, and a little more confidence in what comes next. All in one simple place.</p>
          {error ? <p className="landing-error" role="alert">{error}</p> : null}
          <div className="landing-actions">
            <button className="landing-primary" type="button" onClick={onSignUp}>Get started <span>→</span></button>
            <button className="landing-secondary" type="button" onClick={onTryDemo} disabled={busy}>
              {busy ? 'Opening demo…' : 'Explore the demo'}
            </button>
          </div>
          <span className="landing-note">A demo experience · No real money moves</span>
        </div>

        <div className="landing-art" aria-label="Preview of the Arc banking dashboard">
          <div className="landing-orbit landing-orbit-one"></div>
          <div className="landing-orbit landing-orbit-two"></div>
          <div className="landing-preview">
            <div className="preview-header">
              <span className="preview-brand"><span className="brand-mark">a</span> arc<span>.</span></span>
              <span className="preview-avatar">JD</span>
            </div>
            <div className="preview-greeting">YOUR MONEY, IN GOOD SHAPE</div>
            <p className="preview-label">Total balance</p>
            <strong className="preview-balance">$20,670<span>.42</span></strong>
            <div className="preview-growth"><span>↗ 4.8%</span> <small>vs. last month</small></div>
            <svg className="preview-chart" viewBox="0 0 420 94" role="img" aria-label="Illustration of a rising balance">
              <defs>
                <linearGradient id="landing-chart-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#bde3ca" stopOpacity=".45" />
                  <stop offset="1" stopColor="#bde3ca" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 72 C32 68 43 76 72 58 S115 65 145 48 S190 56 220 38 S267 46 294 32 S337 39 360 19 S397 24 420 8 V94 H0Z" fill="url(#landing-chart-fill)" />
              <path d="M0 72 C32 68 43 76 72 58 S115 65 145 48 S190 56 220 38 S267 46 294 32 S337 39 360 19 S397 24 420 8" fill="none" stroke="#679b74" strokeWidth="3" />
            </svg>
            <div className="preview-divider"></div>
            <div className="preview-activity">
              <span className="preview-merchant">↙</span>
              <span><b>Payday</b><small>Income · Today</small></span>
              <strong>+$2,620</strong>
            </div>
            <div className="preview-activity">
              <span className="preview-merchant preview-merchant-spend">M</span>
              <span><b>Market Street Café</b><small>Food &amp; drink · Today</small></span>
              <strong>−$18.50</strong>
            </div>
          </div>
          <div className="landing-floating-card">
            <span>✳</span><div><b>A goal within reach</b><small>First home · 61% saved</small></div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-heading">
          <span className="landing-eyebrow">A little more in control</span>
          <h2>Money tools that make sense.</h2>
        </div>
        <div className="landing-feature-grid">
          <article className="landing-feature">
            <span className="feature-symbol feature-symbol-balance">↗</span>
            <h3>See the whole picture</h3>
            <p>Keep balances, income, spending, and upcoming bills together in one clear snapshot.</p>
          </article>
          <article className="landing-feature">
            <span className="feature-symbol feature-symbol-goals">◎</span>
            <h3>Make progress feel possible</h3>
            <p>Set savings goals, track every step, and celebrate the progress you’re already making.</p>
          </article>
          <article className="landing-feature">
            <span className="feature-symbol feature-symbol-activity">⌕</span>
            <h3>Find what you need</h3>
            <p>Search your activity and understand where your money has been going.</p>
          </article>
        </div>
      </section>

      <section className="landing-bottom-cta">
        <div><span className="landing-eyebrow">Your next step starts here</span><h2>A calmer way to handle money.</h2></div>
        <button className="landing-primary" type="button" onClick={onSignUp}>Create your account <span>→</span></button>
      </section>

      <footer className="landing-footer">
        <a className="landing-brand-small" href="#">arc<span>.</span></a>
        <span>Arc is a demo banking experience. No real bank accounts or payments are connected.</span>
        <button type="button" onClick={onSignIn}>Sign in</button>
      </footer>
    </main>
  );
}
