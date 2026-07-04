import * as React from 'react';
import { Comment } from '../types';
import { addComment } from '../services/evidenceClient';

interface CommentThreadProps {
  scanId: string;
  findingId: string;
  userId: string;
  userEmail?: string;
  comments: Comment[];
  onCommentAdded: (newComment: Comment) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  scanId,
  findingId,
  userId,
  userEmail,
  comments,
  onCommentAdded
}) => {
  const [text, setText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await addComment({
        scanId,
        findingId,
        userId,
        userEmail: userEmail || 'user@company.com',
        commentText: text.trim()
      });
      onCommentAdded(newComment);
      setText('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const findingComments = comments.filter(c => c.finding_id === findingId);

  return (
    <div className="mt-4 border-t border-border pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <span>💬</span>
        <span>Team Discussion ({findingComments.length})</span>
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 pl-2">
          {findingComments.length > 0 ? (
            <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
              {findingComments.map((c) => (
                <div key={c.id} className="rounded-lg bg-muted/40 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>{c.user_email || 'Team Member'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{c.comment_text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground">No comments yet. Start a discussion with your team.</p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment or update for the team..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CommentThread;
