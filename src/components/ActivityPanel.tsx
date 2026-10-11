import { useMemo, useState } from 'react';
import type { Transaction } from '../types';

type Props = {
  transactions: Transaction[];
  onShowAll: () => void;
  expanded?: boolean;
};

export function ActivityPanel({ transactions, onShowAll, expanded = false }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const visibleTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesQuery = !normalizedQuery
        || `${transaction.name} ${transaction.meta} ${transaction.status}`.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === 'all'
        || (filter === 'incoming' && transaction.amount > 0)
        || (filter === 'outgoing' && transaction.amount < 0 && transaction.status !== 'Queued')
        || (filter === 'queued' && transaction.status === 'Queued');
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, transactions]);

  return (
    <article className={`panel activity-panel ${expanded ? 'activity-expanded' : ''}`}>
      <div className="panel-heading">
        <div>
          <h2>{expanded ? 'Transaction history' : 'Recent activity'}</h2>
          <p>{expanded ? `${visibleTransactions.length} of ${transactions.length} transactions` : 'Your money has been busy.'}</p>
        </div>
        {!expanded ? <button className="text-button" type="button" onClick={onShowAll}>View all <span>↗</span></button> : null}
      </div>
      {expanded ? (
        <div className="activity-toolbar">
          <label className="activity-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions"
              aria-label="Search transactions"
              autoFocus
            />
          </label>
          <label className="activity-filter">
            <span className="visually-hidden">Filter transactions</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All activity</option>
              <option value="incoming">Money in</option>
              <option value="outgoing">Money out</option>
              <option value="queued">Pending</option>
            </select>
          </label>
        </div>
      ) : null}
      <div className="activity-list">
        {visibleTransactions.map((transaction) => {
          const isIncoming = transaction.amount >= 0;
          const amount = `${isIncoming ? '+' : '−'}${formatMoney(Math.abs(transaction.amount))}`;

          return (
            <div className="transaction" key={transaction.id}>
              <span className={`merchant-icon ${transaction.iconClass}`}>{transaction.icon}</span>
              <span className="transaction-name"><b>{transaction.name}</b><small>{transaction.meta}</small></span>
              <span className={`transaction-status ${transaction.status === 'Incoming' ? 'incoming' : 'settled'}`}>{transaction.status}</span>
              <span className={`transaction-amount ${isIncoming ? 'positive' : 'negative'}`}>{amount}</span>
            </div>
          );
        })}
        {visibleTransactions.length === 0 ? (
          <p className="activity-empty" role="status">No transactions match your search.</p>
        ) : null}
      </div>
      {!expanded ? <button type="button" className="mobile-view-all" onClick={onShowAll}>See all activity →</button> : null}
    </article>
  );
}

function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
