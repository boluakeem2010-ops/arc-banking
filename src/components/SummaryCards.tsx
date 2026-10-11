import type { DashboardSummary } from '../types';

type Props = {
  summary: DashboardSummary;
};

export function SummaryCards({ summary }: Props) {
  const { balance, income, spending } = summary;
  const budgetRemaining = Math.max(0, spending.budget - spending.month);
  const spentPercent = Math.min(100, (spending.month / spending.budget) * 100);

  return (
    <section className="summary-grid">
      <article className="balance-card">
        <div className="card-top">
          <span>Total balance</span>
          <button className="more-button" type="button" aria-label="More balance options">···</button>
        </div>
        <div className="total-balance">{formatMoney(balance.total)}</div>
        <div className="balance-note">
          <span className="trend-up">↗ {balance.changePercent}%</span>
          <span>vs. last month</span>
        </div>
        <div className="balance-chart">
          <svg viewBox="0 0 600 74" preserveAspectRatio="none" aria-label="Balance increased over the last month" role="img">
            <defs>
              <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#bde3ca" stopOpacity=".4" />
                <stop offset="1" stopColor="#bde3ca" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="chart-fill" d="M0 55 C30 52 36 59 66 47 S110 48 137 38 S174 53 204 39 S244 45 269 30 S307 40 335 29 S374 35 400 20 S440 33 468 15 S512 26 540 12 S580 18 600 5 V74 H0Z" />
            <path className="chart-line" d="M0 55 C30 52 36 59 66 47 S110 48 137 38 S174 53 204 39 S244 45 269 30 S307 40 335 29 S374 35 400 20 S440 33 468 15 S512 26 540 12 S580 18 600 5" />
          </svg>
          <div className="chart-labels"><span>Sep 12</span><span>Sep 26</span><span>Oct 11</span></div>
        </div>
      </article>

      <article className="stat-card">
        <div className="stat-top"><span>Income this month</span><span className="stat-icon income-icon">↙</span></div>
        <div className="stat-value">{formatMoney(income.month)}</div>
        <div className="stat-foot">
          <span className="mini-bars income-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
          <span>On track for your average</span>
        </div>
        <div className="stat-detail"><span>Last deposit</span><b>+{formatMoney(income.lastDeposit)}</b></div>
      </article>

      <article className="stat-card">
        <div className="stat-top"><span>Spent this month</span><span className="stat-icon spend-icon">↗</span></div>
        <div className="stat-value">{formatMoney(spending.month)}</div>
        <div className="stat-foot">
          <span className="spend-progress"><i style={{ width: `${spentPercent}%` }}></i></span>
          <span>{formatMoney(budgetRemaining, 0)} left in your budget</span>
        </div>
        <div className="stat-detail"><span>Monthly budget</span><b>{formatMoney(spending.budget)}</b></div>
      </article>
    </section>
  );
}

function formatMoney(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
