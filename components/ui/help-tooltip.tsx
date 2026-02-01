'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import tooltips from '@/lib/help/tooltips.json';

type TooltipKey = keyof typeof tooltips;

interface HelpTooltipProps {
  tooltipKey: TooltipKey;
  className?: string;
  iconSize?: number;
}

export function HelpTooltip({ tooltipKey, className = '', iconSize = 14 }: HelpTooltipProps) {
  const text = tooltips[tooltipKey];
  
  if (!text) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors p-0.5 ${className}`}
            aria-label="Aide"
          >
            <HelpCircle className={`h-[${iconSize}px] w-[${iconSize}px]`} style={{ width: iconSize, height: iconSize }} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-popover text-popover-foreground border border-border shadow-lg"
        >
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function to get tooltip text programmatically
export function getTooltipText(key: string): string | undefined {
  return (tooltips as Record<string, string>)[key];
}

// Export tooltip keys for type-safe usage
export type { TooltipKey };
