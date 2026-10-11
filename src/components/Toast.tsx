type Props = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
};

export function Toast({ message, visible, onDismiss }: Props) {
  return (
    <div className={`toast ${visible ? 'show' : ''}`} role="status" aria-live="polite">
      <span className="toast-check">✓</span>
      <span>{message}</span>
      <button type="button" aria-label="Dismiss" onClick={onDismiss}>×</button>
    </div>
  );
}
