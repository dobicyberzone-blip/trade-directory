/**
 * Responsive Container Component
 * 
 * Provides consistent, responsive padding and max-width across the application
 * Prevents horizontal scroll and ensures proper spacing on all devices
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width of the container
   * @default "7xl" (1280px)
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full"
  
  /**
   * Whether to center the container
   * @default true
   */
  center?: boolean
  
  /**
   * Custom padding (overrides responsive defaults)
   */
  noPadding?: boolean
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "3xl": "max-w-[1920px]",
  "4xl": "max-w-[2048px]",
  "5xl": "max-w-[2560px]",
  "6xl": "max-w-[3072px]",
  "7xl": "max-w-[3840px]",
  full: "max-w-full",
}

export const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ 
    className, 
    maxWidth = "7xl", 
    center = true, 
    noPadding = false,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          maxWidthClasses[maxWidth],
          center && "mx-auto",
          !noPadding && "px-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveContainer.displayName = "ResponsiveContainer"
