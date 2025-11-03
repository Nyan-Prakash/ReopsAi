/**
 * Saved Views Bar Component
 * SPEC §9.2 - Saved view switcher with CRUD operations
 */

'use client';

import { useState } from 'react';
import { Plus, Star, Edit2, Trash2, X } from 'lucide-react';
import { useInboxStore } from '@/stores/useInboxStore';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function SavedViewsBar() {
  const {
    savedViews,
    activeViewId,
    filters,
    setActiveView,
    createView,
    updateView,
    deleteView,
    setFilters,
  } = useInboxStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [viewName, setViewName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingViewId, setDeletingViewId] = useState<string | null>(null);

  const handleCreateView = () => {
    if (!viewName.trim()) return;

    createView({
      name: viewName.trim(),
      filters,
      columns: ['dept', 'subject', 'student', 'priority', 'sla', 'status', 'assignee', 'updated'],
      isDefault: false,
      userId: 'current-user',
    });
    setIsCreateDialogOpen(false);
    setViewName('');

    // Telemetry
    console.log('[Telemetry] reops.inbox.view_saved', {
      view_name: viewName.trim(),
      filter_count: Object.keys(filters).filter((k) => filters[k as keyof typeof filters] !== 'All').length,
      is_default: false,
    });
  };

  const handleEditView = () => {
    if (!editingViewId || !viewName.trim()) return;

    updateView(editingViewId, { name: viewName.trim(), filters });
    setIsEditDialogOpen(false);
    setEditingViewId(null);
    setViewName('');
  };

  const handleDeleteView = () => {
    if (!deletingViewId) return;

    deleteView(deletingViewId);
    setIsDeleteDialogOpen(false);
    setDeletingViewId(null);

    // Telemetry
    console.log('[Telemetry] reops.inbox.view_deleted', {
      view_id: deletingViewId,
    });
  };

  const handleViewClick = (viewId: string) => {
    setActiveView(viewId);
    const view = savedViews.find((v) => v.id === viewId);
    if (view) {
      setFilters(view.filters);
    }
  };

  const openEditDialog = (viewId: string) => {
    const view = savedViews.find((v) => v.id === viewId);
    if (view) {
      setEditingViewId(viewId);
      setViewName(view.name);
      setIsEditDialogOpen(true);
    }
  };

  const openDeleteDialog = (viewId: string) => {
    setDeletingViewId(viewId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="flex h-12 items-center gap-2 border-b bg-muted/30 px-4 overflow-x-auto">
        {savedViews.map((view) => (
          <div key={view.id} className="group relative flex items-center gap-1">
            <Button
              variant={activeViewId === view.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewClick(view.id)}
              className={cn(
                'h-8 gap-1.5',
                activeViewId === view.id && 'font-semibold'
              )}
            >
              {view.isDefault && (
                <Star className="h-3 w-3 fill-current" />
              )}
              {view.name}
            </Button>

            {/* Action menu - visible on hover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => openEditDialog(view.id)}>
                  <Edit2 className="mr-2 h-3 w-3" />
                  {t('inbox.view.edit', 'en')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateView(view.id, { isDefault: !view.isDefault })}>
                  <Star className="mr-2 h-3 w-3" />
                  {view.isDefault ? t('inbox.view.unsetDefault', 'en') : t('inbox.view.setDefault', 'en')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(view.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  {t('inbox.view.delete', 'en')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {/* Create new view */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
          className="h-8 gap-1.5 text-muted-foreground"
        >
          <Plus className="h-3 w-3" />
          {t('inbox.view.new', 'en')}
        </Button>
      </div>

      {/* Create View Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inbox.view.new', 'en')}</DialogTitle>
            <DialogDescription>
              Save the current filters as a new view for quick access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="view-name">View Name</Label>
              <Input
                id="view-name"
                placeholder="e.g., Today's SLA Reds"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateView()}
              />
            </div>
            <div className="grid gap-2">
              <Label>Current Filters</Label>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                {filters.dept !== 'All' && <Badge variant="secondary">{filters.dept}</Badge>}
                {filters.status !== 'All' && <Badge variant="secondary">{filters.status}</Badge>}
                {filters.priority !== 'All' && <Badge variant="secondary">{filters.priority}</Badge>}
                {filters.slaRisk !== 'All' && <Badge variant="secondary">SLA: {filters.slaRisk}</Badge>}
                {Object.keys(filters).filter((k) => filters[k as keyof typeof filters] !== 'All' && k !== 'page' && k !== 'sort').length === 0 && (
                  <span>No filters applied</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateView} disabled={!viewName.trim()}>
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit View Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inbox.view.edit', 'en')}</DialogTitle>
            <DialogDescription>
              Update the view name and filters.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-view-name">View Name</Label>
              <Input
                id="edit-view-name"
                placeholder="e.g., Today's SLA Reds"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditView()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditView} disabled={!viewName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete View</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this view? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteView}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
