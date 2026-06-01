"use client"

import * as React from "react"
import { Checkbox as RadixCheckbox } from "radix-ui"

// React 19 + Radix UI consolidated: Checkbox sub-components lack className/children in typings.
const CheckboxPrimitive = RadixCheckbox as any

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

type CheckboxProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean | "indeterminate"
  defaultChecked?: boolean
  required?: boolean
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  asChild?: boolean
}

function Checkbox({
  className,
  ...props
}: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
