'use client';

import { useState } from 'react';
import { isDraftAIEnabled } from '@/shared/runtime_config';

interface CaseComposerProps {
  caseId: string;
  onSend: (message: string) => void;
}

export function CaseComposer({ caseId, onSend }: CaseComposerProps) {
  const [message, setMessage] = useState('');
  const aiEnabled = isDraftAIEnabled();

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const handleAIDraft = () => {
    // AI draft functionality (§17)
    // This would call POST /api/ai/draft
  };

  const handleMacro = (macroText: string) => {
    setMessage(macroText);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Reply</h3>
        <div className="flex gap-2">
          {aiEnabled && (
            <button
              onClick={handleAIDraft}
              data-testid="ai-draft-button"
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
              aria-label="Generate AI draft"
            >
              AI Draft
            </button>
          )}
          <button
            onClick={() => handleMacro('Thank you for contacting us.')}
            data-testid="macro-button"
            className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
            aria-label="Insert macro"
          >
            Macros
          </button>
        </div>
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your reply..."
        className="min-h-[120px] w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Message input"
      />
      <div className="flex justify-end">
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
}