/**
 * Bulk Actions Bar
 * SPEC §9.3 - Actions for selected rows
 */

'use client';

import { useState } from 'react';
import { Users, Tag, GitMerge, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

interface Agent {
  id: string;
  name: string;
  currentWorkload: number;
}

interface BulkActionsBarProps {
  selectedCount: number;
  onAssign: (agentId: string) => void;
  onSetStatus: (status: string) => void;
  onSetPriority: (priority: string) => void;
  onAddTag: (tag: string) => void;
  onMerge: () => void;
  isPending?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onAssign,
  onSetStatus,
  onSetPriority,
  onAddTag,
  onMerge,
  isPending = false,
}: BulkActionsBarProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [newTag, setNewTag] = useState('');

  // Mock agents - in real app, fetch from API filtered by department
  const agents: Agent[] = [
    { id: 'agent-001', name: 'Sarah Johnson', currentWorkload: 12 },
    { id: 'agent-002', name: 'David Lee', currentWorkload: 8 },
    { id: 'agent-003', name: 'Emily Chen', currentWorkload: 15 },
  ];

  const handleAssign = () => {
    if (selectedAgent) {
      onAssign(selectedAgent);
      setIsAssignDialogOpen(false);
      setSelectedAgent('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setIsTagDialogOpen(false);
      setNewTag('');
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {t('inbox.bulk.selected', 'en', { count: selectedCount })}
            </Badge>
            {isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAssignDialogOpen(true)}
              disabled={isPending}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              {t('inbox.bulk.assign', 'en')}
            </Button>

            <Select onValueChange={onSetStatus} disabled={isPending}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder={t('inbox.bulk.setStatus', 'en')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={onSetPriority} disabled={isPending}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder={t('inbox.bulk.setPriority', 'en')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTagDialogOpen(true)}
              disabled={isPending}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              {t('inbox.bulk.addTag', 'en')}
            </Button>

            {selectedCount >= 2 && (
              <Button
                size="sm"
                variant="default"
                onClick={onMerge}
                disabled={isPending}
                className="gap-2"
              >
                <GitMerge className="h-4 w-4" />
                {t('inbox.bulk.merge', 'en')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Cases</DialogTitle>
            <DialogDescription>
              Assign {selectedCount} case{selectedCount > 1 ? 's' : ''} to an agent
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="agent-select">Select Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger id="agent-select">
                  <SelectValue placeholder="Choose agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{agent.name}</span>
                        <Badge
                          variant={
                            agent.currentWorkload > 12
                              ? 'destructive'
                              : agent.currentWorkload > 8
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {agent.currentWorkload} cases
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current workload shown for each agent
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedAgent}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
            <DialogDescription>
              Add a tag to {selectedCount} case{selectedCount > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tag-input">Tag Name</Label>
              <Input
                id="tag-input"
                placeholder="e.g., urgent_review"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <p className="text-xs text-muted-foreground">
                Common tags: payment_plan, documents_pending, transcript, financial_hardship
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTag} disabled={!newTag.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
