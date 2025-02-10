import type { SellRate, CostRate, Project } from '@/types';

// Helper function to get sell rate for a specific date
export function getSellRateForDate(sellRates: SellRate[] | undefined, date: string): number {
  if (!sellRates || sellRates.length === 0) return 0;
  const now = new Date();

  // Sort rates by date descending
  const sortedRates = [...sellRates].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Find the most recent rate that isn't in the future
  const applicableRate = sortedRates.find(rate => 
    new Date(rate.date) <= now
  );
  
  return applicableRate?.sellRate || 0;
}

// Helper function to get cost rate for a specific date
export function getCostRateForDate(costRates: CostRate[] | undefined, date: string): number {
  if (!costRates || costRates.length === 0) return 0;
  const now = new Date();
  
  // Sort rates by date descending
  const sortedRates = [...costRates].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Find the most recent rate that isn't in the future
  const applicableRate = sortedRates.find(rate => 
    new Date(rate.date) <= now
  );
  
  return applicableRate?.costRate || 0;
}

// Helper function to get cost rate for the first day of a month
export function getCostRateForMonth(costRates: CostRate[] | undefined, month: string): number {
  if (!costRates || costRates.length === 0) return 0;
  if (!Array.isArray(costRates)) return 0;
  
  // Sort rates by date descending
  const sortedRates = Array.from(costRates).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get first day of target month
  const targetDate = new Date(month + '-01');
  if (isNaN(targetDate.getTime())) return 0;
  
  // Find the most recent rate that isn't after the target month
  const applicableRate = sortedRates.find(rate => 
    rate && rate.date && new Date(rate.date) <= targetDate
  );
  
  return applicableRate?.costRate || 0;
}

// Helper function to get average sell rate for a user's assignments
export function getAverageSellRate(
  projects: Project[],
  userId: string,
  date: string
): number {
  console.log('Calculating average sell rate for:', { userId, date });
  console.log('Projects:', projects);

  // Get all billable assignments for this user
  const assignments = projects.flatMap(project =>
    project.tasks
      .filter(task => task.billable && task.userAssignments?.some(a => a.userId === userId))
      .map(task => ({
        sellRate: getSellRateForDate(task.sellRates, date)
      }))
  );

  console.log('Found assignments:', assignments);


  const totalRate = assignments.reduce((sum, a) => sum + a.sellRate, 0);
  const averageRate = assignments.length > 0 ? totalRate / assignments.length : 0;

  console.log('Calculated average rate:', averageRate);

  return assignments.length > 0 ? totalRate / assignments.length : 0;
}