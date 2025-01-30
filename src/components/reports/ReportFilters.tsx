import { useProjects } from '@/lib/hooks/useProjects';
import { useUsers } from '@/lib/hooks/useUsers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { Download } from 'lucide-react';
import type { ReportFilters } from '@/types';

interface ReportFiltersProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}

export function ReportFilters({ filters, onChange }: ReportFiltersProps) {
  const { projects } = useProjects();
  const { users } = useUsers();

  const handleChange = (key: keyof ReportFilters, value: any) => {
    // Convert 'all' back to empty string for the filter
    const filterValue = value === 'all' ? '' : value;
    onChange({ ...filters, [key]: filterValue });
  };

  const handleExport = () => {
    console.log('Exporting with filters:', filters);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
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

          <FormField label="User">
            <Select
              value={filters.userId || 'all'}
              onValueChange={(value) => handleChange('userId', value)}
            >
              <SelectTrigger>
                {filters.userId ? users.find(u => u.id === filters.userId)?.name : 'All Users'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">All Users</SelectItem>
                {users.map(user => (
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

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </Card>
  );
}