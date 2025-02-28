import { Building2, FolderKanban, BarChart2, TrendingUp, UserCircle, Settings, FileCheck, Users, DollarSign, Receipt, Clock } from 'lucide-react';

export const navigationItems = [
  { name: 'Reports', href: '/reports', icon: BarChart2, roles: ['admin'], allowTeamManager: true },
  { name: 'Processing', href: '/processing', icon: FileCheck, roles: ['admin'], allowTeamManager: false },
  { name: 'Bonuses', href: '/bonuses', icon: DollarSign, roles: ['admin'], allowTeamManager: true },
  { name: 'Overtime', href: '/overtime', icon: Clock, roles: ['admin'], allowTeamManager: true, teamManagerOnly: true },
  { name: 'Forecasting', href: '/forecast', icon: TrendingUp, roles: ['admin'], allowTeamManager: true },
  { name: 'Clients & Projects', href: '/clients-and-projects', icon: Building2, roles: ['admin'], allowTeamManager: true },
  { name: 'Staff', href: '/users', icon: UserCircle, roles: ['admin'], allowTeamManager: true },
  { name: 'Teams', href: '/teams', icon: Users, roles: ['admin'], allowTeamManager: false },
  { name: 'Admin', href: '/admin', icon: Settings, roles: ['admin'], allowTeamManager: false },
] as const;