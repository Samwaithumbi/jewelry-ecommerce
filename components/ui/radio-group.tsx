"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  children,
  value,
  onValueChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (value: string) => void }) {
  return (
    <div
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            checked: value === (child.props as any).value,
            onChange: () => {
              onValueChange?.((child.props as any).value)
            },
          } as any)
        }
        return child
      })}
    </div>
  )
}

function RadioGroupItem({
  className,
  id,
  value,
  checked,
  onChange,
  name,
  ...props
}: React.ComponentProps<"input"> & { value: string }) {
  return (
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      data-slot="radio-group-item"
      className={cn(
        "aspect-square size-4 rounded-full border border-primary text-primary shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 accent-primary aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { RadioGroup, RadioGroupItem }
