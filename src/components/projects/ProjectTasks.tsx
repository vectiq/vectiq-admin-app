import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { useUsers } from '@/lib/hooks/useUsers';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTeams } from '@/lib/hooks/useTeams';
import { UserPlus, X, Edit2, Users, Plus, Loader2 } from 'lucide-react';
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
  const [selectedTask, setSelectedTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
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
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; taskId: string | null }>({
    isOpen: false,
    taskId: null
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !selectedUser || !project) return;
    setIsAssigning(true);

    // Find the task
    const task = project.tasks.find(t => t.id === selectedTask);
    if (!task) return;
    if (!task) {
      setIsAssigning(false);
      return;
    }

    // Check if user is already assigned to this task
    const isAlreadyAssigned = task.userAssignments?.some(
      assignment => assignment.userId === selectedUser && assignment.isActive
    );

    if (isAlreadyAssigned) {
      setIsAssigning(false);
      alert('This user is already assigned to this task');
      return;
    }

    const user = users.find(u => u.id === selectedUser);
    if (!user) {
      setIsAssigning(false);
      return;
    }

    try {
      await onAssignUser(selectedTask, user.id, user.name);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Failed to assign user');
    } finally {
      setIsAssigning(false);
    }

    setSelectedUser(''); // Reset user selection after assignment
  };

  const handleAddTask = () => {
    if (!project) return;

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      name: newTaskData.name,
      isActive: true,
      projectId: project.id,
      sellRates: [{
        sellRate: parseFloat(newTaskData.sellRates[0].sellRate.toString()) || 0,
        date: newTaskData.sellRates[0].date
      }],
      billable: newTaskData.billable,
      teamId: newTaskData.teamId || undefined,
      xeroLeaveTypeId: project.name === 'Leave' ? newTaskData.xeroLeaveTypeId : '',
      userAssignments: []
    };

    const updatedProject = {
      ...project,
      tasks: [...project.tasks, newTask]
    };

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

  const handleRemoveTask = async (taskId: string) => {
    const task = project?.tasks.find(t => t.id === taskId);
    if (!task) return;
    setDeleteConfirmation({ isOpen: true, taskId });
  };

  const handleConfirmDelete = async () => {
    if (!project || !deleteConfirmation.taskId) return;
    const task = project.tasks.find(t => t.id === deleteConfirmation.taskId);
    if (!task) return;

    // Create updated project with toggled task status
    // Toggle the task's active status
    const updatedProject = {
      ...project,
      tasks: project.tasks.map(t => 
        t.id === deleteConfirmation.taskId 
          ? { 
              ...t, 
              isActive: !t.isActive,
              // When deactivating a task, also deactivate all assignments
              userAssignments: !t.isActive 
                ? t.userAssignments 
                : t.userAssignments.map(a => ({ ...a, isActive: false }))
            } 
          : t
      )
    };

    // Update the project immediately
    onUpdateProject(updatedProject);
    setDeleteConfirmation({ isOpen: false, taskId: null });
  };

  const handleRemoveUserFromTask = async (projectId: string, taskId: string, assignmentId: string) => {
    await onRemoveUser(projectId, taskId, assignmentId);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<ProjectTask>) => {
    if (!project) return;

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
      ...project,
      tasks: project.tasks.map(task => 
        task.id === taskId ? { ...task, ...parsedUpdates } : task
      )
    };

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

  if (!project) return null;

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title="Manage Project Tasks & Assignments"
      subtitle={project.name}
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

              {project.name === 'Leave' && (
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

              <Switch
                checked={newTaskData.billable}
                onCheckedChange={(checked) => setNewTaskData(prev => ({ ...prev, billable: checked }))}
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
            {project.tasks.map(task => (
              <div 
                key={task.id} 
                className={`p-4 rounded-lg border ${
                  selectedTask === task.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                } ${!task.isActive ? 'opacity-60 bg-gray-50' : ''}`}
                data-task-id={task.id}
                data-active={task.isActive}
              >
                <div className="flex flex-col gap-3 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{task.name}</span>
                      </div>
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                handleStartEditing(task);
                              }}
                              className="p-1.5 text-blue-600"
                            >
                              <Edit2 className="h-4 w-4 text-gray-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Edit task details
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Manage assignments
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Switch
                        checked={task.isActive}
                        onCheckedChange={(checked) => {
                          const updatedProject = {
                            ...project,
                            tasks: project.tasks.map(t => 
                              t.id === task.id 
                                ? { 
                                    ...t, 
                                    isActive: checked,
                                    userAssignments: !checked 
                                      ? t.userAssignments.map(a => ({ ...a, isActive: false }))
                                      : t.userAssignments
                                  } 
                                : t
                            )
                          };
                          onUpdateProject(updatedProject);
                        }}
                        label={task.isActive ? 'Active' : 'Inactive'}
                      />
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

                      {project.name === 'Leave' && (
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

                      <Switch
                        checked={editingTaskData?.billable}
                        onCheckedChange={(checked) => setEditingTaskData(prev => ({
                          ...prev!,
                          billable: checked
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
                      <div className="flex-1">
                        <Select
                          value={selectedUser}
                          onValueChange={setSelectedUser}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user..." />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter(user => !task.userAssignments?.some(a => a.userId === user.id && a.isActive))
                              .map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        size="sm"
                        disabled={!selectedUser || isAssigning}
                        onClick={handleSubmit}
                      >
                        {isAssigning ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                        <UserPlus className="h-4 w-4 mr-1" />
                        )}
                        Add
                      </Button>
                    </div>
                  )}

                  {/* User Assignments */}
                  {task.userAssignments && task.userAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTask === task.id && task.isActive ? (
                        // Editable mode with toggle buttons - show all assignments
                        task.userAssignments.map(assignment => (
                          <div 
                            key={assignment.id}
                            className={`flex items-center justify-between bg-white p-2 rounded-md text-sm border border-gray-100 ${
                              !assignment.isActive && 'opacity-60 bg-gray-50'
                            }`} 
                            data-assignment-id={assignment.id}
                            data-active={assignment.isActive}
                          >
                            <div className="flex items-center gap-2">
                              <span>{assignment.userName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={assignment.isActive}
                                onCheckedChange={(checked) => {
                                  const updatedProject = {
                                    ...project,
                                    tasks: project.tasks.map(t => 
                                      t.id === task.id 
                                        ? {
                                            ...t,
                                            userAssignments: t.userAssignments.map(a =>
                                              a.id === assignment.id
                                                ? { ...a, isActive: checked }
                                                : a
                                            )
                                          }
                                        : t
                                    )
                                  };
                                  onUpdateProject(updatedProject);
                                }}
                                label={assignment.isActive ? 'Active' : 'Inactive'}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        // Read-only mode - just list the assignments
                        <div className="flex flex-wrap gap-2">
                          {task.userAssignments.map(assignment => (
                            <div 
                              key={assignment.id}
                              className={`px-2 py-1 rounded text-sm transition-all duration-200 ${
                                assignment.isActive 
                                  ? 'bg-gray-50 text-gray-700' 
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{assignment.userName}</span>
                                {!assignment.isActive && ( 
                                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
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

      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {project?.tasks.find(t => t.id === deleteConfirmation.taskId)?.isActive 
                ? 'Deactivate Task' 
                : 'Activate Task'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {project?.tasks.find(t => t.id === deleteConfirmation.taskId)?.isActive
                ? 'Are you sure you want to deactivate this task? Inactive tasks will still be visible but cannot be assigned to new users.'
                : 'Are you sure you want to activate this task? Active tasks can be assigned to users.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {project?.tasks.find(t => t.id === deleteConfirmation.taskId)?.isActive
                ? 'Deactivate'
                : 'Activate'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SlidePanel>
  );
}