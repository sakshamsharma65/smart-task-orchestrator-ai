import React from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  parse,
  format,
} from "date-fns";

const presets = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "custom", label: "Custom" },
];

type DateRange = { from: Date | null; to: Date | null };

type DateRangePresetSelectorProps = {
  dateRange: DateRange;
  preset: string;
  onChange: (range: DateRange, preset: string) => void;
};

// computeRange unchanged except using date-fns startOfDay/endOfDay already imported
function computeRange(key: string): DateRange {
  const now = new Date();

  switch (key) {
      case "today": {
      // From: Start of Today
      const from = startOfDay(now);
      // To: Start of TOMORROW (Covers all of today)
      const to = startOfDay(addDays(now, 1)); 
      return { from, to };
    }
    case "yesterday": {
      const yd = subDays(now, 1);
      // From: Start of Yesterday
      const from = startOfDay(yd);
      // To: Start of TODAY (Covers all of yesterday)
      const to = startOfDay(now); 
      return { from, to };
    }
    case "this_week": {
      // From: Start of Monday
      const from = startOfDay(startOfWeek(now, { weekStartsOn: 1 }));
      // To: End of Sunday (23:59:59)
      const to = endOfWeek(now, { weekStartsOn: 1 });
      return { from, to };
    }
    case "last_week": {
      const prevW = subWeeks(now, 1);
      const from = startOfDay(startOfWeek(prevW, { weekStartsOn: 1 }));
      // To: End of last Sunday (23:59:59)
      const to = endOfWeek(prevW, { weekStartsOn: 1 });
      return { from, to };
    }
    case "this_month": {
      const from = startOfDay(startOfMonth(now));
      // To: Last millisecond of current month
      const to = endOfMonth(now);
      return { from, to };
    }
    case "last_month": {
      const prevM = subMonths(now, 1);
      const from = startOfDay(startOfMonth(prevM));
      // To: Last millisecond of previous month
      const to = endOfMonth(prevM);
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
}


/**
 * NOTE about timezone handling:
 * - HTML date inputs produce values like "2025-12-01".
 * - `new Date("2025-12-01")` is parsed as UTC midnight and can become the previous day
 *   in local time depending on the timezone offset.
 * - To avoid that we parse the string using date-fns `parse(..., 'yyyy-MM-dd', new Date())`
 *   which produces a Date at local timezone midnight for the selected day.
 */
export default function DateRangePresetSelector({
  dateRange,
  preset,
  onChange,
}: DateRangePresetSelectorProps) {
  // helper to convert Date -> yyyy-MM-dd for input value
  const toInputValue = (d: Date | null) => (d ? format(d, "yyyy-MM-dd") : "");
  const [tempRange, setTempRange] = React.useState(dateRange);
React.useEffect(() => {
  setTempRange(dateRange);
}, [dateRange]);
  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((opt) => (
          <button
            key={opt.key}
            className={`px-2 py-1 rounded text-xs font-medium border
              ${preset === opt.key ? "bg-primary text-white border-primary" : "bg-muted border-muted-foreground/20"}
              hover:bg-muted-foreground/10 transition`}
            type="button"
            onClick={() => {
              if (opt.key === "custom") {
                onChange(dateRange, "custom");
              } else {
                const range = computeRange(opt.key);
                onChange(range, opt.key);
              }
            }}
            aria-pressed={preset === opt.key}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom date picker - visible when custom is selected */}
      {preset === "custom" && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium mb-3">Select Custom Date Range</h4>
          <div className="flex gap-4 items-center flex-wrap">
            {/* From Date Input */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={toInputValue(tempRange.from)}
           onChange={(e) => {
  const dateValue = e.target.value;
  const parsed = dateValue
    ? parse(dateValue, "yyyy-MM-dd", new Date())
    : null;

  const newDate = parsed ? startOfDay(parsed) : null;

  setTempRange((prev) => ({
    ...prev,
    from: newDate,
  }));
}}
                className="px-3 py-1 border rounded text-sm"
                aria-label="From date"
              />
            </div>

            {/* To Date Input */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={toInputValue(tempRange.to)}
              onChange={(e) => {
  const dateValue = e.target.value;
  const parsed = dateValue
    ? parse(dateValue, "yyyy-MM-dd", new Date())
    : null;

  const newDate = parsed ? endOfDay(parsed) : null;

  setTempRange((prev) => ({
    ...prev,
    to: newDate,
  }));
}}
                min={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined}
                className="px-3 py-1 border rounded text-sm"
                aria-label="To date"
              />
            </div>

            {/* Optional quick apply/reset controls */}
            <div className="flex gap-2 items-end mt-[18px]" >
            <button
  type="button"
  onClick={() => {
    onChange(tempRange, "custom");
  }}
  className="px-3 py-1 rounded border text-sm"
>
  Apply
</button>
              <button
                type="button"
                onClick={() => {
                  onChange({ from: null, to: null }, "custom");
                }}
                className="px-3 py-1 rounded border text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
