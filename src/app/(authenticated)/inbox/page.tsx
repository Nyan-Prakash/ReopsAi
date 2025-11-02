/**
 * Inbox Page - Agent Case Queue
 * SPEC §9 - Complete inbox with filters, bulk actions, merge/split, keyboard nav, virtualization
 */

'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, RefreshCw, HelpCircle, X as XIcon, Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInboxStore } from '@/stores/useInboxStore';
import type { InboxCase } from '@/lib/inbox-schemas';
import { SavedViewsBar } from '@/components/inbox/SavedViewsBar';
import { BulkActionsBar } from '@/components/inbox/BulkActionsBar';
import { MergeWizard } from '@/components/inbox/MergeWizard';
import { SLABadge } from '@/components/inbox/SLABadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    filters,
    setFilters,
    resetFilters,
    selectedRows,
    toggleRowSelection,
    selectAll,
    deselectAll,
    highlightedRow,
    setHighlightedRow,
    bulkActionPending,
    setBulkActionPending,
    setLastAction,
    density,
  } = useInboxStore();

  const [cases, setCases] = useState<InboxCase[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, perPage: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMergeWizardOpen, setIsMergeWizardOpen] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [slaTimerTick, setSlaTimerTick] = useState(0);

  const debouncedSearch = useDebounce(filters.search, 250);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Row height based on density
  const rowHeight = density === 'compact' ? 32 : density === 'comfortable' ? 40 : 48;

  // Virtualization (only when >200 rows)
  const rowVirtualizer = useVirtualizer({
    count: cases.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
    enabled: cases.length > 200,
  });

  // SLA countdown timer - updates every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaTimerTick((prev) => prev + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(timer);
  }, []);

  // Sync filters with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.dept !== 'All') params.set('dept', filters.dept);
    if (filters.status !== 'Open') params.set('status', filters.status);
    if (filters.priority !== 'All') params.set('priority', filters.priority);
    if (filters.slaRisk !== 'All') params.set('slaRisk', filters.slaRisk);
    if (filters.owner !== 'All') params.set('owner', filters.owner);
    if (filters.page > 1) params.set('page', String(filters.page));
    if (filters.search) params.set('search', filters.search);

    router.replace(`/inbox?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  // Fetch cases
  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        dept: filters.dept,
        status: filters.status,
        priority: filters.priority,
        slaRisk: filters.slaRisk,
        channel: filters.channel,
        owner: filters.owner,
        page: String(filters.page),
        limit: '50',
        sort: filters.sort,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/inbox?${params}`);
      if (!res.ok) throw new Error('Failed to fetch cases');

      const data = await res.json();
      setCases(data.data);
      setMeta(data.meta);

      // Telemetry
      if (debouncedSearch) {
        console.log('[Telemetry] reops.inbox.filter_applied', {
          filter_type: 'search',
          filter_value: debouncedSearch,
          result_count: data.meta.total,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if input/textarea focused
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        isKeyboardHelpOpen ||
        isMergeWizardOpen
      ) {
        return;
      }

      const currentIndex = cases.findIndex((c) => c.id === highlightedRow);

      switch (e.key.toLowerCase()) {
        case 'j':
          // Next row
          e.preventDefault();
          if (currentIndex < cases.length - 1) {
            setHighlightedRow(cases[currentIndex + 1].id);
          }
          console.log('[Telemetry] reops.inbox.keyboard_shortcut_used', {
            shortcut: 'j',
            context: 'table',
          });
          break;

        case 'k':
          // Previous row
          e.preventDefault();
          if (currentIndex > 0) {
            setHighlightedRow(cases[currentIndex - 1].id);
          } else if (currentIndex === -1 && cases.length > 0) {
            setHighlightedRow(cases[0].id);
          }
          console.log('[Telemetry] reops.inbox.keyboard_shortcut_used', {
            shortcut: 'k',
            context: 'table',
          });
          break;

        case 'g':
          // Go to top (G+G) or Open case (single G)
          if (e.shiftKey) {
            // Shift+G - Go to bottom
            e.preventDefault();
            if (cases.length > 0) {
              setHighlightedRow(cases[cases.length - 1].id);
            }
          } else {
            e.preventDefault();
            if (highlightedRow) {
              // Open case
              router.push(`/cases/${highlightedRow}`);
            } else if (cases.length > 0) {
              // Go to top
              setHighlightedRow(cases[0].id);
            }
          }
          break;

        case 'x':
          // Toggle selection
          e.preventDefault();
          if (highlightedRow) {
            toggleRowSelection(highlightedRow);
          }
          console.log('[Telemetry] reops.inbox.keyboard_shortcut_used', {
            shortcut: 'x',
            context: 'table',
          });
          break;

        case 'escape':
          // Deselect all
          e.preventDefault();
          deselectAll();
          break;

        case 'a':
          // Assign (requires selection)
          if (e.ctrlKey || e.metaKey) return; // Allow browser Ctrl+A
          e.preventDefault();
          if (selectedRows.size > 0) {
            // Open assign dialog (handled by BulkActionsBar)
          }
          break;

        case 'e':
          // Escalate (set priority to Urgent)
          e.preventDefault();
          if (selectedRows.size > 0) {
            handleBulkPriority('Urgent');
          }
          break;

        case 'r':
          // Refresh
          e.preventDefault();
          fetchCases();
          console.log('[Telemetry] reops.inbox.keyboard_shortcut_used', {
            shortcut: 'r',
            context: 'table',
          });
          break;

        case '/':
          // Focus search
          e.preventDefault();
          searchInputRef.current?.focus();
          break;

        case '?':
          // Show keyboard help
          e.preventDefault();
          setIsKeyboardHelpOpen(true);
          break;

        case 'enter':
          // Open case
          if (highlightedRow) {
            e.preventDefault();
            router.push(`/cases/${highlightedRow}`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cases,
    highlightedRow,
    selectedRows,
    isKeyboardHelpOpen,
    isMergeWizardOpen,
    router,
    setHighlightedRow,
    toggleRowSelection,
    deselectAll,
    fetchCases,
  ]);

  // Bulk actions
  const handleBulkAssign = async (agentId: string) => {
    setBulkActionPending(true);
    try {
      const caseIds = Array.from(selectedRows);
      const res = await fetch('/api/cases/bulk/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds, agentId }),
      });

      if (!res.ok) throw new Error('Failed to assign cases');

      // Optimistic update
      setCases((prev) =>
        prev.map((c) =>
          caseIds.includes(c.id)
            ? {
                ...c,
                assignee: { id: agentId, name: 'Agent', avatarUrl: '' },
              }
            : c
        )
      );

      toast.success(`${caseIds.length} cases assigned`);
      deselectAll();

      console.log('[Telemetry] reops.inbox.bulk_assign', {
        case_count: caseIds.length,
        assignee_id: agentId,
        from_status: [...new Set(cases.filter((c) => caseIds.includes(c.id)).map((c) => c.status))],
      });
    } catch (err) {
      toast.error('Failed to assign cases. Please try again.');
    } finally {
      setBulkActionPending(false);
    }
  };

  const handleBulkStatus = async (status: string) => {
    setBulkActionPending(true);
    try {
      const caseIds = Array.from(selectedRows);
      const previousStatuses = cases
        .filter((c) => caseIds.includes(c.id))
        .map((c) => c.status);

      const res = await fetch('/api/cases/bulk/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds, status }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Optimistic update
      setCases((prev) =>
        prev.map((c) => (caseIds.includes(c.id) ? { ...c, status: status as any } : c))
      );

      toast.success(`${caseIds.length} cases updated to ${status}`);
      deselectAll();

      console.log('[Telemetry] reops.inbox.bulk_status_change', {
        case_count: caseIds.length,
        new_status: status,
        previous_statuses: previousStatuses,
      });
    } catch (err) {
      toast.error('Failed to update status. Please try again.');
    } finally {
      setBulkActionPending(false);
    }
  };

  const handleBulkPriority = async (priority: string) => {
    setBulkActionPending(true);
    try {
      const caseIds = Array.from(selectedRows);
      const res = await fetch('/api/cases/bulk/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds, priority }),
      });

      if (!res.ok) throw new Error('Failed to update priority');

      // Optimistic update
      setCases((prev) =>
        prev.map((c) => (caseIds.includes(c.id) ? { ...c, priority: priority as any } : c))
      );

      toast.success(`${caseIds.length} cases updated to ${priority}`);
      deselectAll();

      console.log('[Telemetry] reops.inbox.bulk_priority_change', {
        case_count: caseIds.length,
        priority,
      });
    } catch (err) {
      toast.error('Failed to update priority. Please try again.');
    } finally {
      setBulkActionPending(false);
    }
  };

  const handleBulkTag = async (tag: string) => {
    setBulkActionPending(true);
    try {
      const caseIds = Array.from(selectedRows);
      const res = await fetch('/api/cases/bulk/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds, tag }),
      });

      if (!res.ok) throw new Error('Failed to add tag');

      // Optimistic update
      setCases((prev) =>
        prev.map((c) =>
          caseIds.includes(c.id) ? { ...c, tags: [...(c.tags || []), tag] } : c
        )
      );

      toast.success(`Tag "${tag}" added to ${caseIds.length} cases`);
      deselectAll();

      console.log('[Telemetry] reops.inbox.bulk_tag', {
        case_count: caseIds.length,
        tag,
      });
    } catch (err) {
      toast.error('Failed to add tag. Please try again.');
    } finally {
      setBulkActionPending(false);
    }
  };

  const handleMerge = () => {
    if (selectedRows.size < 2) {
      toast.error('Select at least 2 cases to merge');
      return;
    }
    setIsMergeWizardOpen(true);
  };

  const handleMergeConfirm = async (primaryCaseId: string) => {
    setBulkActionPending(true);
    try {
      const caseIds = Array.from(selectedRows);
      const mergeCaseIds = caseIds.filter((id) => id !== primaryCaseId);

      const res = await fetch('/api/cases/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryCaseId, mergeCaseIds }),
      });

      if (!res.ok) throw new Error('Failed to merge cases');

      const result = await res.json();

      // Remove merged cases from view
      setCases((prev) => prev.filter((c) => !mergeCaseIds.includes(c.id)));
      deselectAll();

      // Store for undo
      setLastAction({
        type: 'merge',
        caseIds: mergeCaseIds,
        primaryCaseId,
        performedAt: new Date().toISOString()
      });

      // Show undo toast
      toast.success(
        <div className="flex items-center justify-between gap-4">
          <span>{mergeCaseIds.length} cases merged into {result.ticketNumber}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUndoMerge(result.mergeId)}
          >
            Undo
          </Button>
        </div>,
        { duration: 30000 }
      );

      console.log('[Telemetry] reops.inbox.merge_success', {
        primary_case_id: primaryCaseId,
        merged_case_ids: mergeCaseIds,
        merged_count: mergeCaseIds.length,
      });
    } catch (err) {
      toast.error('Failed to merge cases. Please try again.');
    } finally {
      setBulkActionPending(false);
    }
  };

  const handleUndoMerge = async (mergeId: string) => {
    try {
      const res = await fetch('/api/cases/merge/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mergeId }),
      });

      if (!res.ok) throw new Error('Failed to undo merge');

      toast.success('Merge undone successfully');
      fetchCases(); // Refresh to show restored cases

      console.log('[Telemetry] reops.inbox.merge_undo', {
        merge_id: mergeId,
      });
    } catch (err) {
      toast.error('Failed to undo merge. Please try again.');
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === cases.length) {
      deselectAll();
    } else {
      selectAll(cases.map((c) => c.id));
    }
  };

  const selectedCases = cases.filter((c) => selectedRows.has(c.id));

  // Render virtual rows
  const virtualItems = cases.length > 200 ? rowVirtualizer.getVirtualItems() : null;
  const paddingTop = virtualItems ? virtualItems[0]?.start ?? 0 : 0;
  const paddingBottom = virtualItems
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
    : 0;

  return (
    <div className="flex h-screen flex-col">
      {/* Saved Views Bar */}
      <SavedViewsBar />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder={t('inbox.search.placeholder', 'en')}
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9"
            aria-label="Search cases"
          />
        </div>

        <Select value={filters.dept} onValueChange={(value) => setFilters({ dept: value as any })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('inbox.filter.department', 'en')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Depts</SelectItem>
            <SelectItem value="Admissions">Admissions</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Registrar">Registrar</SelectItem>
            <SelectItem value="Housing">Housing</SelectItem>
            <SelectItem value="IT">IT</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(value) => setFilters({ status: value as any })}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t('inbox.filter.status', 'en')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Waiting">Waiting</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(value) => setFilters({ priority: value as any })}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t('inbox.filter.priority', 'en')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Priority</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.slaRisk} onValueChange={(value) => setFilters({ slaRisk: value as any })}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t('inbox.filter.sla', 'en')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All SLA</SelectItem>
            <SelectItem value="green">Green</SelectItem>
            <SelectItem value="yellow">Yellow</SelectItem>
            <SelectItem value="red">Red</SelectItem>
          </SelectContent>
        </Select>

        {Object.values(filters).some((v) => v !== 'All' && v !== 'Open' && v !== '' && v !== 1) && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <XIcon className="mr-2 h-4 w-4" />
            {t('inbox.filter.clear', 'en')}
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={fetchCases} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setIsKeyboardHelpOpen(true)}>
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto">
        {loading && cases.length === 0 ? (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>SLA Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="text-6xl">⚠️</div>
            <h3 className="text-lg font-semibold">{t('inbox.error.title', 'en')}</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchCases}>{t('inbox.error.retry', 'en')}</Button>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="text-6xl">🔍</div>
            <h3 className="text-lg font-semibold">{t('inbox.empty.title', 'en')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('inbox.empty.description', 'en')}
            </p>
            <Button variant="outline" onClick={resetFilters}>
              {t('inbox.empty.clearFilters', 'en')}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={cases.length > 0 && selectedRows.size === cases.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all cases"
                  />
                </TableHead>
                <TableHead className="w-16">Dept</TableHead>
                <TableHead className="min-w-[300px]">Subject</TableHead>
                <TableHead className="w-32">Student</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-28">SLA Due</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Assignee</TableHead>
                <TableHead className="w-24">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {virtualItems && paddingTop > 0 && (
                <tr>
                  <td style={{ height: paddingTop }} />
                </tr>
              )}
              {(virtualItems
                ? virtualItems.map((virtualItem) => cases[virtualItem.index])
                : cases
              ).map((c) => (
                <TableRow
                  key={c.id}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    highlightedRow === c.id && 'bg-accent',
                    selectedRows.has(c.id) && 'bg-muted'
                  )}
                  style={
                    virtualItems
                      ? {
                          height: rowHeight,
                        }
                      : undefined
                  }
                  onClick={() => setHighlightedRow(c.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows.has(c.id)}
                      onCheckedChange={() => toggleRowSelection(c.id)}
                      aria-label={`Select case ${c.ticketNumber}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.department.slice(0, 3).toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate" title={c.subject}>
                      {c.subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="truncate" title={c.studentEmail}>
                      {c.studentName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.priority === 'Urgent' || c.priority === 'High'
                          ? 'destructive'
                          : c.priority === 'Normal'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {c.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <SLABadge sla={c.sla} policy="Standard" key={`${c.id}-${slaTimerTick}`} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'Resolved' || c.status === 'Closed'
                          ? 'secondary'
                          : c.status === 'Waiting'
                          ? 'outline'
                          : 'default'
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.assignee ? (
                      <div className="truncate">{c.assignee.name}</div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatRelativeTime(c.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
              {virtualItems && paddingBottom > 0 && (
                <tr>
                  <td style={{ height: paddingBottom }} />
                </tr>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && cases.length > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-sm text-muted-foreground">
            {t('inbox.pagination.showing', 'en', {
              start: (meta.page - 1) * meta.perPage + 1,
              end: Math.min(meta.page * meta.perPage, meta.total),
              total: meta.total,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ page: meta.page - 1 })}
              disabled={meta.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {meta.page} of {meta.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ page: meta.page + 1 })}
              disabled={meta.page === meta.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedRows.size}
        onAssign={handleBulkAssign}
        onSetStatus={handleBulkStatus}
        onSetPriority={handleBulkPriority}
        onAddTag={handleBulkTag}
        onMerge={handleMerge}
        isPending={bulkActionPending}
      />

      {/* Merge Wizard */}
      <MergeWizard
        open={isMergeWizardOpen}
        onOpenChange={setIsMergeWizardOpen}
        cases={selectedCases}
        onConfirm={handleMergeConfirm}
      />

      {/* Keyboard Help Dialog */}
      <Dialog open={isKeyboardHelpOpen} onOpenChange={setIsKeyboardHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('inbox.keyboard.help', 'en')}</DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate and perform actions quickly
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <h4 className="mb-2 font-semibold">Navigation</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Next row</span>
                  <Badge variant="outline">J</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Previous row</span>
                  <Badge variant="outline">K</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Go to top</span>
                  <Badge variant="outline">G G</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Go to bottom</span>
                  <Badge variant="outline">Shift G</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Open case</span>
                  <Badge variant="outline">Enter</Badge> or <Badge variant="outline">G</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Selection</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Toggle selection</span>
                  <Badge variant="outline">X</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deselect all</span>
                  <Badge variant="outline">Esc</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Actions (requires selection)</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Escalate (set to Urgent)</span>
                  <Badge variant="outline">E</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Other</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Focus search</span>
                  <Badge variant="outline">/</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Refresh table</span>
                  <Badge variant="outline">R</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Show this help</span>
                  <Badge variant="outline">?</Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
