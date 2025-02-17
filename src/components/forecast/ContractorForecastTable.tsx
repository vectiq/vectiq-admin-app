import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EditableTimeCell } from '@/components/ui/EditableTimeCell';
import { Briefcase } from 'lucide-react';
import type { User } from '@/types';

interface ContractorForecastTableProps {
  users: User[];
  localData: Record<string, any>;
  holidays: any[];
  modifiedCells: Set<string>;
  onCellChange: (userId: string, field: string, value: number) => void;
}

export function ContractorForecastTable({
  users,
  localData,
  holidays,
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
            <Th className="text-center">Billable %</Th>
            <Th className="text-center">Sell Rate</Th>
            <Th className="text-center">Cost Rate</Th>
            <Th className="text-center">Public Holidays</Th>
            <Th className="text-center">Forecast Hours</Th>
          </tr>
        </TableHeader>
        <TableBody>
          {users.map(user => {
            const userData = localData[user.id] || {
              hoursPerWeek: user.hoursPerWeek || 40,
              billablePercentage: user.estimatedBillablePercentage || 0,
              sellRate: 0,
              costRate: 0,
              forecastHours: 0
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
                    value={userData.billablePercentage}
                    onChange={(value) => onCellChange(user.id, 'billablePercentage', value)}
                    isEditing={editingCell === `${user.id}-billable`}
                    isModified={modifiedCells.has(`${user.id}_billablePercentage`)}
                    onStartEdit={() => setEditingCell(`${user.id}-billable`)}
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
                  <EditableTimeCell
                    className="text-center"
                    value={adjustedForecastHours}
                    onChange={(value) => onCellChange(user.id, 'forecastHours', value)}
                    isEditing={editingCell === `${user.id}-forecast`}
                    isModified={modifiedCells.has(`${user.id}_forecastHours`)}
                    onStartEdit={() => setEditingCell(`${user.id}-forecast`)}
                    onEndEdit={() => setEditingCell(null)}
                  />
                </Td>
              </tr>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}