import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import type { PayRun, PayrollCalendar, XeroPayItem } from "@/types";

const COLLECTION = "xeroPayRuns";
const CALENDARS_COLLECTION = "xeroPayCalendars";
const PAY_ITEMS_COLLECTION = "xeroPayItems";

export async function getPayrollCalendars(): Promise<PayrollCalendar[]> {
  try {
    const calendarRef = collection(db, CALENDARS_COLLECTION);
    const querySnapshot = await getDocs(calendarRef);

    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs
      .map((doc) => doc.data() as PayrollCalendar)
      .sort(
        (a, b) =>
          new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime()
      );
  } catch (error) {
    console.error("Error fetching payroll calendars:", error);
    throw error;
  }
}

export async function getPayItems(): Promise<XeroPayItem[]> {
  try {
    const payItemsRef = collection(db, "xeroPayItems");
    const querySnapshot = await getDocs(payItemsRef);

    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as XeroPayItem[];
  } catch (error) {
    console.error("Error fetching pay items:", error);
    throw error;
  }
}

export async function createPayRun(calendarId: string): Promise<PayRun> {
  try {
    const createXeroPayRun = httpsCallable(functions, "createXeroPayRun");
    const response = await createXeroPayRun({ calendarId });
    return response.data as PayRun;
  } catch (error) {
    console.error("Error creating pay run:", error);
    throw error;
  }
}
export async function syncPayRun(): Promise<void> {
  try {
    const syncPayRunFunction = httpsCallable(functions, "syncPayRun");
    const result = await syncPayRunFunction();

    if (!result.data) {
      throw new Error("Sync failed - no response from server");
    }

    // Ensure we have a valid response
    if (typeof result.data !== "object") {
      throw new Error("Invalid response from sync operation");
    }
  } catch (error) {
    console.error("Error syncing pay run:", {
      error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function getPayRun(
  month?: string,
  status?: string
): Promise<PayRun[]> {
  try {
    // Create query to find all documents where id starts with YYYYMM-
    const payRunRef = collection(db, COLLECTION);
    const constraints = [
      month ? where("__name__", ">=", `${month}-`) : undefined,
      month ? where("__name__", "<", `${month}-\uf8ff`) : undefined,
      status ? where("PayRunStatus", "==", status) : undefined,
    ];
    const q = query(
      payRunRef,
      ...constraints.filter((c) => c !== undefined),
      orderBy("__name__")
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc) => {
      return doc.data() as PayRun;
    });
  } catch (error) {
    console.error("Error fetching pay runs:", error);
    throw error;
  }
}

export async function getPayRunHistory(months: number = 12): Promise<PayRun[]> {
  try {
    const payRunRef = collection(db, COLLECTION);
    const payRunDocs = await getDocs(payRunRef);

    if (payRunDocs.empty) {
      return [];
    }

    // Convert to array and sort by date descending
    const payRuns = payRunDocs.docs
      .map((doc) => doc.data() as PayRun)
      .sort((a, b) => {
        const dateA = new Date(a.PayRunPeriodStartDate);
        const dateB = new Date(b.PayRunPeriodStartDate);
        return dateB.getTime() - dateA.getTime();
      });

    // Return only the specified number of months
    return payRuns.slice(0, months);
  } catch (error) {
    console.error("Error fetching pay run history:", error);
    throw error;
  }
}

export async function getPayRunStats(month: string): Promise<{
  totalEmployees: number;
  totalWages: number;
  totalTax: number;
  totalSuper: number;
  averageNetPay: number;
}> {
  try {
    // Normalize month format
    let normalizedMonth: string;
    if (month.length === 6) {
      // Format YYYYMM
      normalizedMonth = `${month.slice(0, 4)}-${month.slice(4, 6)}`;
    } else if (/^\d{4}-\d{2}$/.test(month)) {
      // Format YYYY-MM
      normalizedMonth = month;
    } else {
      throw new Error(
        `Invalid month format: ${month}. Expected YYYY-MM or YYYYMM`
      );
    }

    const payRuns = await getPayRun(normalizedMonth);

    if (payRuns.length === 0) {
      return {
        totalEmployees: 0,
        totalWages: 0,
        totalTax: 0,
        totalSuper: 0,
        averageNetPay: 0,
      };
    }

    // Aggregate stats across all pay runs for the month
    const stats = payRuns.reduce(
      (acc, payRun) => {
        acc.totalEmployees += payRun.Payslips.length;
        acc.totalWages += payRun.Wages;
        acc.totalTax += payRun.Tax;
        acc.totalSuper += payRun.Super;
        acc.totalNetPay += payRun.NetPay;
        return acc;
      },
      {
        totalEmployees: 0,
        totalWages: 0,
        totalTax: 0,
        totalSuper: 0,
        totalNetPay: 0,
      }
    );

    return {
      ...stats,
      averageNetPay:
        stats.totalEmployees > 0 ? stats.totalNetPay / stats.totalEmployees : 0,
    };
  } catch (error) {
    console.error("Error calculating pay run stats:", {
      error,
      month,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
