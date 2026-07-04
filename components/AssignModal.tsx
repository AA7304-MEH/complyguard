import * as React from 'react';
import { assignFinding } from '../services/evidenceClient';

interface AssignModalProps {
  scanId: string;
  findingId: string;
  userId: string;
  currentAssignee?: string;
  onClose: () => void;
  onAssigned: (email: string) => void;
}

const AssignModal: React.FC<AssignModalProps> = ({
  scanId,
  findingId,
  userId,
  currentAssignee,
  onClose,
  onAssigned
}) => {
  const [email, setEmail] = React.useState(currentAssignee || '');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError("Please enter a valid team member email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignFinding({
        scanId,
        findingId,
        userId,
        assignedToEmail: email.trim()
      });
      onAssigned(email.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to assign finding.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl border border-border p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h3 className="text-lg font-bold text-foreground">Assign Finding</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Assign this compliance gap to a CISO, compliance officer, or IT manager on your enterprise team.
          </p>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Team Member Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., ciso@company.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
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
              disabled={isSubmitting || !email.trim()}
              className="rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-accent/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Finding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignModal;
