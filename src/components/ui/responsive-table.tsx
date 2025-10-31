import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useOrientation } from "@/hooks/use-orientation"
import { useDeviceFeatures } from "@/hooks/use-device-features"

const ResponsiveTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  const { isLandscape } = useOrientation()
  const { isNative } = useDeviceFeatures()

  return (
    <div className={cn(
      "w-full overflow-x-auto overflow-y-auto",
      isNative && isLandscape && "max-h-[60vh]"
    )}>
      <table
        ref={ref}
        className={cn(
          "min-w-full caption-bottom",
          isMobile ? "text-xs" : "text-sm",
          className
        )}
        {...props}
      />
    </div>
  )
})
ResponsiveTable.displayName = "ResponsiveTable"

const ResponsiveTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
ResponsiveTableHeader.displayName = "ResponsiveTableHeader"

const ResponsiveTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
ResponsiveTableBody.displayName = "ResponsiveTableBody"

const ResponsiveTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
ResponsiveTableRow.displayName = "ResponsiveTableRow"

const ResponsiveTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    hideOnMobile?: boolean
  }
>(({ className, hideOnMobile = false, ...props }, ref) => {
  const isMobile = useIsMobile()
  const { isLandscape } = useOrientation()
  const { isNative } = useDeviceFeatures()

  // Solo ocultar si está explícitamente marcado para ocultar
  if (hideOnMobile && isMobile && !isLandscape) {
    return null
  }

  return (
    <th
      ref={ref}
      className={cn(
        "text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 whitespace-nowrap",
        isMobile ? "h-8 px-2 text-xs" : "h-12 px-4",
        className
      )}
      {...props}
    />
  )
})
ResponsiveTableHead.displayName = "ResponsiveTableHead"

const ResponsiveTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    hideOnMobile?: boolean
  }
>(({ className, hideOnMobile = false, ...props }, ref) => {
  const isMobile = useIsMobile()
  const { isLandscape } = useOrientation()
  const { isNative } = useDeviceFeatures()

  // Solo ocultar si está explícitamente marcado para ocultar
  if (hideOnMobile && isMobile && !isLandscape) {
    return null
  }

  return (
    <td
      ref={ref}
      className={cn(
        "align-middle [&:has([role=checkbox])]:pr-0 whitespace-nowrap",
        isMobile ? "p-2 text-xs" : "p-4",
        className
      )}
      {...props}
    />
  )
})
ResponsiveTableCell.displayName = "ResponsiveTableCell"

export {
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableHead,
  ResponsiveTableCell,
}
