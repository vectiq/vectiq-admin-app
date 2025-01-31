import { useNavigate } from 'react-router-dom';
import { navigationItems } from '@/lib/constants/navigation';
import { useUsers } from '@/lib/hooks/useUsers';
import { cn } from '@/lib/utils/styles';

export default function Welcome() {
  const navigate = useNavigate();
  const { currentUser } = useUsers();

  // Filter navigation items based on user role
  const allowedItems = navigationItems.filter(item =>
    item.roles.includes(currentUser?.role || 'user')
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8">
      {/* Welcome Text */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Vectiq Management App
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Manage your time entries, track projects, and generate reports all in one place.
        </p>
      </div>

      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={cn(
                "group relative p-6 bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5",
                "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                "overflow-hidden"
              )}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
              <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-500/5 to-transparent" />
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "p-3 rounded-lg transition-colors duration-300",
                    "bg-gray-50 group-hover:bg-indigo-50"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 transition-all duration-300 transform",
                      "text-gray-600 group-hover:text-indigo-600",
                      "group-hover:scale-110 group-hover:rotate-3"
                    )} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {item.name}
                  </h2>
                </div>

                <p className="text-gray-600 text-sm">
                  {getDescription(item.name)}
                </p>

                <div className={cn(
                  "mt-4 inline-flex items-center text-sm font-medium",
                  "text-indigo-600 group-hover:text-indigo-700"
                )}>
                  Get started
                  <svg
                    className={cn(
                      "ml-2 h-4 w-4 transition-transform duration-300",
                      "group-hover:translate-x-1"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getDescription(name: string): string {
  switch (name) {
    case 'Reports':
      return 'View detailed reports and analytics for time entries and project performance.';
    case 'Processing':
      return 'Process timesheets, generate invoices, and manage payroll data.';
    case 'Bonuses':
      return 'Manage and track employee bonuses and special payments.';
    case 'Forecasting':
      return 'Create and analyze forecasts for resource planning and budgeting.';
    case 'Projects':
      return 'Manage projects, assign team members, and track project progress.';
    case 'Clients':
      return 'Manage client information and relationships.';
    case 'Users':
      return 'Manage user accounts, permissions, and team assignments.';
    case 'Teams':
      return 'Organize and manage team structures and assignments.';
    case 'Admin':
      return 'Access system settings and administrative functions.';
    default:
      return '';
  }
}