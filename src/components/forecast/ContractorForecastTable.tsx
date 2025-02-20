import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EditableTimeCell } from '@/components/ui/EditableTimeCell';
import { Briefcase } from 'lucide-react';
import type { User } from '@/types';

interface ContractorForecastTableProps {
  users: User[];
  data: {
    users: User[];
    projects: Project[];
    bonuses: any[];
    leave: any[];
    holidays: any[];
    workingDays: number;
    deltas: Record<string, any>;
  };
  holidays: any[];
  workingDays: number;
  modifiedCells: Set<string>;
  onCellChange: (userId: string, field: string, value: number) => void;
}

export function ContractorForecastTable({
  users,
  data,
  holidays,
  workingDays,
  modifiedCells,
  onCellChange
}: ContractorForecastTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);

  if (users.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contractors</h3>
              <p className="text-sm text-gray-500">
                {users.length} {users.length === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <Th>User</Th>
            <Th className="text-center">Hours/Week</Th>
            <Th className="text-center">Sell Rate</Th>
            <Th className="text-center">Cost Rate</Th>
            <Th className="text-center">Public Holidays</Th>
            <Th className="text-center">Forecast Hours</Th>
          </tr>
        </TableHeader>
        <TableBody>
          {users.map(user => {
            // Get base values from user
            const baseValues = {
              hoursPerWeek: user.hoursPerWeek || 40,
              billablePercentage: user.estimatedBillablePercentage || 0,
              sellRate: user.currentSellRate || 0,
              costRate: user.currentCostRate || 0,
              forecastHours: 0
            };

            // Apply any deltas that exist
            const deltas = data.deltas || {};
            const userData = {
              ...baseValues,
              hoursPerWeek: deltas[`${user.id}_hoursPerWeek`]?.value ?? baseValues.hoursPerWeek,
              billablePercentage: deltas[`${user.id}_billablePercentage`]?.value ?? baseValues.billablePercentage,
              sellRate: deltas[`${user.id}_sellRate`]?.value ?? (user.currentSellRate ?? 0),
              costRate: deltas[`${user.id}_costRate`]?.value ?? (user.currentCostRate ?? 0),
              forecastHours: deltas[`${user.id}_forecastHours`]?.value ?? baseValues.forecastHours
            };

            // For contractors, public holidays reduce forecast hours
            const publicHolidayHours = holidays.length * 8;
            const adjustedForecastHours = Math.max(0, userData.forecastHours - publicHolidayHours);

            return (
              <tr key={user.id}>
                <Td className="font-medium">{user.name}</Td>
                <Td className="text-right p-0">
                  <EditableTimeCell
                    className="text-center"
                    value={userData.hoursPerWeek}
                    onChange={(value) => onCellChange(user.id, 'hoursPerWeek', value)}
                    isEditing={editingCell === `${user.id}-hoursPerWeek`}
                    isModified={modifiedCells.has(`${user.id}_hoursPerWeek`)}
                    onStartEdit={() => setEditingCell(`${user.id}-hoursPerWeek`)}
                    onEndEdit={() => setEditingCell(null)}
                  />
                </Td>
                <Td className="text-right p-0">
                  <EditableTimeCell
                    className="text-center"
                    value={userData.sellRate}
                    onChange={(value) => onCellChange(user.id, 'sellRate', value)}
                    isEditing={editingCell === `${user.id}-sellRate`}
                    isModified={modifiedCells.has(`${user.id}_sellRate`)}
                    onStartEdit={() => setEditingCell(`${user.id}-sellRate`)}
                    onEndEdit={() => setEditingCell(null)}
                  />
                </Td>
                <Td className="text-right p-0">
                  <EditableTimeCell
                    className="text-center"
                    value={userData.costRate}
                    onChange={(value) => onCellChange(user.id, 'costRate', value)}
                    isEditing={editingCell === `${user.id}-costRate`}
                    isModified={modifiedCells.has(`${user.id}_costRate`)}
                    onStartEdit={() => setEditingCell(`${user.id}-costRate`)}
                    onEndEdit={() => setEditingCell(null)}
                  />
                </Td>
                <Td className="text-center">
                  <Badge variant="secondary">
                    {(holidays.length * 8 || 0).toFixed(1)} hrs
                  </Badge>
                </Td>
                <Td className="text-right p-0">
                  <div className="py-2 text-center">
                    {(() => {
                      // Calculate forecast hours based on formula
                      const baseHours = (userData.hoursPerWeek / 5) * workingDays;
                      const publicHolidayHours = holidays.length * 8;
                      const forecastHours = Math.max(0, baseHours - publicHolidayHours);

                      return forecastHours.toFixed(1);
                    })()}
                  </div>
                </Td>
              </tr>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}