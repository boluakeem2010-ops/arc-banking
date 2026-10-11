import type { Bill } from '../types';

type Props = {
  bills: Bill[];
};

export function UpcomingPanel({ bills }: Props) {
  const total = bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <article className="panel upcoming-panel">
      <div className="panel-heading">
        <div><h2>Coming up</h2><p>Keep the surprises small.</p></div>
        <button className="more-button" type="button" aria-label="More upcoming bills options">···</button>
      </div>
      {bills.map((bill) => (
        <div className="upcoming-item" key={bill.name}>
          <span className={`bill-icon ${bill.iconClass}`}>{bill.icon}</span>
          <span className="bill-name"><b>{bill.name}</b><small>{bill.meta}</small></span>
          <span className="bill-amount">{formatMoney(bill.amount)}</span>
        </div>
      ))}
      <div className="upcoming-total"><span>Next 7 days</span><b>{formatMoney(total)}</b></div>
    </article>
  );
}

function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
