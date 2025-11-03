/**
 * Inbox Store (Zustand)
 * SPEC §9.7 - State management for inbox, filters, selection, bulk actions
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Department = 'All' | 'Admissions' | 'Finance' | 'Registrar' | 'Housing' | 'IT';
export type Status = 'All' | 'New' | 'Open' | 'Waiting' | 'Resolved' | 'Closed';
export type Priority = 'All' | 'Low' | 'Normal' | 'High' | 'Urgent';
export type SLARisk = 'All' | 'green' | 'yellow' | 'red';
export type Channel = 'All' | 'Chat' | 'Email' | 'Phone' | 'Form' | 'Walk-in';
export type DateRange = '7d' | '30d' | '90d' | 'all';
export type SortOption = 'sla_asc' | 'updated_desc' | 'priority_desc';
export type Density = 'compact' | 'comfortable' | 'spacious';

export interface InboxFilters {
  dept: Department;
  status: Status;
  priority: Priority;
  slaRisk: SLARisk;
  channel: Channel;
  tags: string[];
  owner: 'All' | 'me' | 'unassigned' | string; // user ID
  dateRange: DateRange;
  page: number;
  sort: SortOption;
  search: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: InboxFilters;
  columns: string[];
  isDefault: boolean;
  userId: string;
  createdAt: string;
}

export interface BulkAction {
  type: 'assign' | 'status' | 'priority' | 'tag' | 'merge' | 'split';
  caseIds: string[];
  performedAt: string;
  primaryCaseId?: string; // For merge operations
}

interface InboxState {
  // Filters
  filters: InboxFilters;
  setFilters: (filters: Partial<InboxFilters>) => void;
  resetFilters: () => void;

  // Selection
  selectedRows: Set<string>; // case IDs
  highlightedRow: string | null;
  toggleRowSelection: (caseId: string) => void;
  selectRange: (fromId: string, toId: string, allIds: string[]) => void;
  selectAll: (caseIds: string[]) => void;
  deselectAll: () => void;
  setHighlightedRow: (caseId: string | null) => void;

  // Bulk actions
  bulkActionPending: boolean;
  setBulkActionPending: (pending: boolean) => void;
  lastAction: BulkAction | null;
  setLastAction: (action: BulkAction | null) => void;

  // Saved views
  savedViews: SavedView[];
  activeViewId: string | null;
  createView: (view: Omit<SavedView, 'id' | 'createdAt'>) => void;
  updateView: (id: string, updates: Partial<SavedView>) => void;
  deleteView: (id: string) => void;
  setActiveView: (id: string | null) => void;
  setDefaultView: (id: string) => void;

  // UI preferences
  density: Density;
  setDensity: (density: Density) => void;
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;
}

const defaultFilters: InboxFilters = {
  dept: 'All',
  status: 'Open',
  priority: 'All',
  slaRisk: 'All',
  channel: 'All',
  tags: [],
  owner: 'All',
  dateRange: '7d',
  page: 1,
  sort: 'sla_asc',
  search: '',
};

const defaultColumns = [
  'select',
  'dept',
  'subject',
  'student',
  'priority',
  'sla',
  'status',
  'assignee',
  'updated',
  'actions',
];

export const useInboxStore = create<InboxState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial filters
        filters: defaultFilters,

        setFilters: (newFilters) =>
          set(
            (state) => ({
              filters: { ...state.filters, ...newFilters, page: 1 }, // Reset to page 1 on filter change
            }),
            false,
            'setFilters'
          ),

        resetFilters: () =>
          set(
            {
              filters: defaultFilters,
            },
            false,
            'resetFilters'
          ),

        // Selection state
        selectedRows: new Set<string>(),
        highlightedRow: null,

        toggleRowSelection: (caseId) =>
          set(
            (state) => {
              const newSelected = new Set(state.selectedRows);
              if (newSelected.has(caseId)) {
                newSelected.delete(caseId);
              } else {
                newSelected.add(caseId);
              }
              return { selectedRows: newSelected };
            },
            false,
            'toggleRowSelection'
          ),

        selectRange: (fromId, toId, allIds) =>
          set(
            (state) => {
              const fromIndex = allIds.indexOf(fromId);
              const toIndex = allIds.indexOf(toId);
              if (fromIndex === -1 || toIndex === -1) return state;

              const start = Math.min(fromIndex, toIndex);
              const end = Math.max(fromIndex, toIndex);
              const rangeIds = allIds.slice(start, end + 1);

              const newSelected = new Set(state.selectedRows);
              rangeIds.forEach((id) => newSelected.add(id));

              return { selectedRows: newSelected };
            },
            false,
            'selectRange'
          ),

        selectAll: (caseIds) =>
          set(
            {
              selectedRows: new Set(caseIds),
            },
            false,
            'selectAll'
          ),

        deselectAll: () =>
          set(
            {
              selectedRows: new Set<string>(),
            },
            false,
            'deselectAll'
          ),

        setHighlightedRow: (caseId) =>
          set(
            {
              highlightedRow: caseId,
            },
            false,
            'setHighlightedRow'
          ),

        // Bulk action state
        bulkActionPending: false,
        setBulkActionPending: (pending) =>
          set(
            {
              bulkActionPending: pending,
            },
            false,
            'setBulkActionPending'
          ),

        lastAction: null,
        setLastAction: (action) =>
          set(
            {
              lastAction: action,
            },
            false,
            'setLastAction'
          ),

        // Saved views
        savedViews: [],
        activeViewId: null,

        createView: (view) =>
          set(
            (state) => {
              const newView: SavedView = {
                ...view,
                id: `view-${Date.now()}`,
                createdAt: new Date().toISOString(),
              };
              return {
                savedViews: [...state.savedViews, newView],
                activeViewId: newView.id,
              };
            },
            false,
            'createView'
          ),

        updateView: (id, updates) =>
          set(
            (state) => ({
              savedViews: state.savedViews.map((view) => (view.id === id ? { ...view, ...updates } : view)),
            }),
            false,
            'updateView'
          ),

        deleteView: (id) =>
          set(
            (state) => ({
              savedViews: state.savedViews.filter((view) => view.id !== id),
              activeViewId: state.activeViewId === id ? null : state.activeViewId,
            }),
            false,
            'deleteView'
          ),

        setActiveView: (id) =>
          set(
            (state) => {
              const view = state.savedViews.find((v) => v.id === id);
              return {
                activeViewId: id,
                filters: view ? view.filters : state.filters,
                visibleColumns: view ? view.columns : state.visibleColumns,
              };
            },
            false,
            'setActiveView'
          ),

        setDefaultView: (id) =>
          set(
            (state) => ({
              savedViews: state.savedViews.map((view) => ({
                ...view,
                isDefault: view.id === id,
              })),
            }),
            false,
            'setDefaultView'
          ),

        // UI preferences
        density: 'comfortable',
        setDensity: (density) =>
          set(
            {
              density,
            },
            false,
            'setDensity'
          ),

        visibleColumns: defaultColumns,
        setVisibleColumns: (columns) =>
          set(
            {
              visibleColumns: columns,
            },
            false,
            'setVisibleColumns'
          ),

        columnOrder: defaultColumns,
        setColumnOrder: (order) =>
          set(
            {
              columnOrder: order,
            },
            false,
            'setColumnOrder'
          ),
      }),
      {
        name: 'inbox-store',
        partialize: (state) => ({
          density: state.density,
          visibleColumns: state.visibleColumns,
          columnOrder: state.columnOrder,
          savedViews: state.savedViews,
        }),
      }
    )
  )
);
