import * as React from 'react'
import TextareaAutosize, {
  TextareaAutosizeProps,
} from 'react-textarea-autosize'

import { cn } from '@/lib/utils'
/* eslint-disable-next-line @typescript-eslint/no-empty-interface */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    focus?:Boolean
  }

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps
>(({ className, ...props }, ref) => {
  return (
    <TextareaAutosize
      className={cn(
        'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }