import { useEffect, useRef, useState } from 'react';
import {
  ApiError,
  createTransfer,
  getCurrentUser,
  getSummary,
  requestPasswordReset,
  resetDemo,
  resetPassword,
  signIn,
  signOut,
  signUp,
  startDemoSession,
} from './api';
import type { AuthUser } from './api';
import { AuthPage, type AuthMode } from './components/AuthPage';
import { ActivityPanel } from './components/ActivityPanel';
import { AutomationCard } from './components/AutomationCard';
import { GoalsPanel } from './components/GoalsPanel';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { Toast } from './components/Toast';
import { TransferModal } from './components/TransferModal';
import { UpcomingPanel } from './components/UpcomingPanel';
import type { DashboardSummary, TransferInput, View } from './types';

const viewLabels: Record<View, string> = {
  overview: 'Overview',
  activity: 'Activity',
  cards: 'Cards',
  planning: 'Planning',
};

export default function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [activeView, setActiveView] = useState<View>('overview');
  const [pageName, setPageName] = useState('Overview');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Move money with confidence.');
  const [modalDescription, setModalDescription] = useState('Choose an account and amount to create a demo transfer.');
  const [transferAmount, setTransferAmount] = useState('100.00');
  const [transferDestination, setTransferDestination] = useState('First home goal');
  const [isSuggestionDismissed, setIsSuggestionDismissed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const result = await getCurrentUser();
        if (!cancelled) setUser(result.user);
        const data = await getSummary();
        if (!cancelled) {
          setSummary(data);
          setError('');
        }
      } catch (cause) {
        if (!cancelled) {
          if (cause instanceof ApiError && cause.status === 401) {
            setUser(null);
          } else {
            setError(toErrorMessage(cause));
          }
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    void loadDashboard();
    return () => {
      cancelled = true;
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setIsToastVisible(false), 3600);
  };

  const openModal = (
    title = 'Move money with confidence.',
    description = 'Choose an account and amount to create a demo transfer.',
  ) => {
    setModalTitle(title);
    setModalDescription(description);
    setIsModalOpen(true);
  };

  const handleNavigate = (view: View) => {
    setActiveView(view);
    setPageName(viewLabels[view]);
    showToast(`${viewLabels[view]} demo view selected.`);
  };

  const handleShowAllActivity = () => {
    setActiveView('activity');
    setPageName('Activity');
    showToast('You’re viewing your latest activity.');
  };

  const handleTransfer = async (transfer: TransferInput) => {
    setIsSubmittingTransfer(true);
    setError('');
    try {
      const result = await createTransfer(transfer);
      setSummary(result.summary);
      setIsModalOpen(false);
      showToast(`Demo transfer of $${result.transfer.amount.toFixed(2)} queued for ${result.transfer.destination}.`);
    } catch (cause) {
      const message = toErrorMessage(cause);
      setError(message);
      showToast(message);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleReset = async () => {
    setError('');
    try {
      const data = await resetDemo();
      setSummary(data);
      setIsSuggestionDismissed(false);
      showToast('Demo data restored to the sample dashboard.');
    } catch (cause) {
      const message = toErrorMessage(cause);
      setError(message);
      showToast(message);
    }
  };

  const completeSignIn = async (result: { user: AuthUser }) => {
    setIsAuthBusy(true);
    setAuthError('');
    try {
      const data = await getSummary();
      setSummary(data);
      setUser(result.user);
      setError('');
    } catch (cause) {
      setAuthError(toErrorMessage(cause));
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    setIsAuthBusy(true);
    setAuthError('');
    try {
      await completeSignIn(await signIn(email, password));
    } catch (cause) {
      setAuthError(toErrorMessage(cause));
      setIsAuthBusy(false);
    }
  };

  const handleSignUp = async (name: string, email: string, password: string) => {
    setIsAuthBusy(true);
    setAuthError('');
    try {
      await completeSignIn(await signUp(name, email, password));
    } catch (cause) {
      setAuthError(toErrorMessage(cause));
      setIsAuthBusy(false);
    }
  };

  const handleTryDemo = async () => {
    setIsAuthBusy(true);
    setAuthError('');
    setAuthNotice('');
    try {
      await completeSignIn(await startDemoSession());
    } catch (cause) {
      setAuthError(toErrorMessage(cause));
      setIsAuthBusy(false);
    }
  };

  const openAuthPage = (mode: AuthMode) => {
    setAuthMode(mode);
    setShowAuthPage(true);
    setAuthError('');
    setAuthNotice('');
  };

  const handleForgotPassword = async (email: string) => {
    setIsAuthBusy(true);
    setAuthError('');
    setAuthNotice('');
    try {
      const result = await requestPasswordReset(email);
      setResetToken(result.resetToken);
      setAuthMode('reset');
      setAuthNotice(`${result.message} ${result.resetToken}`);
    } catch (cause) {
      setAuthError(toErrorMessage(cause));
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleResetPassword = async (email: string, token: string, password: string) => {
    setIsAuthBusy(true);
    setAuthError('');
    try {
      await resetPassword(email, token, password);
      setResetToken('');
      setAuthMode('signin');
      setAuthNotice('Password reset. Sign in with your new password.');
    } catch (cause) {
      setAuthError(toErrorMessage(cause));
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    try {
      await signOut();
      setUser(null);
      setSummary(null);
      setAuthMode('signin');
      setShowAuthPage(false);
      setAuthNotice('You have signed out.');
      setAuthError('');
    } catch (cause) {
      setError(toErrorMessage(cause));
    }
  };

  if (!authChecked) {
    return <main className="app-status" role="status"><p>Checking your Arc session…</p></main>;
  }

  if (!user) {
    if (!showAuthPage) {
      return (
        <LandingPage
          busy={isAuthBusy}
          error={error}
          onSignIn={() => openAuthPage('signin')}
          onSignUp={() => openAuthPage('signup')}
          onTryDemo={() => void handleTryDemo()}
        />
      );
    }

    return (
      <AuthPage
        mode={authMode}
        busy={isAuthBusy}
        error={authError || error}
        notice={authNotice}
        resetToken={resetToken}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setAuthError('');
          setAuthNotice('');
        }}
        onHome={() => {
          setShowAuthPage(false);
          setAuthError('');
          setAuthNotice('');
        }}
        onSignIn={(email, password) => void handleSignIn(email, password)}
        onSignUp={(name, email, password) => void handleSignUp(name, email, password)}
        onTryDemo={() => void handleTryDemo()}
        onForgotPassword={(email) => void handleForgotPassword(email)}
        onResetPassword={(email, token, password) => void handleResetPassword(email, token, password)}
      />
    );
  }

  if (!summary) {
    return (
      <main className="app-status" role={error ? 'alert' : 'status'}>
        {error ? (
          <>
            <h1>Couldn’t load Arc demo data</h1>
            <p>{error}</p>
            <p>Start the development app with <code>npm run dev</code>, or the production app with <code>npm start</code>.</p>
          </>
        ) : <p>Loading your Arc dashboard…</p>}
      </main>
    );
  }

  const greetingName = getGreetingName(user.name);

  return (
    <>
      <div className="app-shell">
        <Sidebar
          activeView={activeView}
          accounts={summary.accounts}
          userName={user.name}
          userEmail={user.email}
          onNavigate={handleNavigate}
          onSupport={() => showToast('Arc support is ready to help (demo).')}
          onSignOut={() => void handleSignOut()}
        />
        <main className="main-content">
          <header className="topbar">
            <div className="breadcrumb">My workspace <span>/</span> <b>{pageName}</b></div>
            <div className="top-actions">
              <button className="icon-button" aria-label="Search transactions" type="button" onClick={() => handleNavigate('activity')}>⌕</button>
              <button className="icon-button notification" aria-label="Notifications" type="button">♧<i></i></button>
              <span className="top-divider"></span>
              <span className="today">Tuesday, October 11</span>
            </div>
          </header>

          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-dot"></span>YOUR MONEY, IN GOOD SHAPE</div>
              <h1>Good morning{greetingName ? `, ${greetingName}` : ''}<span className="wave">✳</span></h1>
              <p className="welcome-sub">Here's your financial snapshot for today.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => openModal()}>
              <span>＋</span> New transfer
            </button>
          </section>

          {error ? <p className="app-error" role="alert">{error}</p> : null}
          {activeView === 'activity' ? (
            <section className="activity-page">
              <ActivityPanel transactions={summary.transactions} onShowAll={handleShowAllActivity} expanded />
            </section>
          ) : (
            <>
              <SummaryCards summary={summary} />

              <section className="content-grid">
                <div className="left-column">
                  <ActivityPanel transactions={summary.transactions} onShowAll={handleShowAllActivity} />
                  <GoalsPanel goals={summary.goals} onNewGoal={() => openModal(
                    'What are you saving for?',
                    'This demo opens the transfer form as a placeholder.',
                  )} />
                </div>
                <div className="right-column">
                  <AutomationCard
                    dismissed={isSuggestionDismissed}
                    onMove={() => {
                      setTransferAmount('100.00');
                      setTransferDestination('First home goal');
                      openModal('A small step toward home.', 'Review your suggested $100 move to your First home goal.');
                    }}
                    onDismiss={() => setIsSuggestionDismissed(true)}
                  />
                  <UpcomingPanel bills={summary.upcomingBills} />
                  <article className="insight-strip">
                    <span className="insight-icon">↗</span>
                    <div><b>Nice work{greetingName ? `, ${greetingName}` : ''}.</b><p>You spent 12% less on dining this week.</p></div>
                    <button type="button" onClick={() => showToast('Dining spend is down $24.80 compared with last week.')}>→</button>
                  </article>
                </div>
              </section>
            </>
          )}

          <footer className="footer">
            <span>© 2026 Arc Financial, Inc.</span>
            <span>Member FDIC · Equal Housing Lender</span>
            <button className="reset-demo-button" type="button" onClick={() => void handleReset()}>Reset demo</button>
            <a href="#">Privacy &amp; security</a>
          </footer>
        </main>
      </div>

      <Toast message={toastMessage} visible={isToastVisible} onDismiss={() => setIsToastVisible(false)} />
      <TransferModal
        open={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        amount={transferAmount}
        destination={transferDestination}
        submitting={isSubmittingTransfer}
        onAmountChange={setTransferAmount}
        onDestinationChange={setTransferDestination}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(transfer) => void handleTransfer(transfer)}
      />
      {isSubmittingTransfer ? <div className="visually-hidden" role="status">Submitting demo transfer</div> : null}
    </>
  );
}

function toErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'An unexpected error occurred.';
}

function getGreetingName(name: string): string {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.includes('@')) return '';
  return trimmedName.split(/\s+/)[0];
}
