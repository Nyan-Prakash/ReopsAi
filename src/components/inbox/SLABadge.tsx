/**
 * SLA Badge Component
 * SPEC §9.5 - SLA countdown with risk colors
 */

import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SLABadgeProps {
  sla: {
    firstResponseDueAt: string;
    resolutionDueAt: string;
    riskLevel: 'green' | 'yellow' | 'red';
    breached: boolean;
    percentElapsed: number;
  };
  policy?: string;
}

function formatCountdown(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) {
    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
    const mins = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
    return `OVERDUE ${hours}h ${mins}m`;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 24) {
    return `${hours}h ${mins}m`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function SLABadge({ sla, policy = 'Standard' }: SLABadgeProps) {
  const countdown = formatCountdown(sla.resolutionDueAt);
  const isOverdue = countdown.startsWith('OVERDUE');

  const badgeClass = cn(
    'font-mono text-xs',
    sla.riskLevel === 'green' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    sla.riskLevel === 'yellow' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 animate-pulse',
    sla.riskLevel === 'red' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse'
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={badgeClass}>
            <Clock className="mr-1 h-3 w-3" />
            {countdown}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p>First Response Due: {new Date(sla.firstResponseDueAt).toLocaleString()}</p>
            <p>Resolution Due: {new Date(sla.resolutionDueAt).toLocaleString()}</p>
            <p>Policy: {policy}</p>
            <p>Risk: {sla.riskLevel.toUpperCase()} ({sla.percentElapsed}% elapsed)</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
