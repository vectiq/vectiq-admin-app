import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  getPayRun,
  getPayRunHistory,
  getPayRunStats,
  getPayrollCalendars,
  getPayItems,
  createPayRun,
} from "@/lib/services/payroll";
import type { PayRun, PayrollCalendar, XeroPayItem } from "@/types";

const QUERY_KEYS = {
  payRun: "payRun",
  draftPayRun: "draftPayRun",
  postedPayRun: "postedPayRun",
  history: "payRunHistory",
  stats: "payRunStats",
  calendars: "payrollCalendars",
  payItems: "payItems",
} as const;

interface UsePayrollOptions {
  selectedDate: Date;
  includeHistory?: boolean;
  includeStats?: boolean;
  onPayRunCreated?: () => void;
}

export function usePayroll({
  selectedDate,
  includeHistory = false,
  includeStats = false,
  onPayRunCreated,
}: UsePayrollOptions) {
  // Format the month as YYYYMM for querying
  const month = format(selectedDate, "yyyyMM");
  const queryClient = useQueryClient();

  // Query for current month's pay runs
  const payRunQuery = useQuery({
    queryKey: [QUERY_KEYS.payRun, month],
    queryFn: () => getPayRun(month),
  });

  const draftPayRuns = useQuery({
    queryKey: [QUERY_KEYS.payRun, QUERY_KEYS.draftPayRun],
    queryFn: () => getPayRun(undefined, "DRAFT"),
  });
  const postedPayRuns = useQuery({
  queryKey: [QUERY_KEYS.payRun, QUERY_KEYS.postedPayRun],
    queryFn: () => getPayRun(undefined, "POSTED"),
  });

  // Query for pay run history (optional)
  const historyQuery = useQuery({
    queryKey: [QUERY_KEYS.history],
    queryFn: () => getPayRunHistory(),
    enabled: includeHistory,
  });

  // Query for pay run stats (optional)
  const statsQuery = useQuery({
    queryKey: [QUERY_KEYS.stats, month],
    queryFn: () => getPayRunStats(month),
    enabled: includeStats,
  });

  // Query for payroll calendars
  const calendarsQuery = useQuery({
    queryKey: [QUERY_KEYS.calendars],
    queryFn: getPayrollCalendars,
  });

  // Query for pay items
  const payItemsQuery = useQuery({
    queryKey: [QUERY_KEYS.payItems],
    queryFn: getPayItems,
  });

  const handleCreatePayRun = async (calendarId: string) => {
    try {
      await createPayRun(calendarId);
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.payRun] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
      if (onPayRunCreated) {
        onPayRunCreated();
      }
    } catch (error) {
      console.error("Error creating pay run:", error);
      throw error;
    }
  };

  return {
    payRuns: payRunQuery.data ?? [],
    draftPayRuns: draftPayRuns.data ?? [],
    postedPayRuns: postedPayRuns.data ?? [],
    history: historyQuery.data,
    stats: statsQuery.data,
    calendars: calendarsQuery.data || [],
    payItems: payItemsQuery.data || [],
    createPayRun: handleCreatePayRun,
    isLoading:
      payRunQuery.isLoading ||
      (includeHistory && historyQuery.isLoading) ||
      (includeStats && statsQuery.isLoading) ||
      calendarsQuery.isLoading ||
      payItemsQuery.isLoading,
    error:
      payRunQuery.error ||
      historyQuery.error ||
      statsQuery.error ||
      calendarsQuery.error ||
      payItemsQuery.error,
  };
}
