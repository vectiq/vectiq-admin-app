import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EditableTimeCell } from '@/components/ui/EditableTimeCell';
import { Users } from 'lucide-react';
import { calculateLeaveHours } from '@/lib/utils/date';
import type { User } from '@/types';

interface EmployeeForecastTableProps {
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
  leaveHours: Record<string, number>;
  month: string;
  modifiedCells: Set<string>;
  onCellChange: (userId: string, field: string, value: number) => void;
}

export function EmployeeForecastTable({
  users,
  data,
  holidays,
  workingDays,
  leaveHours,
  month,
  modifiedCells,
  onCellChange
}: EmployeeForecastTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);

  if (users.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Employees</h3>
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
            <Th className="text-center">Billable %</Th>
            <Th className="text-center">Sell Rate</Th>
            <Th className="text-center">Cost Rate</Th>
            <Th className="text-center">Public Holidays</Th>
            <Th className="text-center">Planned Leave</Th>
            <Th className="text-center">Bonus</Th>
            <Th className="text-center">Forecast Hours</Th>
          </tr>
        </TableHeader>
        <TableBody>
          {users.map(user => {
            // Get base values from user
            const baseValues = {
              hoursPerWeek: user.hoursPerWeek || 40,
              billablePercentage: user.estimatedBillablePercentage || 0,
              plannedBonus: data.bonuses[user.id] ?? 0, // Use nullish coalescing to handle 0 values correctly
              sellRate: 0, // Will be calculated from projects
              sellRate: user.currentSellRate || 0,
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
              plannedBonus: deltas[`${user.id}_plannedBonus`]?.value ?? baseValues.plannedBonus,
              forecastHours: deltas[`${user.id}_forecastHours`]?.value ?? baseValues.forecastHours
            };

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
                    onClear={() => onCellChange(user.id, 'hoursPerWeek', baseValues.hoursPerWeek)}
                  />
                </Td>
                <Td className="text-right p-0">
                  <EditableTimeCell
                    className="text-center"
                    value={userData.billablePercentage}
                    onChange={(value) => onCellChange(user.id, 'billablePercentage', value)}
                    isEditing={editingCell === `${user.id}-billable`}
                    isModified={modifiedCells.has(`${user.id}_billablePercentage`)}
                    onStartEdit={() => setEditingCell(`${user.id}-billable`)}
                    onEndEdit={() => setEditingCell(null)}
                    onClear={() => onCellChange(user.id, 'billablePercentage', baseValues.billablePercentage)}
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
                    onClear={() => onCellChange(user.id, 'sellRate', user.currentSellRate || 0)}
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
                    onClear={() => onCellChange(user.id, 'costRate', user.currentCostRate || 0)}
                  />
                </Td>
                <Td className="text-center">
                  <Badge variant="secondary">
                    {(holidays.length * 8 || 0).toFixed(1)} hrs
                  </Badge>
                </Td>
                <Td className="text-center">
                  {(() => {
                    const totalHours = leaveHours[user.id] || 0;
                    if (totalHours === 0) return <Badge variant="secondary">None</Badge>;
                    
                    return (
                      <Badge variant="warning">
                        {totalHours.toFixed(1)} hrs
                      </Badge>
                    );
                  })()}
                </Td>
                <Td className="text-right p-0">
                  <EditableTimeCell
                    className="text-center"
                    value={userData.plannedBonus}
                    onChange={(value) => onCellChange(user.id, 'plannedBonus', value)}
                    isEditing={editingCell === `${user.id}-bonus`}
                    isModified={modifiedCells.has(`${user.id}_plannedBonus`)}
                    onStartEdit={() => setEditingCell(`${user.id}-bonus`)}
                    onEndEdit={() => setEditingCell(null)}
                    onClear={() => onCellChange(user.id, 'plannedBonus', data.bonuses[user.id] ?? 0)}
                  />
                </Td>
                <Td className="text-right p-0">
                  <div className="py-2 text-center">
                    {(() => {
                      // Calculate forecast hours based on formula
                      const baseHours = (userData.hoursPerWeek / 5) * workingDays;
                      const billableHours = baseHours * (userData.billablePercentage / 100);
                      const publicHolidayHours = holidays.length * 8;
                      const userLeaveHours = leaveHours[user.id] || 0;
                      const forecastHours = Math.max(0, billableHours - publicHolidayHours - userLeaveHours);

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