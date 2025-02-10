import { Building2, FolderKanban, BarChart2, TrendingUp, UserCircle, Settings, FileCheck, Users, DollarSign } from 'lucide-react';

export const navigationItems = [
  { name: 'Forecasting', href: '/forecast', icon: TrendingUp, roles: ['admin'], allowTeamManager: true },
] as const;