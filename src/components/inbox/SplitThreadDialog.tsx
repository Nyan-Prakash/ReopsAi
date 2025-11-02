/**
 * Split Thread Dialog
 * SPEC §9.4 - Split messages from a case into a new case
 */

'use client';

import { useState } from 'react';
import { Split, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface SplitThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  ticketNumber: string;
  messageRange: { start: number; end: number };
  onConfirm: (department: string, subject: string) => void;
}

export function SplitThreadDialog({
  open,
  onOpenChange,
  caseId,
  ticketNumber,
  messageRange,
  onConfirm,
}: SplitThreadDialogProps) {
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');

  const handleConfirm = () => {
    if (!department || !subject.trim()) return;
    onConfirm(department, subject);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split to New Case
          </DialogTitle>
          <DialogDescription>
            Create a new case from messages {messageRange.start}-{messageRange.end} of{' '}
            {ticketNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. The selected messages will
              be moved to a new case and linked as "Related Cases".
            </AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <Label htmlFor="split-dept">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger id="split-dept">
                <SelectValue placeholder="Select department for new case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admissions">Admissions</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Registrar">Registrar</SelectItem>
                <SelectItem value="Housing">Housing</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="split-subject">Subject for New Case</Label>
            <Input
              id="split-subject"
              placeholder="Auto-generated from first message"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate from the first message in the range
            </p>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            <h4 className="font-semibold">What will happen:</h4>
            <ul className="mt-2 space-y-1 text-xs">
              <li>
                ✓ Messages {messageRange.start}-{messageRange.end} will move to new case
              </li>
              <li>
                ✓ Original case will show: "Messages {messageRange.start}-{messageRange.end}{' '}
                split to TKT-XXXXX"
              </li>
              <li>✓ New case will show: "Split from {ticketNumber}"</li>
              <li>✓ Both cases will be linked as "Related Cases"</li>
              <li>✓ New case will inherit priority and tags from original</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!department || !subject.trim()}
            className="gap-2"
          >
            <Split className="h-4 w-4" />
            Split to New Case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
