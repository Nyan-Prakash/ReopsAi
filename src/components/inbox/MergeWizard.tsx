/**
 * Merge Cases Wizard
 * SPEC §9.4 - 3-step wizard for merging duplicate cases
 */

'use client';

import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import type { InboxCase } from '@/lib/inbox-schemas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface MergeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: InboxCase[];
  onConfirm: (primaryCaseId: string) => void;
}

export function MergeWizard({ open, onOpenChange, cases, onConfirm }: MergeWizardProps) {
  const [step, setStep] = useState(1);
  const [primaryCaseId, setPrimaryCaseId] = useState<string>('');
  const [timelinePreview, setTimelinePreview] = useState<TimelineEvent[]>([]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setPrimaryCaseId(cases[0]?.id || '');
    }
  }, [open, cases]);

  // Generate timeline preview when primary case is selected
  useEffect(() => {
    if (step === 2 && primaryCaseId) {
      generateTimelinePreview();
    }
  }, [step, primaryCaseId]);

  const generateTimelinePreview = () => {
    // Mock timeline generation - in real app, fetch from API
    const events: TimelineEvent[] = [];

    cases.forEach((c) => {
      events.push({
        id: `${c.id}-created`,
        type: 'created',
        caseId: c.id,
        ticketNumber: c.ticketNumber,
        timestamp: c.createdAt,
        description: `Case created by ${c.studentName}`,
      });

      // Mock some messages
      if (c.id === primaryCaseId) {
        events.push({
          id: `${c.id}-msg-1`,
          type: 'message',
          caseId: c.id,
          ticketNumber: c.ticketNumber,
          timestamp: new Date(new Date(c.createdAt).getTime() + 60000).toISOString(),
          description: `Student: ${c.subject}`,
        });
      } else {
        events.push({
          id: `${c.id}-msg-1`,
          type: 'message',
          caseId: c.id,
          ticketNumber: c.ticketNumber,
          timestamp: new Date(new Date(c.createdAt).getTime() + 120000).toISOString(),
          description: `[From ${c.ticketNumber}] Student: ${c.subject}`,
        });
      }
    });

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setTimelinePreview(events);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirm = () => {
    onConfirm(primaryCaseId);
    onOpenChange(false);
  };

  const primaryCase = cases.find((c) => c.id === primaryCaseId);
  const childCases = cases.filter((c) => c.id !== primaryCaseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Merge Cases ({cases.length})</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 && 'Select primary case'}
            {step === 2 && 'Preview consolidated timeline'}
            {step === 3 && 'Confirm merge'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2',
                  step >= s
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/20 text-muted-foreground'
                )}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    step > s ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="max-h-[400px]">
          {/* Step 1: Select primary case */}
          {step === 1 && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The primary case will retain its ID, ticket number, and creation date.
                  Other cases will be marked as "Merged" and their timelines will be
                  consolidated into the primary case.
                </AlertDescription>
              </Alert>

              <RadioGroup value={primaryCaseId} onValueChange={setPrimaryCaseId}>
                {cases.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4',
                      primaryCaseId === c.id && 'border-primary bg-primary/5'
                    )}
                  >
                    <RadioGroupItem value={c.id} id={c.id} className="mt-1" />
                    <Label htmlFor={c.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{c.ticketNumber}</Badge>
                        <Badge>{c.department}</Badge>
                        {c.priority === 'Urgent' && <Badge variant="destructive">Urgent</Badge>}
                        {c.priority === 'High' && <Badge variant="destructive">High</Badge>}
                      </div>
                      <p className="mt-1 font-medium">{c.subject}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{c.studentName}</span>
                        <span>Created {new Date(c.createdAt).toLocaleDateString()}</span>
                        <span>Status: {c.status}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Preview timeline */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="font-semibold">Primary Case</h4>
                <p className="text-sm text-muted-foreground">
                  {primaryCase?.ticketNumber} - {primaryCase?.subject}
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Consolidated Timeline</h4>
                <div className="relative space-y-3 pl-6">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

                  {timelinePreview.map((event) => (
                    <div key={event.id} className="relative">
                      <div
                        className={cn(
                          'absolute -left-6 top-1 h-2 w-2 rounded-full border-2 border-background',
                          event.caseId === primaryCaseId ? 'bg-primary' : 'bg-muted-foreground'
                        )}
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          {event.caseId !== primaryCaseId && (
                            <Badge variant="outline" className="text-xs">
                              From {event.ticketNumber}
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-0.5">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Summary:</strong> {childCases.length} case(s) will be merged into{' '}
                  {primaryCase?.ticketNumber}. All tags will be combined. SLA will be
                  recalculated from the primary case creation date.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This action cannot be automatically undone after 30
                  seconds. You will have 30 seconds to undo this merge via the toast
                  notification.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold">Merge Summary</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>
                    <strong>Primary Case:</strong> {primaryCase?.ticketNumber} -{' '}
                    {primaryCase?.subject}
                  </li>
                  <li>
                    <strong>Merging:</strong> {childCases.length} case(s)
                  </li>
                  <li>
                    <strong>Child Cases:</strong>{' '}
                    {childCases.map((c) => c.ticketNumber).join(', ')}
                  </li>
                  <li>
                    <strong>Timeline Events:</strong> {timelinePreview.length} events will be
                    consolidated
                  </li>
                  <li>
                    <strong>Tags:</strong> All unique tags will be combined
                  </li>
                  <li>
                    <strong>Status:</strong> Child cases will be marked as "Merged"
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-muted/30 p-4">
                <h4 className="text-sm font-semibold">After Merge:</h4>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>✓ All messages and events will appear in chronological order</li>
                  <li>✓ Child case timelines will show "[From TKT-XXXXX]" headers</li>
                  <li>✓ SLA will be recalculated from primary case creation</li>
                  <li>✓ Assignee from primary case will be preserved</li>
                  <li>✓ Audit event "case.merged" will be logged</li>
                </ul>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} disabled={!primaryCaseId}>
              Next
            </Button>
          ) : (
            <Button onClick={handleConfirm} variant="default">
              <Check className="mr-2 h-4 w-4" />
              Confirm Merge
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TimelineEvent {
  id: string;
  type: 'created' | 'message' | 'status_change' | 'assignment';
  caseId: string;
  ticketNumber: string;
  timestamp: string;
  description: string;
}
