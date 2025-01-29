import { useQuery } from '@tanstack/react-query';
import { Clock, DollarSign, Briefcase, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { WeeklyHoursChart } from '@/components/dashboard/WeeklyHoursChart';
import { formatCurrency } from '@/lib/utils/currency';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => ({
      totalHours: 160,
      totalRevenue: 24000,
      activeProjects: 5,
      pendingApprovals: 3,
    }),
  });

  const { data: weeklyHours } = useQuery({
    queryKey: ['weekly-hours'],
    queryFn: async () => ([
      { name: 'Mon', hours: 8 },
      { name: 'Tue', hours: 7.5 },
      { name: 'Wed', hours: 8 },
      { name: 'Thu', hours: 6.5 },
      { name: 'Fri', hours: 8 },
    ]),
  });

  if (!stats || !weeklyHours) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Hours"
          value={stats.totalHours}
          icon={Clock}
          color="text-blue-600"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="text-green-600"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={Briefcase}
          color="text-purple-600"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={AlertCircle}
          color="text-yellow-600"
        />
      </div>

      <WeeklyHoursChart data={weeklyHours} />
    </div>
  );
}