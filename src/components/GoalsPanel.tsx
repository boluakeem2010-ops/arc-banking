import type { Goal } from '../types';

type Props = {
  goals: Goal[];
  onNewGoal: () => void;
};

export function GoalsPanel({ goals, onNewGoal }: Props) {
  return (
    <article className="panel goals-panel">
      <div className="panel-heading">
        <div><h2>Your goals</h2><p>Small steps, meaningful progress.</p></div>
        <button className="text-button" type="button" onClick={onNewGoal}>＋ New goal</button>
      </div>
      <div className="goal-list">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
          return (
            <div className="goal-row" key={goal.name}>
              <span className={`goal-icon ${goal.iconClass}`}>{goal.icon}</span>
              <span className="goal-info">
                <b>{goal.name}</b>
                <small>{formatMoney(goal.current, 0)} <em>of {formatMoney(goal.target, 0)}</em></small>
              </span>
              <span className="goal-eta">{progress}%</span>
              <div className={`goal-track ${goal.trackClass}`}><i style={{ width: `${progress}%` }}></i></div>
            </div>
          );
        })}
      </div>
    </article>
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
