import { XCircle, CheckCircle2 } from 'lucide-react'
import { type ReactNode } from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type TraceStatus = 'success' | 'error' | 'degraded' | 'skipped' | 'pending'

interface TraceStepProps {
  id: string
  icon: ReactNode
  title: string
  status: TraceStatus
  successText?: string
  errorText?: string
  tooltipText: string
  details?: Record<string, string | number | undefined | null>
}

export function TraceStep({ 
  id, 
  icon, 
  title, 
  status, 
  successText, 
  errorText, 
  tooltipText, 
  details 
}: TraceStepProps) {
  const isError = status === 'error'
  const isSuccess = status === 'success'
  const isDegraded = status === 'degraded'
  const isSkipped = status === 'skipped'

  if (status === 'pending') return null

  let borderStatusColor = 'border-l-muted'
  let iconBgColor = 'bg-muted text-muted-foreground'

  if (isError) {
    borderStatusColor = 'border-l-red-500'
    iconBgColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  } else if (isDegraded) {
    borderStatusColor = 'border-l-yellow-500'
    iconBgColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  } else if (isSuccess) {
    borderStatusColor = 'border-l-green-500'
    iconBgColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  }

  return (
    <AccordionItem 
      value={id} 
      className={`border border-border/40 rounded-lg shadow-sm bg-card border-l-4 ${borderStatusColor} overflow-hidden`}
    >
      <AccordionTrigger className="px-3 py-2.5 hover:no-underline [&[data-state=open]>svg]:text-foreground text-muted-foreground/50">
        <div className="flex flex-row items-center justify-start gap-3 flex-1 w-full min-w-0 pr-2 text-left">
          <div className={`shrink-0 rounded-md h-6 w-6 flex items-center justify-center ${iconBgColor}`}>
            {isError ? <XCircle className="w-3.5 h-3.5" /> : (isSuccess || isDegraded) ? <CheckCircle2 className="w-3.5 h-3.5" /> : icon}
          </div>

          <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-semibold text-xs leading-none text-foreground shrink-0 cursor-help w-fit">{title}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>

            <div className="flex-1 flex justify-end text-right overflow-hidden">
              {(isSuccess || isDegraded) && <span className="text-[11px] font-mono text-muted-foreground truncate">{successText}</span>}
              {isSkipped && <span className="text-[11px] font-medium text-muted-foreground">Skipped</span>}
              {(isError || isDegraded) && (
                <span className={`text-[11px] font-medium truncate w-full ml-2 ${isError ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {errorText}
                </span>
              )}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-3 pt-2 text-sm text-muted-foreground border-t border-border/40 bg-muted/10">
        <div className="space-y-1.5 pt-1">
          {details && Object.entries(details).map(([key, value]) => (
            value !== undefined && value !== null && (
              <div key={key} className="flex justify-between items-center py-0.5">
                <span className="font-medium text-[11px] text-foreground/70 uppercase tracking-wider">{key}</span>
                <span className="font-mono text-xs">{value}</span>
              </div>
            )
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}