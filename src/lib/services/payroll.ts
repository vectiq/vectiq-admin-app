import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@/lib/firebase";
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
    const functions = getFunctions();
    const createXeroPayRun = httpsCallable(functions, "createXeroPayRun");
    const response = await createXeroPayRun({ calendarId });
    return response.data as PayRun;
  } catch (error) {
    console.error("Error creating pay run:", error);
    throw error;
  }
}
export async function syncPayRun(): Promise<void> {
  const functions = getFunctions();
  const syncPayRun = httpsCallable(functions, "syncPayRun");
  await syncPayRun();
}
export async function getPayRun(month: string): Promise<PayRun[]> {
  try {
    // Create query to find all documents where id starts with YYYYMM-
    const payRunRef = collection(db, COLLECTION);
    const q = query(
      payRunRef,
      where("__name__", ">=", `${month}-`),
      where("__name__", "<", `${month}-\uf8ff`),
      orderBy("__name__")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc) => doc.data() as PayRun);
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
    const payRuns = await getPayRun(month);

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
    console.error("Error calculating pay run stats:", error);
    throw error;
  }
}
