import { useState } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { useUsers } from '@/lib/hooks/useUsers';
import { useTasks } from '@/lib/hooks/useTasks';
import { UserPlus, X, Edit2, Users, Plus } from 'lucide-react';
import type { Project, ProjectTask } from '@/types';

interface ProjectAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onAssignUser: (taskId: string, userId: string, userName: string) => void;
  onRemoveUser: (projectId: string, taskId: string, assignmentId: string) => void;
  onUpdateProject: (project: Project) => void;
}

export function ProjectAssignmentDialog({
  open,
  onOpenChange,
  project,
  onAssignUser,
  onRemoveUser,
  onUpdateProject
}: ProjectAssignmentDialogProps) {
  const { users } = useUsers();
  const { tasks: allTasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    name: '',
    costRate: 0,
    sellRate: 0,
    billable: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !selectedUser || !project) return;

    const user = users.find(u => u.id === selectedUser);
    if (!user) return;

    await onAssignUser(selectedTask, user.id, user.name);
    setSelectedUser(''); // Reset user selection after assignment
  };

  const handleAddTask = () => {
    if (!project) return;

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      name: newTaskData.name,
      projectId: project.id,
      costRate: newTaskData.costRate,
      sellRate: newTaskData.sellRate,
      billable: newTaskData.billable,
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
      costRate: 0,
      sellRate: 0,
      billable: false
    });
  };

  const handleRemoveTask = (taskId: string) => {
    if (!project) return;

    const updatedProject = {
      ...project,
      tasks: project.tasks.filter(t => t.id !== taskId)
    };

    onUpdateProject(updatedProject);
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
                <input
                  type="text"
                  value={newTaskData.name}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., Senior Developer"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cost Rate">
                  <input
                    type="number"
                    step="0.01"
                    value={newTaskData.costRate}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, costRate: parseFloat(e.target.value) || 0 }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </FormField>

                <FormField label="Sell Rate">
                  <input
                    type="number"
                    step="0.01"
                    value={newTaskData.sellRate}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, sellRate: parseFloat(e.target.value) || 0 }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </FormField>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTaskData.billable}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, billable: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">Billable</span>
              </div>

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
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium text-gray-900">{task.name}</span>
                      <div className="text-sm text-gray-500 mt-1">
                        Cost: ${task.costRate}/hr • Sell: ${task.sellRate}/hr
                        {task.billable && <span className="ml-2 text-green-600">Billable</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedTask(task.id === selectedTask ? '' : task.id)}
                      className="p-1.5"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
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

                {selectedTask === task.id && (
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Add user...</option>
                      {users
                        .filter(user => !task.userAssignments?.some(a => a.userId === user.id))
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))
                      }
                    </select>
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
                    {task.userAssignments.map(assignment => (
                      <div 
                        key={assignment.id}
                        className="flex items-center justify-between bg-white p-2 rounded-md text-sm border border-gray-100"
                      >
                        <span>{assignment.userName}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onRemoveUser(project.id, task.id, assignment.id)}
                          className="p-1 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No users assigned
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}