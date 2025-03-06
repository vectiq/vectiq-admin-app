import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { User } from '@/types';

export async function processContractorHours(
  startDate: string,
  endDate: string,
  contractors: User[],
  contractorHours: Map<string, number>, 
  payRunId: string
): Promise<void> {
  // Prepare contractor entries
  const contractorEntries = contractors
    .map(contractor => ({
      xeroEmployeeId: contractor.xeroEmployeeId,
      hoursWorked: contractorHours.get(contractor.id) || 0,
      ratePerHour: contractor.costRate?.[0]?.costRate || 0
    }))
    .filter(entry => entry.hoursWorked > 0);

  // Call Firebase function
  const processContractorHoursFunction = httpsCallable(functions, 'processContractorHours');
  await processContractorHoursFunction({
    startDate,
    endDate,
    contractorEntries,
    payRunId
  });
}