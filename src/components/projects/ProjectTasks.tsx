import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useUsers } from '@/lib/hooks/useUsers';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTeams } from '@/lib/hooks/useTeams';
import { UserPlus, X, Edit2, Users, Plus } from 'lucide-react';
import type { Project, ProjectTask } from '@/types';

interface ProjectTasksProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onAssignUser: (taskId: string, userId: string, userName: string) => void;
  onRemoveUser: (projectId: string, taskId: string, assignmentId: string) => void;
  onUpdateProject: (project: Project) => void;
}

export function ProjectTasks({
  open,
  onOpenChange,
  project,
  onAssignUser,
  onRemoveUser,
  onUpdateProject
}: ProjectTasksProps) {
  const { users } = useUsers();
  const { tasks: allTasks } = useTasks();
  const { teams } = useTeams();
  const [localProject, setLocalProject] = useState<Project | null>(project);
  const [selectedTask, setSelectedTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState('');
  const [editingTaskData, setEditingTaskData] = useState<{
    sellRates: Array<{
      sellRate: number;
      date: string;
    }>;
    billable: boolean;
    teamId?: string;
    xeroLeaveTypeId?: string;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    name: '',
    sellRates: [{
      sellRate: 0,
      date: format(new Date(), 'yyyy-MM-dd')
    }],
    billable: false,
    teamId: null,
    xeroLeaveTypeId: ''
  });

  // Update local state when project changes
  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !selectedUser || !localProject) return;

    const user = users.find(u => u.id === selectedUser);
    if (!user) return;

    await onAssignUser(selectedTask, user.id, user.name);
    
    // Update local state after assignment
    setLocalProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(task => {
          if (task.id === selectedTask) {
            return {
              ...task,
              userAssignments: [
                ...(task.userAssignments || []),
                {
                  id: crypto.randomUUID(),
                  userId: user.id,
                  userName: user.name,
                  assignedAt: new Date().toISOString()
                }
              ]
            };
          }
          return task;
        })
      };
    });

    setSelectedUser(''); // Reset user selection after assignment
  };

  const handleAddTask = () => {
    if (!localProject) return;

    // Parse number values when submitting
    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      name: newTaskData.name,
      projectId: localProject.id,
      sellRates: [{
        sellRate: parseFloat(newTaskData.sellRates[0].sellRate.toString()) || 0,
        date: newTaskData.sellRates[0].date
      }],
      billable: newTaskData.billable,
      teamId: newTaskData.teamId || undefined,
      xeroLeaveTypeId: localProject.name === 'Leave' ? newTaskData.xeroLeaveTypeId : '',
      userAssignments: []
    };

    const updatedProject = {
      ...localProject,
      tasks: [...localProject.tasks, newTask]
    };

    setLocalProject(updatedProject);
    onUpdateProject(updatedProject);
    setIsAddingTask(false);
    setNewTaskData({
      name: '',
      sellRates: [{
        sellRate: 0,
        date: format(new Date(), 'yyyy-MM-dd')
      }],
      billable: false,
      teamId: '',
      xeroLeaveTypeId: ''
    });
  };

  const handleRemoveTask = (taskId: string) => {
    if (!localProject) return;

    const updatedProject = {
      ...localProject,
      tasks: localProject.tasks.filter(t => t.id !== taskId)
    };

    setLocalProject(updatedProject);
    onUpdateProject(updatedProject);
  };

  const handleRemoveUserFromTask = async (projectId: string, taskId: string, assignmentId: string) => {
    await onRemoveUser(projectId, taskId, assignmentId);
    
    // Update local state after removal
    setLocalProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              userAssignments: task.userAssignments?.filter(a => a.id !== assignmentId) || []
            };
          }
          return task;
        })
      };
    });
  };

  const handleUpdateTask = (taskId: string, updates: Partial<ProjectTask>) => {
    if (!localProject) return;

    // Clean and standardize updates
    const parsedUpdates = {
      ...updates,
      sellRates: updates.sellRates?.map(rate => ({
        sellRate: typeof rate.sellRate === 'string' ? parseFloat(rate.sellRate) || 0 : rate.sellRate,
        date: rate.date
      })),
      teamId: updates.teamId === 'none' || updates.teamId === '' ? null : updates.teamId
    };

    const updatedProject = {
      ...localProject,
      tasks: localProject.tasks.map(task => 
        task.id === taskId ? { ...task, ...parsedUpdates } : task
      )
    };

    setLocalProject(updatedProject);
    onUpdateProject(updatedProject);
    setEditingTaskId('');
    setEditingTaskData(null);
  };

  const handleStartEditing = (task: ProjectTask) => {
    setEditingTaskId(task.id);
    setEditingTaskData({
      sellRates: task.sellRates.map(rate => ({
        sellRate: rate.sellRate,
        date: rate.date
      })),
      billable: task.billable,
      teamId: task.teamId,
      xeroLeaveTypeId: task.xeroLeaveTypeId
    });
    setSelectedTask('');
  };

  const handleCancelEditing = () => {
    setEditingTaskId('');
    setEditingTaskData(null);
  };

  if (!localProject) return null;

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title="Manage Project Tasks & Assignments"
      subtitle={localProject.name}
      icon={<Users className="h-5 w-5 text-indigo-500" />}
    >
      <div className="divide-y divide-gray-200">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Project Tasks</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Add Task Form */}
          {isAddingTask && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <FormField label="Task Name">
                <Input
                  type="text"
                  value={newTaskData.name}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Senior Developer"
                />
              </FormField>

              {localProject.name === 'Leave' && (
                <FormField label="Xero Leave Type ID">
                  <Input
                    type="text"
                    value={newTaskData.xeroLeaveTypeId}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, xeroLeaveTypeId: e.target.value }))}
                    placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The Xero Leave Type ID is used to sync leave requests with Xero
                  </p>
                </FormField>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Sell Rate">
                  <Input
                    type="number"
                    step="0.01"
                    value={newTaskData.sellRates[0].sellRate}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, sellRates: [{ ...prev.sellRates[0], sellRate: parseFloat(e.target.value) || 0 }] }))}
                  />
                </FormField>
              </div>

              <FormField label="Team">
                <Select
                  value={newTaskData.teamId}
                  onValueChange={(value) => setNewTaskData(prev => ({ ...prev, teamId: value }))}
                >
                  <SelectTrigger>
                    {newTaskData.teamId ? teams.find(t => t.id === newTaskData.teamId)?.name : 'Select Team'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <Checkbox
                checked={newTaskData.billable}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, billable: e.target.checked }))}
                label="Billable"
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddingTask(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  disabled={!newTaskData.name}
                >
                  Add Task
                </Button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-4">
            {localProject.tasks.map(task => (
              <div 
                key={task.id} 
                className={`p-4 rounded-lg border ${
                  selectedTask === task.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col gap-3 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-900">{task.name}</span>
                      <div className="text-sm text-gray-500 mt-1">
                        Current Sell Rate: ${task.sellRates?.[0]?.sellRate || 0}/hr
                      </div>
                      <div className="flex gap-2 mt-2">
                        {task.billable && (
                          <div className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-md border border-green-100">
                            Billable
                          </div>
                        )}
                        {task.teamId && (
                          <div className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                            {teams.find(t => t.id === task.teamId)?.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          handleStartEditing(task);
                        }}
                        className="p-1.5 text-blue-600"
                        title="Edit task details"
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (selectedTask === task.id) {
                            setSelectedTask('');
                          } else {
                            setSelectedTask(task.id);
                            setEditingTaskId('');
                          }
                        }}
                        className="p-1.5 text-indigo-600"
                        title="Manage assignments"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveTask(task.id)}
                        className="p-1.5 text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Edit Task Form */}
                  {editingTaskId === task.id && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-3">
                      <FormField label="Sell Rates">
                        <div className="space-y-4 relative">
                          <div className="text-sm text-gray-500 mb-2">
                            Rates are shown in chronological order, with oldest rates first
                          </div>
                          {editingTaskData?.sellRates
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((rate, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-start">
                              <div className="col-span-5">
                                <FormField label="Rate">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={rate.sellRate || ''}
                                    placeholder="Enter sell rate"
                                    onChange={(e) => {
                                      const newRates = [...editingTaskData.sellRates];
                                      newRates[index] = {
                                        ...rate,
                                        sellRate: parseFloat(e.target.value) || 0
                                      };
                                      setEditingTaskData(prev => ({
                                        ...prev!,
                                        sellRates: newRates
                                      }));
                                    }}
                                  />
                                </FormField>
                              </div>
                              <div className="col-span-5">
                                <FormField label="Effective Date">
                                  <Input
                                    type="date"
                                    value={rate.date}
                                    onChange={(e) => {
                                      const newRates = [...editingTaskData.sellRates];
                                      newRates[index] = {
                                        ...rate,
                                        date: e.target.value
                                      };
                                      setEditingTaskData(prev => ({
                                        ...prev!,
                                        sellRates: newRates
                                      }));
                                    }}
                                  />
                                </FormField>
                              </div>
                              <div className="col-span-2 pt-8">
                                {index > 0 && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      const newRates = editingTaskData.sellRates.filter((_, i) => i !== index);
                                      setEditingTaskData(prev => ({
                                        ...prev!,
                                        sellRates: newRates
                                      }));
                                    }}
                                    className="w-full"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingTaskData(prev => ({
                                ...prev!,
                                sellRates: [
                                  ...prev!.sellRates,
                                  {
                                    sellRate: 0,
                                    date: format(new Date(), 'yyyy-MM-dd')
                                  }
                                ]
                              }));
                            }}
                          >
                            Add Rate
                          </Button>
                        </div>
                      </FormField>

                      <FormField label="Team">
                        <Select
                          value={editingTaskData?.teamId || ''}
                          onValueChange={(value) => {
                            setEditingTaskData(prev => ({
                              ...prev!,
                              teamId: value || undefined
                            }));
                          }}
                        >
                          <SelectTrigger>
                            {editingTaskData?.teamId ? 
                              teams.find(t => t.id === editingTaskData.teamId)?.name : 
                              'Select Team'}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Team</SelectItem>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      {localProject.name === 'Leave' && (
                        <FormField label="Xero Leave Type ID">
                          <Input
                            type="text"
                            value={editingTaskData?.xeroLeaveTypeId}
                            onChange={(e) => {
                              setEditingTaskData(prev => ({
                                ...prev!,
                                xeroLeaveTypeId: e.target.value
                              }));
                            }}
                            placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            The Xero Leave Type ID is used to sync leave requests with Xero
                          </p>
                        </FormField>
                      )}

                      <Checkbox
                        checked={editingTaskData?.billable}
                        onChange={(e) => setEditingTaskData(prev => ({
                          ...prev!,
                          billable: e.target.checked
                        }))}
                        label="Billable"
                      />
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleCancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTask(task.id, editingTaskData!)}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedTask === task.id && (
                    <div className="flex items-center gap-2 mb-3 relative">
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter(user => !task.userAssignments?.some(a => a.userId === user.id))
                            .map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm"
                        disabled={!selectedUser}
                        onClick={handleSubmit}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  )}

                  {/* User Assignments */}
                  {task.userAssignments && task.userAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTask === task.id ? (
                        // Editable mode with remove buttons
                        task.userAssignments.map(assignment => (
                          <div 
                            key={assignment.id}
                            className="flex items-center justify-between bg-white p-2 rounded-md text-sm border border-gray-100"
                          >
                            <span>{assignment.userName}</span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRemoveUserFromTask(localProject.id, task.id, assignment.id)}
                              className="p-1 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        // Read-only mode - just list the assignments
                        <div className="flex flex-wrap gap-2">
                          {task.userAssignments.map(assignment => (
                            <div 
                              key={assignment.id}
                              className="bg-gray-50 px-2 py-1 rounded text-sm text-gray-700"
                            >
                              {assignment.userName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No users assigned
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}