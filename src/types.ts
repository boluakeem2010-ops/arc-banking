export type View = 'overview' | 'activity' | 'cards' | 'planning';

export type Account = {
  name: string;
  lastFour: string;
  balance: number;
  kind: 'checking' | 'savings';
};

export type Transaction = {
  id: string;
  name: string;
  meta: string;
  amount: number;
  status: 'Settled' | 'Incoming' | 'Queued';
  icon: string;
  iconClass: string;
};

export type Goal = {
  name: string;
  current: number;
  target: number;
  icon: string;
  iconClass: string;
  trackClass: string;
};

export type Bill = {
  name: string;
  meta: string;
  amount: number;
  icon: string;
  iconClass: string;
};

export type DashboardSummary = {
  balance: {
    total: number;
    changePercent: number;
  };
  income: {
    month: number;
    lastDeposit: number;
  };
  spending: {
    month: number;
    budget: number;
  };
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  upcomingBills: Bill[];
};

export type TransferInput = {
  amount: number;
  destination: string;
};

export type TransferResult = {
  transfer: {
    id: string;
    amount: number;
    destination: string;
    status: 'Queued';
    createdAt: string;
  };
  summary: DashboardSummary;
};
