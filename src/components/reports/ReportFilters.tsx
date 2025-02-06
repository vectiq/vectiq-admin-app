import { useState } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { useUsers } from '@/lib/hooks/useUsers';
import { useTeams } from '@/lib/hooks/useTeams';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Filter, Download, X } from 'lucide-react';
import type { ReportFilters } from '@/types';

interface ReportFiltersProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}

export function ReportFilters({ filters, onChange }: ReportFiltersProps) {
  const { projects } = useProjects();
  const { users, isTeamManager, managedTeam } = useUsers();
  const { teams } = useTeams();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof ReportFilters, value: any) => {
    let newFilters = { ...filters };

    if (key === 'clientIds' || key === 'projectIds' || key === 'taskIds') {
      // Handle array values
      if (value === 'all') {
        newFilters[key] = [];
      } else {
        const currentValues = newFilters[key] as string[];
        const valueIndex = currentValues.indexOf(value);
        if (valueIndex === -1) {
          newFilters[key] = [...currentValues, value];
        } else {
          newFilters[key] = currentValues.filter(v => v !== value);
        }
      }
    } else {
      // Handle single values
      newFilters[key] = value === 'all' ? '' : value;
    }

    onChange(newFilters);
  };

  const clearFilters = () => {
    onChange({
      ...filters,
      clientIds: [],
      projectIds: [],
      taskIds: []
    });
  };

  const hasActiveFilters = filters.clientIds.length > 0 || filters.projectIds.length > 0 || filters.taskIds.length > 0;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-4 gap-4">
          <FormField label="Start Date">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </FormField>

          <FormField label="End Date">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </FormField>

          <div className="col-span-2 flex items-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {isExpanded ? 'Hide Filters' : 'Show Filters'}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}

            <Button variant="secondary" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
            <FormField label="Team">
              <Select
                value={filters.teamId || 'all'}
                onValueChange={(value) => handleChange('teamId', value)}
                disabled={isTeamManager}
              >
                <SelectTrigger>
                  {isTeamManager 
                    ? managedTeam?.name 
                    : (filters.teamId ? teams.find(t => t.id === filters.teamId)?.name : 'All Teams')}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="User">
              <Select
                value={filters.userId || 'all'}
                onValueChange={(value) => handleChange('userId', value)}
              >
                <SelectTrigger>
                  {filters.userId ? users.find(u => u.id === filters.userId)?.name : 'All Users'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users
                    .filter(user => !isTeamManager || user.teamId === managedTeam?.id)
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Project">
              <Select
                value={filters.projectId || 'all'}
                onValueChange={(value) => handleChange('projectId', value)}
              >
                <SelectTrigger>
                  {filters.projectId ? projects.find(p => p.id === filters.projectId)?.name : 'All Projects'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        )}
      </div>
    </Card>
  );
}