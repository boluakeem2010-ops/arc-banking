import { useEffect, useRef, type FormEvent } from 'react';
import type { TransferInput } from '../types';

type Props = {
  open: boolean;
  title: string;
  description: string;
  amount: string;
  destination: string;
  submitting: boolean;
  onAmountChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (transfer: TransferInput) => void;
};

export function TransferModal({
  open,
  title,
  description,
  amount,
  destination,
  submitting,
  onAmountChange,
  onDestinationChange,
  onClose,
  onSubmit,
}: Props) {
  const amountInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) amountInput.current?.focus();
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ amount: Number(amount), destination });
  };

  return (
    <div
      className="modal-backdrop"
      hidden={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <span className="modal-kicker">ARC BANKING</span>
        <h2 id="modalTitle">{title}</h2>
        <p id="modalDesc">{description}</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="transferAmount">Amount</label>
          <div className="amount-input">
            <span>$</span>
            <input
              id="transferAmount"
              ref={amountInput}
              type="number"
              min="1"
              max="8420"
              step="0.01"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              required
            />
          </div>
          <label htmlFor="transferDestination">To</label>
          <select id="transferDestination" value={destination} onChange={(event) => onDestinationChange(event.target.value)}>
            <option>Rainy day savings</option>
            <option>First home goal</option>
            <option>Japan trip goal</option>
          </select>
          <button className="primary-button modal-submit" type="submit" disabled={submitting}>
            {submitting ? 'Queueing transfer…' : 'Review transfer'} <span>→</span>
          </button>
        </form>
        <div className="modal-note">Demo mode · No real money will move</div>
      </section>
    </div>
  );
}
