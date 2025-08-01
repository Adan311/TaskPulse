import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/frontend/lib/utils"
import { buttonVariants } from "@/frontend/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0 pointer-events-auto rounded-3xl bg-background shadow-none w-[260px] mx-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center items-center",
        month: "space-y-4 justify-center items-center",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-lg font-semibold text-primary tracking-wide",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100 border-none rounded-full flex items-center justify-center"
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-10 font-medium text-xs tracking-wide text-center",
        row: "flex w-full mt-2",
        cell: "h-10 w-10 text-center text-base p-0 relative focus-within:relative focus-within:z-20 transition-all",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal rounded-full transition-all aria-selected:opacity-100 focus:ring-2 focus:ring-primary flex items-center justify-center mx-auto text-base"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary/15 text-primary font-semibold shadow-sm z-20 hover:bg-primary/25",
        day_today: "bg-accent text-accent-foreground font-bold border border-primary scale-105 z-10",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "bg-[#e7e3fa] text-[#a18aff]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-5 w-5" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

// Define ChevronLeft and ChevronRight SVG components
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
