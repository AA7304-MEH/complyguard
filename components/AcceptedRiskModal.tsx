import * as React from 'react';
import { acceptRisk } from '../services/evidenceClient';

interface AcceptedRiskModalProps {
  scanId: string;
  findingId: string;
  userId: string;
  userEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AcceptedRiskModal: React.FC<AcceptedRiskModalProps> = ({
  scanId,
  findingId,
  userId,
  userEmail,
  onClose,
  onSuccess
}) => {
  const [justification, setJustification] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || justification.trim().length < 15) {
      setError("Please provide a comprehensive business justification (at least 15 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptRisk({
        scanId,
        findingId,
        userId,
        userEmail,
        justification
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to mark as accepted risk.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h3 className="text-lg font-bold text-foreground">Mark as Accepted Risk</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            In enterprise compliance, certain gaps may be formally accepted by management if compensating controls exist or remediation cost exceeds risk. This will be logged in the immutable audit trail.
          </p>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Business Justification / Compensating Controls *
            </label>
            <textarea
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g., We accept this medium risk because our internal firewall and strict VPN access controls mitigate potential external exposure..."
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !justification.trim()}
              className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Logging Risk...' : 'Confirm Accepted Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptedRiskModal;
