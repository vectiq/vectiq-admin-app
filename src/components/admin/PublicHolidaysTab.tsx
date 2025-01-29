import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Plus, Trash2, Loader2, Upload } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { usePublicHolidays } from '@/lib/hooks/usePublicHolidays';
import type { PublicHoliday } from '@/types';

export function PublicHolidaysTab() {
  const {
    holidays,
    isLoading,
    addHoliday,
    deleteHoliday,
    importHolidays,
    isAdding,
    isDeleting,
    isImporting
  } = usePublicHolidays();
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: ''
  });
  const [xeroJson, setXeroJson] = useState('');
  const [holidayGroup, setHolidayGroup] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) return;

    try {
      await addHoliday(newHoliday);
      setNewHoliday({ name: '', date: '' });
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  }, [newHoliday, addHoliday]);

  const handleImport = useCallback(async () => {
    if (!xeroJson || !holidayGroup) return;
    
    try {
      // Parse JSON and validate structure
      const data = JSON.parse(xeroJson);
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid JSON format');
      }

      // Filter holidays for the specified group
      const groupId = parseInt(holidayGroup);
      await importHolidays(data.data, groupId);

      // Clear form
      setXeroJson('');
      setHolidayGroup('');
    } catch (error) {
      console.error('Error importing holidays:', error);
      alert('Failed to import holidays: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [xeroJson, holidayGroup, importHolidays]);

  return (
    <Card>
      <div className="p-6 space-y-6">
        {/* Add Holiday Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Holiday Name">
              <Input
                value={newHoliday.name}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., New Year's Day"
              />
            </FormField>

            <FormField label="Date">
              <Input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isAdding || !newHoliday.name || !newHoliday.date}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Holiday
            </Button>
          </div>
        </form>

        {/* Holidays Table */}
        <Table>
          <TableHeader>
            <tr>
              <Th>Holiday Name</Th>
              <Th>Date</Th>
              <Th className="w-20"></Th>
            </tr>
          </TableHeader>
          <TableBody>
            {holidays
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(holiday => (
                <tr key={holiday.id}>
                  <Td className="font-medium">{holiday.name}</Td>
                  <Td>{format(parseISO(holiday.date), 'MMMM d, yyyy')}</Td>
                  <Td>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => deleteHoliday(holiday.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Td>
                </tr>
              ))}
            {holidays.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  No public holidays configured
                </td>
              </tr>
            )}
          </TableBody>
        </Table>

        {/* Xero Import Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-4">Import from Xero</h3>
          <div className="space-y-4">
            <FormField label="Holiday Group ID">
              <Input
                type="text"
                value={holidayGroup}
                onChange={(e) => setHolidayGroup(e.target.value)}
                placeholder="e.g., 84681"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the Xero holiday group ID to filter holidays
              </p>
            </FormField>

            <FormField label="Xero JSON">
              <textarea
                value={xeroJson}
                onChange={(e) => setXeroJson(e.target.value)}
                className="w-full h-48 font-mono text-sm p-4 rounded-md border border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Paste Xero holidays JSON here..."
              />
            </FormField>

            <div className="flex justify-end">
              <Button
                onClick={handleImport}
                disabled={isImporting || !xeroJson || !holidayGroup}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import Holidays
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}