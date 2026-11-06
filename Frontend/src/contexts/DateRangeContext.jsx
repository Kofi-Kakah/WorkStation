import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

export const DateRangeContext = createContext(null);

export const RANGE_PRESETS = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "sprint", label: "This sprint", days: 14 },
  { id: "custom", label: "Custom range" },
];

function formatDateLabel(start, end) {
  if (!start || !end) return "";
  const startMonth = start.toLocaleString("en-US", { month: "short" });
  const endMonth = end.toLocaleString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (start.getFullYear() === end.getFullYear()) {
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  }
  return `${startMonth} ${startDay}, ${start.getFullYear()} – ${endMonth} ${endDay}, ${end.getFullYear()}`;
}

function calculateDatesForPreset(presetId) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let days = 30;
  if (presetId === "7d") days = 7;
  if (presetId === "sprint") days = 14;

  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000 + 1);
  start.setHours(0, 0, 0, 0);

  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return { start, end, previousStart, previousEnd };
}

export function DateRangeProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRange = searchParams.get("range") || "30d";
  const initialFrom = searchParams.get("from");
  const initialTo = searchParams.get("to");
  const initialProject = searchParams.get("project") || "all";

  const [preset, setPresetState] = useState(
    initialFrom && initialTo ? "custom" : initialRange,
  );
  const [customRange, setCustomRange] = useState({
    start: initialFrom ? new Date(initialFrom) : null,
    end: initialTo ? new Date(initialTo) : null,
  });
  const [selectedProjectId, setSelectedProjectIdState] = useState(initialProject);

  // Derive dates
  const { start, end, previousStart, previousEnd } = useMemo(() => {
    if (preset === "custom" && customRange.start && customRange.end) {
      const s = new Date(customRange.start);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customRange.end);
      e.setHours(23, 59, 59, 999);
      const dur = e.getTime() - s.getTime();
      const prevE = new Date(s.getTime() - 1);
      const prevS = new Date(prevE.getTime() - dur);
      return { start: s, end: e, previousStart: prevS, previousEnd: prevE };
    }
    return calculateDatesForPreset(preset);
  }, [preset, customRange]);

  // Sync to URL search parameters
  const updateUrl = useCallback(
    (newPreset, newCustom, newProject) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newPreset === "custom" && newCustom?.start && newCustom?.end) {
            next.delete("range");
            next.set("from", newCustom.start.toISOString().slice(0, 10));
            next.set("to", newCustom.end.toISOString().slice(0, 10));
          } else {
            next.delete("from");
            next.delete("to");
            if (newPreset && newPreset !== "30d") {
              next.set("range", newPreset);
            } else {
              next.delete("range");
            }
          }

          if (newProject && newProject !== "all") {
            next.set("project", newProject);
          } else {
            next.delete("project");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPreset = useCallback(
    (newPreset) => {
      setPresetState(newPreset);
      updateUrl(newPreset, customRange, selectedProjectId);
    },
    [customRange, selectedProjectId, updateUrl],
  );

  const setCustomDates = useCallback(
    (startDate, endDate) => {
      const newCustom = { start: startDate, end: endDate };
      setCustomRange(newCustom);
      setPresetState("custom");
      updateUrl("custom", newCustom, selectedProjectId);
    },
    [selectedProjectId, updateUrl],
  );

  const setSelectedProjectId = useCallback(
    (projectId) => {
      setSelectedProjectIdState(projectId);
      updateUrl(preset, customRange, projectId);
    },
    [preset, customRange, updateUrl],
  );

  const label = useMemo(() => formatDateLabel(start, end), [start, end]);

  const isInCurrentRange = useCallback(
    (dateValue) => {
      if (!dateValue) return false;
      const d = new Date(dateValue).getTime();
      return d >= start.getTime() && d <= end.getTime();
    },
    [start, end],
  );

  const isInPreviousRange = useCallback(
    (dateValue) => {
      if (!dateValue) return false;
      const d = new Date(dateValue).getTime();
      return d >= previousStart.getTime() && d <= previousEnd.getTime();
    },
    [previousStart, previousEnd],
  );

  const value = useMemo(
    () => ({
      preset,
      start,
      end,
      previousStart,
      previousEnd,
      label,
      selectedProjectId,
      setPreset,
      setCustomDates,
      setSelectedProjectId,
      isInCurrentRange,
      isInPreviousRange,
      presets: RANGE_PRESETS,
    }),
    [
      preset,
      start,
      end,
      previousStart,
      previousEnd,
      label,
      selectedProjectId,
      setPreset,
      setCustomDates,
      setSelectedProjectId,
      isInCurrentRange,
      isInPreviousRange,
    ],
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}

export default DateRangeProvider;

