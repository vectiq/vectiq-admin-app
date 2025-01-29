import { Clock, Building2, FolderKanban, BarChart2, TrendingUp, UserCircle, Settings, FileCheck, CalendarDays, HelpCircle, Users, DollarSign } from 'lucide-react';

export const navigationItems = [
<<<<<<< HEAD
  { name: 'Processing', href: '/processing', icon: FileCheck, roles: ['admin'] },
  { name: 'Bonuses', href: '/bonuses', icon: DollarSign, roles: ['admin'] },
  { name: 'Forecast Entry', href: '/forecast', icon: TrendingUp, roles: ['admin'] },
=======
  { name: 'Timesheet', href: '/', icon: Clock, roles: ['user', 'admin'] },
  { name: 'Leave', href: '/leave', icon: CalendarDays, roles: ['user', 'admin'] },
  { name: 'Reports', href: '/reports', icon: BarChart2, roles: ['admin'] },
>>>>>>> 24f29c2e344e093b64de73e291d51fbf16e965f9
  { name: 'Projects', href: '/projects', icon: FolderKanban, roles: ['admin'] },
  { name: 'Clients', href: '/clients', icon: Building2, roles: ['admin'] },
  { name: 'Users', href: '/users', icon: UserCircle, roles: ['admin'] },
  { name: 'Teams', href: '/teams', icon: Users, roles: ['admin'] },
  { name: 'Admin', href: '/admin', icon: Settings, roles: ['admin'] },
] as const;