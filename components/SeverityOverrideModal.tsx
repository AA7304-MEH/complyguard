import * as React from 'react';
import { overrideSeverity } from '../services/evidenceClient';
import { SeverityOverride } from '../types';

interface SeverityOverrideModalProps {
  scanId: string;
  findingId: string;
  userId: string;
  userEmail?: string;
  currentSeverity: string;
  onClose: () => void;
  onOverride: (override: SeverityOverride) => void;
}

const SeverityOverrideModal: React.FC<SeverityOverrideModalProps> = ({
  scanId,
  findingId,
  userId,
  userEmail,
  currentSeverity,
  onClose,
  onOverride
}) => {
  const [newSeverity, setNewSeverity] = React.useState('High');
  const [justification, setJustification] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || justification.trim().length < 15) {
      setError("Please provide written justification for downgrading or modifying this finding severity (at least 15 characters).");
      return;
    }

    if (newSeverity.toLowerCase() === currentSeverity.toLowerCase()) {
      setError("New severity must be different from current severity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const override = await overrideSeverity({
        scanId,
        findingId,
        userId,
        userEmail,
        oldSeverity: currentSeverity,
        newSeverity,
        justification
      });
      onOverride(override);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to override severity.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h3 className="text-lg font-bold text-foreground">Override Finding Severity</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            In enterprise environments, compliance officers can downgrade or adjust a finding severity if compensating controls exist. This action is permanently logged in the audit trail.
          </p>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Current Severity
              </label>
              <div className="rounded-lg border border-border bg-muted/40 p-2 text-sm font-semibold text-foreground">
                {currentSeverity}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                New Severity *
              </label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Written Justification *
            </label>
            <textarea
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g., We accept this as HIGH because we have compensating controls X, Y, Z..."
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
              className="rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-accent/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Adjusting...' : 'Confirm Severity Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeverityOverrideModal;
