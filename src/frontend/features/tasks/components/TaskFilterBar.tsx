import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { Calendar } from "@/frontend/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/frontend/components/ui/popover";
import { CalendarIcon, Filter, Search, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Switch } from '@/frontend/components/ui/switch';

interface TaskFilterBarProps {
  onFilterChange: (filters: TaskFilters) => void;
}

export interface TaskFilters {
  status: string[];
  priority: string[];
  searchQuery: string;
  dateRange: {
    start: Date | undefined;
    end: Date | undefined;
  };
  showArchived: boolean;
}

export function TaskFilterBar({ onFilterChange }: TaskFilterBarProps) {
  const [filters, setFilters] = useState<TaskFilters>({
    status: [],
    priority: [],
    searchQuery: "",
    dateRange: {
      start: undefined,
      end: undefined,
    },
    showArchived: false,
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleFilterChange = (
    key: keyof TaskFilters,
    value: any
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange("searchQuery", e.target.value);
  };

  const handleStatusChange = (value: string) => {
    handleFilterChange("status", value === "all" ? [] : [value]);
  };

  const handlePriorityChange = (value: string) => {
    handleFilterChange("priority", value === "all" ? [] : [value]);
  };

  const handleDateRangeChange = (date: Date | undefined) => {
    if (!filters.dateRange.start) {
      handleFilterChange("dateRange", { start: date, end: undefined });
    } else if (!filters.dateRange.end && date) {
      if (date < filters.dateRange.start) {
        handleFilterChange("dateRange", { start: date, end: filters.dateRange.start });
      } else {
        handleFilterChange("dateRange", { start: filters.dateRange.start, end: date });
      }
      setIsCalendarOpen(false);
    } else {
      handleFilterChange("dateRange", { start: date, end: undefined });
    }
  };

  const clearFilters = () => {
    const defaultFilters = {
      status: [],
      priority: [],
      searchQuery: "",
      dateRange: {
        start: undefined,
        end: undefined,
      },
      showArchived: false,
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.searchQuery !== "" ||
      filters.dateRange.start !== undefined ||
      filters.dateRange.end !== undefined ||
      filters.showArchived
    );
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-2 bg-background rounded-lg border">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
      </div>

      <Select
        value={filters.status[0] || "all"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority[0] || "all"}
        onValueChange={handlePriorityChange}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-[180px] justify-start text-left font-normal ${
              !filters.dateRange.start && !filters.dateRange.end
                ? "text-muted-foreground"
                : ""
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange.start ? (
              filters.dateRange.end ? (
                <>
                  {format(filters.dateRange.start, "LLL dd, y")} -{" "}
                  {format(filters.dateRange.end, "LLL dd, y")}
                </>
              ) : (
                format(filters.dateRange.start, "LLL dd, y")
              )
            ) : (
              "Pick date range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateRange.end || filters.dateRange.start}
            onSelect={handleDateRangeChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2">
        <Switch
          checked={filters.showArchived}
          onCheckedChange={(checked) => handleFilterChange('showArchived', checked)}
          id="show-archived-switch"
        />
        <label htmlFor="show-archived-switch" className="text-sm">Show Archived</label>
      </div>

      {hasActiveFilters() && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilters}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 