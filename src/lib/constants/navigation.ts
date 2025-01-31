import { Building2, FolderKanban, BarChart2, TrendingUp, UserCircle, Settings, FileCheck, Users, DollarSign } from 'lucide-react';

export const navigationItems = [
  { name: 'Reports', href: '/reports', icon: BarChart2, roles: ['admin'] },
  { name: 'Processing', href: '/processing', icon: FileCheck, roles: ['admin'] },
  { name: 'Bonuses', href: '/bonuses', icon: DollarSign, roles: ['admin'] },
  { name: 'Forecasting', href: '/forecast', icon: TrendingUp, roles: ['admin'] },
  { name: 'Projects', href: '/projects', icon: FolderKanban, roles: ['admin'] },
  { name: 'Clients', href: '/clients', icon: Building2, roles: ['admin'] },
  { name: 'Staff', href: '/users', icon: UserCircle, roles: ['admin'] },
  { name: 'Teams', href: '/teams', icon: Users, roles: ['admin'] },
  { name: 'Admin', href: '/admin', icon: Settings, roles: ['admin'] },
] as const;