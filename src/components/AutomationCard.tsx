type Props = {
  dismissed: boolean;
  onMove: () => void;
  onDismiss: () => void;
};

export function AutomationCard({ dismissed, onMove, onDismiss }: Props) {
  return (
    <article className="automation-card">
      <div className="automation-head">
        <span className="automation-spark">✳</span>
        <span className="automation-tag"><i></i> ARC INTELLIGENCE</span>
        <button className="more-button" type="button" aria-label="More suggestion options">···</button>
      </div>
      {dismissed ? (
        <>
          <h2>We’ll check in again soon.</h2>
          <p className="automation-copy">Your budget suggestion is snoozed for now. Your First home goal is still right where you left it.</p>
          <div className="automation-foot">✧ Based on your spending patterns</div>
        </>
      ) : (
        <>
          <h2>Your money has a little<br />room to grow.</h2>
          <p className="automation-copy">You have <b>$415</b> left in this month's budget. Move a little to your First home goal?</p>
          <div className="suggestion"><span>Suggested move</span><b>$100.00</b></div>
          <button className="automation-cta" type="button" onClick={onMove}>Move $100 to First home <span>→</span></button>
          <button className="dismiss-link" type="button" onClick={onDismiss}>Maybe later</button>
          <div className="automation-foot"><span>✧</span> Based on your spending patterns</div>
        </>
      )}
    </article>
  );
}
