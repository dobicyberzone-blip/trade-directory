/**
 * Responsive Button Component
 * 
 * A fully responsive button that:
 * - Maintains minimum 44px touch targets on mobile
 * - Scales appropriately across breakpoints
 * - Handles loading and disabled states
 * - Prevents overflow and wrapping issues
 * - Uses consistent spacing
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const responsiveButtonVariants = cva(
  // Base styles - mobile-first with minimum touch targets
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Mobile-first sizing with minimum 44px height for touch targets
        default: "h-11 px-4 py-2 text-sm sm:h-10 sm:px-4 sm:py-2",
        sm: "h-11 px-3 text-xs sm:h-9 sm:px-3",
        lg: "h-12 px-6 text-base sm:h-11 sm:px-8 md:text-lg",
        xl: "h-14 px-8 text-lg sm:h-12 sm:px-10 md:text-xl",
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ResponsiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof responsiveButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const ResponsiveButton = React.forwardRef<HTMLButtonElement, ResponsiveButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false, 
    loading = false,
    loadingText,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(responsiveButtonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
ResponsiveButton.displayName = "ResponsiveButton"

export { ResponsiveButton, responsiveButtonVariants }
