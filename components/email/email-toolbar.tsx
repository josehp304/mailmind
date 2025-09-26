"use client"
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Archive,
  Trash2,
  Star,
  Zap,
  Tag,
  MoreHorizontal,
  RefreshCw,
  Filter,
  SortAsc,
  CheckSquare
} from 'lucide-react';

interface EmailToolbarProps {
  selectedCount?: number;
  totalCount?: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onRefresh?: () => void;
  onArchiveSelected?: () => void;
  onDeleteSelected?: () => void;
  onStarSelected?: () => void;
  onMarkImportant?: () => void;
  onSort?: (sortBy: string) => void;
  onFilter?: () => void;
  currentSort?: string;
  className?: string;
}

export function EmailToolbar({
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onDeselectAll,
  onRefresh,
  onArchiveSelected,
  onDeleteSelected,
  onStarSelected,
  onMarkImportant,
  onSort,
  onFilter,
  currentSort = 'date',
  className,
}: EmailToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200',
      className
    )}>
      {/* Left side - Selection and actions */}
      <div className="flex items-center space-x-2">
        {/* Select all checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedCount > 0 && selectedCount === totalCount}
            onChange={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        {/* Bulk actions - shown when emails are selected */}
        {hasSelection && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onArchiveSelected}
              className="h-8 px-2"
            >
              <Archive className="w-4 h-4 mr-1" />
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteSelected}
              className="h-8 px-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onStarSelected}
              className="h-8 px-2"
            >
              <Star className="w-4 h-4 mr-1" />
              Star
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkImportant}
              className="h-8 px-2"
            >
              <Zap className="w-4 h-4 mr-1" />
              Important
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <Tag className="w-4 h-4 mr-1" />
              Label
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Right side - View controls */}
      <div className="flex items-center space-x-2">
        {/* Total count */}
        <div className="text-sm text-gray-600">
          {totalCount} {totalCount === 1 ? 'email' : 'emails'}
        </div>

        <div className="h-4 w-px bg-gray-300" />

        {/* Sort */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSort?.(currentSort === 'date' ? 'sender' : 'date')}
          className="h-8 px-2"
        >
          <SortAsc className="w-4 h-4 mr-1" />
          Sort
        </Button>

        {/* Filter */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onFilter}
          className="h-8 px-2"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filter
        </Button>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}